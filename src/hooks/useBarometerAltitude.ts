import { useState, useEffect, useRef, useCallback } from 'react';
import { Barometer, BarometerMeasurement } from 'expo-sensors';

/**
 * Barometer/Altitude Hook
 *
 * Uses barometric pressure to estimate altitude changes.
 * Primary use: elevation gain tracking during rucks.
 *
 * Formula: altitude = 44330 * (1 - (pressure/1013.25)^0.1903) meters
 */

export interface AltitudeState {
  isActive: boolean;
  /** Current pressure in hPa (mbar) */
  currentPressure: number | null;
  /** Estimated current altitude in feet */
  currentAltitudeFt: number | null;
  /** Total elevation gained in feet (only uphill) */
  elevationGainFt: number;
  /** Total elevation lost in feet (only downhill) */
  elevationLossFt: number;
  /** Starting altitude at session start */
  startAltitudeFt: number | null;
}

const HPA_TO_ALTITUDE_METERS = (pressure: number): number => {
  // Standard barometric formula
  return 44330 * (1 - Math.pow(pressure / 1013.25, 0.1903));
};
const METERS_TO_FEET = 3.28084;

// Minimum altitude change to register (filter noise) — 1.5 meters
const MIN_CHANGE_METERS = 1.5;

export function useBarometerAltitude() {
  const [state, setState] = useState<AltitudeState>({
    isActive: false,
    currentPressure: null,
    currentAltitudeFt: null,
    elevationGainFt: 0,
    elevationLossFt: 0,
    startAltitudeFt: null,
  });

  const subscriptionRef = useRef<ReturnType<typeof Barometer.addListener> | null>(null);
  const lastAltRef = useRef<number | null>(null);
  const gainRef = useRef(0);
  const lossRef = useRef(0);
  const startAltRef = useRef<number | null>(null);

  const handleData = useCallback((data: BarometerMeasurement) => {
    const altMeters = HPA_TO_ALTITUDE_METERS(data.pressure);
    const altFeet = altMeters * METERS_TO_FEET;

    if (startAltRef.current === null) {
      startAltRef.current = altFeet;
    }

    if (lastAltRef.current !== null) {
      const change = altMeters - (lastAltRef.current / METERS_TO_FEET);
      if (Math.abs(change) > MIN_CHANGE_METERS) {
        if (change > 0) {
          gainRef.current += change * METERS_TO_FEET;
        } else {
          lossRef.current += Math.abs(change) * METERS_TO_FEET;
        }
        lastAltRef.current = altFeet;
      }
    } else {
      lastAltRef.current = altFeet;
    }

    setState({
      isActive: true,
      currentPressure: Math.round(data.pressure * 10) / 10,
      currentAltitudeFt: Math.round(altFeet),
      elevationGainFt: Math.round(gainRef.current),
      elevationLossFt: Math.round(lossRef.current),
      startAltitudeFt: startAltRef.current ? Math.round(startAltRef.current) : null,
    });
  }, []);

  const start = useCallback(async () => {
    const available = await Barometer.isAvailableAsync();
    if (!available) return;

    gainRef.current = 0;
    lossRef.current = 0;
    lastAltRef.current = null;
    startAltRef.current = null;

    Barometer.setUpdateInterval(2000); // 2 sec is plenty for altitude
    subscriptionRef.current = Barometer.addListener(handleData);

    setState({
      isActive: true,
      currentPressure: null,
      currentAltitudeFt: null,
      elevationGainFt: 0,
      elevationLossFt: 0,
      startAltitudeFt: null,
    });
  }, [handleData]);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setState((prev) => ({ ...prev, isActive: false }));
  }, []);

  const reset = useCallback(() => {
    gainRef.current = 0;
    lossRef.current = 0;
    lastAltRef.current = null;
    startAltRef.current = null;
    setState((prev) => ({
      ...prev,
      elevationGainFt: 0,
      elevationLossFt: 0,
      startAltitudeFt: null,
    }));
  }, []);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return { ...state, start, stop, reset };
}
