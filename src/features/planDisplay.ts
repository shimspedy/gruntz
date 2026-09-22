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
  return plan.summary.session_minutes ?? (plan.days[0]?.estimated_minutes || null);
}

export const EQUIPMENT_LABEL: Record<WorkoutPlan['match']['equipment_access'], string> = {
  none: 'No equipment',
  minimal: 'Minimal equipment',
  gym: 'Full gym',
};

/** "4 × 10", "3 × 10–12 each", "3 × 30s", "3 × AMRAP", "1 × 400 m" */
export function slotPrescription(slot: PlanExerciseSlot): string {
  const sets = `${slot.sets} ×`;
  const each = slot.per_side ? ' each' : '';
  switch (slot.measure) {
    case 'time': {
      const sec = slot.duration_seconds ?? 0;
      return `${sets} ${sec >= 120 ? `${Math.round(sec / 60)} min` : `${sec}s`}${each}`;
    }
    case 'distance':
      return `${sets} ${slot.distance_meters ?? ''} m`;
    case 'amrap':
      return `${sets} AMRAP`;
    case 'failure':
      return `${sets} to failure`;
    default:
      if (slot.rep_scheme?.length) return `${slot.rep_scheme.join(', ')}${each}`;
      return `${sets} ${slot.reps ?? ''}${each}`;
  }
}

export function restLabel(seconds: number): string {
  if (seconds <= 0) return 'No rest';
  if (seconds < 120) return `${seconds}s rest`;
  return `${Math.round((seconds / 60) * 2) / 2} min rest`;
}
