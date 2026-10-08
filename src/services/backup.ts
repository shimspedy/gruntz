import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { BACKUP_DEBOUNCE_MS, BACKUP_SCHEMA_VERSION, isBackupAvailable } from '../config/backup';
import { applySnapshot, captureSnapshot, snapshotWorkoutCount, type BackupSnapshot } from './backupSnapshot';
import { getSupabase } from './supabaseClient';

export type BackupMeta = {
  updatedAt: string;
  workoutCount: number;
  deviceLabel: string | null;
  appVersion: string | null;
  trialStartedAt: string | null;
};

export type AuthResult = 'sent' | 'rate-limited' | 'unavailable' | 'error';
export type VerifyResult = 'signed-in' | 'invalid-code' | 'unavailable' | 'error';
export type PushBackupResult = 'ok' | 'needs-review' | 'signed-out' | 'unavailable' | 'too-large' | 'error';
export type RestoreBackupResult = 'restored' | 'no-backup' | 'signed-out' | 'unavailable' | 'too-new' | 'too-large' | 'error';

function isBackupTooLarge(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'backup-too-large';
}

/**
 * Backup and restore for an offline-first app.
 *
 * Every function here returns a tagged result rather than throwing, and every one
 * treats "backup is not configured" as an ordinary outcome. Nothing in this file is
 * ever on the path of logging a set.
 */

function deviceLabel(): string {
  return Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'device';
}

const SUBSCRIPTION_KEY = '@gruntz_subscription';
const BACKUP_OWNER_KEY = '@gruntz_backup_owner';
/** The server's `updated_at` for the copy this device last wrote or restored. */
const BACKUP_SYNCED_AT_KEY = '@gruntz_backup_synced_at';
let operationQueue: Promise<unknown> = Promise.resolve();
let suspended = 0;
let pendingPush: ReturnType<typeof setTimeout> | null = null;

// Serialize uploads, restores and deletion so a late upload cannot undo a restore
// or recreate a backup immediately after deletion.
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = operationQueue.then(operation, operation);
  operationQueue = next.catch(() => undefined);
  return next;
}

export function suspendAutomaticBackups(): () => void {
  suspended += 1;
  if (pendingPush) clearTimeout(pendingPush);
  pendingPush = null;
  let resumed = false;
  return () => { if (!resumed) { resumed = true; suspended -= 1; } };
}

/** Keep the cloud copy safe across a device reset and subsequent app launches. */
export async function pauseAutomaticBackups(): Promise<void> {
  const resume = suspendAutomaticBackups();
  try {
    await serialize(() => AsyncStorage.setItem(BACKUP_OWNER_KEY, 'paused'));
  } finally {
    resume();
  }
}

/** The trial start on this device, read straight from the persisted store. */
async function readLocalTrialStart(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { trialStartedAt?: string | null } };
    return parsed.state?.trialStartedAt ?? null;
  } catch {
    return null;
  }
}

/**
 * Adopt the server's trial start when it is earlier than this device's.
 *
 * Only ever moves the start date *backwards*, which can only shorten the remaining
 * trial. That asymmetry is the whole safety argument: a tampered or stale value
 * cannot buy anyone extra free days, so this is safe to apply without the server
 * being the authority on entitlement — which RevenueCat remains.
 *
 * Called after sign-in. Reinstalling and signing back in therefore resumes the real
 * trial rather than starting a fresh fifteen days.
 */
