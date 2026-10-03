import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKUP_SCHEMA_VERSION } from '../config/backup';
import { prepareStoreRestore } from './backupRestoreStores';
import { isTrackedSession } from '../features/activityHistory';
import { READINESS_STORAGE_KEY, readinessStorage } from '../store/readinessStorage';

/** Reject oversized snapshots rather than silently dropping activity history or routes. */
export const MAX_BACKUP_PAYLOAD_BYTES = 32 * 1024 * 1024;

export class BackupTooLargeError extends Error {
  readonly code = 'backup-too-large';
  constructor() {
    super('This backup exceeds the 32 MB limit. Your existing data has been kept.');
    this.name = 'BackupTooLargeError';
  }
}

function utf8Bytes(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/**
 * Which stores go into a backup, and which deliberately do not.
 *
 * Snapshots are taken from persisted storage rather than live Zustand stores.
 * Android activity history uses complete file revisions; other stores use AsyncStorage.
 * Apart from the explicit route privacy preference, what is on disk is what a fresh install would
 * rehydrate, so a restore reproduces the device rather than a re-serialisation of
 * whatever happens to be in memory. It also means this module does not import the
 * stores and cannot be caught in a hydration race with them.
 */
const BACKED_UP_KEYS = [
  '@gruntz_user', // profile, XP, streak, achievements, claimed missions
  '@gruntz_exercise_log', // the training history — the irreplaceable part
  '@gruntz_exercise_notes',
  '@gruntz_readiness', // check-ins, completed activities, opt-in routes, test scores
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
 * - `@gruntz_active_activity` — a live native tracking draft is device-local.
 * - The SecureStore assessment blob — it is in SecureStore precisely because it
 *   should not travel, and it is re-derivable from onboarding.
 */
export type BackupSnapshot = {
  schema_version: number;
  captured_at: string;
  stores: Record<string, string>;
};

async function readStores(keys: readonly string[]): Promise<[string, string | null][]> {
  const values: [string, string | null][] = (await AsyncStorage.multiGet(keys.filter((key) => key !== READINESS_STORAGE_KEY)))
    .map(([key, value]) => [key, value]);
  if (keys.includes(READINESS_STORAGE_KEY)) values.push([READINESS_STORAGE_KEY, await readinessStorage.getItem(READINESS_STORAGE_KEY)]);
  return values;
}

async function writeStores(pairs: [string, string][]): Promise<void> {
  const ordinary = pairs.filter(([key]) => key !== READINESS_STORAGE_KEY);
  if (ordinary.length) await AsyncStorage.multiSet(ordinary);
  const readiness = pairs.find(([key]) => key === READINESS_STORAGE_KEY);
  if (readiness) await readinessStorage.setItem(...readiness);
}

async function removeStores(keys: string[]): Promise<void> {
  const ordinary = keys.filter((key) => key !== READINESS_STORAGE_KEY);
  if (ordinary.length) await AsyncStorage.multiRemove(ordinary);
  if (keys.includes(READINESS_STORAGE_KEY)) await readinessStorage.removeItem(READINESS_STORAGE_KEY);
}

export async function captureSnapshot(): Promise<BackupSnapshot> {
  const entries = await readStores(BACKED_UP_KEYS);
  const stores: Record<string, string> = {};
  for (const [key, value] of entries) {
    // A store the athlete has never touched simply has no row yet.
    if (typeof value !== 'string' || !value.length) continue;
    if (key === '@gruntz_readiness') {
      const parsed: unknown = JSON.parse(value);
      if (isRecord(parsed) && isRecord(parsed.state)
        && parsed.state.includeActivityRoutesInBackup !== true
        && Array.isArray(parsed.state.trackedSessions)) {
        // Existing backup users have never consented to precise location uploads.
        // Only the cloud copy loses routes; local history remains complete.
        parsed.state.trackedSessions = parsed.state.trackedSessions.map((activity: unknown) => {
          if (!isRecord(activity)) return activity;
          const { route: _route, ...summary } = activity;
          return summary;
        });
        stores[key] = JSON.stringify(parsed);
        continue;
      }
    }
    stores[key] = value;
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
  // Stop the native task before replacing any data; a queued location callback
  // must not resurrect a draft belonging to the profile being replaced.
  const { stopActiveActivityForDataChange } = await import('./activityTracking');
  await stopActiveActivityForDataChange();
  // Also remove an unfinished workout from this device; it belongs to the state
  // being replaced and must not later be credited to the restored profile.
  const keys = [...BACKED_UP_KEYS, '@gruntz_session'];
  const previous = await readStores(keys);
  const missing = keys.filter((key) => !pairs.some(([saved]) => saved === key));
  try {
    await writeStores(pairs);
    if (missing.length) await removeStores(missing);
    await updateMemory();
  } catch (error) {
    // AsyncStorage has no transaction. Recover the previous complete snapshot if
    // a partial write fails, before reporting failure to the athlete.
    const oldValues = previous.filter((entry): entry is [string, string] => entry[1] !== null);
    const oldMissing = previous.filter(([, value]) => value === null).map(([key]) => key);
    await writeStores(oldValues);
    if (oldMissing.length) await removeStores(oldMissing);
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
  let payloadBytes = 1024; // framing, allowlisted keys, schema and timestamp
  for (const key of BACKED_UP_KEYS) {
    if (!(key in value.stores)) continue;
    const raw = value.stores[key];
    if (typeof raw !== 'string') throw new Error('That backup contains unreadable data.');
    // Check character length before allocating an escaped copy of a huge value.
    if (raw.length > MAX_BACKUP_PAYLOAD_BYTES) throw new BackupTooLargeError();
    payloadBytes += utf8Bytes(JSON.stringify(raw));
    if (payloadBytes > MAX_BACKUP_PAYLOAD_BYTES) throw new BackupTooLargeError();
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
    if (key === '@gruntz_readiness' && Array.isArray(state.trackedSessions)
      && state.trackedSessions.some((activity: unknown) => !isTrackedSession(activity))) {
      throw new Error('That backup contains invalid activity history or GPS routes.');
    }
    if (key === '@gruntz_readiness' && state.includeActivityRoutesInBackup !== undefined
      && typeof state.includeActivityRoutesInBackup !== 'boolean') {
      throw new Error('That backup contains an invalid route privacy preference.');
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
    const parsed = raw ? JSON.parse(raw) as { state?: { progress?: { workouts_completed?: number } } } : undefined;
    const count = parsed?.state?.progress?.workouts_completed;
    const readiness = snapshot.stores['@gruntz_readiness'];
    const activities = readiness ? (JSON.parse(readiness) as { state?: { trackedSessions?: unknown } }).state?.trackedSessions : undefined;
    return (typeof count === 'number' && Number.isInteger(count) && count >= 0 ? count : 0)
      + (Array.isArray(activities) ? activities.length : 0);
  } catch {
    return 0;
  }
}
