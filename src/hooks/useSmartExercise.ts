/**
 * useSmartExercise — React hook wrapping the Smart Exercise Engine + Vision Coach
 *
 * Provides a single, clean API for the RepCounterScreen:
 * - Manages engine lifecycle (start/stop/reset)
 * - Handles periodic vision analysis via camera ref
 * - Exposes reactive state for UI rendering
 * - Coordinates sensor data + vision data + rep gating
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { SmartExerciseEngine, EngineState, EnginePhase, EXERCISE_PROFILES } from '../engine/smartExerciseEngine';
import { VisionCoach, VisionResult } from '../engine/visionCoach';
import type { CameraView } from 'expo-camera';

export interface SmartExerciseState extends EngineState {
  /** Is the vision AI available (OpenAI key configured)? */
  visionAvailable: boolean;
  /** Number of vision analyses completed */
  visionAnalysisCount: number;
  /** Form trend from vision: improving, declining, stable */
  formTrend: 'improving' | 'declining' | 'stable' | 'unknown';
  /** Latest vision result */
  lastVisionResult: VisionResult | null;
  /** Is the engine running? */
  isActive: boolean;
}

const INITIAL_STATE: SmartExerciseState = {
  phase: 'setup',
  reps: 0,
  validReps: 0,
  rejectedReps: 0,
  formScore: 100,
  phoneStationary: false,
  personVisible: false,
  exerciseMatch: false,
  lightingOk: true,
  pauseReason: null,
  currentMotion: 1.0,
  calibrationProgress: 0,
  coachMessage: null,
  visionConfidence: 0,
  lastVisionCheck: 0,
  visionAvailable: false,
  visionAnalysisCount: 0,
  formTrend: 'unknown',
  lastVisionResult: null,
  isActive: false,
};

