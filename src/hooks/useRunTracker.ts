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
}

const METERS_TO_MILES = 0.000621371;
const METERS_TO_FEET = 3.28084;
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

/** Estimate calories from distance + weight (running) */
function estimateCalories(distanceMiles: number, weightLbs: number = 160): number {
  // Rough: ~100 cal/mile for 160lb person
  return Math.round(distanceMiles * (weightLbs / 1.6));
}

export function useRunTracker() {
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
  });
  const distanceRef = useRef(0);
  const elevationRef = useRef(0);
  const routeRef = useRef<RoutePoint[]>([]);
  const stepsRef = useRef(0);

  const start = useCallback(async () => {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const pedoAvailable = await Pedometer.isAvailableAsync();

    // Reset refs
    distanceRef.current = 0;
    elevationRef.current = 0;
    routeRef.current = [];
    stepsRef.current = 0;
    internals.current.startTime = Date.now();
    internals.current.pausedDuration = 0;
    internals.current.pauseStart = null;
    internals.current.lastAltitude = null;

    // GPS subscription
    internals.current.locationSub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 3, // meters
      },
      (location) => {
        const point: RoutePoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
        };

        // Calculate distance from previous point
        const prev = routeRef.current[routeRef.current.length - 1];
        if (prev) {
          const dist = haversineMeters(prev.latitude, prev.longitude, point.latitude, point.longitude);
          // Filter out GPS jitter (ignore jumps < 2m)
          if (dist > 2 && dist < 100) {
            distanceRef.current += dist * METERS_TO_MILES;
          }
        }

        // Elevation gain
        if (point.altitude != null) {
          if (internals.current.lastAltitude != null) {
            const gain = point.altitude - internals.current.lastAltitude;
            if (gain > 0) elevationRef.current += gain * METERS_TO_FEET;
          }
          internals.current.lastAltitude = point.altitude;
        }

        routeRef.current.push(point);

        setState((prev) => ({
          ...prev,
          distanceMiles: Math.round(distanceRef.current * 100) / 100,
          elevationGainFt: Math.round(elevationRef.current),
          currentSpeedMph: point.speed != null ? Math.round(point.speed * MPS_TO_MPH * 10) / 10 : null,
          route: [...routeRef.current],
          caloriesEstimate: estimateCalories(distanceRef.current),
        }));
      },
    );

    // Pedometer subscription
    if (pedoAvailable) {
      internals.current.pedometerSub = Pedometer.watchStepCount((result) => {
        stepsRef.current = result.steps;
        setState((prev) => ({ ...prev, steps: result.steps }));
      });
    }

    // Timer
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

    setState((prev) => ({ ...prev, isTracking: true, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    internals.current.pauseStart = Date.now();
    if (internals.current.timerInterval) clearInterval(internals.current.timerInterval);
    internals.current.locationSub?.remove();
    internals.current.locationSub = null;
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(async () => {
    if (internals.current.pauseStart) {
      internals.current.pausedDuration += Date.now() - internals.current.pauseStart;
      internals.current.pauseStart = null;
    }
    // Restart GPS
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 3 },
      (location) => {
        const point: RoutePoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
        };
        const prev = routeRef.current[routeRef.current.length - 1];
        if (prev) {
          const dist = haversineMeters(prev.latitude, prev.longitude, point.latitude, point.longitude);
          if (dist > 2 && dist < 100) distanceRef.current += dist * METERS_TO_MILES;
        }
        if (point.altitude != null) {
          if (internals.current.lastAltitude != null) {
            const gain = point.altitude - internals.current.lastAltitude;
            if (gain > 0) elevationRef.current += gain * METERS_TO_FEET;
          }
          internals.current.lastAltitude = point.altitude;
        }
        routeRef.current.push(point);
        setState((prev) => ({
          ...prev,
          distanceMiles: Math.round(distanceRef.current * 100) / 100,
          elevationGainFt: Math.round(elevationRef.current),
          currentSpeedMph: point.speed != null ? Math.round(point.speed * MPS_TO_MPH * 10) / 10 : null,
          route: [...routeRef.current],
          caloriesEstimate: estimateCalories(distanceRef.current),
        }));
      },
    );
    internals.current.locationSub = sub;

    // Restart timer
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

    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const stop = useCallback((): RunTrackerState => {
    internals.current.locationSub?.remove();
    internals.current.pedometerSub?.remove();
    if (internals.current.timerInterval) clearInterval(internals.current.timerInterval);
    internals.current.locationSub = null;
    internals.current.pedometerSub = null;
    internals.current.timerInterval = null;

    const finalState: RunTrackerState = {
      ...state,
      isTracking: false,
      isPaused: false,
    };
    setState(finalState);
    return finalState;
  }, [state]);

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
