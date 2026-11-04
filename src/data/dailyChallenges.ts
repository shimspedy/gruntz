/**
 * Daily Challenge system: 25 challenges rotating by day of year.
 *
 * Each entry is a TEMPLATE at its full ("advanced") target. `scaleChallenge`
 * renders the athlete's own target into the name and description, so a beginner
 * sees "50 Crunches" and an athlete who has been hitting targets sees the number
 * climb toward the full 200. Tokens: `{n}` the target in its unit, `{half}` half
 * of it, `{dur}` / `{durw}` a seconds target as "5-Minute" / "5 minutes", and
 * `{rounds}` a seconds target as 4-minute Tabata rounds.
 */

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'reps' | 'time' | 'distance';
  /** The target this athlete is asked to hit today. */
  target: number;
  unit: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  muscleGroups: string[];
  /** Rounding step for scaled targets. Defaults per unit; set when the wording needs a coarser step. */
  step?: number;
  /** The full, unscaled target. Equal to `target` for an athlete at full scale. */
  fullTarget: number;
  /** Extra XP for pushing past a scaled target all the way to `fullTarget`. 0 when there is nothing to push to. */
  bonusXp: number;
}

export type ChallengeTemplate = Omit<DailyChallenge, 'fullTarget' | 'bonusXp'>;

