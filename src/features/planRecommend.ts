import { UserProfile } from '../types';
import { allPlans, PlanEquipmentAccess, PlanLevel, WorkoutPlan } from '../data/workoutPlans';

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

function scorePlan(plan: WorkoutPlan, profile: UserProfile, relaxed = false): PlanRecommendation | null {
  const m = plan.match;
  const reasons: string[] = [];
  let score = 0;

  // Hard filters: equipment the user can't access, or a level jump of two steps.
  const access = userEquipment(profile);
  if (access === 'none' && m.equipment_access !== 'none') return null;
  if (access === 'minimal' && m.equipment_access === 'gym') return null;
  const levelGap = LEVEL_RANK[m.fitness_level] - LEVEL_RANK[profile.fitness_level];
  const cautious = (profile.movement_limitations ?? []).length > 0;
  if (!relaxed && levelGap >= 2) return null;
  if (!relaxed && cautious && m.fitness_level === 'advanced') return null;

  const goals = Array.from(new Set(m.goals));
  const direct = goals.filter((g) => profile.goals.includes(g));
  const related = goals.filter((g) => !direct.includes(g) && profile.goals.some((u) => RELATED_GOALS[u]?.includes(g)));
  score += direct.length * 3 + related.length * 1.5;
  if (direct.length) reasons.push(`Built for ${direct.join(' & ').toLowerCase()}`);
  else if (related.length) reasons.push(`Supports ${related.join(' & ').toLowerCase()}`);

  if (levelGap === 0) { score += 3; reasons.push(`${m.fitness_level[0].toUpperCase()}${m.fitness_level.slice(1)} level`); }
  else if (levelGap === -1) score += 1;
  else if (levelGap === 1) score -= 1;

  if (m.days_per_week != null) {
    const gap = Math.abs(m.days_per_week - profile.workout_days_per_week);
    if (gap === 0) { score += 3; reasons.push(`${m.days_per_week} days a week`); }
    else if (gap === 1) score += 1.5;
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