export async function reconcileTrialStart(): Promise<'adopted' | 'kept-local' | 'nothing' | 'error'> {
  try {
    const meta = await fetchBackupMeta();
    const remote = meta?.trialStartedAt ?? null;
    if (!remote) return 'nothing';

    const local = await readLocalTrialStart();
    const remoteMs = Date.parse(remote);
    if (!Number.isFinite(remoteMs)) return 'nothing';
    if (local) {
      const localMs = Date.parse(local);
      if (Number.isFinite(localMs) && localMs <= remoteMs) return 'kept-local';
    }

    const { useSubscriptionStore } = await import('../store/useSubscriptionStore');
    if (!useSubscriptionStore.persist.hasHydrated()) await useSubscriptionStore.persist.rehydrate();
    useSubscriptionStore.getState().adoptTrialStart(new Date(remoteMs).toISOString());
    return 'adopted';
  } catch (error) {
    if (__DEV__) console.warn('[backup] reconcileTrialStart failed', error);
    return 'error';
  }
}

/** Email a sign-in code. Creates the account if there is not one. */
export async function requestSignInCode(email: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) return 'unavailable';
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      if (__DEV__) console.warn('[backup] requestSignInCode failed', error);
      return error.status === 429 ? 'rate-limited' : 'error';
    }
    return 'sent';
  } catch (error) {
    if (__DEV__) console.warn('[backup] requestSignInCode threw', error);
    return 'error';
  }
}

/**
 * The same code verifies under different types depending on who you are.
 *
 * An athlete signing up for the first time is sent a *signup confirmation* token
 * (Supabase's "Confirm sign up" email); one who already has an account is sent a
 * magic-link/OTP token ("Magic link or OTP"). Verifying a signup token as `email`
 * is rejected, so trying only one type meant the very first sign-in on an account
 * could never succeed — the code looked wrong when it was not.
 *
 * Ordered `email` first because after the first sign-in that is every subsequent
 * one, and a wrong guess costs only a rejected attempt, not a consumed code.
 */
const OTP_TYPES = ['email', 'signup'] as const;

function isBadCodeError(message: string): boolean {
  const text = message.toLowerCase();
  return text.includes('invalid') || text.includes('expired') || text.includes('token');
}

export async function verifySignInCode(email: string, code: string): Promise<VerifyResult> {
  const supabase = getSupabase();
  if (!supabase) return 'unavailable';
  const normalizedEmail = email.trim().toLowerCase();
  const token = code.trim();

  try {
    let lastBadCode = false;
    for (const type of OTP_TYPES) {
      const { error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type });
      if (!error) return 'signed-in';

      if (isBadCodeError(error.message)) {
        // Might just be the wrong type for this athlete — try the next one before
        // telling them their code is bad.
        lastBadCode = true;
        continue;
      }
      if (__DEV__) console.warn('[backup] verifySignInCode failed', error);
      return 'error';
    }
    return lastBadCode ? 'invalid-code' : 'error';
  } catch (error) {
    if (__DEV__) console.warn('[backup] verifySignInCode threw', error);
    return 'error';
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    if (__DEV__) console.warn('[backup] signOut failed', error);
  }
}

