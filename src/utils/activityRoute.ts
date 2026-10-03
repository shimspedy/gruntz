import type { Feature, MultiLineString } from 'geojson';
import type { RoutePoint } from '../types/activity';

export const SHARE_PRIVACY_RADIUS_METERS = 200;
const EARTH_RADIUS = 6371000;
const radians = (value: number) => value * Math.PI / 180;
const wrappedLongitude = (difference: number) => ((difference + 540) % 360) - 180;
export const isRoutePoint = (point: RoutePoint) => Number.isFinite(point?.latitude) && Math.abs(point.latitude) <= 90 && Number.isFinite(point?.longitude) && Math.abs(point.longitude) <= 180;

export function routeDistanceMeters(a: RoutePoint, b: RoutePoint) {
  const lat = radians(b.latitude - a.latitude);
  const lng = radians(wrappedLongitude(b.longitude - a.longitude));
  const value = Math.sin(lat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lng / 2) ** 2;
  return EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(Math.min(1, value)), Math.sqrt(Math.max(0, 1 - value)));
}

/** Keeps pause boundaries and corrupt-sample gaps; never invents a connecting leg. */
export function routeSegments(route: RoutePoint[] = []) {
  const segments: RoutePoint[][] = [];
  let current: RoutePoint[] = [];
  let previous: RoutePoint | undefined;
  for (const point of route) {
    if (!isRoutePoint(point)) {
      if (current.length > 1) segments.push(current);
      current = [];
      previous = undefined;
      continue;
    }
    if (previous && (previous.segment ?? 0) !== (point.segment ?? 0)) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push(point);
    previous = point;
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

// Test an entire line against an endpoint's privacy zone, not only its samples.
// Otherwise sparse samples on opposite sides of home would draw a line through it.
function edgeNearEndpoint(a: RoutePoint, b: RoutePoint, center: RoutePoint, radius: number) {
  const xScale = Math.cos(radians(center.latitude));
  const xy = (point: RoutePoint) => ({
    x: radians(wrappedLongitude(point.longitude - center.longitude)) * EARTH_RADIUS * xScale,
    y: radians(point.latitude - center.latitude) * EARTH_RADIUS,
  });
  const start = xy(a), end = xy(b);
  const dx = end.x - start.x, dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, -(start.x * dx + start.y * dy) / length)) : 0;
  return Math.hypot(start.x + dx * t, start.y + dy * t) <= radius;
}

/** Removes every visit near the start/end, including loop returns, for share previews. */
export function privateRoute(route: RoutePoint[] = [], radius = SHARE_PRIVACY_RADIUS_METERS): RoutePoint[] {
  const valid = route.filter(isRoutePoint);
  if (valid.length < 2) return [];
  const start = valid[0], end = valid[valid.length - 1];
  const zones = [start, end];
  const output: RoutePoint[] = [];
  let segment = 0;
  let previous: RoutePoint | undefined;
  for (const point of route) {
    if (!isRoutePoint(point) || zones.some((center) => routeDistanceMeters(point, center) <= radius)) {
      previous = undefined;
      segment += 1;
      continue;
    }
    if (previous && ((point.segment ?? 0) !== (previous.segment ?? 0) || zones.some((center) => edgeNearEndpoint(previous!, point, center, radius)))) segment += 1;
    output.push({ ...point, segment });
    previous = point;
  }
  // Lone points don't make a route and needn't reveal isolated locations.
  return routeSegments(output).flat();
}

export function routeGeoJSON(route: RoutePoint[] = []): Feature<MultiLineString> {
  return {
    type: 'Feature', properties: {},
    geometry: { type: 'MultiLineString', coordinates: routeSegments(route).map((segment) => segment.map((point) => [point.longitude, point.latitude])) },
  };
}

/** Continuous longitudes keep date-line routes from spanning the entire planet. */
export function projectedRoute(route: RoutePoint[] = []) {
  let previousLng: number | undefined;
  return routeSegments(route).map((segment) => segment.map((point) => {
    const longitude = previousLng === undefined ? point.longitude : previousLng + wrappedLongitude(point.longitude - previousLng);
    previousLng = longitude;
    const latitude = Math.max(-85.051129, Math.min(85.051129, point.latitude));
    return { x: longitude / 360, y: -Math.log(Math.tan(Math.PI / 4 + radians(latitude) / 2)) / (2 * Math.PI) };
  }));
}

export function routeBounds(route: RoutePoint[] = []): [number, number, number, number] | null {
  const valid = routeSegments(route).flat();
  if (valid.length < 2) return null;
  let lng = valid[0].longitude;
  let west = lng, east = lng, south = valid[0].latitude, north = south;
  for (const point of valid.slice(1)) {
    lng += wrappedLongitude(point.longitude - lng);
    west = Math.min(west, lng); east = Math.max(east, lng);
    south = Math.min(south, point.latitude); north = Math.max(north, point.latitude);
  }
  const lngPad = Math.max((east - west) * 0.18, 0.0006);
  const latPad = Math.max((north - south) * 0.18, 0.0006);
  return [west - lngPad, Math.max(-85.051129, south - latPad), east + lngPad, Math.min(85.051129, north + latPad)];
}
