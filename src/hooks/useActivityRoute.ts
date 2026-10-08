import { useEffect, useState } from 'react';
import type { TrackedSession } from '../store/useReadinessStore';
import { activityRouteNow, inlineRoute, loadActivityRoute, type ActivityRouteState } from '../store/activityRoutes';

/**
 * An activity's GPS route, read from route storage when first needed.
 *
 * `loading` and `none` both carry an empty route but mean different things: wait,
 * or say nothing was recorded. `missing` is a recorded route that cannot be read;
 * the activity's summary is still shown.
 */
export function useActivityRoute(session: TrackedSession | null | undefined): ActivityRouteState {
  const id = session?.id;
  const points = session?.routePoints;
  const inline = inlineRoute(session);
  const [loaded, setLoaded] = useState<{ id: string | undefined; state: ActivityRouteState } | null>(null);
  const now = activityRouteNow(session);
  const waiting = now.status === 'loading';

  useEffect(() => {
    if (!waiting || !id) return undefined;
    let current = true;
    void loadActivityRoute({ id, routePoints: points }).then((state) => { if (current) setLoaded({ id, state }); });
    return () => { current = false; };
  }, [waiting, id, points, inline]);

  // Memory answers first, so a cached route never flashes a loading state.
  if (!waiting) return now;
  return loaded && loaded.id === id ? loaded.state : now;
}
