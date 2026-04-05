/**
 * Smart Exercise Engine — The brain behind intelligent rep counting
 *
 * Combines multiple signals to ensure accurate, validated rep counting:
 * 1. Phone Position Detection — Is the phone stationary or being held?
 * 2. Motion Signature Validation — Does the accelerometer pattern match the exercise?
 * 3. Vision Gating — Periodic camera checks validate person + exercise
 * 4. Rep Gating — Only counts when all validators agree
 *
 * State Machine: SETUP → CALIBRATING → READY → COUNTING → PAUSED → COMPLETE
 */
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

// ─── Types ──────────────────────────────────────────────────────

export type EnginePhase =
  | 'setup'        // Not started yet
  | 'calibrating'  // Phone placed, learning baseline (3 seconds)
  | 'ready'        // Baseline learned, waiting for vision confirmation
  | 'counting'     // Actively counting valid reps
  | 'paused'       // Paused — phone moved, person lost, wrong exercise
  | 'complete';    // Session ended

export type PauseReason =
  | 'phone_moved'       // Phone picked up or knocked
  | 'no_person'         // Camera can't see anyone
  | 'wrong_exercise'    // Person doing different exercise
  | 'bad_lighting'      // Camera can't see clearly
  | 'too_fast'          // Moving dangerously fast
  | 'phone_in_hand'     // Phone is being held, not placed down
  | null;

export interface EngineState {
  phase: EnginePhase;
  reps: number;
  validReps: number;           // Reps that passed all validation
  rejectedReps: number;        // Motion peaks that were rejected
  formScore: number;           // Rolling form quality 0-100
  phoneStationary: boolean;    // Is the phone placed down?
  personVisible: boolean;      // Does camera see a person?
  exerciseMatch: boolean;      // Is the right exercise being performed?
  lightingOk: boolean;         // Is visibility sufficient?
  pauseReason: PauseReason;
  currentMotion: number;       // Current acceleration magnitude
  calibrationProgress: number; // 0-100 during calibration
  coachMessage: string | null; // Real-time coaching feedback
  visionConfidence: number;    // 0-100 from last vision check
  lastVisionCheck: number;     // Timestamp of last vision analysis
}

export interface ExerciseMotionProfile {
  /** Primary axis of motion ('y' for vertical like push-ups/squats) */
  primaryAxis: 'x' | 'y' | 'z';
  /** Peak threshold on primary axis for rep detection */
  peakThreshold: number;
  /** Reset threshold */
  resetThreshold: number;
  /** Minimum time between reps (ms) */
  minRepInterval: number;
  /** Maximum time between reps before "paused" (ms) */
  maxRepInterval: number;
  /** Expected phone orientation when placed correctly */
  expectedOrientation: 'flat' | 'upright' | 'angled';
  /** Max variance allowed for phone to be considered stationary */
  stationaryVarianceMax: number;
  /** Form tips from exercise database */
  formTips: string[];
  /** Description from exercise database */
  description: string;
}

// ─── Exercise Motion Profiles ──────────────────────────────────

/**
 * Each exercise has a unique motion signature based on how the
 * accelerometer reads when the phone is placed correctly and the
 * user is performing the exercise.
 *
 * Phone is always stationary (placed on ground/ledge/propped).
 * We detect motion via vibrations/impact transmitted through the surface.
 */
