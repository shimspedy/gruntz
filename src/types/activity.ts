/** Tracked activities. A `walk` is an indoor (treadmill) walk: steps and time, no GPS route. */
export type ActivityType = 'run' | 'ruck' | 'hike' | 'walk';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  speed: number | null;
  /** A pause starts a new segment; maps must not draw across the gap. */
  segment?: number;
}
