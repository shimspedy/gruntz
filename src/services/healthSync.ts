import Constants from 'expo-constants';
import { AppState, Linking, Platform } from 'react-native';
import {
  syncHealth, type HealthAdapter, type HealthExport, type HealthSyncResult, type HealthWorkout, type HealthWorkoutDetails, type HealthWorkoutKind,
} from '../features/healthSync';
import { loadRoute } from '../store/activityRoutes';
import { useHealthStore } from '../store/useHealthStore';
import { saveTrackedActivity, useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import type { RoutePoint } from '../types/activity';
import { healthSyncAllowed, healthSyncGeneration, trackHealthImportWrite } from './healthSyncGate';

export const healthPlatformName = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';
export type HealthAvailability = 'ready' | 'needsUpdate' | 'unavailable';

/** Which directions the user allowed. iOS never reveals reads, so `read` is assumed there. */
export interface HealthAccess { read: boolean; write: boolean }

type PlatformAdapter = HealthAdapter & {
  availability(): Promise<HealthAvailability>;
  requestAccess(): Promise<HealthAccess>;
  /** True when the platform says Gruntz may not save workouts; null when it will not say. */
  writeDenied(): boolean | null;
  openSettings(): void;
  /** Drops whatever a sync cached between calls. */
  release(): void;
};

// Each library is loaded only on the platform it exists for, and only once health
// sync is actually used: neither native module is touched at launch.
type HealthKit = typeof import('@kingstinct/react-native-healthkit');
type HealthConnect = typeof import('react-native-health-connect');

const HEART_RATE = 'HKQuantityTypeIdentifierHeartRate';
const DISTANCE = 'HKQuantityTypeIdentifierDistanceWalkingRunning';
const ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned';
const WORKOUT = 'HKWorkoutTypeIdentifier';
const WORKOUT_ROUTE = 'HKWorkoutRouteTypeIdentifier';

function appleHealth(): PlatformAdapter {
  const hk = require('@kingstinct/react-native-healthkit') as HealthKit;
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.gruntz.fitness';
  // A route can only be read through the workout object it belongs to.
  type Workout = Awaited<ReturnType<HealthKit['queryWorkoutSamples']>>[number];
  const seen = new Map<string, Workout>();
  const kinds: Record<number, HealthWorkoutKind> = {
    [hk.WorkoutActivityType.running]: 'run', [hk.WorkoutActivityType.hiking]: 'hike', [hk.WorkoutActivityType.walking]: 'walk',
  };
  return {
    availability: async () => (hk.isHealthDataAvailable() ? 'ready' : 'unavailable'),
    // Resolves once the sheet is answered. iOS never says what was allowed for reading,
    // so "connected" means "asked", and the sync finds out by reading.
    async requestAccess() {
      await hk.requestAuthorization({
        toRead: [WORKOUT, WORKOUT_ROUTE, HEART_RATE, DISTANCE, ENERGY],
        toShare: [WORKOUT, WORKOUT_ROUTE, DISTANCE, ENERGY],
      });
      return { read: true, write: hk.authorizationStatusFor(WORKOUT) !== hk.AuthorizationStatus.sharingDenied };
    },
    writeDenied: () => hk.authorizationStatusFor(WORKOUT) === hk.AuthorizationStatus.sharingDenied,
    release: () => seen.clear(),
    // Access is managed in the Health app (Sharing → Apps), not in this app's settings page.
    openSettings: () => { void Linking.openURL('x-apple-health://').catch(() => Linking.openSettings().catch(() => undefined)); },
    async workouts(sinceMs, untilMs) {
      const found = await hk.queryWorkoutSamples({
        filter: { date: { startDate: new Date(sinceMs), endDate: new Date(untilMs) } }, limit: 0, ascending: true,
      });
      seen.clear();
      return found.map((workout): HealthWorkout => {
        seen.set(workout.uuid, workout);
        return {
          id: workout.uuid,
          // The Gruntz watch app files rucks as hikes (Health has no ruck type) and tags them.
          kind: workout.metadata?.GruntzActivity === 'ruck' ? 'ruck' : kinds[workout.workoutActivityType] ?? 'other',
          startMs: workout.startDate.getTime(),
          endMs: workout.endDate.getTime(),
          activeSeconds: workout.duration?.quantity,
          distanceMeters: workout.totalDistance?.quantity,
          calories: workout.totalEnergyBurned?.quantity,
          source: workout.sourceRevision?.source?.name,
          fromGruntz: workout.sourceRevision?.source?.bundleIdentifier === bundleId,
        };
      });
    },
    // Everything a workout carries came with the query.
    workoutDetails: async () => ({}),
    async workoutRoute(id) {
      const routes = await seen.get(id)?.getWorkoutRoutes();
      return (routes ?? []).flatMap((route) => route.locations).map((location): RoutePoint => ({
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: Number.isFinite(location.altitude) ? location.altitude : null,
        timestamp: location.date.getTime(),
        speed: location.speed >= 0 ? location.speed : null,
      }));
    },
    async heartRate(startMs, endMs) {
      const stats = await hk.queryStatisticsForQuantity(HEART_RATE, ['discreteAverage', 'discreteMax'], {
        unit: 'count/min', filter: { date: { startDate: new Date(startMs), endDate: new Date(endMs) } },
      });
      const average = stats.averageQuantity?.quantity;
      const max = stats.maximumQuantity?.quantity;
      return typeof average === 'number' && typeof max === 'number' ? { average, max } : null;
    },
    async saveWorkout(workout) {
      const startDate = new Date(workout.startMs);
      const endDate = new Date(workout.endMs);
      const saved = await hk.saveWorkoutSample(
        workout.kind === 'run' ? hk.WorkoutActivityType.running : hk.WorkoutActivityType.hiking,
        [
          ...(workout.distanceMeters > 0 ? [{ startDate, endDate, quantityType: DISTANCE, quantity: workout.distanceMeters, unit: 'm' } as const] : []),
          ...(workout.calories ? [{ startDate, endDate, quantityType: ENERGY, quantity: workout.calories, unit: 'kcal' } as const] : []),
        ],
        startDate,
        endDate,
        { distance: workout.distanceMeters, ...(workout.calories ? { energyBurned: workout.calories } : {}) },
        { HKExternalUUID: workout.activityId },
      );
      // The workout is saved either way; a refused route only costs the map.
      if (workout.route && workout.route.length > 1) {
        await saved.saveWorkoutRoute(workout.route.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude ?? 0,
          date: new Date(point.timestamp),
          // Gruntz does not keep per-point accuracy. Negative means "unknown" to
          // Core Location; horizontal gets a nominal GPS figure so the point counts.
          horizontalAccuracy: 10,
          verticalAccuracy: point.altitude === null ? -1 : 10,
          speed: point.speed ?? -1,
          course: -1,
        }))).catch(() => false);
      }
      return true;
    },
  };
}

