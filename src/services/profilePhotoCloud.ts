import { useReadinessStore } from '../store/useReadinessStore';
import { useChromePrefs } from '../store/useUiStore';
import { loadProfilePhotoLocation, saveDownloadedProfilePhoto } from './profilePhoto';
import { getSupabase } from './supabaseClient';

/**
 * The profile photo of a signed-in athlete is kept on the server, so it survives a
 * reinstall or a new phone and teammates can see it.
 *
 * Who can read it is decided by storage policies, not here: the owner, and members
 * of a team the owner is on. The bucket is private and links are short-lived. The
 * bucket keeps its original name, `team-avatars`, so existing photos and policies
 * carry over.
 */
const BUCKET = 'team-avatars';
const pathFor = (userId: string) => `${userId}.jpg`;

async function signedInUser(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/** Ties the upload record to the account, so switching accounts uploads again. */
const markerFor = (userId: string, file: string) => `${userId}:${file}`;

/** A stable version for teammates' caches: when the photo was taken, not when it was synced. */
export function photoVersion(file: string, now = Date.now()): number {
  const taken = Number(/(\d{10,})/.exec(file)?.[1]);
  return Math.floor((Number.isFinite(taken) && taken > 0 ? taken : now) / 1000);
}

let running: Promise<void> | null = null;

/**
 * Brings the server copy in line with this phone: uploads a new photo, deletes a
 * removed one, and tells each team which version to show. Safe to call often;
 * failures are retried on the next call.
 */
export function syncProfilePhoto(): Promise<void> {
  running ??= syncNow().finally(() => { running = null; });
  return running;
}

async function syncNow(): Promise<void> {
  const userId = await signedInUser();
  const supabase = getSupabase();
  if (!userId || !supabase) return;
  const prefs = useChromePrefs.getState();
  const inTeam = useReadinessStore.getState().teamCount > 0;
  try {
    const file = prefs.profilePhotoFile;
    if (file) {
      const marker = markerFor(userId, file);
      if (prefs.teamAvatarSynced !== marker) {
        const uri = await loadProfilePhotoLocation();
        if (!uri) return;
        const { File } = await import('expo-file-system');
        const bytes = await new File(uri).arrayBuffer();
        const { error } = await supabase.storage.from(BUCKET).upload(pathFor(userId), bytes, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        useChromePrefs.getState().setTeamAvatarSynced(marker);
      }
      // Every team roster row carries the version, including teams joined after the upload.
      if (inTeam) {
        const { error } = await supabase.rpc('set_team_avatar_version', { p_version: photoVersion(file) });
        if (error) throw error;
      }
    } else if (prefs.teamAvatarSynced?.startsWith(`${userId}:`)) {
      // Removed on this phone after it was uploaded.
      const { error } = await supabase.storage.from(BUCKET).remove([pathFor(userId)]);
      if (error) throw error;
      if (inTeam) {
        const { error: rpcError } = await supabase.rpc('set_team_avatar_version', { p_version: 0 });
        if (rpcError) throw rpcError;
      }
      useChromePrefs.getState().setTeamAvatarSynced(null);
    }
  } catch (error) {
    if (__DEV__) console.warn('[profilePhoto] sync failed', error);
  }
}

/**
 * On a phone with no photo (new install, new phone, restored progress), fetches the
 * one saved on the account. Never replaces a photo already on this phone, and never
 * brings back one this phone removed and has not yet deleted from the server.
 */
export async function restoreProfilePhoto(): Promise<'restored' | 'none'> {
  const userId = await signedInUser();
  const supabase = getSupabase();
  if (!userId || !supabase) return 'none';
  if (await loadProfilePhotoLocation()) return 'none';
  if (useChromePrefs.getState().teamAvatarSynced?.startsWith(`${userId}:`)) return 'none';
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(pathFor(userId));
    if (error || !data) return 'none';
    const file = await saveDownloadedProfilePhoto(await data.arrayBuffer());
    // Re-check: the athlete may have picked a photo while this was downloading.
    if (!file) return 'none';
    useChromePrefs.getState().setTeamAvatarSynced(markerFor(userId, file));
    return 'restored';
  } catch (error) {
    if (__DEV__) console.warn('[profilePhoto] restore failed', error);
    return 'none';
  }
}

let started = false;

/** Restores and syncs the photo whenever an account session starts, including at launch. */
export function initializeProfilePhotoCloud() {
  if (started) return;
  const supabase = getSupabase();
  if (!supabase) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session?.user.id || (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN')) return;
    // Outside the auth callback: Supabase calls made inside it can deadlock its lock.
    setTimeout(() => { void restoreProfilePhoto().then(() => syncProfilePhoto()); }, 0);
  });
}
