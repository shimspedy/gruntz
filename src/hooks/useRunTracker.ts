import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';

/**
 * Run/Ruck Tracker Hook
 *
 * Combines GPS (distance, pace, route) + Pedometer (step count)
 * Used for run and ruck mission tracking.
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  speed: number | null; // m/s
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
}

interface TrackerInternals {
  locationSub: Location.LocationSubscription | null;
  pedometerSub: ReturnType<typeof Pedometer.watchStepCount> | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  startTime: number;
  pausedDuration: number;
  pauseStart: number | null;
  lastAltitude: number | null;
  /**
   * Steps banked from earlier pedometer subscriptions.
   *
   * `watchStepCount` reports steps since THIS subscription began, and pause/resume
   * tears the subscription down and makes a new one — so writing the raw value
   * straight to state reset the tile to near zero after every traffic light.
   */
  stepsBanked: number;
}

const METERS_TO_MILES = 0.000621371;
const METERS_TO_FEET = 3.28084;
/** Fixes worse than this are position noise, not movement; they do not add distance. */
const MAX_FIX_ACCURACY_M = 25;
/** Matches the barometer hook's threshold, so the two sources agree on what a climb is. */
const MIN_ELEVATION_GAIN_M = 1.5;
/** Refresh the on-screen route line every N fixes rather than on every one. */
const ROUTE_COPY_EVERY = 5;

const MPS_TO_MPH = 2.23694;

/** Haversine distance between two GPS points in meters */
function haversineMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimate calories from distance and the load being carried.
 *
 * Always called with one argument before, so every athlete got the 160 lb default
 * and the pack was ignored entirely — a 220 lb rucker carrying 45 lb was shown a
 * number 40% under this formula's own answer, presented as if it were theirs.
 * Body weight is optional on the profile, so the default still applies when it is
 * unset; the tile says "est." either way.
 */
export const DEFAULT_BODY_WEIGHT_LBS = 160;

function estimateCalories(distanceMiles: number, loadedWeightLbs: number = DEFAULT_BODY_WEIGHT_LBS): number {
  // Rough: ~100 cal/mile for a 160 lb person, scaled by the total load moved.
  return Math.round(distanceMiles * (loadedWeightLbs / 1.6));
}