function healthConnect(): PlatformAdapter {
  const hc = require('react-native-health-connect') as HealthConnect;
  const packageName = Constants.expoConfig?.android?.package ?? 'com.gruntz.fitness';
  const kinds: Record<number, HealthWorkoutKind> = {
    [hc.ExerciseType.RUNNING]: 'run', [hc.ExerciseType.RUNNING_TREADMILL]: 'run',
    [hc.ExerciseType.HIKING]: 'hike', [hc.ExerciseType.WALKING]: 'walk',
  };
  // Routes arrive inline with a session, and only when Health Connect allows it.
  const routes = new Map<string, RoutePoint[]>();
  // What a session needs for its totals, kept until the sync asks for them.
  const scopes = new Map<string, { startMs: number; endMs: number; origin?: string; source?: string }>();
  let ready: Promise<boolean> | null = null;
  const initialized = async () => {
    ready ??= hc.initialize().catch(() => false);
    if (!await ready) { ready = null; throw new Error('Health Connect is not available.'); }
  };
  const between = (startMs: number, endMs: number) => ({
    operator: 'between' as const, startTime: new Date(startMs).toISOString(), endTime: new Date(endMs).toISOString(),
  });
  // A refused record is normal (the user may allow less than asked); development builds say which.
  const quiet = async <T,>(work: Promise<T>): Promise<T | undefined> => work.catch((error: unknown) => {
    if (__DEV__) console.warn('[health] Health Connect refused', error instanceof Error ? error.message : error);
    return undefined;
  });
  return {
    async availability() {
      const status = await hc.getSdkStatus().catch(() => hc.SdkAvailabilityStatus.SDK_UNAVAILABLE);
      if (status === hc.SdkAvailabilityStatus.SDK_AVAILABLE) return 'ready';
      return status === hc.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ? 'needsUpdate' : 'unavailable';
    },
    async requestAccess() {
      await initialized();
      const granted = await hc.requestPermission([
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'Distance' },
        { accessType: 'read', recordType: 'TotalCaloriesBurned' },
        { accessType: 'read', recordType: 'ElevationGained' },
        { accessType: 'write', recordType: 'ExerciseSession' },
        { accessType: 'write', recordType: 'Distance' },
        { accessType: 'write', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'write', recordType: 'ExerciseRoute' },
      ]);
      const has = (accessType: 'read' | 'write') => granted.some((p) => p.recordType === 'ExerciseSession' && p.accessType === accessType);
      return { read: has('read'), write: has('write') };
    },
    // Health Connect only reports granted permissions through an async call; the screen
    // learns about a refused write from the sync instead.
    writeDenied: () => null,
    release: () => { routes.clear(); scopes.clear(); },
    openSettings: () => {
      try {
        hc.openHealthConnectSettings();
      } catch {
        // Not installed or too old: the store listing is where it gets fixed.
        void Linking.openURL('market://details?id=com.google.android.apps.healthdata')
          .catch(() => Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'))
          .catch(() => undefined);
      }
    },
    async workouts(sinceMs, untilMs) {
      await initialized();
      const found: HealthWorkout[] = [];
      routes.clear();
      scopes.clear();
      let pageToken: string | undefined;
      do {
        const page = await hc.readRecords('ExerciseSession', {
          timeRangeFilter: between(sinceMs, untilMs), ascendingOrder: true, pageSize: 200, ...(pageToken ? { pageToken } : {}),
        });
        for (const session of page.records) {
          const id = session.metadata?.id;
          const startMs = Date.parse(session.startTime);
          const endMs = Date.parse(session.endTime);
          if (!id || !(startMs < endMs)) continue;
          const origin = session.metadata?.dataOrigin;
          const fromGruntz = origin === packageName;
          const kind = kinds[session.exerciseType] ?? 'other';
          const workout: HealthWorkout = { id, kind, startMs, endMs, fromGruntz };
          // Totals are separate records, fetched later and only for what gets imported.
          if (!fromGruntz && (kind === 'run' || kind === 'hike')) {
            const device = session.metadata?.device;
            scopes.set(id, { startMs, endMs, origin, source: [device?.manufacturer, device?.model].filter(Boolean).join(' ') || undefined });
            // The library reports the route state as text, whatever its types say.
            const route = session.exerciseRoute as { type?: unknown; route?: { time: string; latitude: number; longitude: number; altitude?: { inMeters?: number } }[] } | undefined;
            if (route?.type === 'DATA' && route.route?.length) {
              // A missing altitude comes through as 0 metres, so a route that is 0 all
              // the way is one with no altitude at all.
              const flat = route.route.every((point) => !point.altitude?.inMeters);
              routes.set(id, route.route.map((point): RoutePoint => ({
                latitude: point.latitude, longitude: point.longitude, altitude: flat ? null : point.altitude?.inMeters ?? null,
                timestamp: Date.parse(point.time), speed: null,
              })));
            }
          }
          found.push(workout);
        }
        pageToken = page.pageToken || undefined;
      } while (pageToken);
      return found;
    },
    async workoutDetails(id) {
      const scope = scopes.get(id);
      if (!scope) return {};
      const filter = { timeRangeFilter: between(scope.startMs, scope.endMs), ...(scope.origin ? { dataOriginFilter: [scope.origin] } : {}) };
      const [distance, energy, elevation] = await Promise.all([
        quiet(hc.aggregateRecord({ recordType: 'Distance', ...filter })),
        quiet(hc.aggregateRecord({ recordType: 'TotalCaloriesBurned', ...filter })),
        quiet(hc.aggregateRecord({ recordType: 'ElevationGained', ...filter })),
      ]);
      const details: HealthWorkoutDetails = { source: scope.source };
      if (distance?.DISTANCE?.inMeters) details.distanceMeters = distance.DISTANCE.inMeters;
      if (energy?.ENERGY_TOTAL?.inKilocalories) details.calories = energy.ENERGY_TOTAL.inKilocalories;
      if (elevation?.ELEVATION_GAINED_TOTAL?.inMeters) details.elevationMeters = elevation.ELEVATION_GAINED_TOTAL.inMeters;
      return details;
    },
    workoutRoute: async (id) => routes.get(id) ?? [],
    async heartRate(startMs, endMs) {
      await initialized();
      const stats = await hc.aggregateRecord({ recordType: 'HeartRate', timeRangeFilter: between(startMs, endMs) });
      // No samples comes back as zero, not as nothing.
      return stats.BPM_AVG > 0 && stats.BPM_MAX > 0 ? { average: stats.BPM_AVG, max: stats.BPM_MAX } : null;
    },
    async saveWorkout(workout) {
      await initialized();
      const span = { startTime: new Date(workout.startMs).toISOString(), endTime: new Date(workout.endMs).toISOString() };
      // ACTIVELY_RECORDED; the client ID makes a repeated insert an update, not a twin.
      const metadata = { clientRecordId: workout.activityId, recordingMethod: 1 };
      const session = {
        recordType: 'ExerciseSession' as const, ...span, title: workout.title, metadata,
        exerciseType: workout.kind === 'run' ? hc.ExerciseType.RUNNING : hc.ExerciseType.HIKING,
      };
      // Health Connect rejects a session whose route strays outside its own times.
      const route = (workout.route ?? [])
        .filter((point) => point.timestamp >= workout.startMs && point.timestamp <= workout.endMs)
        .map((point) => ({
          time: new Date(point.timestamp).toISOString(), latitude: point.latitude, longitude: point.longitude,
          ...(point.altitude === null ? {} : { altitude: { value: point.altitude, unit: 'meters' as const } }),
        }));
      // Route access is its own permission: without it the workout is still worth saving.
      if (route.length < 2 || !await quiet(hc.insertRecords([{ ...session, exerciseRoute: { route } }]))) {
        const ids = await hc.insertRecords([session]);
        if (__DEV__) console.log('[health] saved session', workout.activityId, ids);
      }
      if (workout.distanceMeters > 0) {
        await quiet(hc.insertRecords([{
          recordType: 'Distance', ...span, distance: { value: workout.distanceMeters, unit: 'meters' },
          metadata: { ...metadata, clientRecordId: `${workout.activityId}:distance` },
        }]));
      }
      if (workout.calories) {
        await quiet(hc.insertRecords([{
          recordType: 'ActiveCaloriesBurned', ...span, energy: { value: workout.calories, unit: 'kilocalories' },
          metadata: { ...metadata, clientRecordId: `${workout.activityId}:energy` },
        }]));
      }
      return true;
    },
  };
}

