import type { ProgramId, UserProfile } from '../types';
import { getBaseCampReadiness } from '../data/baseCampWorkouts';

export interface ProgramRecommendation {
  programId: ProgramId;
  title: string;
  reason: string;
  coachNote: string;
  focusAreas: string[];
}

function hasGoal(profile: UserProfile, text: string) {
  return profile.goals?.some((goal) => goal.toLowerCase().includes(text.toLowerCase())) === true;
}

function hasLimitation(profile: UserProfile, key: string) {
  return profile.movement_limitations?.includes(key) === true;
}

function hasSafetyFlag(profile: UserProfile) {
  return (
    profile.fitness_level === 'beginner' ||
    profile.preferred_intensity === 'low' ||
    profile.workout_days_per_week <= 3 ||
    profile.age_range === '60_plus' ||
    hasLimitation(profile, 'low_impact') ||
    hasLimitation(profile, 'joint_concerns') ||
    hasLimitation(profile, 'returning_after_break')
  );
}

export function recommendProgramForProfile(profile: UserProfile): ProgramRecommendation {
  const wantsMilitaryPrep = hasGoal(profile, 'military');

  if (hasSafetyFlag(profile) || !wantsMilitaryPrep) {
    const readiness = getBaseCampReadiness(profile);

    return {
      programId: 'basecamp',
      title: `Base Camp ${readiness.charAt(0).toUpperCase() + readiness.slice(1)}`,
      reason: getBaseCampReason(profile),
      coachNote: 'Your missions will be generated locally from your answers, then progressed gradually as you complete them.',
      focusAreas: ['safe starting point', 'walking base', 'bodyweight strength', 'mobility'],
    };
  }

  if (
    profile.has_gym_access &&
    profile.has_ruck_access &&
    profile.workout_days_per_week >= 5 &&
    profile.fitness_level === 'advanced'
  ) {
    return {
      programId: 'recon',
      title: 'Recon Prep',
      reason: 'You selected military prep with high readiness, gym access, ruck access, and enough weekly training days.',
      coachNote: 'Recon is the most demanding path. Keep assessment inputs honest and back off if recovery drops.',
      focusAreas: ['barbell strength', 'running', 'rucking', 'functional carries'],
    };
  }

  if (
    profile.has_pool_access &&
    profile.has_ruck_access &&
    profile.workout_days_per_week >= 4 &&
    profile.fitness_level !== 'beginner'
  ) {
    return {
      programId: 'raider',
      title: 'Raider Prep',
      reason: 'You selected military prep and have the pool, ruck, and baseline training frequency Raider needs.',
      coachNote: 'Raider keeps the tactical edge while staying a step below Recon volume.',
      focusAreas: ['calisthenics', 'swimming', 'rucking', 'running'],
    };
  }

  return {
    programId: 'basecamp',
    title: 'Base Camp Standard',
    reason: 'Base Camp is the best bridge because your answers do not yet match every tactical program prerequisite.',
    coachNote: 'Build the base first. You can switch into Raider or Recon from your profile when ready.',
    focusAreas: ['readiness bridge', 'strength base', 'conditioning', 'mobility'],
  };
}

function getBaseCampReason(profile: UserProfile): string {
  if (profile.fitness_level === 'beginner') {
    return 'You marked yourself as a beginner, so the app will start with lower-impact missions and gradual progression.';
  }

  if (profile.age_range === '60_plus' || profile.age_range === '45_59') {
    return 'Your age range benefits from a steadier ramp with mobility and balance built into the plan.';
  }

  if (hasLimitation(profile, 'joint_concerns') || hasLimitation(profile, 'low_impact')) {
    return 'You asked for a joint-friendly start, so the plan avoids hard running and max-effort work.';
  }

  if (hasGoal(profile, 'fat')) {
    return 'Your fat-loss goal is best served by consistent walking, strength, and repeatable daily missions.';
  }

  if (profile.workout_days_per_week <= 3) {
    return 'Your schedule is limited, so the app will focus on high-value full-body sessions.';
  }

  return 'This path gives you a stronger base before you move into harder tactical programs.';
}
