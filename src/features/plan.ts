import { getExerciseById } from '../data/exercises';
import { getProgramWorkoutForDate } from '../data/programWorkouts';
import type { Exercise, ProgramId, UserProfile, WorkoutDay } from '../types';
import { getLocalDateKey } from '../utils/dateKey';

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface PlanDay {
  date: Date;
  dateKey: string;
  weekday: string;
  isToday: boolean;
  isPast: boolean;
  workout: WorkoutDay | null;
  completed: boolean;
}

/** Monday-first calendar week containing `anchor`, each day resolved against the active program. */
export function getPlanWeek(
  program: ProgramId,
  week: number,
  profile: UserProfile | null,
  claimed: Set<string>,
  anchor = new Date(),
): PlanDay[] {
  const today = getLocalDateKey(anchor);
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = getLocalDateKey(date);
    const workout = getProgramWorkoutForDate(program, week, date, profile);
    return {
      date,
      dateKey,
      weekday: WEEKDAYS[date.getDay()],
      isToday: dateKey === today,
      isPast: dateKey < today,
      workout,
      completed: workout ? claimed.has(`${dateKey}:${workout.id}`) : false,
    };
  });
}

export function workoutExercises(day: WorkoutDay | null | undefined): Exercise[] {
  if (!day) return [];
  return day.sections.flatMap((s) => s.exercises.map((id) => getExerciseById(id)).filter((e): e is Exercise => !!e));
}

/** Renders shot standing up — they fill a portrait hero card; floor work crops badly. */
const UPRIGHT = new Set([
  'barbell-deadlift', 'barbell-squat', 'barbell-overhead-press', 'barbell-thruster', 'barbell-split-squat',
  'barbell-step-up-knee-drive', 'barbell-bent-over-row', 'pull-ups', 'chin-ups', 'kettlebell-swing',
  'kettlebell-push-press', 'kettlebell-romanian-deadlift', 'kettlebell-gorilla-row', 'dumbbell-goblet-squat',
  'dumbbell-goblet-reverse-lunge', 'dumbbell-thruster', 'dumbbell-single-arm-clean-and-press', 'dumbbell-rear-delt-fly',
  'forward-lunge', 'lunge-walking', 'bodyweight-squat', 'bodyweight-box-squat', 'jump-squats', 'box-jump',
  'hanging-knee-raises', 'bodyweight-alternating-lateral-lunge', 'single-legged-romanian-deadlifts', 'machine-face-pulls',
  'parralel-bar-dips',
]);

/** First upright render, then any render, then whatever comes first. */
export function pickHero(ordered: Exercise[]): Exercise | undefined {
  return ordered.find((e) => e.media_key && UPRIGHT.has(e.media_key)) ?? ordered.find((e) => e.media_key) ?? ordered[0];
}

/** The movement that best represents the day, preferring the main block over warm-ups. */
export function heroExercise(day: WorkoutDay | null | undefined): Exercise | undefined {
  if (!day) return undefined;
  const main = day.sections.filter((s) => s.type !== 'warmup' && s.type !== 'recovery');
  const all = (sections: typeof day.sections) =>
    sections.flatMap((s) => s.exercises.map((id) => getExerciseById(id)).filter((e): e is Exercise => !!e));
  return pickHero([...all(main), ...all(day.sections)]);
}

/** Short all-caps card title: "Lower Body Strength + Sprints" → "LOWER BODY STRENGTH". */
export function cardTitle(day: WorkoutDay): string {
  const base = day.title.split(/[+–—:|]/)[0].trim();
  return base.toUpperCase();
}

export function exerciseDetail(ex: Exercise): string {
  if (ex.reps) return `${ex.sets || 1} ${(ex.sets || 1) === 1 ? 'set' : 'sets'} x ${ex.reps} reps`;
  if (ex.duration_seconds) {
    const t = ex.duration_seconds >= 60 && ex.duration_seconds % 60 === 0 ? `${ex.duration_seconds / 60} min` : `${ex.duration_seconds}s`;
    return ex.sets && ex.sets > 1 ? `${ex.sets} sets x ${t}` : t;
  }
  if (ex.distance) return ex.distance;
  return `${ex.sets || 1} sets`;
}

const MUSCLE_LABELS: Record<string, string> = {
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  biceps: 'Biceps',
  core: 'Core',
  calves: 'Calves',
  legs: 'Legs',
  'full body': 'Full body',
  forearms: 'Forearms',
  lats: 'Lats',
  traps: 'Traps',
  obliques: 'Obliques',
  'hip flexors': 'Hip flexors',
};

export function muscleLabel(m: string) {
  return MUSCLE_LABELS[m.toLowerCase()] ?? m.charAt(0).toUpperCase() + m.slice(1);
}

/** Share of total muscle hits per group, top N, as whole percentages. */
export function muscleDistribution(day: WorkoutDay | null | undefined, top = 3): { muscle: string; pct: number }[] {
  const counts = new Map<string, number>();
  workoutExercises(day).forEach((ex) => {
    const sets = Math.max(1, ex.sets || 1);
    (ex.muscle_groups ?? []).forEach((m) => counts.set(m, (counts.get(m) ?? 0) + sets));
  });
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  if (!total) return [];
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([muscle, n]) => ({ muscle, pct: Math.round((n / total) * 100) }));
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function claimedDates(claimed: Set<string>): Set<string> {
  return new Set(Array.from(claimed).map((k) => k.split(':')[0]));
}

/** "1 exercise" / "2 exercises" — a hardcoded plural reads as broken UI. */
export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}
