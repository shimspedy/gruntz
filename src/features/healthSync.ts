import type { RoutePoint } from '../types/activity';
import type { RecordedActivity, TrackedSession } from '../store/useReadinessStore';
import { finite, isRoutePoint } from './activityHistory';
import { FEET_PER_METER, METERS_PER_MILE } from '../utils/units';

const DAY_MS = 86_400_000;

/** First sync, and the furthest back any sync reaches. */
export const HEALTH_LOOKBACK_DAYS = 30;
/** Imported activities carry the platform's own ID behind this prefix. */
export const HEALTH_ID_PREFIX = 'health:';
const MIN_IMPORT_SECONDS = 60;
/** A watch can deliver heart rate hours after the activity; asking again daily catches it. */
const HEART_RATE_RECHECK_MS = DAY_MS;

/** A ruck only exists as a hike in Apple Health; the Gruntz watch app tags its rucks so they come back as rucks. */
export type HealthWorkoutKind = 'run' | 'ruck' | 'hike' | 'walk' | 'other';

/** A workout read from Apple Health or Health Connect, reduced to what Gruntz keeps. */
export interface HealthWorkout {
  id: string;
  kind: HealthWorkoutKind;
  startMs: number;
  endMs: number;
  /** Time spent moving when the platform reports it; otherwise the whole span counts. */
  activeSeconds?: number;
  distanceMeters?: number;
  calories?: number;
  elevationMeters?: number;
  /** The watch or app that recorded it, e.g. "Apple Watch". */
  source?: string;
  /** Written by Gruntz itself, so never imported back. */
  fromGruntz: boolean;
}

/** Totals a platform only hands over on request, for the workouts that are actually imported. */
export type HealthWorkoutDetails = Partial<Pick<HealthWorkout, 'activeSeconds' | 'distanceMeters' | 'calories' | 'elevationMeters' | 'source'>>;

export interface HeartRateSummary { average: number; max: number }

/** What Gruntz writes to the health platform for one finished activity. */
export interface HealthExport {
  activityId: string;
  /** Neither platform has a ruck type; a ruck is filed as a hike. */
  kind: 'run' | 'hike';
  title: string;
  startMs: number;
  endMs: number;
  distanceMeters: number;
  calories?: number;
  route?: RoutePoint[];
}

/** The native boundary. Every method may reject; the sync treats that as "nothing this time". */
export interface HealthAdapter {
  workouts(sinceMs: number, untilMs: number): Promise<HealthWorkout[]>;
  workoutDetails(id: string): Promise<HealthWorkoutDetails>;
  workoutRoute(id: string): Promise<RoutePoint[]>;
  heartRate(startMs: number, endMs: number): Promise<HeartRateSummary | null>;
  saveWorkout(workout: HealthExport): Promise<boolean>;
}

export interface HealthSyncPrefs {
  writeActivities: boolean;
  importWorkouts: boolean;
  exportedIds: string[];
  /** Activity ID → when heart rate was last looked up for it. */
  heartRateChecked: Record<string, number>;
  lastSyncAt: number | null;
}

export interface HealthSyncDependencies {
  adapter: HealthAdapter;
  now(): number;
  prefs(): HealthSyncPrefs;
  sessions(): TrackedSession[];
  /** False once the user has disconnected: the sync stops at the next item. */
  connected(): boolean;
  loadRoute(id: string): Promise<RoutePoint[] | undefined>;
  saveImported(activity: RecordedActivity): Promise<boolean>;
  /** Lifetime distance and run/ruck records; an import is real training too. */
  credit(activity: RecordedActivity): void;
  setHeartRate(id: string, heartRate: HeartRateSummary): void;
  heartRateChecked(id: string, at: number): void;
  markExported(id: string): void;
  finished(at: number): void;
}

export interface HealthSyncResult {
  exported: number;
  imported: number;
  heartRates: number;
  /** The platform refused to hand over workouts: access was probably withdrawn. */
  readFailed: boolean;
  /** The user disconnected while the sync was running. */
  stopped: boolean;
}