let adapter: PlatformAdapter | null | undefined;
function platformAdapter(): PlatformAdapter | null {
  if (adapter !== undefined) return adapter;
  try {
    adapter = Platform.OS === 'ios' ? appleHealth() : Platform.OS === 'android' ? healthConnect() : null;
  } catch {
    // A build made before the native modules were added.
    adapter = null;
  }
  return adapter;
}

export async function healthAvailability(): Promise<HealthAvailability> {
  return await platformAdapter()?.availability().catch((): HealthAvailability => 'unavailable') ?? 'unavailable';
}

export function openHealthSettings() {
  platformAdapter()?.openSettings();
}

/** Whether the platform is known to refuse Gruntz writing workouts. */
export function healthWriteDenied(): boolean {
  try {
    return platformAdapter()?.writeDenied() === true;
  } catch {
    return false;
  }
}

/**
 * Asks for access and, once given in either direction, runs the first sync. A
 * direction the user refused is switched off rather than left to fail quietly.
 * False when nothing was allowed, or the request itself failed.
 */
export async function connectHealth(): Promise<boolean> {
  const epoch = connectionEpoch;
  const generation = healthSyncGeneration();
  const access = await platformAdapter()?.requestAccess().catch((): HealthAccess => ({ read: false, write: false })) ?? { read: false, write: false };
  if (!healthSyncAllowed() || connectionEpoch !== epoch || healthSyncGeneration() !== generation) return false;
  const granted = access.read || access.write;
  const store = useHealthStore.getState();
  store.setConnected(granted);
  if (!granted) return false;
  if (!access.read) store.setPreference('importWorkouts', false);
  if (!access.write) store.setPreference('writeActivities', false);
  void runHealthSync();
  return true;
}

