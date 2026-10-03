import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKUP_SCHEMA_VERSION } from '../config/backup';
import { prepareStoreRestore } from './backupRestoreStores';

/**
 * Which stores go into a backup, and which deliberately do not.
 *
 * Snapshots are taken straight from AsyncStorage rather than from the live Zustand
 * stores. That is on purpose: what is on disk is exactly what a fresh install would
 * rehydrate, so a restore reproduces the device rather than a re-serialisation of
 * whatever happens to be in memory. It also means this module does not import the
 * stores and cannot be caught in a hydration race with them.
 */
const BACKED_UP_KEYS = [
  '@gruntz_user', // profile, XP, streak, achievements, claimed missions
  '@gruntz_exercise_log', // the training history — the irreplaceable part
  '@gruntz_exercise_notes',
  '@gruntz_readiness', // check-ins, tracked runs and rucks, test scores
  '@gruntz_plan_library',
  '@gruntz_program',
  '@gruntz_routines',
  '@gruntz_challenges',
] as const;

/**
 * Never backed up:
 *
 * - `@gruntz_subscription` — RevenueCat is the authority on entitlement. Making Pro
 *   access restorable from a payload the client writes would be a way to grant
 *   yourself a subscription. Restoring purchases is the supported path and already
 *   exists in Settings.
 * - The 528-plan catalog and the exercise library — bundled with the app, identical
 *   for everyone, and several megabytes. Nothing to back up.
 * - UI state and one-off flags — worthless to restore and noisy to diff.
 * - The SecureStore assessment blob — it is in SecureStore precisely because it
 *   should not travel, and it is re-derivable from onboarding.
 */
export type BackupSnapshot = {
  schema_version: number;
  captured_at: string;
  stores: Record<string, string>;
};

export async function captureSnapshot(): Promise<BackupSnapshot> {
  const entries = await AsyncStorage.multiGet([...BACKED_UP_KEYS]);
  const stores: Record<string, string> = {};
  for (const [key, value] of entries) {
    // A store the athlete has never touched simply has no row yet.
    if (typeof value === 'string' && value.length) stores[key] = value;
  }
  const snapshot = {
    schema_version: BACKUP_SCHEMA_VERSION,
    captured_at: new Date().toISOString(),
    stores,
  };
  if (Object.keys(stores).length) validateSnapshot(snapshot);
  return snapshot;
}

/**
 * Replace local state with a snapshot.
 *
 * This is a wholesale replacement, not a merge, and that is the point: merging two
 * divergent training histories without a conflict model is how you end up with
 * duplicated sessions and an XP total nobody can explain. The caller is responsible
 * for confirming with the athlete first — see `restoreBackup`.
 *
 * Disk and live stores are replaced together; otherwise the next store update would
 * overwrite the restored backup with the device's previous state.
 */
export async function applySnapshot(snapshot: BackupSnapshot): Promise<void> {
  const pairs = validateSnapshot(snapshot);
  const updateMemory = await prepareStoreRestore(Object.fromEntries(pairs));
  // Also remove an unfinished workout from this device; it belongs to the state
  // being replaced and must not later be credited to the restored profile.
  const keys = [...BACKED_UP_KEYS, '@gruntz_session'];
  const previous = await AsyncStorage.multiGet(keys);
  const missing = keys.filter((key) => !pairs.some(([saved]) => saved === key));
  try {
    await AsyncStorage.multiSet(pairs);
    if (missing.length) await AsyncStorage.multiRemove(missing);
    await updateMemory();
  } catch (error) {
    // AsyncStorage has no transaction. Recover the previous complete snapshot if
    // a partial write fails, before reporting failure to the athlete.
    const oldValues = previous.filter((entry): entry is [string, string] => entry[1] !== null);
    const oldMissing = previous.filter(([, value]) => value === null).map(([key]) => key);
    await AsyncStorage.multiSet(oldValues);
    if (oldMissing.length) await AsyncStorage.multiRemove(oldMissing);
    throw error;
  }
}


/** Reject corrupt payloads before deleting or replacing any local storage. */
export function validateSnapshot(value: unknown): [string, string][] {
  if (!isRecord(value) || !Number.isInteger(value.schema_version) || (value.schema_version as number) < 1) {
    throw new Error('That backup is not valid.');
  }
  if ((value.schema_version as number) > BACKUP_SCHEMA_VERSION) {
    throw new Error('This backup was made by a newer version of Gruntz. Update the app, then restore.');
  }
  if (!isRecord(value.stores)) throw new Error('That backup has no stores.');
  const pairs: [string, string][] = [];
  for (const key of BACKED_UP_KEYS) {
    if (!(key in value.stores)) continue;
    const raw = value.stores[key];
    if (typeof raw !== 'string') throw new Error('That backup contains unreadable data.');
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.state)
      || (parsed.version !== undefined && (!Number.isInteger(parsed.version) || (parsed.version as number) < 0))) {
      throw new Error('That backup contains an invalid store.');
    }
    const state = parsed.state;
    const recordKeys: Record<string, string[]> = {
      '@gruntz_user': ['progress'], '@gruntz_exercise_log': ['logs'],
      '@gruntz_exercise_notes': ['notes'], '@gruntz_readiness': ['testScores', 'targetScores'],
      '@gruntz_plan_library': ['progressByPlan'],
    };
    const arrayKeys: Record<string, string[]> = {
      '@gruntz_user': ['achievements'], '@gruntz_readiness': ['checkIns', 'trackedSessions'],
      '@gruntz_plan_library': ['completedDayIds'], '@gruntz_routines': ['routines'],
      '@gruntz_challenges': ['completedDates'],
    };
    for (const field of recordKeys[key] ?? []) {
      if (field in state && !isRecord(state[field])) throw new Error('That backup contains invalid records.');
    }
    for (const field of arrayKeys[key] ?? []) {
      if (field in state && !Array.isArray(state[field])) throw new Error('That backup contains invalid lists.');
    }
    if (key === '@gruntz_exercise_log' && isRecord(state.logs)) {
      for (const entries of Object.values(state.logs)) {
        if (!Array.isArray(entries) || entries.some((entry) => !isRecord(entry)
          || typeof entry.id !== 'string' || typeof entry.at !== 'string'
          || !Number.isFinite(Date.parse(entry.at)) || !Array.isArray(entry.sets)
          || entry.sets.some((set: unknown) => !isRecord(set)))) {
          throw new Error('That backup contains invalid workout history.');
        }
      }
    }
    pairs.push([key, raw]);
  }
  if (!pairs.length) throw new Error('That backup is empty.');
  return pairs;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Workouts in the snapshot, for the "N workouts" line on the restore screen. */
export function snapshotWorkoutCount(snapshot: BackupSnapshot): number {
  try {
    const raw = snapshot.stores['@gruntz_user'];
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { state?: { progress?: { workouts_completed?: number } } };
    const count = parsed.state?.progress?.workouts_completed;
    return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : 0;
  } catch {
    return 0;
  }
}