/** When an activity started and ended, or null when its dates cannot say. */
export function activityWindow(session: TrackedSession): { startMs: number; endMs: number } | null {
  const endMs = Date.parse(session.date);
  if (!Number.isFinite(endMs)) return null;
  const started = session.startedAt ? Date.parse(session.startedAt) : NaN;
  const startMs = Number.isFinite(started) ? started : endMs - session.durationSeconds * 1000;
  return startMs < endMs ? { startMs, endMs } : null;
}

export const isImported = (session: Pick<TrackedSession, 'id'>) => session.id.startsWith(HEALTH_ID_PREFIX);

const TITLES = { run: 'Run', ruck: 'Ruck', hike: 'Hike' } as const;

/** Null for anything that should not be written: imported workouts and undatable records. */
export function toHealthExport(activity: RecordedActivity): HealthExport | null {
  if (isImported(activity)) return null;
  const window = activityWindow(activity);
  if (!window) return null;
  return {
    activityId: activity.id,
    kind: activity.type === 'run' ? 'run' : 'hike',
    title: activity.title?.trim() || `Gruntz ${TITLES[activity.type]}`,
    ...window,
    distanceMeters: Math.round(activity.distanceMiles * METERS_PER_MILE),
    ...(finite(activity.caloriesEstimate) && activity.caloriesEstimate > 0 ? { calories: Math.round(activity.caloriesEstimate) } : {}),
    ...(activity.route?.length ? { route: activity.route } : {}),
  };
}

/** Two recordings of the same outing overlap for most of the shorter one. */
function sameOuting(a: { startMs: number; endMs: number }, b: { startMs: number; endMs: number }) {
  const overlap = Math.min(a.endMs, b.endMs) - Math.max(a.startMs, b.startMs);
  return overlap > 0 && overlap >= Math.min(a.endMs - a.startMs, b.endMs - b.startMs) / 2;
}

/**
 * Workouts worth adding to history, oldest first. Walks are left out: a watch logs
 * every stroll, and that is not what Activity history is for. A workout that covers
 * the same time as something already in history is the same outing recorded twice.
 */
export function importableWorkouts(workouts: HealthWorkout[], existing: TrackedSession[]): HealthWorkout[] {
  const known = new Set(existing.map((session) => session.id));
  const taken = existing.map(activityWindow).filter((window) => window !== null);
  const imported: HealthWorkout[] = [];
  for (const workout of [...workouts].sort((a, b) => a.endMs - b.endMs)) {
    if (workout.fromGruntz || (workout.kind !== 'run' && workout.kind !== 'ruck' && workout.kind !== 'hike')) continue;
    if (!workout.id || !finite(workout.startMs) || !finite(workout.endMs)) continue;
    if ((workout.endMs - workout.startMs) / 1000 < MIN_IMPORT_SECONDS) continue;
    const id = `${HEALTH_ID_PREFIX}${workout.id}`;
    if (id.length > 200 || known.has(id) || taken.some((window) => sameOuting(window, workout))) continue;
    known.add(id);
    taken.push({ startMs: workout.startMs, endMs: workout.endMs });
    imported.push(workout);
  }
  return imported;
}

/** The history record for a workout; passes the same validation as a recorded activity. */
export function toImportedActivity(workout: HealthWorkout, details: HealthWorkoutDetails = {}): RecordedActivity {
  const merged = { ...workout, ...details };
  const span = (merged.endMs - merged.startMs) / 1000;
  const active = finite(merged.activeSeconds) && merged.activeSeconds > 0 ? Math.min(merged.activeSeconds, span) : span;
  const source = merged.source?.trim().slice(0, 100);
  return {
    id: `${HEALTH_ID_PREFIX}${merged.id}`,
    type: merged.kind === 'run' ? 'run' : merged.kind === 'ruck' ? 'ruck' : 'hike',
    date: new Date(merged.endMs).toISOString(),
    startedAt: new Date(merged.startMs).toISOString(),
    distanceMiles: Math.round((Math.max(0, finite(merged.distanceMeters) ? merged.distanceMeters : 0) / METERS_PER_MILE) * 100) / 100,
    durationSeconds: Math.round(active),
    elevationFeet: Math.round(Math.max(0, finite(merged.elevationMeters) ? merged.elevationMeters : 0) * FEET_PER_METER),
    ...(finite(merged.calories) && merged.calories > 0 ? { caloriesEstimate: Math.round(merged.calories) } : {}),
    ...(source ? { source } : {}),
  };
}

