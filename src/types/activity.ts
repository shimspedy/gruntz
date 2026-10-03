/** Outdoor activities and their locally recorded GPS samples. */
export type ActivityType = 'run' | 'ruck' | 'hike';

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  speed: number | null;
  /** A pause starts a new segment; maps must not draw across the gap. */
  segment?: number;
}