/** Gruntz stops reading and writing. What the platform has already been given stays there. */
export function disconnectHealth() {
  useHealthStore.getState().setConnected(false);
}

let running: Promise<HealthSyncResult | null> | null = null;
let connectionEpoch = 0;
// A reconnect must not revive work started under the previous permission choices.
useHealthStore.subscribe((next, previous) => {
  if (next.connected !== previous.connected || next.importWorkouts !== previous.importWorkouts || next.writeActivities !== previous.writeActivities) connectionEpoch++;
});

function trainingStoresReady(): boolean {
  return healthSyncAllowed() && useHealthStore.persist.hasHydrated() && useReadinessStore.persist.hasHydrated()
    && useUserStore.persist.hasHydrated() && !useUserStore.getState().hydrationFailed;
}

/** One sync at a time; a second caller gets the result of the one in flight. Null when not connected. */
export function runHealthSync(): Promise<HealthSyncResult | null> {
  running ??= sync().catch(() => null).finally(() => { running = null; });
  return running;
}

async function sync(): Promise<HealthSyncResult | null> {
  if (!trainingStoresReady()) return null;
  const health = platformAdapter();
  if (!health || !useHealthStore.getState().connected) return null;
  const epoch = connectionEpoch;
  const generation = healthSyncGeneration();
  try {
    return await syncHealth({
      adapter: health,
      now: () => Date.now(),
      prefs: () => useHealthStore.getState(),
      sessions: () => useReadinessStore.getState().trackedSessions,
      connected: () => useHealthStore.getState().connected && connectionEpoch === epoch && healthSyncAllowed() && healthSyncGeneration() === generation,
      loadRoute: async (id) => await loadRoute(id) ?? undefined,
      saveImported: (activity) => trackHealthImportWrite(saveTrackedActivity(activity)),
      credit: (activity) => useUserStore.getState().recordTrackedSession({
        id: activity.id, type: activity.type, miles: activity.distanceMiles, seconds: activity.durationSeconds,
      }),
      setHeartRate: (id, heartRate) => useReadinessStore.getState().setTrackedHeartRate(id, heartRate),
      heartRateChecked: (id, at) => useHealthStore.getState().noteHeartRateChecked(id, at),
      markExported: (id) => useHealthStore.getState().markExported(id),
      finished: (at) => useHealthStore.getState().finishedSync(at),
    });
  } finally {
    health.release();
  }
}

const MIN_AUTOMATIC_INTERVAL_MS = 15 * 60_000;

/** Syncs when the app opens and when it comes back to the front, but not more than every 15 minutes. */
export function startHealthSyncLifecycle(): () => void {
  const maybeSync = () => {
    const { connected, lastSyncAt } = useHealthStore.getState();
    if (trainingStoresReady() && connected && Date.now() - (lastSyncAt ?? 0) >= MIN_AUTOMATIC_INTERVAL_MS) void runHealthSync();
  };
  const unsubscribeHealth = useHealthStore.persist.onFinishHydration(maybeSync);
  const unsubscribeUser = useUserStore.persist.onFinishHydration(maybeSync);
  const unsubscribeReadiness = useReadinessStore.persist.onFinishHydration(maybeSync);
  maybeSync();
  const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') maybeSync(); });
  return () => { unsubscribeHealth(); unsubscribeUser(); unsubscribeReadiness(); subscription.remove(); };
}