export function useRunTracker(options: { batterySaver?: boolean; loadedWeightLbs?: number } = {}) {
  const { batterySaver = false, loadedWeightLbs } = options;
  // Held in a ref so the watch callbacks always read the current value without
  // being torn down and re-attached when the pack weight changes mid-setup.
  const loadRef = useRef(loadedWeightLbs);
  loadRef.current = loadedWeightLbs;
  const getInitialState = useCallback(
    (): RunTrackerState => ({
      isTracking: false,
      isPaused: false,
      distanceMiles: 0,
      durationMs: 0,
      paceMinPerMile: null,
      currentSpeedMph: null,
      steps: 0,
      elevationGainFt: 0,
      route: [],
      caloriesEstimate: 0,
    }),
    []
  );

  const [state, setState] = useState<RunTrackerState>({
    isTracking: false,
    isPaused: false,
    distanceMiles: 0,
    durationMs: 0,
    paceMinPerMile: null,
    currentSpeedMph: null,
    steps: 0,
    elevationGainFt: 0,
    route: [],
    caloriesEstimate: 0,
  });

  const internals = useRef<TrackerInternals>({
    locationSub: null,
    pedometerSub: null,
    timerInterval: null,
    startTime: 0,
    pausedDuration: 0,
    pauseStart: null,
    lastAltitude: null,
    stepsBanked: 0,
  });
  const distanceRef = useRef(0);
  const elevationRef = useRef(0);
  const routeRef = useRef<RoutePoint[]>([]);
  /** Mirrors the latest state so `stop()` never reads a stale closure. */
  const stateRef = useRef(state);
  stateRef.current = state;
  const stepsRef = useRef(0);

  const attachPedometer = useCallback(async () => {
    try {
      const pedoAvailable = await Pedometer.isAvailableAsync();
      if (!pedoAvailable) {
        internals.current.pedometerSub?.remove();
        internals.current.pedometerSub = null;
        return false;
      }

      internals.current.pedometerSub?.remove();
      internals.current.pedometerSub = Pedometer.watchStepCount((result) => {
        const total = internals.current.stepsBanked + result.steps;
        stepsRef.current = total;
        setState((prev) => ({ ...prev, steps: total }));
      });
      return true;
    } catch {
      internals.current.pedometerSub?.remove();
      internals.current.pedometerSub = null;
      return false;
    }
  }, []);

  const attachLocationWatcher = useCallback(async () => {
    try {
      internals.current.locationSub?.remove();
      internals.current.locationSub = await Location.watchPositionAsync(
        {
          accuracy: batterySaver ? Location.Accuracy.Balanced : Location.Accuracy.BestForNavigation,
          timeInterval: batterySaver ? 5000 : 2000,
          distanceInterval: batterySaver ? 10 : 3, // meters
        },
        (location) => {
          const point: RoutePoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            timestamp: location.timestamp,
            speed: location.coords.speed,
          };

          // A fix is only trusted to move you as far as its own accuracy allows.
          // With no accuracy check at all, GPS wander under buildings accumulated
          // real mileage while the athlete stood still — roughly 0.37 mi over a
          // five-minute stop at this hook's 2 s / 3 m watch settings.
          const accuracy = location.coords.accuracy ?? null;
          const usable = accuracy == null || accuracy <= MAX_FIX_ACCURACY_M;

          const prev = routeRef.current[routeRef.current.length - 1];
          if (prev && usable) {
            const dist = haversineMeters(prev.latitude, prev.longitude, point.latitude, point.longitude);
            // Require the step to exceed the fix's own error, so noise cannot
            // masquerade as movement.
            const floor = Math.max(2, Math.min(accuracy ?? 0, MAX_FIX_ACCURACY_M));
            if (dist > floor && dist < 100) {
              distanceRef.current += dist * METERS_TO_MILES;
            }
          }

          // Same threshold the barometer hook uses. Summing every positive raw
          // delta turned ±5 m of GPS vertical noise into thousands of feet of
          // "climb" on flat ground, and RunTrackerScreen falls back to this figure
          // whenever the barometer reports exactly 0.
          if (point.altitude != null && usable) {
            if (internals.current.lastAltitude != null) {
              const gain = point.altitude - internals.current.lastAltitude;
              if (gain > MIN_ELEVATION_GAIN_M) {
                elevationRef.current += gain * METERS_TO_FEET;
                internals.current.lastAltitude = point.altitude;
              } else if (gain < -MIN_ELEVATION_GAIN_M) {
                internals.current.lastAltitude = point.altitude;
              }
            } else {
              internals.current.lastAltitude = point.altitude;
            }
          }

          routeRef.current.push(point);

          // Copying the whole route on every fix is O(n) per point and O(n squared)
          // over a run — thousands of points on a 10 km effort. The line on screen
          // does not need per-point fidelity, so the copy is batched; `stop()` takes
          // the exact final route from the ref.
          const copyRoute = routeRef.current.length % ROUTE_COPY_EVERY === 0;
          setState((prev) => ({
            ...prev,
            distanceMiles: Math.round(distanceRef.current * 100) / 100,
            elevationGainFt: Math.round(elevationRef.current),
            currentSpeedMph: point.speed != null ? Math.round(point.speed * MPS_TO_MPH * 10) / 10 : null,
            route: copyRoute ? [...routeRef.current] : prev.route,
            caloriesEstimate: estimateCalories(distanceRef.current, loadRef.current),
          }));
        },
      );
      return true;
    } catch {
      internals.current.locationSub?.remove();
      internals.current.locationSub = null;
      return false;
    }
  }, [batterySaver]);

  const attachTimer = useCallback(() => {
    if (internals.current.timerInterval) {
      clearInterval(internals.current.timerInterval);
    }

    internals.current.timerInterval = setInterval(() => {
      const elapsed = Date.now() - internals.current.startTime - internals.current.pausedDuration;
      const distMiles = distanceRef.current;
      const elapsedMin = elapsed / 60000;
      const pace = distMiles > 0.05 ? elapsedMin / distMiles : null;

      setState((prev) => ({
        ...prev,
        durationMs: elapsed,
        paceMinPerMile: pace ? Math.round(pace * 10) / 10 : null,
      }));
    }, 1000);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (internals.current.locationSub || internals.current.timerInterval) {
      internals.current.locationSub?.remove();
      internals.current.pedometerSub?.remove();
      if (internals.current.timerInterval) clearInterval(internals.current.timerInterval);
      internals.current.locationSub = null;
      internals.current.pedometerSub = null;
      internals.current.timerInterval = null;
    }

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    // Reset refs
    internals.current.stepsBanked = 0;
    distanceRef.current = 0;
    elevationRef.current = 0;
    routeRef.current = [];
    stepsRef.current = 0;
    internals.current.startTime = Date.now();
    internals.current.pausedDuration = 0;
    internals.current.pauseStart = null;
    internals.current.lastAltitude = null;
    setState(getInitialState());

    const locationAttached = await attachLocationWatcher();
    if (!locationAttached) {
      setState(getInitialState());
      return false;
    }

    await attachPedometer();
    attachTimer();

    setState((prev) => ({ ...prev, isTracking: true, isPaused: false }));
    return true;
  }, [attachLocationWatcher, attachPedometer, attachTimer, getInitialState]);

  const pause = useCallback(() => {
    internals.current.pauseStart = Date.now();
    if (internals.current.timerInterval) clearInterval(internals.current.timerInterval);
    internals.current.locationSub?.remove();
    // Bank what this subscription counted; the next one starts from zero again.
    internals.current.stepsBanked = stepsRef.current;
    internals.current.pedometerSub?.remove();
    internals.current.locationSub = null;
    internals.current.pedometerSub = null;
    setState((prev) => ({ ...prev, isPaused: true, currentSpeedMph: null }));
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    if (!state.isTracking || !state.isPaused) {
      return false;
    }
    if (internals.current.pauseStart) {
      internals.current.pausedDuration += Date.now() - internals.current.pauseStart;
      internals.current.pauseStart = null;
    }

    const locationAttached = await attachLocationWatcher();
    if (!locationAttached) {
      setState((prev) => ({ ...prev, isPaused: true, currentSpeedMph: null }));
      return false;
    }

    await attachPedometer();
    attachTimer();

    setState((prev) => ({ ...prev, isPaused: false }));
    return true;
  }, [attachLocationWatcher, attachPedometer, attachTimer, state.isPaused, state.isTracking]);

  const stop = useCallback((): RunTrackerState => {
    internals.current.locationSub?.remove();
    internals.current.pedometerSub?.remove();
    if (internals.current.timerInterval) clearInterval(internals.current.timerInterval);
    internals.current.locationSub = null;
    internals.current.pedometerSub = null;
    internals.current.timerInterval = null;

    // Built from the refs, not the captured `state`: the last fixes may not have
    // flushed through setState yet, and a saved run was missing its final points.
    const finalState: RunTrackerState = {
      ...stateRef.current,
      distanceMiles: Math.round(distanceRef.current * 100) / 100,
      elevationGainFt: Math.round(elevationRef.current),
      route: [...routeRef.current],
      caloriesEstimate: estimateCalories(distanceRef.current, loadRef.current),
      isTracking: false,
      isPaused: false,
    };
    setState(finalState);
    return finalState;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      internals.current.locationSub?.remove();
      internals.current.pedometerSub?.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (internals.current.timerInterval) clearInterval(internals.current.timerInterval);
    };
  }, []);

  return { ...state, start, pause, resume, stop };
}