export const EXERCISE_PROFILES: Record<string, ExerciseMotionProfile> = {
  'Push-Ups': {
    primaryAxis: 'z',
    peakThreshold: 1.08,
    resetThreshold: 0.96,
    minRepInterval: 800,
    maxRepInterval: 8000,
    expectedOrientation: 'flat',
    stationaryVarianceMax: 0.04,
    formTips: ['Back straight', 'Full lockout', "Don't rest on ground"],
    description: 'Push up through hands keeping back straight. Full lockout at top.',
  },
  'Sit-Ups': {
    primaryAxis: 'z',
    peakThreshold: 1.06,
    resetThreshold: 0.97,
    minRepInterval: 900,
    maxRepInterval: 8000,
    expectedOrientation: 'flat',
    stationaryVarianceMax: 0.04,
    formTips: ['Shoulders to deck each rep', 'Use abs not momentum', 'Full ROM'],
    description: 'Lying on back, knees up, arms across abdomen. Drive upper body off ground.',
  },
  'Squats': {
    primaryAxis: 'y',
    peakThreshold: 1.10,
    resetThreshold: 0.95,
    minRepInterval: 1000,
    maxRepInterval: 8000,
    expectedOrientation: 'upright',
    stationaryVarianceMax: 0.05,
    formTips: ['Hip crease below knee', 'Heels on ground', 'Chest up'],
    description: 'Deep squat with arms at shoulder height. Explode up.',
  },
  'Pull-Ups': {
    primaryAxis: 'z',
    peakThreshold: 1.06,
    resetThreshold: 0.97,
    minRepInterval: 1200,
    maxRepInterval: 10000,
    expectedOrientation: 'flat',
    stationaryVarianceMax: 0.05,
    formTips: ['Full dead hang', 'Chin above bar', 'No kipping'],
    description: 'Dead hang, hands wider than shoulders. Pull chest to bar.',
  },
  'Burpees': {
    primaryAxis: 'z',
    peakThreshold: 1.15,
    resetThreshold: 0.90,
    minRepInterval: 1500,
    maxRepInterval: 10000,
    expectedOrientation: 'flat',
    stationaryVarianceMax: 0.06,
    formTips: ['Full push-up', 'Explosive jump', 'Spread eagle in air'],
    description: 'Squat, kick back, push-up, fire legs in, jump with hands overhead.',
  },
  'Lunges': {
    primaryAxis: 'y',
    peakThreshold: 1.08,
    resetThreshold: 0.95,
    minRepInterval: 900,
    maxRepInterval: 8000,
    expectedOrientation: 'upright',
    stationaryVarianceMax: 0.05,
    formTips: ['Knee over foot', 'Body straight', 'Step through'],
    description: 'Step forward, lower to parallel, drive up. Alternate legs.',
  },
};

// ─── Phone Position Detector ───────────────────────────────────

interface AccelSample {
  x: number;
  y: number;
  z: number;
  mag: number;
  ts: number;
}

const CALIBRATION_DURATION_MS = 3000;
const STATIONARY_WINDOW = 40; // 2 seconds at 50ms interval

export class SmartExerciseEngine {
  private exerciseName: string;
  private profile: ExerciseMotionProfile;
  private state: EngineState;
  private listener: (() => void) | null = null;

  // Accelerometer
  private subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  private samples: AccelSample[] = [];
  private calibrationBaseline: { x: number; y: number; z: number } | null = null;
  private calibrationStart = 0;

  // Rep counting
  private isPeaked = false;
  private lastRepTime = 0;
  private repCandidateCount = 0;

  // Phone stationarity
  private stationaryBuffer: number[] = [];

  // Callbacks
  private onStateChange: ((state: EngineState) => void) | null = null;
  private onRepCounted: ((reps: number) => void) | null = null;

  constructor(exerciseName: string) {
    this.exerciseName = exerciseName;
    this.profile = EXERCISE_PROFILES[exerciseName] || EXERCISE_PROFILES['Push-Ups'];
    this.state = this.createInitialState();
  }

  private createInitialState(): EngineState {
    return {
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
    };
  }

  /** Subscribe to state changes */
  setOnStateChange(cb: (state: EngineState) => void) {
    this.onStateChange = cb;
  }

  setOnRepCounted(cb: (reps: number) => void) {
    this.onRepCounted = cb;
  }

  getState(): EngineState {
    return { ...this.state };
  }

  getProfile(): ExerciseMotionProfile {
    return this.profile;
  }

  // ─── Lifecycle ──────────────────────────────────────────────

