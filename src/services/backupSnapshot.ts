import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKUP_SCHEMA_VERSION } from '../config/backup';

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
  return {
    schema_version: BACKUP_SCHEMA_VERSION,
    captured_at: new Date().toISOString(),
    stores,
  };
}

/**
 * Replace local state with a snapshot.
 *
 * This is a wholesale replacement, not a merge, and that is the point: merging two
 * divergent training histories without a conflict model is how you end up with
 * duplicated sessions and an XP total nobody can explain. The caller is responsible
 * for confirming with the athlete first — see `restoreBackup`.
 *
 * The app must be restarted afterwards. Zustand's persist middleware reads storage
 * once at startup, so writing underneath a running store would leave memory and
 * disk disagreeing until something happened to overwrite one of them.
 */
export async function applySnapshot(snapshot: BackupSnapshot): Promise<void> {
  if (snapshot.schema_version > BACKUP_SCHEMA_VERSION) {
    throw new Error('This backup was made by a newer version of Gruntz. Update the app, then restore.');
  }

  const pairs = Object.entries(snapshot.stores).filter(
    ([key]) => (BACKED_UP_KEYS as readonly string[]).includes(key),
  );
  if (!pairs.length) {
    throw new Error('That backup is empty.');
  }

  // Keys absent from the snapshot are cleared rather than left behind, so a restore
  // cannot leave one store from the old device mixed in with seven from the backup.
  const missing = BACKED_UP_KEYS.filter((key) => !(key in snapshot.stores));
  if (missing.length) await AsyncStorage.multiRemove([...missing]);
  await AsyncStorage.multiSet(pairs as [string, string][]);
}

/** Workouts in the snapshot, for the "N workouts" line on the restore screen. */
export function snapshotWorkoutCount(snapshot: BackupSnapshot): number {
  try {
    const raw = snapshot.stores['@gruntz_user'];
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { state?: { progress?: { workouts_completed?: number } } };
    return parsed.state?.progress?.workouts_completed ?? 0;
  } catch {
    return 0;
  }
}
