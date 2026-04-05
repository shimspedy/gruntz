/**
 * Vision Coach — Periodic camera frame analysis via GPT-4o Vision
 *
 * Captures frames from the camera at intervals and sends them to GPT-4o
 * to validate: person presence, exercise correctness, form quality,
 * and generate real-time coaching tips.
 *
 * Uses the exercise database form_tips and descriptions for context.
 * Falls back to basic heuristics when AI is unavailable.
 *
 * Cost: ~$0.003 per frame at low-res → ~$0.02-0.04 per 5-min workout
 */
import OpenAI from 'openai';
import { exercises } from '../data/exercises';
import type { Exercise } from '../types';

// ─── Configuration ──────────────────────────────────────────────

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const VISION_MODEL = 'gpt-4o';
const ANALYSIS_INTERVAL_MS = 4000; // Analyze every 4 seconds
const MIN_ANALYSIS_INTERVAL_MS = 2500; // Don't analyze more often than this

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

// ─── Types ──────────────────────────────────────────────────────

export interface VisionResult {
  personVisible: boolean;
  exerciseMatch: boolean;
  lightingOk: boolean;
  confidence: number;        // 0-100
  formScore: number;         // 0-100
  exerciseDetected: string;  // What exercise does the AI think is happening
  phase: 'up' | 'down' | 'neutral' | 'standing' | 'unknown';
  formErrors: string[];      // Specific form issues detected
  coachTip: string;          // Real-time coaching message
}

interface VisionAnalysisRaw {
  person_visible: boolean;
  lighting_ok: boolean;
  exercise_detected: string;
  matches_expected: boolean;
  confidence: number;
  form_score: number;
  phase: string;
  form_errors: string[];
  coach_tip: string;
}

// ─── Exercise Context Builder ───────────────────────────────────

function getExerciseContext(exerciseName: string): { exercise: Exercise | null; context: string } {
  const lower = exerciseName.toLowerCase();

  // Find exercise in database
  const exercise = exercises.find(
    (e) => e.name.toLowerCase() === lower ||
           e.name.toLowerCase().includes(lower.replace(/s$/, '')) ||
           lower.includes(e.name.toLowerCase().replace(/s$/, ''))
  ) || null;

  if (exercise) {
    return {
      exercise,
      context: [
        `Exercise: ${exercise.name}`,
        `Category: ${exercise.category}`,
        `Description: ${exercise.description}`,
        `Form Tips: ${exercise.form_tips.join('; ')}`,
        exercise.sets ? `Target sets: ${exercise.sets}` : '',
        exercise.reps ? `Target reps: ${exercise.reps}` : '',
      ].filter(Boolean).join('\n'),
    };
  }

  return {
    exercise: null,
    context: `Exercise: ${exerciseName} (no detailed data available)`,
  };
}

// ─── Vision System Prompt ───────────────────────────────────────

function buildSystemPrompt(exerciseName: string, exerciseContext: string): string {
  return `You are a real-time military fitness form analyst embedded in a rep counter app.
Your job is to analyze a single camera frame and provide instant assessment.

EXPECTED EXERCISE: ${exerciseName}

EXERCISE DETAILS:
${exerciseContext}

Analyze the camera frame and return ONLY valid JSON (no markdown, no explanation):
{
  "person_visible": boolean,     // Is a person clearly visible in the frame?
  "lighting_ok": boolean,        // Is the lighting sufficient to see the person?
  "exercise_detected": string,   // What exercise does it look like they're doing? e.g. "push-up", "squat", "standing", "sitting", "unknown"
  "matches_expected": boolean,   // Does the detected exercise match "${exerciseName}"?
  "confidence": number,          // 0-100, how confident are you in this assessment?
  "form_score": number,          // 0-100, form quality (100=perfect, 0=terrible). 50 if unsure.
  "phase": string,               // "up", "down", "neutral", "standing", or "unknown"
  "form_errors": string[],       // Specific form issues you can see (max 3, be brief)
  "coach_tip": string            // One short coaching tip (max 15 words). Military style, direct.
}

RULES:
- If no person is visible, set person_visible=false and confidence=0.
- If lighting is too dark/bright, set lighting_ok=false.
- Be specific about form errors based on what you actually see.
- Use the exercise's form tips as your reference for what good form looks like.
- Do NOT count reps — just assess the current frame.
- coach_tip should be actionable and brief, like a drill sergeant's cue.
- If the person is clearly doing a different exercise, say what it looks like.`;
}

// ─── Vision Coach Class ─────────────────────────────────────────

export class VisionCoach {
  private exerciseName: string;
  private exerciseContext: string;
  private exercise: Exercise | null;
  private systemPrompt: string;
  private lastAnalysisTime = 0;
  private isAnalyzing = false;
  private analysisCount = 0;
  private consecutiveFailures = 0;
  private lastResults: VisionResult[] = [];
  private _isActive = false;

