import { useState, useEffect, useRef, useCallback } from 'react';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

/**
 * Rep Counter Hook — uses accelerometer to count movement reps
 *
 * Algorithm: Detects peaks in the resultant acceleration magnitude.
 * A peak above threshold followed by a dip below reset threshold = 1 rep.
 *
 * Supports: push-ups, sit-ups, squats, burpees, lunges, pull-ups
 */

export interface RepCounterConfig {
  /** Acceleration peak threshold to register a rep peak (default: 1.15g) */
  peakThreshold?: number;
  /** Reset threshold — must dip below this after a peak (default: 0.95g) */
  resetThreshold?: number;
  /** Minimum time between reps in ms (debounce) (default: 400ms) */
  minRepIntervalMs?: number;
  /** Sensor update interval in ms (default: 50) */
  updateIntervalMs?: number;
}

export interface RepCounterState {
  reps: number;
  isActive: boolean;
  lastRepTimestamp: number | null;
  currentMagnitude: number;
}

const EXERCISE_PRESETS: Record<string, Partial<RepCounterConfig>> = {
  'push-up': { peakThreshold: 1.18, resetThreshold: 0.9, minRepIntervalMs: 600 },
  'sit-up': { peakThreshold: 1.2, resetThreshold: 0.85, minRepIntervalMs: 700 },
  'squat': { peakThreshold: 1.15, resetThreshold: 0.9, minRepIntervalMs: 800 },
  'burpee': { peakThreshold: 1.4, resetThreshold: 0.85, minRepIntervalMs: 1200 },
  'pull-up': { peakThreshold: 1.2, resetThreshold: 0.88, minRepIntervalMs: 900 },
  'lunge': { peakThreshold: 1.12, resetThreshold: 0.92, minRepIntervalMs: 800 },
};

/** Get preset tuning for a named exercise, or use defaults */
export function getRepPreset(exerciseName: string): RepCounterConfig {
  const lower = exerciseName.toLowerCase();
  const key = Object.keys(EXERCISE_PRESETS).find((k) => lower.includes(k));
  return {
    peakThreshold: 1.15,
    resetThreshold: 0.95,
    minRepIntervalMs: 400,
    updateIntervalMs: 50,
    ...(key ? EXERCISE_PRESETS[key] : {}),
  };
}

export function useRepCounter(config: RepCounterConfig = {}) {
  const {
    peakThreshold = 1.15,
    resetThreshold = 0.95,
    minRepIntervalMs = 400,
    updateIntervalMs = 50,
  } = config;

  const [state, setState] = useState<RepCounterState>({
    reps: 0,
    isActive: false,
    lastRepTimestamp: null,
    currentMagnitude: 1.0,
  });

  const isPeakedRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const repsRef = useRef(0);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  const handleData = useCallback((data: AccelerometerMeasurement) => {
    const { x, y, z } = data;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    const now = Date.now();

    if (!isPeakedRef.current && magnitude > peakThreshold) {
      // Rising past peak threshold
      isPeakedRef.current = true;
    } else if (isPeakedRef.current && magnitude < resetThreshold) {
      // Fell below reset — count it as a rep if enough time passed
      if (now - lastRepTimeRef.current > minRepIntervalMs) {
        repsRef.current += 1;
        lastRepTimeRef.current = now;
        setState((prev) => ({
          ...prev,
          reps: repsRef.current,
          lastRepTimestamp: now,
          currentMagnitude: magnitude,
        }));
      }
      isPeakedRef.current = false;
    }

    setState((prev) => ({ ...prev, currentMagnitude: magnitude }));
  }, [peakThreshold, resetThreshold, minRepIntervalMs]);

  const start = useCallback(async () => {
    const { status } = await Accelerometer.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Accelerometer.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }

    repsRef.current = 0;
    lastRepTimeRef.current = 0;
    isPeakedRef.current = false;

    Accelerometer.setUpdateInterval(updateIntervalMs);
    subscriptionRef.current = Accelerometer.addListener(handleData);

    setState({ reps: 0, isActive: true, lastRepTimestamp: null, currentMagnitude: 1.0 });
  }, [handleData, updateIntervalMs]);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const reset = useCallback(() => {
    repsRef.current = 0;
    lastRepTimeRef.current = 0;
    isPeakedRef.current = false;
    setState((prev) => ({ ...prev, reps: 0, lastRepTimestamp: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return { ...state, start, stop, reset };
}
