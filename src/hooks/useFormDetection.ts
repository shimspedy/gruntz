import { useState, useEffect, useRef, useCallback } from 'react';
import { Gyroscope, GyroscopeMeasurement } from 'expo-sensors';

/**
 * Form Detection Hook — uses gyroscope to detect body angle and form quality
 *
 * Tracks rotation rate to detect:
 * - Plank sag (hip dropping)
 * - Squat depth (knee angle estimation)
 * - Push-up range of motion
 * - Body alignment stability
 */

export interface FormMetrics {
  /** Stability score 0-100 (higher = more stable, less wobble) */
  stabilityScore: number;
  /** Average angular velocity magnitude (lower = more stable) */
  avgAngularVelocity: number;
  /** Peak angular velocity — big spikes may indicate form break */
  peakAngularVelocity: number;
  /** Number of form warnings detected */
  warningCount: number;
  /** Specific warnings */
  warnings: FormWarning[];
  /** Is sensor active */
  isActive: boolean;
}

export interface FormWarning {
  type: 'instability' | 'too_fast' | 'asymmetric' | 'range_of_motion';
  message: string;
  timestamp: number;
}

interface GyroSample {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  timestamp: number;
}

export interface FormDetectionConfig {
  /** Exercise type for tuned thresholds */
  exerciseType?: 'plank' | 'squat' | 'push-up' | 'general';
  /** Max angular velocity before warning (rad/s) */
  instabilityThreshold?: number;
  /** Update interval ms */
  updateIntervalMs?: number;
  /** Window size for rolling statistics */
  windowSize?: number;
}

const EXERCISE_THRESHOLDS: Record<string, { instability: number; tooFast: number }> = {
  'plank': { instability: 0.8, tooFast: 2.0 },
  'squat': { instability: 1.5, tooFast: 4.0 },
  'push-up': { instability: 1.2, tooFast: 3.5 },
  'general': { instability: 1.0, tooFast: 3.0 },
};

export function useFormDetection(config: FormDetectionConfig = {}) {
  const {
    exerciseType = 'general',
    updateIntervalMs = 50,
    windowSize = 60, // ~3 sec at 50ms
  } = config;

  const thresholds = EXERCISE_THRESHOLDS[exerciseType] || EXERCISE_THRESHOLDS['general'];

  const [metrics, setMetrics] = useState<FormMetrics>({
    stabilityScore: 100,
    avgAngularVelocity: 0,
    peakAngularVelocity: 0,
    warningCount: 0,
    warnings: [],
    isActive: false,
  });

  const samplesRef = useRef<GyroSample[]>([]);
  const warningsRef = useRef<FormWarning[]>([]);
  const lastWarningTimeRef = useRef(0);
  const subscriptionRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);

  const handleData = useCallback((data: GyroscopeMeasurement) => {
    const { x, y, z } = data;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    const sample: GyroSample = { x, y, z, magnitude, timestamp: now };
    samplesRef.current.push(sample);

    // Keep rolling window
    if (samplesRef.current.length > windowSize) {
      samplesRef.current = samplesRef.current.slice(-windowSize);
    }

    const samples = samplesRef.current;
    const avgMag = samples.reduce((sum, s) => sum + s.magnitude, 0) / samples.length;
    const peakMag = Math.max(...samples.map((s) => s.magnitude));

    // Stability score: inverse of average magnitude, mapped to 0-100
    // At 0 rad/s avg = 100, at threshold = ~50, at 2x threshold = ~0
    const stability = Math.max(0, Math.min(100, 100 - (avgMag / thresholds.instability) * 50));

    // Generate warnings (max 1 per 3 seconds)
    if (now - lastWarningTimeRef.current > 3000) {
      if (magnitude > thresholds.instability) {
        warningsRef.current.push({
          type: 'instability',
          message: 'Body wobble detected — tighten your core',
          timestamp: now,
        });
        lastWarningTimeRef.current = now;
      } else if (magnitude > thresholds.tooFast) {
        warningsRef.current.push({
          type: 'too_fast',
          message: 'Moving too fast — control the movement',
          timestamp: now,
        });
        lastWarningTimeRef.current = now;
      }

      // Check asymmetry (big difference between x and z rotation)
      if (Math.abs(x) > 0.5 && Math.abs(x - z) > 1.0) {
        warningsRef.current.push({
          type: 'asymmetric',
          message: 'Uneven movement — try to stay symmetrical',
          timestamp: now,
        });
        lastWarningTimeRef.current = now;
      }

      // Keep last 10 warnings
      if (warningsRef.current.length > 10) {
        warningsRef.current = warningsRef.current.slice(-10);
      }
    }

    setMetrics({
      stabilityScore: Math.round(stability),
      avgAngularVelocity: Math.round(avgMag * 100) / 100,
      peakAngularVelocity: Math.round(peakMag * 100) / 100,
      warningCount: warningsRef.current.length,
      warnings: [...warningsRef.current],
      isActive: true,
    });
  }, [thresholds, windowSize]);

  const start = useCallback(async () => {
    const { status } = await Gyroscope.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Gyroscope.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }

    samplesRef.current = [];
    warningsRef.current = [];
    lastWarningTimeRef.current = 0;

    Gyroscope.setUpdateInterval(updateIntervalMs);
    subscriptionRef.current = Gyroscope.addListener(handleData);

    setMetrics({
      stabilityScore: 100,
      avgAngularVelocity: 0,
      peakAngularVelocity: 0,
      warningCount: 0,
      warnings: [],
      isActive: true,
    });
  }, [handleData, updateIntervalMs]);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setMetrics((prev) => ({ ...prev, isActive: false }));
  }, []);

  const reset = useCallback(() => {
    samplesRef.current = [];
    warningsRef.current = [];
    lastWarningTimeRef.current = 0;
    setMetrics({
      stabilityScore: 100,
      avgAngularVelocity: 0,
      peakAngularVelocity: 0,
      warningCount: 0,
      warnings: [],
      isActive: metrics.isActive,
    });
  }, [metrics.isActive]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return { ...metrics, start, stop, reset };
}