  async start() {
    const { status } = await Accelerometer.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: ns } = await Accelerometer.requestPermissionsAsync();
      if (ns !== 'granted') return;
    }

    this.state = this.createInitialState();
    this.state.phase = 'calibrating';
    this.state.coachMessage = 'Place your phone on a stable surface...';
    this.calibrationStart = Date.now();
    this.samples = [];
    this.stationaryBuffer = [];
    this.isPeaked = false;
    this.lastRepTime = 0;
    this.repCandidateCount = 0;
    this.calibrationBaseline = null;

    Accelerometer.setUpdateInterval(50);
    this.subscription = Accelerometer.addListener(this.handleAccelData);
    this.emit();
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
    this.state.phase = 'complete';
    this.emit();
  }

  reset() {
    this.subscription?.remove();
    this.subscription = null;
    this.state = this.createInitialState();
    this.samples = [];
    this.stationaryBuffer = [];
    this.emit();
  }

  // ─── Vision Integration ─────────────────────────────────────

  /** Called by the vision coach when a frame is analyzed */
  updateVisionResult(result: {
    personVisible: boolean;
    exerciseMatch: boolean;
    lightingOk: boolean;
    confidence: number;
    formScore?: number;
    coachTip?: string;
  }) {
    this.state.personVisible = result.personVisible;
    this.state.exerciseMatch = result.exerciseMatch;
    this.state.lightingOk = result.lightingOk;
    this.state.visionConfidence = result.confidence;
    this.state.lastVisionCheck = Date.now();

    if (result.formScore !== undefined) {
      // Blend vision form score with sensor form score
      this.state.formScore = Math.round(
        this.state.formScore * 0.4 + result.formScore * 0.6
      );
    }

    if (result.coachTip) {
      this.state.coachMessage = result.coachTip;
    }

    // Transition logic based on vision
    if (this.state.phase === 'ready') {
      if (result.personVisible && result.exerciseMatch) {
        this.state.phase = 'counting';
        this.state.coachMessage = 'You\'re in position. Let\'s go!';
      } else if (!result.personVisible) {
        this.state.coachMessage = 'I can\'t see you — adjust your camera position';
      } else if (!result.exerciseMatch) {
        this.state.coachMessage = `Get in position for ${this.exerciseName}`;
      }
    }

    if (this.state.phase === 'counting') {
      if (!result.personVisible) {
        this.state.phase = 'paused';
        this.state.pauseReason = 'no_person';
        this.state.coachMessage = 'Lost visual — make sure you\'re in frame';
      } else if (!result.lightingOk) {
        this.state.phase = 'paused';
        this.state.pauseReason = 'bad_lighting';
        this.state.coachMessage = 'Can\'t see clearly — improve lighting';
      }
    }

    // Auto-resume from pause if vision is good now
    if (this.state.phase === 'paused' && this.state.phoneStationary) {
      if (result.personVisible && result.lightingOk) {
        if (result.exerciseMatch || result.confidence < 30) {
          // Low confidence means we couldn't tell — give benefit of doubt
          this.state.phase = 'counting';
          this.state.pauseReason = null;
          this.state.coachMessage = 'Back on track. Keep going!';
        }
      }
    }

    this.emit();
  }

  // ─── Accelerometer Handler ──────────────────────────────────

  private handleAccelData = (data: AccelerometerMeasurement) => {
    const { x, y, z } = data;
    const mag = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    this.samples.push({ x, y, z, mag, ts: now });
    if (this.samples.length > 200) {
      this.samples = this.samples.slice(-200);
    }

    this.state.currentMotion = mag;

    // ─── Phase: CALIBRATING ─────
    if (this.state.phase === 'calibrating') {
      this.handleCalibration(x, y, z, now);
      return;
    }

    // ─── Phone stationarity check (always running) ─────
    this.updateStationarity(mag);

    // ─── Phase: READY ─────
    if (this.state.phase === 'ready') {
      // Waiting for vision to confirm person + exercise
      // If no vision check for 10s, allow counting with sensor-only
      if (now - this.state.lastVisionCheck > 10000 && this.state.phoneStationary) {
        this.state.phase = 'counting';
        this.state.coachMessage = 'Camera check pending — counting with sensors';
      }
      this.emit();
      return;
    }

    // ─── Phase: COUNTING ─────
    if (this.state.phase === 'counting') {
      this.handleRepDetection(x, y, z, mag, now);
      return;
    }

    // ─── Phase: PAUSED ─────
    if (this.state.phase === 'paused') {
      // Auto-resume if phone becomes stationary again
      if (this.state.pauseReason === 'phone_moved' && this.state.phoneStationary) {
        this.state.phase = 'counting';
        this.state.pauseReason = null;
        this.state.coachMessage = 'Phone stable again. Resuming count.';
      }
      // phone_in_hand — only resumes if variance drops significantly
      if (this.state.pauseReason === 'phone_in_hand' && this.state.phoneStationary) {
        this.state.phase = 'counting';
        this.state.pauseReason = null;
        this.state.coachMessage = 'Phone placed down. Ready to count.';
      }
      this.emit();
      return;
    }

    this.emit();
  };

  // ─── Calibration ────────────────────────────────────────────

  private handleCalibration(x: number, y: number, z: number, now: number) {
    const elapsed = now - this.calibrationStart;
    this.state.calibrationProgress = Math.min(100, (elapsed / CALIBRATION_DURATION_MS) * 100);

    if (elapsed < CALIBRATION_DURATION_MS) {
      this.state.coachMessage = 'Hold still... learning your phone position';
      this.emit();
      return;
    }

    // Calibration complete — compute baseline from recent samples
    const recentSamples = this.samples.slice(-40);
    if (recentSamples.length < 20) {
      this.state.coachMessage = 'Hold still a bit longer...';
      this.emit();
      return;
    }

    const avgX = recentSamples.reduce((s, r) => s + r.x, 0) / recentSamples.length;
    const avgY = recentSamples.reduce((s, r) => s + r.y, 0) / recentSamples.length;
    const avgZ = recentSamples.reduce((s, r) => s + r.z, 0) / recentSamples.length;

    // Check variance — must be low enough to confirm phone is stationary
    const magValues = recentSamples.map(s => s.mag);
    const avgMag = magValues.reduce((a, b) => a + b, 0) / magValues.length;
    const variance = magValues.reduce((s, m) => s + (m - avgMag) ** 2, 0) / magValues.length;

    if (variance > this.profile.stationaryVarianceMax * 2) {
      // Phone is still moving — not stationary
      this.state.coachMessage = 'Phone is moving! Place it on a stable surface.';
      this.state.pauseReason = 'phone_in_hand';
      this.calibrationStart = now; // restart calibration
      this.samples = [];
      this.emit();
      return;
    }

    this.calibrationBaseline = { x: avgX, y: avgY, z: avgZ };
    this.state.phoneStationary = true;
    this.state.phase = 'ready';
    this.state.coachMessage = `Phone locked in. Get in position for ${this.exerciseName}.`;
    this.emit();
  }

  // ─── Stationarity Detection ─────────────────────────────────

  private updateStationarity(mag: number) {
    this.stationaryBuffer.push(mag);
    if (this.stationaryBuffer.length > STATIONARY_WINDOW) {
      this.stationaryBuffer = this.stationaryBuffer.slice(-STATIONARY_WINDOW);
    }

    if (this.stationaryBuffer.length < 10) return;

    const avg = this.stationaryBuffer.reduce((a, b) => a + b, 0) / this.stationaryBuffer.length;
    const variance = this.stationaryBuffer.reduce((s, m) => s + (m - avg) ** 2, 0) / this.stationaryBuffer.length;

    const wasStationary = this.state.phoneStationary;
    this.state.phoneStationary = variance < this.profile.stationaryVarianceMax;

    // If phone was stationary and now isn't during counting → pause
    if (wasStationary && !this.state.phoneStationary && this.state.phase === 'counting') {
      // Check if this is a big movement (phone picked up) vs exercise vibration
      if (variance > this.profile.stationaryVarianceMax * 5) {
        this.state.phase = 'paused';
        this.state.pauseReason = 'phone_moved';
        this.state.coachMessage = 'Phone moved! Place it back on a stable surface.';
      }
    }
  }

  // ─── Smart Rep Detection ────────────────────────────────────

  private handleRepDetection(x: number, y: number, z: number, mag: number, now: number) {
    if (!this.calibrationBaseline) return;

    // Calculate deviation from baseline on the primary axis
    let primaryDeviation: number;
    switch (this.profile.primaryAxis) {
      case 'x':
        primaryDeviation = Math.abs(x - this.calibrationBaseline.x);
        break;
      case 'y':
        primaryDeviation = Math.abs(y - this.calibrationBaseline.y);
        break;
      case 'z':
        primaryDeviation = Math.abs(z - this.calibrationBaseline.z);
        break;
    }

    // Use magnitude-based detection (vibrations from exercise impact)
    // The phone picks up floor vibrations from push-ups, squats landing, etc.
    const deviationFromGravity = Math.abs(mag - 1.0);
    const combinedSignal = deviationFromGravity + primaryDeviation * 0.3;

    const peakThreshold = this.profile.peakThreshold - 1.0; // Convert to deviation
    const resetThreshold = this.profile.resetThreshold - 1.0;

    if (!this.isPeaked && combinedSignal > peakThreshold) {
      this.isPeaked = true;
    } else if (this.isPeaked && combinedSignal < resetThreshold) {
      this.isPeaked = false;
      const timeSinceLastRep = now - this.lastRepTime;

      if (timeSinceLastRep > this.profile.minRepInterval) {
        // ─── REP GATE: Validate before counting ─────
        const gateResult = this.validateRepGate(timeSinceLastRep);

        if (gateResult.valid) {
          this.state.validReps += 1;
          this.state.reps = this.state.validReps;
          this.lastRepTime = now;
          this.onRepCounted?.(this.state.validReps);

          if (gateResult.tip) {
            this.state.coachMessage = gateResult.tip;
          }
        } else {
          this.state.rejectedReps += 1;
          if (gateResult.reason) {
            this.state.coachMessage = gateResult.reason;
          }
        }
      }
    }

    // Check for inactivity
    if (this.lastRepTime > 0 && now - this.lastRepTime > this.profile.maxRepInterval) {
      this.state.coachMessage = 'No movement detected — keep going or stop your session';
    }

    this.emit();
  }

  // ─── Rep Gate (multi-signal validation) ─────────────────────

  private validateRepGate(timeSinceLastRep: number): {
    valid: boolean;
    reason?: string;
    tip?: string;
  } {
    // Gate 1: Phone must be stationary
    if (!this.state.phoneStationary) {
      return {
        valid: false,
        reason: 'Place your phone down — can\'t count while holding it',
      };
    }

    // Gate 2: Timing validation
    if (timeSinceLastRep < this.profile.minRepInterval) {
      return { valid: false, reason: 'Too fast — control the movement' };
    }

    // Gate 3: If we have recent vision data, check person visibility
    const timeSinceVision = Date.now() - this.state.lastVisionCheck;
    if (timeSinceVision < 15000) {
      // Vision data is fresh
      if (!this.state.personVisible) {
        return {
          valid: false,
          reason: 'I can\'t see you — adjust camera position',
        };
      }
      if (!this.state.exerciseMatch && this.state.visionConfidence > 50) {
        return {
          valid: false,
          reason: `That doesn't look like ${this.exerciseName} — check your form`,
        };
      }
    }

    // Gate 4: Form quality — accept but warn if poor
    let tip: string | undefined;
    if (this.state.formScore < 40) {
      const randomTip = this.profile.formTips[
        Math.floor(Math.random() * this.profile.formTips.length)
      ];
      tip = `⚠️ Form check: ${randomTip}`;
    }

    return { valid: true, tip };
  }

  // ─── Emit state ─────────────────────────────────────────────

  private emit() {
    this.onStateChange?.({ ...this.state });
  }
}
