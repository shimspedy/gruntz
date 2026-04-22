import { UserProgress, UserProfile, WorkoutRecommendation, MovementCard } from '../types';
import { movementCards } from '../data/movementCards';

// ============================================================
// LOCAL WORKOUT RECOMMENDATION ENGINE
// Analyzes user progress to recommend the best movement cards
// and workout focus areas based on performance data.
// ============================================================

interface StrengthProfile {
  upper_body: number;
  lower_body: number;
  core: number;
  endurance: number;
  swimming: number;
  rucking: number;
  overall: number;
}

function buildStrengthProfile(progress: UserProgress): StrengthProfile {
  const ec = progress.exercises_completed ?? {};

  const upperExercises = ['pushups', 'hand_release_pushups', 'pullups', 'chinups', 'ammo_can_push_press'];
  const lowerExercises = ['air_squats', 'walking_lunges', 'frog_squats', 'ammo_can_front_squats', 'broad_jumps'];
  const coreExercises = ['forward_plank', 'side_plank', 'flutter_kicks', 'usmc_crunches', 'mountain_climbers', 'knees_to_elbows'];
  const enduranceExercises = ['run_1_5mi', 'run_3mi', 'sprint_200m', 'sprint_400m', 'sprint_800m', 'pft_run'];
  const swimmingExercises = ['swim_25m', 'swim_50m', 'swim_100m', 'swim_200m', 'swim_300m', 'swim_500m', 'tread_water'];
  const ruckingExercises = ['ruck_1_2mi', 'ruck_4mi', 'ruck_5mi', 'ruck_6mi', 'ruck_7mi', 'ruck_8mi', 'ruck_9mi', 'ruck_10mi', 'ruck_12mi'];

  const score = (ids: string[]) => {
    const total = ids.reduce((sum, id) => sum + (ec[id] || 0), 0);
    return Math.min(100, Math.round((total / (ids.length * 10)) * 100));
  };

  const upper = score(upperExercises);
  const lower = score(lowerExercises);
  const core = score(coreExercises);
  const endurance = score(enduranceExercises);
  const swimming = score(swimmingExercises);
  const rucking = score(ruckingExercises);
  const overall = Math.round((upper + lower + core + endurance + swimming + rucking) / 6);

  return { upper_body: upper, lower_body: lower, core, endurance, swimming, rucking, overall };
}

function getWeakAreas(strength: StrengthProfile, userProfile?: UserProfile | null): string[] {
  const areas: { name: string; score: number }[] = [
    { name: 'upper_body', score: strength.upper_body },
    { name: 'lower_body', score: strength.lower_body },
    { name: 'core', score: strength.core },
    { name: 'endurance', score: strength.endurance },
  ];
  // Only flag swim/ruck as weak if the user has the equipment to train them.
  if (userProfile?.has_pool_access) {
    areas.push({ name: 'swimming', score: strength.swimming });
  }
  if (userProfile?.has_ruck_access) {
    areas.push({ name: 'rucking', score: strength.rucking });
  }
  areas.sort((a, b) => a.score - b.score);
  return areas.slice(0, 3).map(a => a.name);
}

function cardMatchesWeakness(card: MovementCard, weakAreas: string[]): number {
  let matchScore = 0;

  for (const area of weakAreas) {
    switch (area) {
      case 'core':
        if (card.category === 'core' || card.target_muscle_groups.includes('core')) matchScore += 3;
        break;
      case 'upper_body':
        if (card.target_muscle_groups.some(m => ['chest', 'back', 'shoulders', 'biceps'].includes(m))) matchScore += 3;
        break;
      case 'lower_body':
        if (card.target_muscle_groups.some(m => ['legs', 'glutes', 'quads'].includes(m))) matchScore += 3;
        break;
      case 'endurance':
        if (card.category === 'total_body') matchScore += 2;
        break;
      case 'swimming':
        if (card.category === 'swim') matchScore += 4;
        break;
      case 'rucking':
        if (card.category === 'ruck') matchScore += 4;
        break;
    }
  }
  return matchScore;
}

function getReasonForCard(card: MovementCard, weakAreas: string[], profile: StrengthProfile): string {
  const reasons: string[] = [];

  if (card.category === 'core' && weakAreas.includes('core')) {
    reasons.push(`Your core score is ${profile.core}%. This card targets core stability.`);
  }
  if (card.category === 'ruck' && weakAreas.includes('rucking')) {
    reasons.push(`Rucking performance at ${profile.rucking}%. Build ruck-specific strength.`);
  }
  if (card.category === 'swim' && weakAreas.includes('swimming')) {
    reasons.push(`Swimming at ${profile.swimming}%. Time to improve water confidence.`);
  }
  if (card.category === 'total_body') {
    reasons.push('Total body conditioning builds overall readiness.');
  }

  if (weakAreas.includes('upper_body') && card.target_muscle_groups.some(m => ['chest', 'back', 'shoulders'].includes(m))) {
    reasons.push(`Upper body at ${profile.upper_body}%. This card builds push/pull strength.`);
  }
  if (weakAreas.includes('lower_body') && card.target_muscle_groups.some(m => ['legs', 'glutes'].includes(m))) {
    reasons.push(`Lower body at ${profile.lower_body}%. Strengthen your foundation.`);
  }

  if (reasons.length === 0) {
    reasons.push('Well-rounded training to maintain your progress.');
  }

  return reasons[0];
}

export function generateRecommendations(
  progress: UserProgress,
  userProfile?: UserProfile | null,
): WorkoutRecommendation[] {
  const strength = buildStrengthProfile(progress);
  const weakAreas = getWeakAreas(strength, userProfile);

  const scored = movementCards.map(card => {
    const matchScore = cardMatchesWeakness(card, weakAreas);
    const difficultyBonus = progress.workouts_completed >= 20
      ? (card.difficulty === 'advanced' ? 2 : 0)
      : (card.difficulty === 'beginner' ? 2 : card.difficulty === 'intermediate' ? 1 : 0);

    const totalScore = matchScore + difficultyBonus;
    // First-run users (totalScore == 0) shouldn't see a 0.3 "confidence" floor — drop to 0.
    const confidence = totalScore === 0 ? 0 : Math.min(1, totalScore / 10 + 0.3);

    return {
      card,
      score: totalScore,
      confidence,
      reason: getReasonForCard(card, weakAreas, strength),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((item, index) => ({
    card_id: item.card.id,
    card_name: item.card.name,
    reason: item.reason,
    confidence: item.confidence,
    priority: index < 2 ? 'high' : index < 5 ? 'medium' : 'low',
    focus_areas: weakAreas,
  }));
}

export function getTopRecommendations(
  progress: UserProgress,
  count: number = 3,
  userProfile?: UserProfile | null,
): WorkoutRecommendation[] {
  return generateRecommendations(progress, userProfile).slice(0, count);
}

export function getStrengthProfile(progress: UserProgress): StrengthProfile {
  return buildStrengthProfile(progress);
}

export function getWeakAreaNames(progress: UserProgress, userProfile?: UserProfile | null): string[] {
  const strength = buildStrengthProfile(progress);
  return getWeakAreas(strength, userProfile).map(area => area.replace('_', ' '));
}