  constructor(exerciseName: string) {
    this.exerciseName = exerciseName;
    const { exercise, context } = getExerciseContext(exerciseName);
    this.exercise = exercise;
    this.exerciseContext = context;
    this.systemPrompt = buildSystemPrompt(exerciseName, context);
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isAvailable(): boolean {
    return !!openai;
  }

  start() {
    this._isActive = true;
    this.analysisCount = 0;
    this.consecutiveFailures = 0;
    this.lastResults = [];
  }

  stop() {
    this._isActive = false;
  }

  /** Check if it's time for a new analysis */
  shouldAnalyze(): boolean {
    if (!this._isActive || this.isAnalyzing) return false;
    const now = Date.now();
    const interval = this.consecutiveFailures > 2
      ? ANALYSIS_INTERVAL_MS * 2  // Back off on repeated failures
      : ANALYSIS_INTERVAL_MS;
    return now - this.lastAnalysisTime >= interval;
  }

  /**
   * Analyze a camera frame
   * @param imageBase64 Base64-encoded JPEG image
   */
  async analyzeFrame(imageBase64: string): Promise<VisionResult> {
    if (!openai || !imageBase64) {
      return this.localAnalysis();
    }

    const now = Date.now();
    if (now - this.lastAnalysisTime < MIN_ANALYSIS_INTERVAL_MS) {
      // Too soon — return last result or default
      return this.lastResults.length > 0
        ? this.lastResults[this.lastResults.length - 1]
        : this.localAnalysis();
    }

    this.isAnalyzing = true;
    this.lastAnalysisTime = now;

    try {
      const response = await openai.chat.completions.create({
        model: VISION_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: this.systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text' as const,
                text: `Frame #${this.analysisCount + 1} — analyze this frame for ${this.exerciseName} form:`,
              },
              {
                type: 'image_url' as const,
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'low', // Low detail = cheaper, faster
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const raw = JSON.parse(
        response.choices[0].message.content || '{}'
      ) as VisionAnalysisRaw;

      const result: VisionResult = {
        personVisible: raw.person_visible ?? false,
        exerciseMatch: raw.matches_expected ?? false,
        lightingOk: raw.lighting_ok ?? true,
        confidence: Math.min(100, Math.max(0, raw.confidence ?? 0)),
        formScore: Math.min(100, Math.max(0, raw.form_score ?? 50)),
        exerciseDetected: raw.exercise_detected || 'unknown',
        phase: (['up', 'down', 'neutral', 'standing', 'unknown'].includes(raw.phase)
          ? raw.phase
          : 'unknown') as VisionResult['phase'],
        formErrors: (raw.form_errors || []).slice(0, 3),
        coachTip: raw.coach_tip || '',
      };

      this.analysisCount++;
      this.consecutiveFailures = 0;
      this.lastResults.push(result);
      if (this.lastResults.length > 10) {
        this.lastResults = this.lastResults.slice(-10);
      }

      this.isAnalyzing = false;
      return result;
    } catch (error) {
      console.warn('[VisionCoach] Analysis error:', error);
      this.consecutiveFailures++;
      this.isAnalyzing = false;
      return this.localAnalysis();
    }
  }

  /** Fallback analysis when AI is not available */
  private localAnalysis(): VisionResult {
    // Without AI, assume person is visible and exercise matches
    // The engine's sensor validation will still gate reps
    const tips = this.exercise?.form_tips || [];
    const randomTip = tips.length > 0
      ? tips[Math.floor(Math.random() * tips.length)]
      : 'Focus on controlled movement';

    return {
      personVisible: true,  // Assume visible — sensors will validate
      exerciseMatch: true,   // Assume correct — sensors will validate
      lightingOk: true,
      confidence: 20,        // Low confidence signals sensor-only mode
      formScore: 50,         // Neutral
      exerciseDetected: this.exerciseName.toLowerCase(),
      phase: 'unknown',
      formErrors: [],
      coachTip: randomTip,
    };
  }

  /** Get aggregated confidence from recent results */
  getAggregateConfidence(): number {
    if (this.lastResults.length === 0) return 0;
    const recent = this.lastResults.slice(-3);
    return Math.round(
      recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length
    );
  }

  /** Get trend: is form improving, declining, or stable? */
  getFormTrend(): 'improving' | 'declining' | 'stable' | 'unknown' {
    if (this.lastResults.length < 3) return 'unknown';
    const recent = this.lastResults.slice(-5);
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const avgFirst = firstHalf.reduce((s, r) => s + r.formScore, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, r) => s + r.formScore, 0) / secondHalf.length;

    if (avgSecond - avgFirst > 10) return 'improving';
    if (avgFirst - avgSecond > 10) return 'declining';
    return 'stable';
  }
}