/** Rounded and range-checked; a strap that reported nonsense yields null. */
export function cleanHeartRate(summary: HeartRateSummary | null): HeartRateSummary | null {
  if (!summary || !finite(summary.average) || !finite(summary.max)) return null;
  const average = Math.round(summary.average);
  const max = Math.round(Math.max(summary.max, summary.average));
  return average >= 25 && max <= 260 ? { average, max } : null;
}

/** A route the history store will accept: valid points in time order. */
export function cleanRoute(points: RoutePoint[]): RoutePoint[] {
  return points.filter(isRoutePoint).map((point) => ({ ...point, segment: 0 })).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * One pass in each direction the user has switched on. Each item stands alone: a
 * failure skips that item and it is tried again next time, because nothing is
 * marked done until the platform or the history store has accepted it.
 */
export async function syncHealth(deps: HealthSyncDependencies): Promise<HealthSyncResult> {
  const result: HealthSyncResult = { exported: 0, imported: 0, heartRates: 0, readFailed: false, stopped: false };
  const now = deps.now();
  const prefs = deps.prefs();
  const horizon = now - HEALTH_LOOKBACK_DAYS * DAY_MS;
  const stopped = () => { if (!deps.connected()) result.stopped = true; return result.stopped; };
  // Without read access a platform may refuse outright; exporting still goes ahead.
  const workouts = await deps.adapter.workouts(horizon, now).catch(() => { result.readFailed = true; return []; });
  if (stopped()) return result;

  if (prefs.writeActivities) {
    const exported = new Set(prefs.exportedIds);
    const written = workouts.filter((workout) => workout.fromGruntz);
    for (const session of deps.sessions()) {
      if (stopped()) return result;
      const window = activityWindow(session);
      if (exported.has(session.id) || isImported(session) || !window || window.endMs < horizon) continue;
      // Already there from an earlier install: record it instead of writing a twin.
      if (written.some((workout) => sameOuting(workout, window))) { deps.markExported(session.id); continue; }
      try {
        const route = session.routePoints ? await deps.loadRoute(session.id) : undefined;
        const payload = toHealthExport({ ...session, ...(route?.length ? { route } : {}) });
        if (payload && await deps.adapter.saveWorkout(payload)) { deps.markExported(session.id); result.exported++; }
      } catch { /* Tried again on the next sync. */ }
    }
  }

  if (prefs.importWorkouts) {
    // The whole window every time: anything already in history is skipped by ID, and
    // a restored backup, which never carries health data, gets its workouts back.
    for (const workout of importableWorkouts(workouts, deps.sessions())) {
      if (stopped()) return result;
      try {
        const details = await deps.adapter.workoutDetails(workout.id).catch((): HealthWorkoutDetails => ({}));
        const activity = toImportedActivity(workout, details);
        const route = cleanRoute(await deps.adapter.workoutRoute(workout.id).catch(() => []));
        const heartRate = cleanHeartRate(await deps.adapter.heartRate(workout.startMs, workout.endMs).catch(() => null));
        const saved = await deps.saveImported({
          ...activity,
          ...(route.length > 1 ? { route } : {}),
          ...(heartRate ? { averageHeartRate: heartRate.average, maxHeartRate: heartRate.max } : {}),
        });
        if (!saved) continue;
        deps.credit(activity);
        deps.heartRateChecked(activity.id, now);
        result.imported++;
      } catch { /* Tried again on the next sync. */ }
    }

    // A phone-recorded activity picks up heart rate from whatever the user was
    // wearing. Each one is asked about at most once a day until it has a reading.
    for (const session of deps.sessions()) {
      if (stopped()) return result;
      const window = activityWindow(session);
      const checkedAt = prefs.heartRateChecked[session.id];
      if (!window || window.endMs < horizon || finite(session.averageHeartRate)) continue;
      if (finite(checkedAt) && now - checkedAt < HEART_RATE_RECHECK_MS) continue;
      try {
        const heartRate = cleanHeartRate(await deps.adapter.heartRate(window.startMs, window.endMs));
        deps.heartRateChecked(session.id, now);
        if (heartRate) { deps.setHeartRate(session.id, heartRate); result.heartRates++; }
      } catch { /* Tried again on the next sync. */ }
    }
  }

  deps.finished(now);
  return result;
}
