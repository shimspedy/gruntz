import type { RoutePoint } from '../types/activity';
import type { TrackedSession } from '../store/useReadinessStore';

/** Bound each saved map, while retaining every activity's summary and full totals. */
export const MAX_SAVED_ROUTE_POINTS = 6000;
const MAX_CAPTURED_ROUTE_POINTS = 100_000;

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nonnegative = (value: unknown): value is number => finite(value) && value >= 0;
const date = (value: unknown): value is string => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
const optionalText = (value: unknown, max: number) => value === undefined || (typeof value === 'string' && value.length <= max);

export function isRoutePoint(value: unknown): value is RoutePoint {
  if (!record(value)) return false;
  return finite(value.latitude) && Math.abs(value.latitude) <= 90
    && finite(value.longitude) && Math.abs(value.longitude) <= 180
    && nonnegative(value.timestamp) && value.timestamp <= 8.64e15
    && (value.altitude === null || finite(value.altitude))
    && (value.speed === null || (finite(value.speed) && value.speed >= -1))
    && (value.segment === undefined || (nonnegative(value.segment) && Number.isInteger(value.segment)));
}

/** Legacy run/ruck records do not need any of the optional map or sensor fields. */
export function isTrackedSession(value: unknown, maxRoutePoints = MAX_SAVED_ROUTE_POINTS): value is TrackedSession {
  if (!record(value) || typeof value.id !== 'string' || !value.id.length || value.id.length > 200
    || !['run', 'ruck', 'hike'].includes(value.type as string) || !date(value.date)
    || !nonnegative(value.distanceMiles) || !nonnegative(value.durationSeconds) || !nonnegative(value.elevationFeet)
    || (value.packWeightPounds !== undefined && !nonnegative(value.packWeightPounds))
    || !optionalText(value.terrain, 200) || !optionalText(value.notes, 20_000) || !optionalText(value.title, 300)
    || (value.startedAt !== undefined && !date(value.startedAt))
    || (value.steps !== undefined && (!nonnegative(value.steps) || !Number.isInteger(value.steps)))
    || (value.caloriesEstimate !== undefined && !nonnegative(value.caloriesEstimate))
    || (value.stepsLimited !== undefined && typeof value.stepsLimited !== 'boolean')) return false;
  if (value.route === undefined) return true;
  if (!Array.isArray(value.route) || value.route.length > maxRoutePoints) return false;
  let previousTimestamp = -1;
  let previousSegment = 0;
  for (const point of value.route) {
    if (!isRoutePoint(point) || point.timestamp < previousTimestamp || (point.segment ?? 0) < previousSegment) return false;
    previousTimestamp = point.timestamp;
    previousSegment = point.segment ?? 0;
  }
  return true;
}

/** Keep pause boundaries and endpoints when a long activity has more GPS fixes than the map needs. */
export function compactSavedRoute(route: RoutePoint[]): RoutePoint[] | null {
  if (route.length <= MAX_SAVED_ROUTE_POINTS) return route.map((point) => ({ ...point }));
  const keep = new Set<number>([0, route.length - 1]);
  for (let i = 1; i < route.length; i++) {
    if ((route[i].segment ?? 0) !== (route[i - 1].segment ?? 0)) { keep.add(i - 1); keep.add(i); }
  }
  // Do not silently join or drop whole paused segments to force an invalid map to fit.
  if (keep.size > MAX_SAVED_ROUTE_POINTS) return null;
  const candidates: number[] = [];
  for (let i = 0; i < route.length; i++) if (!keep.has(i)) candidates.push(i);
  const remaining = MAX_SAVED_ROUTE_POINTS - keep.size;
  for (let i = 0; i < remaining; i++) keep.add(candidates[Math.floor(i * candidates.length / remaining)]);
  return [...keep].sort((a, b) => a - b).map((index) => ({ ...route[index] }));
}

/** Returns an independent saved record; the recording engine may keep mutating its own route. */
export function prepareTrackedSession(value: TrackedSession): TrackedSession | null {
  if (!isTrackedSession(value, MAX_CAPTURED_ROUTE_POINTS)) return null;
  const route = value.route ? compactSavedRoute(value.route) : undefined;
  if (route === null) return null;
  return { ...value, ...(route ? { route } : {}) };
}
