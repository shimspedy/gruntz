import { getExerciseById, libraryExerciseId } from '../data/exercises';
import type { PlanDay, PlanExerciseSlot, WorkoutPlan } from '../data/workoutPlans';
import type { Exercise } from '../types';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The first exercise with a clip, as the plan or day's cover art. */
export function planDayHero(day: PlanDay): Exercise | undefined {
  const slot = day.exercises.find((e) => e.video_key);
  return slot?.video_key ? getExerciseById(libraryExerciseId(slot.video_key)) : undefined;
}

export function planHero(plan: WorkoutPlan): Exercise | undefined {
  for (const day of plan.days) {
    const hero = planDayHero(day);
    if (hero) return hero;
  }
  return undefined;
}

/** "4 days a week · 8 weeks · Intermediate" */
export function planMeta(plan: WorkoutPlan): string {
  const s = plan.summary;
  const parts: string[] = [];
  if (plan.kind === 'single_workout') parts.push('Single workout');
  else if (s.days_per_week) parts.push(`${s.days_per_week} ${s.days_per_week === 1 ? 'day' : 'days'} a week`);
  if (plan.kind === 'program' && s.duration_weeks) parts.push(`${s.duration_weeks} ${s.duration_weeks === 1 ? 'week' : 'weeks'}`);
  if (s.level) parts.push(cap(s.level));
  return parts.join(' · ');
}

export function planMinutes(plan: WorkoutPlan): number | null {
  if (plan.summary.session_minutes) return plan.summary.session_minutes;
  // No stated length: the median day, not day one — a plan that opens with a short
  // day would otherwise advertise a session length none of its other days match.
  const days = plan.days.map((d) => d.estimated_minutes).filter((m): m is number => !!m).sort((a, b) => a - b);
  return days.length ? days[Math.floor(days.length / 2)] : null;
}

export const EQUIPMENT_LABEL: Record<WorkoutPlan['match']['equipment_access'], string> = {
  none: 'No equipment',
  minimal: 'Minimal equipment',
  gym: 'Full gym',
};

/** "12:30" for 750 s, "3 min" for 180 s, "45s" under a minute. */
function duration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rest = sec % 60;
  return rest ? `${min}:${String(rest).padStart(2, '0')}` : `${min} min`;
}

/** "4 × 10", "3 × 10–12 each", "3 × 30s", "3 × AMRAP", "1 × 400 m", "100 total reps" */
export function slotPrescription(slot: PlanExerciseSlot): string {
  const sets = `${slot.sets} ×`;
  const each = slot.per_side ? ' each' : '';
  switch (slot.measure) {
    case 'time':
      return `${sets} ${duration(slot.duration_seconds ?? 0)}${each}`;
    case 'distance':
      // A handful of source rows give a distance exercise with no distance. Print the
      // set count rather than a dangling "3 ×  m".
      return slot.distance_meters ? `${sets} ${slot.distance_meters} m` : `${slot.sets} ${slot.sets === 1 ? 'set' : 'sets'}`;
    case 'amrap':
      return `${sets} AMRAP`;
    case 'failure':
      return `${sets} to failure`;
    default:
      // "100 total reps in as few sets as possible" — the count is the whole job.
      if (slot.total_reps && slot.reps) return `${slot.reps} total${each}`;
      if (slot.rep_scheme?.length) return `${slot.rep_scheme.join(', ')}${each}`;
      return `${sets} ${slot.reps ?? ''}${each}`;
  }
}

export function restLabel(seconds: number): string {
  if (seconds <= 0) return 'No rest';
  if (seconds < 120) return `${seconds}s rest`;
  return `${Math.round((seconds / 60) * 2) / 2} min rest`;
}
