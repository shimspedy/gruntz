import { UserProfile } from '../types';
import { allPlans, PlanEquipmentAccess, PlanLevel, planExercises, WorkoutPlan } from '../data/workoutPlans';

export interface PlanRecommendation {
  plan: WorkoutPlan;
  score: number;
  reasons: string[];
}

const LEVEL_RANK: Record<PlanLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Onboarding goal -> plan goals that also serve it (plans carry 'Build Muscle', which onboarding doesn't offer). */
const RELATED_GOALS: Record<string, string[]> = {
  'Get Stronger': ['Build Muscle'],
  'Build Muscle': ['Get Stronger'],
  'Lose Fat': ['Improve Endurance'],
  'Start Moving': ['Lose Fat'],
  'Build Discipline': ['Start Moving', 'Get Stronger'],
  'Military Prep': ['Improve Endurance', 'Get Stronger'],
};

function userEquipment(profile: UserProfile): PlanEquipmentAccess {
  if (profile.has_gym_access || profile.available_equipment.includes('gym')) return 'gym';
  // A pool or ruck doesn't help with strength plans; dumbbells or bands at home do.
  return profile.available_equipment.includes('home') ? 'minimal' : 'none';
}

/**
 * What a plan actually demands, read from the equipment tags on its own exercises.
 *
 * Neither plan-level label could be trusted. `match.equipment_access` is the worst
 * matched video clip, so one gym substitute tagged a bodyweight plan `gym` and hid it
 * from no-gym athletes. `summary.equipment` went the other way: "4-Day Dumbbell Fat
 * Loss Plan" and "20-Minute Treadmill Shred" claimed Bodyweight while prescribing
 * dumbbells, machines and a treadmill. That is the "said dumbbells only, got a
 * workout full of machines" review this app must never earn.
 *
 * A bench counts as no gear (a chair or step stands in) and a weight plate as home
 * gear (a dumbbell stands in). Anything else beyond dumbbells, bands, kettlebells
 * and a stability ball needs a gym.
 */
const NO_GEAR = new Set(['Bodyweight', 'Bench']);
const HOME_GEAR = new Set([...NO_GEAR, 'Dumbbell', 'Band', 'Kettlebell', 'Stability Ball', 'Weight Plate']);
const ACCESS_CACHE = new Map<string, PlanEquipmentAccess>();

export function effectiveEquipmentAccess(plan: WorkoutPlan): PlanEquipmentAccess {
  const cached = ACCESS_CACHE.get(plan.id);
  if (cached) return cached;
  const library = planExercises();
  let access: PlanEquipmentAccess = 'none';
  let known = false;
  for (const day of plan.days) {
    for (const slot of day.exercises) {
      const gear = library[slot.exercise_id]?.equipment;
      if (!gear) continue;
      known = true;
      for (const item of gear) {
        if (NO_GEAR.has(item)) continue;
        if (HOME_GEAR.has(item)) access = 'minimal';
        else { access = 'gym'; break; }
      }
      if (access === 'gym') break;
    }
    if (access === 'gym') break;
  }
  // No tagged exercises at all: fall back to the conservative clip-derived label.
  const result = known ? access : plan.match.equipment_access;
  ACCESS_CACHE.set(plan.id, result);
  return result;
}

function scorePlan(plan: WorkoutPlan, profile: UserProfile, relaxed = false): PlanRecommendation | null {
  const m = plan.match;
  const reasons: string[] = [];
  let score = 0;

  // Hard filters: equipment the user can't access, or a level jump of two steps.
  const access = userEquipment(profile);
  const planAccess = effectiveEquipmentAccess(plan);
  if (access === 'none' && planAccess !== 'none') return null;
  if (access === 'minimal' && planAccess === 'gym') return null;
  const levelGap = LEVEL_RANK[m.fitness_level] - LEVEL_RANK[profile.fitness_level];
  const cautious = (profile.movement_limitations ?? []).length > 0;
  if (!relaxed && levelGap >= 2) return null;
  if (!relaxed && cautious && m.fitness_level === 'advanced') return null;

  const goals = Array.from(new Set(m.goals));
  const direct = goals.filter((g) => profile.goals.includes(g));
  const related = goals.filter((g) => !direct.includes(g) && profile.goals.some((u) => RELATED_GOALS[u]?.includes(g)));
  score += direct.length * 3 + related.length * 1.5;
  // Goals are verb phrases ("Get Stronger"), so "Built for get stronger" read as a typo.
  if (direct.length) reasons.push(`Goal: ${direct.join(' & ')}`);
  else if (related.length) reasons.push(`Supports your goal: ${related.join(' & ')}`);

  if (levelGap === 0) { score += 3; reasons.push(`${m.fitness_level[0].toUpperCase()}${m.fitness_level.slice(1)} level`); }
  else if (levelGap === -1) score += 1;
  else if (levelGap === 1) score -= 1;

  if (m.days_per_week != null) {
    const gap = Math.abs(m.days_per_week - profile.workout_days_per_week);
    if (gap === 0) { score += 3; reasons.push(`${m.days_per_week} days a week`); }
    else if (gap === 1) score += 1.5;
    // Someone with 3 days a week shouldn't be handed a 6-day split.
    else score -= gap;
  }

  const minutes = profile.preferred_session_minutes;
  if (minutes && m.session_minutes != null) {
    const gap = Math.abs(m.session_minutes - minutes);
    if (gap <= 10) { score += 2; reasons.push(`~${m.session_minutes} min sessions`); }
    else if (gap <= 20) score += 1;
    else if (m.session_minutes > minutes) score -= 1;
  }

  score += plan.stats.video_coverage * 2;
  return { plan, score: Math.round(score * 100) / 100, reasons };
}

const rank = (plans: WorkoutPlan[], profile: UserProfile, relaxed: boolean) =>
  plans
    .map((p) => scorePlan(p, profile, relaxed))
    .filter((r): r is PlanRecommendation => r !== null && (relaxed || r.score > 0))
    .sort((a, b) => b.score - a.score);

/**
 * Programs ranked for the onboarding profile, best first. When too few plans pass the
 * level filters (e.g. advanced with no equipment), the list is topped up with the closest
 * plans the user can still do with their equipment.
 */
export function recommendPlans(profile: UserProfile, limit = 10): PlanRecommendation[] {
  const programs = allPlans().filter((p) => p.kind === 'program');
  const strict = rank(programs, profile, false).slice(0, limit);
  if (strict.length >= limit) return strict;
  const taken = new Set(strict.map((r) => r.plan.id));
  return [...strict, ...rank(programs, profile, true).filter((r) => !taken.has(r.plan.id))].slice(0, limit);
}