export async function getSignedInEmail(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Push the current device state up.
 *
 * Upserted on `user_id`, so there is exactly one backup per athlete and a push is
 * idempotent — running it twice costs a round trip and changes nothing.
 */
export function pushBackup(appVersion?: string, options: { replaceExisting?: boolean } = {}): Promise<PushBackupResult> {
  return serialize(() => pushBackupNow(appVersion, options));
}

async function pushBackupNow(appVersion: string | undefined, options: { replaceExisting?: boolean }): Promise<PushBackupResult> {
  const supabase = getSupabase();
  if (!supabase) return 'unavailable';
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return 'signed-out';

    if (suspended) return 'needs-review';
    const owner = await AsyncStorage.getItem(BACKUP_OWNER_KEY);
    if (owner !== userId && !options.replaceExisting) {
      if (owner === 'paused') return 'needs-review';
      const { data: existing, error: lookupError } = await supabase.from('backups')
        .select('user_id').eq('user_id', userId).maybeSingle();
      // A failed lookup is never evidence that overwriting the cloud is safe.
      if (lookupError) return 'error';
      if (existing) return 'needs-review';
    } else if (!options.replaceExisting) {
      // Owning the backup once is not owning it forever: an old phone still signed in
      // used to overwrite whatever a newer device had saved since. If the cloud copy
      // changed after this device last synced, someone has to choose.
      const syncedAt = Date.parse((await AsyncStorage.getItem(BACKUP_SYNCED_AT_KEY)) ?? '');
      if (Number.isFinite(syncedAt)) {
        const { data: existing, error: lookupError } = await supabase.from('backups')
          .select('updated_at').eq('user_id', userId).maybeSingle();
        if (lookupError) return 'error';
        const cloudAt = Date.parse(existing?.updated_at ?? '');
        if (Number.isFinite(cloudAt) && cloudAt > syncedAt) return 'needs-review';
      }
    }
    const snapshot = await captureSnapshot();
    if (!Object.keys(snapshot.stores).length) return 'error';
    const { data: saved, error } = await supabase.from('backups').upsert({
      user_id: userId,
      payload: snapshot,
      schema_version: BACKUP_SCHEMA_VERSION,
      app_version: appVersion ?? null,
      device_label: deviceLabel(),
      workout_count: snapshotWorkoutCount(snapshot),
      // Sent outside the payload on purpose — see the migration. Entitlement is
      // never backed up; only when the trial began.
      trial_started_at: await readLocalTrialStart(),
    }, { onConflict: 'user_id' }).select('updated_at').maybeSingle();

    if (error) {
      if (__DEV__) console.warn('[backup] pushBackup failed', error);
      return 'error';
    }
    await AsyncStorage.setItem(BACKUP_OWNER_KEY, userId);
    if (saved?.updated_at) await AsyncStorage.setItem(BACKUP_SYNCED_AT_KEY, saved.updated_at);
    else await AsyncStorage.removeItem(BACKUP_SYNCED_AT_KEY);
    return 'ok';
  } catch (error) {
    if (__DEV__) console.warn('[backup] pushBackup threw', error);
    return isBackupTooLarge(error) ? 'too-large' : 'error';
  }
}

/** What is stored, without downloading the payload — for the confirm screen. */
export async function fetchBackupMeta(): Promise<BackupMeta | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('backups')
      .select('updated_at, workout_count, device_label, app_version, trial_started_at')
      .maybeSingle();
    if (error || !data) return null;
    return {
      updatedAt: data.updated_at as string,
      workoutCount: (data.workout_count as number) ?? 0,
      deviceLabel: (data.device_label as string | null) ?? null,
      appVersion: (data.app_version as string | null) ?? null,
      trialStartedAt: (data.trial_started_at as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Replace everything on this device with the stored backup.
 *
 * Destructive by design, and the caller must have confirmed it. Returns `restored`
 * only once local storage has actually been written, so the UI can tell the athlete
 * to restart with confidence rather than hope.
 */
export function restoreBackup(): Promise<RestoreBackupResult> {
  const resume = suspendAutomaticBackups();
  return serialize(restoreBackupNow).finally(resume);
}

async function restoreBackupNow(): Promise<RestoreBackupResult> {
  const supabase = getSupabase();
  if (!supabase) return 'unavailable';
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) return 'signed-out';

    const { data, error } = await supabase.from('backups').select('payload, updated_at').maybeSingle();
    if (error) {
      if (__DEV__) console.warn('[backup] restoreBackup fetch failed', error);
      return 'error';
    }
    if (!data?.payload) return 'no-backup';

    const snapshot = data.payload as BackupSnapshot;
    if (snapshot.schema_version > BACKUP_SCHEMA_VERSION) return 'too-new';

    await applySnapshot(snapshot);
    await AsyncStorage.setItem(BACKUP_OWNER_KEY, sessionData.session.user.id);
    if (data.updated_at) await AsyncStorage.setItem(BACKUP_SYNCED_AT_KEY, data.updated_at);
    return 'restored';
  } catch (error) {
    if (__DEV__) console.warn('[backup] restoreBackup threw', error);
    return isBackupTooLarge(error) ? 'too-large' : 'error';
  }
}