export function useSmartExercise(exerciseName: string) {
  const [state, setState] = useState<SmartExerciseState>(INITIAL_STATE);
  const engineRef = useRef<SmartExerciseEngine | null>(null);
  const visionRef = useRef<VisionCoach | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const visionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visionCountRef = useRef(0);
  const visionBusyRef = useRef(false);
  const visionActiveRef = useRef(false);

  // Create engine and vision coach when exercise changes
  useEffect(() => {
    engineRef.current = new SmartExerciseEngine(exerciseName);
    visionRef.current = new VisionCoach(exerciseName);

    engineRef.current.setOnStateChange((engineState) => {
      setState((prev) => ({
        ...prev,
        ...engineState,
        isActive: engineState.phase !== 'setup' && engineState.phase !== 'complete',
      }));
    });

    setState((prev) => ({
      ...prev,
      ...INITIAL_STATE,
      visionAvailable: visionRef.current?.isAvailable ?? false,
    }));

    return () => {
      engineRef.current?.stop();
      visionRef.current?.stop();
    };
  }, [exerciseName]);

  // Set camera ref for frame capture
  const setCameraRef = useCallback((ref: CameraView | null) => {
    console.log('[useSmartExercise] Camera ref set:', ref ? 'YES' : 'null');
    cameraRef.current = ref;
  }, []);

  // ─── Vision Analysis Loop ─────────────────────────────────

  const runVisionAnalysis = useCallback(async () => {
    const vision = visionRef.current;
    const engine = engineRef.current;
    const camera = cameraRef.current;

    if (!vision || !engine) return;
    if (visionBusyRef.current) return; // Skip if previous call still in flight

    visionBusyRef.current = true;

    const scheduleNext = () => {
      visionBusyRef.current = false;
      // Schedule next analysis 2s AFTER this one completes (not from start)
      if (visionActiveRef.current) {
        visionTimerRef.current = setTimeout(runVisionAnalysis, 2000);
      }
    };

    // If no camera ref, use local fallback (still provides defaults)
    if (!camera) {
      const fallback = await vision.analyzeFrame('');
      engine.updateVisionResult({
        personVisible: fallback.personVisible,
        exerciseMatch: fallback.exerciseMatch,
        lightingOk: fallback.lightingOk,
        confidence: fallback.confidence,
        formScore: fallback.formScore,
        coachTip: fallback.coachTip || undefined,
        phase: fallback.phase,
      });
      scheduleNext();
      return;
    }

    try {
      // Capture frame from camera
      const photo = await camera.takePictureAsync({
        quality: 0.1,
        base64: true,
        skipProcessing: true,
        shutterSound: false,
      });

      if (!photo?.base64) {
        // Camera didn't return a frame (e.g. simulator) — use local fallback
        console.log('[useSmartExercise] No photo data — using local fallback');
        const fallback = await vision.analyzeFrame('');
        engine.updateVisionResult({
          personVisible: fallback.personVisible,
          exerciseMatch: fallback.exerciseMatch,
          lightingOk: fallback.lightingOk,
          confidence: fallback.confidence,
          formScore: fallback.formScore,
          coachTip: fallback.coachTip || undefined,
          phase: fallback.phase,
        });
        return; // finally will call scheduleNext()
      }

      // Analyze frame — hook manages timing, no shouldAnalyze() needed
      const result = await vision.analyzeFrame(photo.base64);
      visionCountRef.current++;
      console.log(`[Vision] #${visionCountRef.current} phase=${result.phase} person=${result.personVisible} match=${result.exerciseMatch} form=${result.formScore} conf=${result.confidence} tip="${result.coachTip}"`);

      // Feed result to engine (including phase for vision-based rep counting)
      engine.updateVisionResult({
        personVisible: result.personVisible,
        exerciseMatch: result.exerciseMatch,
        lightingOk: result.lightingOk,
        confidence: result.confidence,
        formScore: result.formScore,
        coachTip: result.coachTip || undefined,
        phase: result.phase,
      });

      // Update hook state with vision-specific info
      setState((prev) => ({
        ...prev,
        visionAnalysisCount: visionCountRef.current,
        formTrend: vision.getFormTrend(),
        lastVisionResult: result,
      }));
    } catch (error) {
      // Camera threw (e.g. no hardware on simulator) — use local fallback
      console.warn('[useSmartExercise] Camera error, using fallback:', error);
      const fallback = await vision.analyzeFrame('');
      engine.updateVisionResult({
        personVisible: fallback.personVisible,
        exerciseMatch: fallback.exerciseMatch,
        lightingOk: fallback.lightingOk,
        confidence: fallback.confidence,
        formScore: fallback.formScore,
        coachTip: fallback.coachTip || undefined,
        phase: fallback.phase,
      });
    } finally {
      scheduleNext();
    }
  }, []);

  // ─── Lifecycle ────────────────────────────────────────────

  const start = useCallback(async () => {
    const engine = engineRef.current;
    const vision = visionRef.current;
    if (!engine || !vision) return;

    visionCountRef.current = 0;

    // Start vision FIRST so it's ready when engine transitions to 'ready'
    vision.start();

    // Start engine (sensors + calibration)
    await engine.start();

    // Kick off vision analysis loop — recursive setTimeout fires 2s AFTER each
    // analysis completes, so no wasted ticks while GPT-4o API is in flight.
    // Vision is the PRIMARY rep counter — tracks phase transitions (down→up = rep)
    visionActiveRef.current = true;
    visionTimerRef.current = setTimeout(runVisionAnalysis, 1500);

    setState((prev) => ({
      ...prev,
      isActive: true,
      visionAvailable: vision.isAvailable,
    }));
  }, [runVisionAnalysis]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    visionRef.current?.stop();
    visionActiveRef.current = false;

    if (visionTimerRef.current) {
      clearTimeout(visionTimerRef.current);
      visionTimerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      phase: 'complete' as EnginePhase,
    }));
  }, []);

  const reset = useCallback(() => {
    engineRef.current?.reset();
    visionRef.current?.stop();
    visionActiveRef.current = false;

    if (visionTimerRef.current) {
      clearTimeout(visionTimerRef.current);
      visionTimerRef.current = null;
    }

    visionCountRef.current = 0;
    setState({ ...INITIAL_STATE, visionAvailable: visionRef.current?.isAvailable ?? false });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      visionRef.current?.stop();
      visionActiveRef.current = false;
      if (visionTimerRef.current) {
        clearTimeout(visionTimerRef.current);
      }
    };
  }, []);

  // Get exercise profile for UI
  const profile = EXERCISE_PROFILES[exerciseName] || EXERCISE_PROFILES['Push-Ups'];

  return {
    ...state,
    profile,
    start,
    stop,
    reset,
    setCameraRef,
  };
}