const challenges: ChallengeTemplate[] = [
  // Reps-based challenges
  {
    id: 'pushup_100',
    name: '{n} Push-Up Challenge',
    description: 'Complete {n} total pushups in any number of sets.',
    icon: 'pushup',
    type: 'reps',
    target: 100,
    unit: 'reps',
    xpReward: 150,
    difficulty: 'medium',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
  },
  {
    id: 'pullup_50',
    name: '{n} Pull-Up Challenge',
    description: 'Complete {n} total pull-ups.',
    icon: 'pullup',
    type: 'reps',
    target: 50,
    unit: 'reps',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['biceps', 'back', 'shoulders'],
  },
  {
    id: 'squat_200',
    name: '{n} Bodyweight Squats',
    description: 'Complete {n} bodyweight squats in any form.',
    icon: 'squat',
    type: 'reps',
    target: 200,
    unit: 'reps',
    xpReward: 150,
    difficulty: 'medium',
    muscleGroups: ['quads', 'hamstrings', 'glutes'],
  },
  {
    id: 'burpee_50',
    name: '{n} Burpee Blitz',
    description: '{n} full burpees. Your heart will thank you.',
    icon: 'burpee',
    type: 'reps',
    target: 50,
    unit: 'reps',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['chest', 'core', 'legs', 'arms'],
  },
  {
    id: 'situp_150',
    name: '{n} Sit-Up Grind',
    description: 'Complete {n} sit-ups to strengthen your core.',
    icon: 'situp',
    type: 'reps',
    target: 150,
    unit: 'reps',
    xpReward: 120,
    difficulty: 'medium',
    muscleGroups: ['core'],
  },
  {
    id: 'lunge_100',
    step: 10,
    name: '{n} Walking Lunges',
    description: '{n} lunges ({half} per leg) for leg strength.',
    icon: 'lunge',
    type: 'reps',
    target: 100,
    unit: 'reps',
    xpReward: 140,
    difficulty: 'medium',
    muscleGroups: ['quads', 'hamstrings', 'glutes'],
  },
  {
    id: 'dip_75',
    name: '{n} Dips Challenge',
    description: 'Complete {n} dips on parallel bars or bench.',
    icon: 'dip',
    type: 'reps',
    target: 75,
    unit: 'reps',
    xpReward: 180,
    difficulty: 'hard',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
  },
  {
    id: 'crunch_200',
    name: '{n} Crunches',
    description: 'Target those abs with {n} crunches.',
    icon: 'crunch',
    type: 'reps',
    target: 200,
    unit: 'reps',
    xpReward: 100,
    difficulty: 'easy',
    muscleGroups: ['core'],
  },
  {
    id: 'mountain_climber_500',
    name: '{n} Mountain Climbers',
    description: '{n} mountain climber reps. Full body cardio.',
    icon: 'climbing',
    type: 'reps',
    target: 500,
    unit: 'reps',
    xpReward: 160,
    difficulty: 'medium',
    muscleGroups: ['core', 'chest', 'cardio'],
  },
  {
    id: 'jump_squat_100',
    name: '{n} Jump Squats',
    description: '{n} explosive jump squats for power and conditioning.',
    icon: 'squat',
    type: 'reps',
    target: 100,
    unit: 'reps',
    xpReward: 140,
    difficulty: 'medium',
    muscleGroups: ['quads', 'hamstrings', 'glutes', 'cardio'],
  },

  // Time-based challenges
  {
    id: 'plank_5min',
    name: '{dur} Plank Hold',
    description: 'Hold a plank position for {durw} straight.',
    icon: 'plank',
    type: 'time',
    target: 300,
    unit: 'seconds',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['core', 'shoulders'],
  },
  {
    id: 'wall_sit_3min',
    name: '{dur} Wall Sit',
    description: 'Hold a wall sit for {durw}.',
    icon: 'wall_sit',
    type: 'time',
    target: 180,
    unit: 'seconds',
    xpReward: 150,
    difficulty: 'hard',
    muscleGroups: ['quads', 'glutes'],
  },
  {
    id: 'hollow_hold_2min',
    name: '{dur} Hollow Body Hold',
    description: 'Maintain a hollow body position for {durw}.',
    icon: 'hollow_hold',
    type: 'time',
    target: 120,
    unit: 'seconds',
    xpReward: 130,
    difficulty: 'medium',
    muscleGroups: ['core', 'shoulders'],
  },
  {
    id: 'amrap_20',
    name: '{dur} AMRAP',
    description: 'As many rounds as possible in {durw}. (Your choice of workout)',
    icon: 'timer',
    type: 'time',
    target: 1200,
    unit: 'seconds',
    xpReward: 250,
    difficulty: 'hard',
    muscleGroups: ['full_body'],
  },
  {
    id: 'tabata_16min',
    step: 240,
    name: '{dur} Tabata Session',
    description: '{rounds} of Tabata (20s hard, 10s rest) x 4 exercises.',
    icon: 'timer',
    type: 'time',
    target: 960,
    unit: 'seconds',
    xpReward: 180,
    difficulty: 'hard',
    muscleGroups: ['full_body'],
  },
  {
    id: 'emom_10',
    name: '{dur} EMOM',
    description: 'Every minute on the minute for {durw} - pick your exercise.',
    icon: 'timer',
    type: 'time',
    target: 600,
    unit: 'seconds',
    xpReward: 140,
    difficulty: 'medium',
    muscleGroups: ['full_body'],
  },

  // Distance-based challenges
  {
    id: 'run_5k',
    name: '{n}K Run Challenge',
    description: 'Run {n} kilometers as fast as you can.',
    icon: 'running',
    type: 'distance',
    target: 5,
    unit: 'km',
    xpReward: 220,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'run_10k',
    name: '{n}K Endurance Run',
    description: 'Complete a {n}-kilometer run.',
    icon: 'running',
    type: 'distance',
    target: 10,
    unit: 'km',
    xpReward: 300,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'ruck_3mi',
    name: '{n}-Mile Ruck',
    description: 'Ruck {n} miles with weight. Build mental toughness.',
    icon: 'ruck',
    type: 'distance',
    target: 3,
    unit: 'miles',
    xpReward: 250,
    difficulty: 'hard',
    muscleGroups: ['legs', 'core', 'cardio'],
  },
  {
    id: 'sprint_1mi',
    name: '{n}-Mile Sprint',
    description: 'Go all-out for a {n}-mile sprint.',
    icon: 'running',
    type: 'distance',
    target: 1,
    unit: 'miles',
    xpReward: 200,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'run_2mi',
    name: '{n}-Mile Run',
    description: 'Run {n} miles - solid training distance.',
    icon: 'running',
    type: 'distance',
    target: 2,
    unit: 'miles',
    xpReward: 160,
    difficulty: 'medium',
    muscleGroups: ['cardio', 'legs'],
  },
  {
    id: 'swim_1mi',
    name: '{n}-Mile Swim',
    description: 'Complete a {n}-mile swim - full body conditioning.',
    icon: 'swimming',
    type: 'distance',
    target: 1,
    unit: 'miles',
    xpReward: 280,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'full_body'],
  },
  {
    id: 'swim_40min',
    name: '{n}-Minute Swim',
    description: 'Continuous swimming for {n} minutes.',
    icon: 'swimming',
    type: 'distance',
    target: 40,
    unit: 'minutes',
    xpReward: 240,
    difficulty: 'hard',
    muscleGroups: ['cardio', 'full_body'],
  },

  // Specialty challenges
  {
    id: 'handstand_3min',
    name: '{dur} Handstand Challenge',
    description: 'Total accumulated handstand time of {durw}.',
    icon: 'handstand',
    type: 'time',
    target: 180,
    unit: 'seconds',
    xpReward: 220,
    difficulty: 'hard',
    muscleGroups: ['shoulders', 'core', 'arms'],
  },
  {
    id: 'l_sit_1min',
    name: '{dur} L-Sit Challenge',
    description: 'Hold an L-sit position for {durw} total.',
    icon: 'lsit',
    type: 'time',
    target: 60,
    unit: 'seconds',
    xpReward: 180,
    difficulty: 'hard',
    muscleGroups: ['core', 'arms', 'shoulders'],
  },
];

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type ChallengeMode = 'reps' | 'time' | 'distance';

