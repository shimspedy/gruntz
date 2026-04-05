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
  const visionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visionCountRef = useRef(0);

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
    cameraRef.current = ref;
  }, []);

  // ─── Vision Analysis Loop ─────────────────────────────────

  const runVisionAnalysis = useCallback(async () => {
    const vision = visionRef.current;
    const engine = engineRef.current;
    const camera = cameraRef.current;

    if (!vision || !engine || !camera) return;
    if (!vision.shouldAnalyze()) return;

    try {
      // Capture frame from camera
      const photo = await camera.takePictureAsync({
        quality: 0.3, // Low quality for speed + cost
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) return;

      // Analyze frame
      const result = await vision.analyzeFrame(photo.base64);
      visionCountRef.current++;

      // Feed result to engine
      engine.updateVisionResult({
        personVisible: result.personVisible,
        exerciseMatch: result.exerciseMatch,
        lightingOk: result.lightingOk,
        confidence: result.confidence,
        formScore: result.formScore,
        coachTip: result.coachTip || undefined,
      });

      // Update hook state with vision-specific info
      setState((prev) => ({
        ...prev,
        visionAnalysisCount: visionCountRef.current,
        formTrend: vision.getFormTrend(),
        lastVisionResult: result,
      }));
    } catch (error) {
      console.warn('[useSmartExercise] Vision analysis error:', error);
    }
  }, []);

  // ─── Lifecycle ────────────────────────────────────────────

  const start = useCallback(async () => {
    const engine = engineRef.current;
    const vision = visionRef.current;
    if (!engine || !vision) return;

    visionCountRef.current = 0;

    // Start engine (sensors)
    await engine.start();

    // Start vision
    vision.start();

    // Start vision analysis loop
    visionTimerRef.current = setInterval(runVisionAnalysis, 2000);

    setState((prev) => ({
      ...prev,
      isActive: true,
      visionAvailable: vision.isAvailable,
    }));
  }, [runVisionAnalysis]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    visionRef.current?.stop();

    if (visionTimerRef.current) {
      clearInterval(visionTimerRef.current);
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

    if (visionTimerRef.current) {
      clearInterval(visionTimerRef.current);
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
      if (visionTimerRef.current) {
        clearInterval(visionTimerRef.current);
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
