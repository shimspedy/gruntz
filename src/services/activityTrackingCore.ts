import type { ActivityType, RoutePoint } from '../types/activity';

export const ACTIVE_ACTIVITY_STORAGE_KEY = '@gruntz_active_activity';
export const DEFAULT_BODY_WEIGHT_LBS = 160;
export const MAX_ACTIVITY_ROUTE_POINTS = 6000;
const METERS_TO_MILES = 0.000621371;
const METERS_TO_FEET = 3.28084;
const MAX_GPS_GAP_MS = 120000;
const MAX_FIX_ACCURACY_M = 35;
const MAX_SPEED_MPS = 12;
const ALTITUDE_SMOOTHING = 0.2;
const DRAFT_READ_ERROR = 'Your saved activity could not be read. Retry after freeing storage; discard it only if you no longer need it.';
const WAITING_FOR_GPS_NOTICE = 'Waiting for a precise GPS signal. Recording will continue when location is available; the missing route will not add distance.';

export interface ActivityTrackingOptions {
  batterySaver?: boolean;
  loadedWeightLbs?: number;
  activityType?: ActivityType;
  packWeightPounds?: number;
  terrain?: string;
  backgroundTracking?: boolean;
}
export interface RunTrackerState {
  isTracking: boolean;
  isPaused: boolean;
  distanceMiles: number;
  durationMs: number;
  paceMinPerMile: number | null;
  currentSpeedMph: number | null;
  steps: number;
  elevationGainFt: number;
  route: RoutePoint[];
  caloriesEstimate: number;
  sessionId: string | null;
  startedAt: number | null;
  activityType: ActivityType;
  packWeightPounds: number;
  terrain: string | null;
  backgroundEnabled: boolean;
  /** Expo's Android pedometer cannot fill steps recorded while backgrounded. */
  stepsLimited: boolean;
  recoveryNotice: string | null;
  error: string | null;
  ready: boolean;
}
export interface ActivityLocation {
  timestamp: number;
  coords: { latitude: number; longitude: number; altitude: number | null; speed: number | null; accuracy: number | null; altitudeAccuracy?: number | null };
}
interface Subscription { remove(): void }
export interface ActivityTrackingDependencies {
  storage: { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
  now(): number;
  platform: string;
  foregroundPermission(): Promise<boolean>;
  backgroundPermission(canContinue?: () => boolean): Promise<boolean>;
  backgroundAvailable(): Promise<boolean>;
  startBackground(options: ActivityTrackingOptions): Promise<void>;
  stopBackground(): Promise<void>;
  hasBackground(): Promise<boolean>;
  /** False while the app is running in the background. Absent in tests that don't model it. */
  isForeground?(): boolean;
  watchForeground(options: ActivityTrackingOptions, onLocation: (location: ActivityLocation) => void, onError: () => void): Promise<Subscription>;
  stepsAvailable(): Promise<boolean>;
  watchSteps(onSteps: (steps: number) => void): Subscription;
  getSteps?(start: number, end: number): Promise<number>;
}
interface Draft {
  schema: 1;
  id: string;
  status: 'recording' | 'paused' | 'finished';
  options: ActivityTrackingOptions;
  startedAt: number;
  activeSince: number | null;
  elapsedMs: number;
  segmentStartedAt: number;
  segment: number;
  distanceMeters: number;
  elevationMeters: number;
  stepsBanked: number;
  stepsCurrent: number;
  route: RoutePoint[];
  anchor: (RoutePoint & { accuracy: number }) | null;
  altitudeAnchor: number | null;
  lastTimestamp: number;
  updatedAt: number;
  backgroundEnabled: boolean;
  stepsLimited: boolean;
}
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: unknown): n is number => finite(n) && n >= 0;
function validPoint(point: unknown): point is RoutePoint {
  if (!point || typeof point !== 'object') return false;
  const p = point as RoutePoint;
  return finite(p.latitude) && Math.abs(p.latitude) <= 90 && finite(p.longitude) && Math.abs(p.longitude) <= 180 && positive(p.timestamp)
    && (p.altitude === null || finite(p.altitude)) && (p.speed === null || finite(p.speed)) && (p.segment === undefined || positive(p.segment));
}
function parseDraft(raw: string): Draft {
  const d = JSON.parse(raw) as Draft;
  if (!d || d.schema !== 1 || typeof d.id !== 'string' || !['recording', 'paused', 'finished'].includes(d.status)
      || !d.options || !['run', 'ruck', 'hike'].includes(d.options.activityType ?? '')
      || !(d.options.loadedWeightLbs === undefined || (positive(d.options.loadedWeightLbs) && d.options.loadedWeightLbs > 0))
      || !(d.options.packWeightPounds === undefined || positive(d.options.packWeightPounds))
      || !(d.options.terrain === undefined || typeof d.options.terrain === 'string')
      || !(d.options.backgroundTracking === undefined || typeof d.options.backgroundTracking === 'boolean')
      || !(d.options.batterySaver === undefined || typeof d.options.batterySaver === 'boolean')
      || !positive(d.startedAt) || !positive(d.elapsedMs) || !(d.activeSince === null || positive(d.activeSince))
      || !positive(d.segmentStartedAt) || !positive(d.segment) || !positive(d.distanceMeters) || !positive(d.elevationMeters)
      || !positive(d.stepsBanked) || !positive(d.stepsCurrent) || !positive(d.lastTimestamp) || !positive(d.updatedAt)
      || typeof d.backgroundEnabled !== 'boolean' || typeof d.stepsLimited !== 'boolean'
      || !Array.isArray(d.route) || d.route.length > MAX_ACTIVITY_ROUTE_POINTS || !d.route.every(validPoint)
      || !(d.anchor === null || (validPoint(d.anchor) && positive(d.anchor.accuracy)))
      || !(d.altitudeAnchor === null || finite(d.altitudeAnchor))) throw new Error('Invalid activity draft');
  return d;
}
function distanceMeters(a: RoutePoint, b: RoutePoint): number {
  const radians = Math.PI / 180;
  const lat = (b.latitude - a.latitude) * radians;
  const lon = (b.longitude - a.longitude) * radians;
  const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(lon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
function compactRoute(route: RoutePoint[]): RoutePoint[] {
  if (route.length <= MAX_ACTIVITY_ROUTE_POINTS) return route;
  const reduced = route.filter((point, index) => index === 0 || index === route.length - 1 || index % 2 === 0
    || route[index - 1]?.segment !== point.segment || route[index + 1]?.segment !== point.segment);
  // Preserve segment numbers even in the pathological case of thousands of tiny
  // segments. Consumers always split by segment, so compression cannot join gaps.
  return reduced.length <= MAX_ACTIVITY_ROUTE_POINTS ? reduced : reduced.filter((_, index) => index % 2 === 0 || index === reduced.length - 1);
}
function emptyState(): RunTrackerState {
  return { isTracking: false, isPaused: false, distanceMiles: 0, durationMs: 0, paceMinPerMile: null, currentSpeedMph: null,
    steps: 0, elevationGainFt: 0, route: [], caloriesEstimate: 0, sessionId: null, startedAt: null, activityType: 'run',
    packWeightPounds: 0, terrain: null, backgroundEnabled: false, stepsLimited: false, recoveryNotice: null, error: null, ready: false };
}

/** One serialized owner of the durable draft; native callbacks never write stores directly. */
export function createActivityTracker(deps: ActivityTrackingDependencies) {
  let draft: Draft | null = null;
  let state = emptyState();
  let loaded = false;
  let readBlocked = false;
  let recovering = false;
  let backgroundDirty = false;
  let queue: Promise<unknown> = Promise.resolve();
  let generation = 0;
  let actionPending = false;
  let stopCutoff: number | null = null;
  // When the last usable fix arrived. Not the anchor's time: the anchor stays put while standing still.
  let lastGoodFixAt: number | null = null;
  // Phone altitude wanders by metres between fixes; smoothing it first stops that noise
  // ratcheting the climb upward on a flat route.
  let smoothedAltitude: number | null = null;
  let foreground: Subscription | null = null;
  let pedometer: Subscription | null = null;
  let stepGeneration = 0;
  let backgrounded = false;
  const listeners = new Set<() => void>();
  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.catch(() => {});
    return result;
  };
  const elapsed = (at = deps.now()) => draft ? draft.elapsedMs + (draft.activeSince === null ? 0 : Math.max(0, at - draft.activeSince)) : 0;
  function publish(patch: Partial<RunTrackerState> = {}) {
    const miles = (draft?.distanceMeters ?? 0) * METERS_TO_MILES;
    const duration = elapsed(stopCutoff ?? deps.now());
    state = { ...state, ...(draft ? {
      isTracking: draft.status !== 'finished', isPaused: draft.status === 'paused', sessionId: draft.id, startedAt: draft.startedAt,
      activityType: draft.options.activityType ?? 'run', packWeightPounds: draft.options.packWeightPounds ?? 0, terrain: draft.options.terrain ?? null,
      distanceMiles: Math.round(miles * 100) / 100, durationMs: duration,
      paceMinPerMile: miles > 0.05 ? Math.round((duration / 60000 / miles) * 10) / 10 : null,
      steps: Math.round(draft.stepsBanked + draft.stepsCurrent), elevationGainFt: Math.round(draft.elevationMeters * METERS_TO_FEET),
      route: draft.route, backgroundEnabled: draft.backgroundEnabled, stepsLimited: draft.stepsLimited,
      caloriesEstimate: Math.round(miles * ((draft.options.loadedWeightLbs ?? DEFAULT_BODY_WEIGHT_LBS) / 1.6)),
    } : {}), ...patch };
    listeners.forEach((listener) => listener());
  }
  const breakSegment = () => {
    if (!draft) return;
    draft.segment += 1;
    draft.anchor = null;
    draft.altitudeAnchor = null;
    state = { ...state, currentSpeedMph: null };
  };
  const freeze = (at: number) => {
    if (!draft) return;
    draft.elapsedMs = elapsed(at);
    draft.activeSince = null;
    draft.status = 'paused';
    breakSegment();
    publish({ currentSpeedMph: null });
  };
  function detachSteps() {
    stepGeneration += 1;
    pedometer?.remove();
    pedometer = null;
  }
  async function detachNative() {
    foreground?.remove();
    foreground = null;
    detachSteps();
    try {
      await deps.stopBackground();
      backgroundDirty = false;
    } catch {
      backgroundDirty = true;
      publish({ error: 'Location recording could not be stopped. Try Stop again before starting another activity.' });
      return false;
    }
    return true;
  }
  async function persist(checkpoint = true): Promise<boolean> {
    if (!draft) return true;
    if (checkpoint) draft.updatedAt = deps.now();
    try { await deps.storage.setItem(ACTIVE_ACTIVITY_STORAGE_KEY, JSON.stringify(draft)); return true; }
    catch {
      // Stop the hardware if the route cannot be protected on disk. Keep the
      // in-memory route available for Finish/Save, and never claim it is durable.
      if (draft.status === 'recording') freeze(deps.now());
      generation += 1;
      await detachNative();
      publish({ error: 'Recording paused because this activity could not be saved on your device. Free storage, then retry or finish.' });
      return false;
    }
  }
  async function hydrateInside(source: 'ui' | 'task') {
    if (loaded && !readBlocked) return;
    try {
      const raw = await deps.storage.getItem(ACTIVE_ACTIVITY_STORAGE_KEY);
      draft = raw ? parseDraft(raw) : null;
      // Clear only this recovered read error, before native cleanup/persistence
      // can publish a new stop or write failure that still needs attention.
      if (readBlocked && state.error === DRAFT_READ_ERROR) state = { ...state, error: null };
      loaded = true;
      readBlocked = false;
      recovering = !!draft && draft.status === 'recording';
      // iOS can relaunch a killed app in the background to deliver locations, and that
      // relaunch may mount the UI before the first task event. The recording is still
      // live then; treating it as an interrupted one paused it and stopped the GPS.
      if (draft?.status === 'recording' && source === 'ui' && deps.isForeground && !deps.isForeground()
        && await deps.hasBackground().catch(() => false)) source = 'task';
      if (draft && source === 'ui' && draft.status === 'recording') {
        // A fresh JS process cannot know when the OS/user stopped the old run.
        // Keep only the last durable duration; explicit Resume starts a new leg.
        await reconcileSteps(Math.min(deps.now(), draft.updatedAt));
        freeze(Math.min(deps.now(), draft.updatedAt));
        await detachNative();
        await persist();
        recovering = false;
        publish({ recoveryNotice: 'Your interrupted activity was recovered and paused at its last saved update. Resume to record a new segment.' });
      }
      if (source === 'ui' && (!draft || draft.status !== 'recording')) await detachNative();
      publish({ ready: true, ...(state.error ? {} : { error: null }) });
    } catch {
      loaded = true;
      readBlocked = true;
      await detachNative();
      publish({ ready: true, error: DRAFT_READ_ERROR });
    }
  }
  async function reconcileSteps(at: number) {
    if (!draft || draft.activeSince === null || !deps.getSteps || deps.platform !== 'ios') return;
    const id = draft.id;
    try {
      const count = await deps.getSteps(draft.activeSince, at);
      if (draft?.id === id && positive(count)) draft.stepsCurrent = Math.max(draft.stepsCurrent, count);
    } catch { if (draft?.id === id) draft.stepsLimited = true; }
  }
  async function attachSteps(token: number) {
    try {
      if (!await deps.stepsAvailable() || token !== generation || !draft) {
        if (draft) draft.stepsLimited = true;
        return;
      }
      const id = draft.id;
      const stepWatchBase = draft.stepsCurrent;
      const stepToken = ++stepGeneration;
      pedometer = deps.watchSteps((steps) => {
        void serial(async () => {
          if (!draft || draft.id !== id || draft.status !== 'recording' || stepToken !== stepGeneration || !positive(steps)) return;
          draft.stepsCurrent = Math.max(draft.stepsCurrent, stepWatchBase + steps);
          publish();
        });
      });
    } catch { if (draft) draft.stepsLimited = true; }
  }
  async function attachLocation(token: number): Promise<boolean> {
    if (!draft) return false;
    const options = draft.options;
    let backgroundWarning: string | null = null;
    if (options.backgroundTracking !== false) {
      try {
        if (await deps.backgroundAvailable() && token === generation && await deps.backgroundPermission(() => token === generation) && token === generation) {
          backgroundDirty = true;
          await deps.startBackground(options);
          if (token !== generation) { await detachNative(); return false; }
          draft.backgroundEnabled = true;
          return true;
        }
        backgroundWarning = 'Background location is unavailable or permission was denied. Keep Gruntz open; recording will pause when the app is backgrounded.';
      } catch {
        const stopped = await detachNative();
        if (!stopped) return false; // Never open a second sampling path over a possibly live task.
        backgroundWarning = 'Background recording could not start. Keep Gruntz open; recording will pause when the app is backgrounded.';
      }
    }
    if (token !== generation) return false;
    draft.backgroundEnabled = false;
    const id = draft.id;
    try {
      const subscription = await deps.watchForeground(options,
        (location) => { void acceptLocations([location], id); },
        () => { void reportTaskError('GPS recording failed. Your activity was paused; check location access and resume.', id); });
      if (token !== generation) { subscription.remove(); return false; }
      foreground = subscription;
      if (backgroundWarning) publish({ error: backgroundWarning });
      return true;
    } catch {
      publish({ error: 'GPS recording could not start. Check location access and try again.' });
      return false;
    }
  }
  function addLocation(location: ActivityLocation) {
    if (!draft || draft.status !== 'recording') return;
    const p = location.coords;
    const timestamp = location.timestamp;
    if (!positive(timestamp) || timestamp <= draft.lastTimestamp || timestamp < draft.segmentStartedAt || timestamp > deps.now() + 30000
      || (stopCutoff !== null && timestamp > stopCutoff)) return;
    draft.lastTimestamp = timestamp;
    const accuracy = p.accuracy;
    if (!finite(p.latitude) || Math.abs(p.latitude) > 90 || !finite(p.longitude) || Math.abs(p.longitude) > 180
      // An imprecise fix is skipped, not treated as a break. Dropping the anchor here threw away
      // the progress since it, so a fix like this every few seconds (tree cover, tall buildings)
      // recorded a fraction of the real distance, or none. A long run of them still ends the
      // segment through the gap check below.
      || !positive(accuracy) || accuracy > MAX_FIX_ACCURACY_M) return;
    const point: RoutePoint = { latitude: p.latitude, longitude: p.longitude, altitude: finite(p.altitude) ? p.altitude : null,
      speed: positive(p.speed) && p.speed <= MAX_SPEED_MPS ? p.speed : null, timestamp, segment: draft.segment };
    const previous = draft.anchor;
    if (previous) {
      const meters = distanceMeters(previous, point);
      const seconds = (timestamp - previous.timestamp) / 1000;
      // Measured from the last usable fix: measuring from the anchor reported a "signal gap"
      // after two minutes at a rest stop with GPS working the whole time.
      if (timestamp - Math.max(previous.timestamp, lastGoodFixAt ?? 0) > MAX_GPS_GAP_MS) {
        breakSegment();
        point.segment = draft.segment;
        state = { ...state, recoveryNotice: 'GPS resumed after a signal gap. The missing route was not added to your distance.' };
      } else if (meters / seconds > MAX_SPEED_MPS || (positive(p.speed) && p.speed > MAX_SPEED_MPS)) {
        // Throw away the implausible fix rather than using it as the next origin.
        breakSegment();
        return;
      } else if (meters > Math.max(2, previous.accuracy, accuracy)) {
        draft.distanceMeters += meters;
        draft.anchor = { ...point, accuracy };
      }
    }
    if (!draft.anchor) draft.anchor = { ...point, accuracy };
    lastGoodFixAt = timestamp;
    if (point.altitude !== null && (p.altitudeAccuracy == null || (positive(p.altitudeAccuracy) && p.altitudeAccuracy <= 20))) {
      smoothedAltitude = smoothedAltitude === null || draft.altitudeAnchor === null
        ? point.altitude : smoothedAltitude + (point.altitude - smoothedAltitude) * ALTITUDE_SMOOTHING;
      if (draft.altitudeAnchor === null) draft.altitudeAnchor = smoothedAltitude;
      else {
        const gain = smoothedAltitude - draft.altitudeAnchor;
        if (gain > 2.5) { draft.elevationMeters += gain; draft.altitudeAnchor = smoothedAltitude; }
        else if (gain < -2.5) draft.altitudeAnchor = smoothedAltitude;
      }
    }
    draft.route.push(point);
    if (state.recoveryNotice === WAITING_FOR_GPS_NOTICE) state = { ...state, recoveryNotice: null };
    state = { ...state, currentSpeedMph: point.speed === null ? null : Math.round(point.speed * 2.23694 * 10) / 10 };
  }
  function acceptLocations(locations: ActivityLocation[], expectedId?: string) {
    return serial(async () => {
      await hydrateInside('task');
      if (expectedId && draft && expectedId !== draft.id) return;
      if (!draft || readBlocked || draft.status !== 'recording') { await detachNative(); return; }
      const sorted = locations.filter((location) => location && location.coords && positive(location.timestamp)
        && location.timestamp > draft!.lastTimestamp && location.timestamp >= draft!.segmentStartedAt && location.timestamp <= deps.now() + 30000)
        .sort((a, b) => a.timestamp - b.timestamp);
      if (!sorted.length) return;
      if (recovering && sorted.length) {
        // A headless relaunch may follow an OS kill. Never invent time or mileage
        // before the first new sample when no durable update covers that interval.
        if (sorted[0].timestamp - draft.updatedAt > MAX_GPS_GAP_MS) {
          draft.elapsedMs = elapsed(draft.updatedAt);
          draft.stepsBanked += draft.stepsCurrent;
          draft.stepsCurrent = 0;
          draft.activeSince = sorted[0].timestamp;
          draft.segmentStartedAt = sorted[0].timestamp;
          breakSegment();
          publish({ recoveryNotice: 'An interrupted recording was recovered. The unrecorded gap was excluded.' });
        }
        recovering = false;
      }
      draft.route = [...draft.route];
      sorted.forEach(addLocation);
      draft.route = compactRoute(draft.route);
      await persist();
      publish();
    });
  }
  function reportSignalLoss() {
    return serial(async () => {
      await hydrateInside('task');
      if (!draft || readBlocked || draft.status !== 'recording') return;
      // CoreLocation locationUnknown is temporary. Keep native sampling running,
      // but never measure a straight line over the missing signal interval.
      breakSegment();
      // No location was recorded: retain the prior durable clock checkpoint so
      // a cold headless recovery cannot mistake this notice for a recorded fix.
      await persist(false);
      publish({ recoveryNotice: WAITING_FOR_GPS_NOTICE });
    });
  }
  function reportTaskError(message: string, expectedId?: string) {
    if (expectedId && (!draft || draft.id !== expectedId || draft.status !== 'recording')) return Promise.resolve();
    generation += 1;
    return serial(async () => {
      await hydrateInside('task');
      if (!draft || draft.status !== 'recording' || (expectedId && draft.id !== expectedId)) return;
      await reconcileSteps(deps.now());
      freeze(deps.now());
      await detachNative();
      await persist();
      publish({ error: message });
    });
  }
  function start(options: ActivityTrackingOptions = {}): Promise<boolean> {
    if (actionPending || (draft && draft.status !== 'finished')) return Promise.resolve(false);
    actionPending = true;
    const token = ++generation;
    return serial(async () => {
      await hydrateInside('ui');
      if (readBlocked || token !== generation || (draft && draft.status !== 'finished')) return false;
      if (draft?.status === 'finished') { publish({ error: 'Save or discard the finished activity before starting another one.' }); return false; }
      try {
        if (!await deps.foregroundPermission() || token !== generation) {
          if (token === generation) publish({ error: 'Location permission is required to record your route. Enable it in Settings and retry.' });
          return false;
        }
        if (backgroundDirty && !await detachNative()) return false;
        const now = deps.now();
        const type = options.activityType ?? 'run';
        draft = { schema: 1, id: `activity-${now}-${Math.random().toString(36).slice(2, 10)}`, status: 'paused',
          options: { ...options, activityType: type, loadedWeightLbs: positive(options.loadedWeightLbs) && options.loadedWeightLbs > 0 ? options.loadedWeightLbs : DEFAULT_BODY_WEIGHT_LBS,
            packWeightPounds: positive(options.packWeightPounds) ? options.packWeightPounds : 0 },
          startedAt: now, activeSince: null, elapsedMs: 0, segmentStartedAt: now, segment: 0, distanceMeters: 0, elevationMeters: 0,
          stepsBanked: 0, stepsCurrent: 0, route: [], anchor: null, altitudeAnchor: null, lastTimestamp: 0, updatedAt: now,
          backgroundEnabled: false, stepsLimited: deps.platform !== 'ios' };
        state = { ...emptyState(), ready: true };
        publish();
        if (!await persist() || token !== generation) return false;
        if (!await attachLocation(token) || token !== generation) { publish(); return false; }
        draft.activeSince = deps.now();
        draft.segmentStartedAt = draft.activeSince;
        draft.status = 'recording';
        await attachSteps(token);
        if (token !== generation) return false;
        if (!await persist()) return false;
        publish();
        return true;
      } catch {
        await detachNative();
        if (draft) freeze(deps.now());
        publish({ error: 'Recording could not start. Check location access and try again.' });
        return false;
      }
    }).finally(() => { actionPending = false; });
  }
  function pause(): Promise<void> {
    const at = deps.now();
    generation += 1;
    stopCutoff = at;
    return serial(async () => {
      await hydrateInside('ui');
      if (!draft || draft.status === 'finished') return;
      await reconcileSteps(at);
      freeze(at);
      draft.stepsBanked += draft.stepsCurrent;
      draft.stepsCurrent = 0;
      await detachNative();
      await persist();
      publish();
    }).finally(() => { stopCutoff = null; });
  }
  function resume(overrides: Pick<ActivityTrackingOptions, 'backgroundTracking'> = {}): Promise<boolean> {
    if (actionPending) return Promise.resolve(false);
    actionPending = true;
    const token = ++generation;
    return serial(async () => {
      await hydrateInside('ui');
      if (!draft || readBlocked || draft.status !== 'paused' || token !== generation) return false;
      try {
        if (!await deps.foregroundPermission() || token !== generation) {
          publish({ error: 'Location permission is required. Enable it in Settings and resume.' }); return false;
        }
        if (backgroundDirty && !await detachNative()) return false;
        draft.stepsBanked += draft.stepsCurrent;
        draft.stepsCurrent = 0;
        draft.options = { ...draft.options, ...overrides };
        publish({ error: null, recoveryNotice: null });
        if (!await persist() || token !== generation || !await attachLocation(token) || token !== generation) return false;
        draft.activeSince = deps.now();
        draft.segmentStartedAt = draft.activeSince;
        draft.status = 'recording';
        breakSegment();
        await attachSteps(token);
        if (token !== generation || !await persist()) return false;
        publish();
        return true;
      } catch {
        await detachNative();
        if (draft) freeze(deps.now());
        publish({ error: 'Recording could not resume. Check location access and retry.' });
        return false;
      }
    }).finally(() => { actionPending = false; });
  }
  function stop(): Promise<RunTrackerState> {
    const at = deps.now();
    generation += 1;
    stopCutoff = at;
    return serial(async () => {
      await hydrateInside('ui');
      if (!draft) { await detachNative(); return state; }
      if (draft.status !== 'finished') {
        await reconcileSteps(at);
        freeze(at);
        draft.stepsBanked += draft.stepsCurrent;
        draft.stepsCurrent = 0;
        draft.status = 'finished';
      }
      await detachNative();
      await persist();
      publish({ currentSpeedMph: null });
      return { ...state, route: [...state.route] };
    }).finally(() => { stopCutoff = null; });
  }
  function discard(): Promise<void> {
    generation += 1;
    return serial(async () => {
      await hydrateInside('ui');
      if (draft?.status === 'recording') freeze(deps.now());
      if (draft) draft.status = 'finished';
      if (!await detachNative()) throw new Error('Location recording could not be stopped.');
      try { await deps.storage.removeItem(ACTIVE_ACTIVITY_STORAGE_KEY); }
      catch { publish({ error: 'The saved activity could not be cleared. Retry before starting another activity.' }); throw new Error(state.error ?? 'Activity clear failed'); }
      draft = null;
      readBlocked = false;
      loaded = true;
      recovering = false;
      state = { ...emptyState(), ready: true };
      publish();
    });
  }
  function handleAppState(next: string): Promise<void> {
    backgrounded = next !== 'active';
    if (next === 'background' && draft?.status === 'recording' && !draft.backgroundEnabled) {
      return pause().then(() => { publish({ recoveryNotice: 'Foreground recording paused when you left Gruntz. Resume with the app open, or enable background location.' }); });
    }
    return serial(async () => {
      await hydrateInside('ui');
      if (!draft || draft.status !== 'recording') return;
      if (next === 'background' && !draft.backgroundEnabled) {
        generation += 1;
        await reconcileSteps(deps.now());
        freeze(deps.now());
        draft.stepsBanked += draft.stepsCurrent;
        draft.stepsCurrent = 0;
        await detachNative();
        await persist();
        publish({ recoveryNotice: 'Foreground recording paused when you left Gruntz. Resume with the app open, or enable background location.' });
        return;
      }
      if (next === 'background') {
        await reconcileSteps(deps.now());
        detachSteps();
        if (deps.platform !== 'ios') {
          draft.stepsBanked += draft.stepsCurrent;
          draft.stepsCurrent = 0;
          draft.stepsLimited = true;
        }
      } else if (next === 'active') {
        let recordingAvailable = true;
        if (draft.backgroundEnabled) {
          try { recordingAvailable = await deps.hasBackground(); }
          catch { recordingAvailable = false; }
        }
        if (!recordingAvailable) {
          freeze(Math.min(deps.now(), draft.updatedAt));
          publish({ recoveryNotice: 'Location recording was interrupted. Your activity was recovered and paused at its last saved update.' });
        } else {
          await reconcileSteps(deps.now());
          detachSteps();
          await attachSteps(generation);
        }
      }
      await persist();
      publish();
    });
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate: () => serial(async () => { await hydrateInside('ui'); }),
    start, pause, resume, stop, clearFinished: discard, discard,
    acceptLocations, reportTaskError, reportSignalLoss, handleAppState,
    tick() { if (draft?.status === 'recording') publish(); },
    checkpoint: () => serial(async () => { if (draft?.status === 'recording' && !backgrounded) { await persist(); publish(); } }),
  };
}