/** Delete the stored backup. The athlete's local training is untouched. */
export function deleteBackup(): Promise<'deleted' | 'signed-out' | 'unavailable' | 'error'> {
  const resume = suspendAutomaticBackups();
  return serialize(deleteBackupNow).finally(resume);
}

async function deleteBackupNow(): Promise<'deleted' | 'signed-out' | 'unavailable' | 'error'> {
  const supabase = getSupabase();
  if (!supabase) return 'unavailable';
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return 'signed-out';
    await AsyncStorage.setItem(BACKUP_OWNER_KEY, 'paused');
    const { error } = await supabase.from('backups').delete().eq('user_id', userId);
    if (error) {
      if (__DEV__) console.warn('[backup] deleteBackup failed', error);
      return 'error';
    }
    return 'deleted';
  } catch {
    return 'error';
  }
}

/**
 * Delete the account itself, not just its backup.
 *
 * Required by Apple guideline 5.1.1(v): an app that can create an account has to be
 * able to delete one from inside the app. Deleting the backup row is *not* this —
 * that leaves the identity and the email address in place.
 *
 * The work happens in the `delete-account` Edge Function, because removing an auth
 * user needs the service role key and that key must never ship in a client. The
 * function takes the athlete's id from their verified token, so this call carries no
 * body: there is nothing here that could name somebody else's account.
 *
 * Failed requests keep the session available for retry. Successful deletion clears
 * the session on this device without signing out other devices unnecessarily.
 */
export async function deleteAccount(): Promise<'deleted' | 'signed-out' | 'unavailable' | 'error'> {
  const supabase = getSupabase();
  if (!supabase) return 'unavailable';
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user.id) return 'signed-out';

    // Leave any team first. Deleting the account cascades, and a leader's team would go
    // with it; leaving hands the team to the next member instead. Best effort: someone
    // who is not in a team, or a failed call, must not block deleting the account.
    await supabase.rpc('leave_team').then(() => undefined, () => undefined);

    const { data: result, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error || result?.ok !== true) {
      if (__DEV__) console.warn('[backup] deleteAccount failed', error);
      return 'error';
    }

    await supabase.auth.signOut({ scope: 'local' });
    return 'deleted';
  } catch (error) {
    if (__DEV__) console.warn('[backup] deleteAccount threw', error);
    return 'error';
  }
}

let backgroundListenerAttached = false;

/**
 * Ask for a backup soon, without making anyone wait for it.
 *
 * Called after something worth keeping changes — a finished workout, a saved
 * check-in. Debounced, so logging five sets in a minute costs one upload rather
 * than five, and fire-and-forget, so a dead network is invisible to the athlete.
 * The next call will catch whatever this one missed, because a snapshot is the
 * whole state rather than a delta.
 */
export function scheduleBackup(): void {
  if (!isBackupAvailable() || suspended) return;
  if (pendingPush) clearTimeout(pendingPush);
  pendingPush = setTimeout(() => {
    pendingPush = null;
    void pushBackup();
  }, BACKUP_DEBOUNCE_MS);
}

/**
 * Flush a pending backup when the app goes to the background.
 *
 * Without this, finishing a workout and immediately closing the app would leave the
 * debounce timer unfired and that session unbacked until the next one.
 */
export function startBackupLifecycle(): () => void {
  if (backgroundListenerAttached || !isBackupAvailable()) return () => undefined;
  backgroundListenerAttached = true;
  const subscription = AppState.addEventListener('change', (next) => {
    if (next !== 'background' && next !== 'inactive') return;
    if (!pendingPush) return;
    clearTimeout(pendingPush);
    pendingPush = null;
    void pushBackup();
  });
  return () => {
    subscription.remove();
    backgroundListenerAttached = false;
  };
}
