import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device-local product events. No network transport, health answers or location data. */
const STORAGE_KEY = '@gruntz_retention_events';
const MAX_EVENTS = 1000;
const PROPERTY_KEYS = new Set(['step', 'path', 'screen', 'source', 'mode', 'outcome', 'variant', 'first', 'count', 'sessions', 'plan_kind']);
type Property = string | number | boolean | null;
export interface RetentionEvent {
  name: string;
  at: string;
  properties: Record<string, Property>;
}
export interface RetentionDiagnostics {
  version: 1;
  installedAt: string;
  firstWorkoutAt: string | null;
  secondWorkoutAt: string | null;
  trainingWeeks: number[];
  events: RetentionEvent[];
  readable: boolean;
}

let state: RetentionDiagnostics | null = null;
let queue: Promise<void> = Promise.resolve();
const fresh = (): RetentionDiagnostics => ({ version: 1, installedAt: new Date().toISOString(), firstWorkoutAt: null, secondWorkoutAt: null, trainingWeeks: [], events: [], readable: true });
const instant = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function sanitizeRetentionProperties(properties: Record<string, Property> = {}): Record<string, Property> {
  return Object.fromEntries(Object.entries(properties).filter(([key, value]) => PROPERTY_KEYS.has(key)
    && (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))
      || (typeof value === 'string' && value.length <= 80))));
}

async function read() {
  if (state) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) { state = fresh(); return; }
    const parsed = JSON.parse(raw) as RetentionDiagnostics;
    if (parsed.version !== 1 || !instant(parsed.installedAt) || !Array.isArray(parsed.events) || !Array.isArray(parsed.trainingWeeks)) throw new Error('Invalid local events');
    state = {
      ...fresh(), installedAt: parsed.installedAt,
      firstWorkoutAt: instant(parsed.firstWorkoutAt) ? parsed.firstWorkoutAt : null,
      secondWorkoutAt: instant(parsed.secondWorkoutAt) ? parsed.secondWorkoutAt : null,
      trainingWeeks: parsed.trainingWeeks.filter((week) => Number.isInteger(week) && week >= 0),
      events: parsed.events.filter((event) => typeof event?.name === 'string' && instant(event.at))
        .slice(-MAX_EVENTS).map((event) => ({ name: event.name, at: event.at, properties: sanitizeRetentionProperties(event.properties) })),
    };
  } catch {
    // Keep an unreadable disk copy intact; analytics must never interrupt training.
    state = { ...fresh(), readable: false };
  }
}

export function trackRetentionEvent(name: string, properties: Record<string, Property> = {}): void {
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(name)) return;
  const event: RetentionEvent = { name, at: new Date().toISOString(), properties: sanitizeRetentionProperties(properties) };
  queue = queue.then(async () => {
    await read();
    const current = state!;
    current.events = [...current.events, event].slice(-MAX_EVENTS);
    if (name === 'workout_completed') {
      if (event.properties.first === true && !current.firstWorkoutAt) current.firstWorkoutAt = event.at;
      else if (current.firstWorkoutAt && !current.secondWorkoutAt) current.secondWorkoutAt = event.at;
      const week = Math.max(0, Math.floor((Date.parse(event.at) - Date.parse(current.installedAt)) / (7 * 86400000)));
      if (!current.trainingWeeks.includes(week)) current.trainingWeeks.push(week);
    }
    if (current.readable) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }).catch(() => undefined);
}

export function getRetentionDiagnostics(): Promise<RetentionDiagnostics> {
  const result = queue.then(async () => {
    await read();
    return JSON.parse(JSON.stringify(state!)) as RetentionDiagnostics;
  });
  queue = result.then(() => undefined, () => undefined);
  return result;
}

export function clearRetentionAnalytics(): Promise<void> {
  // Publish the erase barrier before waiting on storage. An onboarding/navigation
  // event arriving during the delete must wait, then start from the new state.
  const cleared = queue.then(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    state = null;
  });
  queue = cleared.catch(() => undefined);
  return cleared;
}