export function challengeMode(c: Pick<DailyChallenge, 'type' | 'unit'>): ChallengeMode {
  if (c.unit === 'seconds' || c.unit === 'minutes' || c.type === 'time') return 'time';
  if (c.unit === 'km' || c.unit === 'miles' || c.type === 'distance') return 'distance';
  return 'reps';
}

/** Where a fresh athlete starts, as a fraction of the full target. */
export const CHALLENGE_START_SCALE: Record<FitnessLevel, number> = { beginner: 0.25, intermediate: 0.5, advanced: 1 };
/** How much the scale climbs on each completed challenge of that mode, and extra for reaching the full target. */
export const CHALLENGE_SCALE_STEP = 0.05;
export const CHALLENGE_BONUS_SCALE_STEP = 0.1;
export const MIN_CHALLENGE_SCALE = 0.2;

const roundToStep = (value: number, step: number) => Math.max(step, Math.round(value / step) * step);

function defaultStep(c: Pick<ChallengeTemplate, 'unit' | 'target'>): number {
  switch (c.unit) {
    case 'seconds':
      return c.target >= 600 ? 60 : 15;
    case 'minutes':
      return 5;
    case 'km':
      return 0.5;
    case 'miles':
      return 0.25;
    default:
      return c.target >= 200 ? 10 : 5;
  }
}

/** The athlete's target for a challenge at a given scale (0..1), rounded to a step the wording can show. */
export function scaledTarget(c: Pick<ChallengeTemplate, 'unit' | 'target' | 'step'>, scale: number): number {
  const clamped = Math.min(1, Math.max(MIN_CHALLENGE_SCALE, Number.isFinite(scale) ? scale : 1));
  if (clamped >= 1) return c.target;
  const step = c.step ?? defaultStep(c);
  const value = Math.min(c.target, roundToStep(c.target * clamped, step));
  return Math.round(value * 100) / 100;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function durationTitle(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60}-Minute` : `${seconds}-Second`;
}

function durationWords(seconds: number): string {
  if (seconds % 60 === 0) return plural(seconds / 60, 'minute');
  if (seconds < 120) return plural(seconds, 'second');
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function renderTemplate(text: string, target: number): string {
  const n = formatChallengeAmount(target, { type: 'reps', unit: 'reps' });
  return text
    .replace(/\{n\}/g, n)
    .replace(/\{half\}/g, formatChallengeAmount(target / 2, { type: 'reps', unit: 'reps' }))
    .replace(/\{dur\}/g, durationTitle(target))
    .replace(/\{durw\}/g, durationWords(target))
    .replace(/\{rounds\}/g, plural(Math.max(1, Math.round(target / 240)), 'round'));
}

/**
 * Render a template at the athlete's scale. XP is flat for hitting the personal
 * target; pushing on to the full target earns `bonusXp` on top.
 */
export function scaleChallenge(template: ChallengeTemplate, scale: number): DailyChallenge {
  const target = scaledTarget(template, scale);
  const scaled = target < template.target;
  return {
    ...template,
    name: renderTemplate(template.name, target),
    description: renderTemplate(template.description, target),
    target,
    fullTarget: template.target,
    bonusXp: scaled ? Math.max(10, Math.round((template.xpReward * 0.5) / 10) * 10) : 0,
  };
}

/**
 * Get today's daily challenge based on the current date
 */
export function getTodaysChallenge(scale = 1): DailyChallenge {
  const now = new Date();
  return getChallengeForDate(now, scale);
}

/**
 * Get the daily challenge for a specific date
 * Uses day-of-year modulo to rotate through challenges
 */
export function getChallengeForDate(date: Date, scale = 1): DailyChallenge {
  return scaleChallenge(getChallengeTemplateForDate(date), scale);
}

export function getChallengeTemplateForDate(date: Date): ChallengeTemplate {
  // Day of year from calendar fields in UTC. Measuring elapsed milliseconds from
  // local midnight on Jan 0 drifts by an hour across a DST boundary, which was
  // enough for Math.floor to land on the previous day — repeating one challenge
  // and skipping the next.
  const oneDay = 1000 * 60 * 60 * 24;
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.round((today - start) / oneDay);

  const index = ((dayOfYear % challenges.length) + challenges.length) % challenges.length;
  return challenges[index];
}

export function formatChallengeAmount(
  value: number,
  challenge: Pick<DailyChallenge, 'type' | 'unit'>
): string {
  if (challenge.unit === 'seconds') {
    const totalSeconds = Math.max(0, Math.round(value));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0 && seconds > 0) {
      return `${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
      return `${minutes}m`;
    }

    return `${totalSeconds}s`;
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, '');
}
