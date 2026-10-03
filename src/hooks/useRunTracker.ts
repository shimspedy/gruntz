import { useCallback, useEffect, useRef, useState } from 'react';
import { activityTracker, initializeActivityTracking, type ActivityTrackingOptions, type RunTrackerState } from '../services/activityTracking';

export { DEFAULT_BODY_WEIGHT_LBS } from '../services/activityTracking';
export type { RunTrackerState } from '../services/activityTracking';
export type { RoutePoint } from '../types/activity';

/** A view of the singleton durable recorder, rather than the owner of GPS hardware. */
export function useRunTracker(options: ActivityTrackingOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [state, setState] = useState(activityTracker.getSnapshot);
  useEffect(() => {
    const unsubscribe = activityTracker.subscribe(() => setState(activityTracker.getSnapshot()));
    void initializeActivityTracking();
    return unsubscribe;
  }, []);
  const start = useCallback((overrides?: Partial<ActivityTrackingOptions>) => activityTracker.start({ ...optionsRef.current, ...overrides }), []);
  const resume = useCallback((overrides?: Pick<ActivityTrackingOptions, 'backgroundTracking'>) => activityTracker.resume(overrides), []);
  const retry = useCallback(() => initializeActivityTracking(), []);
  const pause = useCallback(() => activityTracker.pause(), []);
  const stop = useCallback(() => activityTracker.stop(), []);
  const clearFinished = useCallback(() => activityTracker.clearFinished(), []);
  return { ...state, start, pause, resume, stop, clearFinished, retry };
}


type ActivityStatus = Pick<RunTrackerState, 'ready' | 'sessionId' | 'isTracking' | 'isPaused' | 'activityType' | 'backgroundEnabled'>;
const selectStatus = (snapshot: RunTrackerState): ActivityStatus => ({ ready: snapshot.ready, sessionId: snapshot.sessionId,
  isTracking: snapshot.isTracking, isPaused: snapshot.isPaused, activityType: snapshot.activityType, backgroundEnabled: snapshot.backgroundEnabled });
/** Menus need identity/mode changes, not a render for every elapsed second or GPS fix. */
export function useActivityStatus(): ActivityStatus {
  const [status, setStatus] = useState(() => selectStatus(activityTracker.getSnapshot()));
  useEffect(() => {
    const unsubscribe = activityTracker.subscribe(() => {
      const next = selectStatus(activityTracker.getSnapshot());
      setStatus((previous) => previous.ready === next.ready && previous.sessionId === next.sessionId && previous.isTracking === next.isTracking
        && previous.isPaused === next.isPaused && previous.activityType === next.activityType && previous.backgroundEnabled === next.backgroundEnabled ? previous : next);
    });
    void initializeActivityTracking();
    return unsubscribe;
  }, []);
  return status;
}
