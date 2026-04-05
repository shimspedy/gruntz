import { UserProgress } from '../types';

export function shouldRecommendRecovery(
  recentWorkoutCount: number,
  avgIntensity: number,
  sorenessRating: number
): boolean {
  return (recentWorkoutCount >= 3 && avgIntensity > 0.8) || sorenessRating >= 4;
}

export function getVolumeAdjustment(consecutiveMissedDays: number): number {
  if (consecutiveMissedDays <= 1) return 1.0;
  if (consecutiveMissedDays === 2) return 0.85;
  if (consecutiveMissedDays <= 6) return 0.75;
  return 0.6; // 7+ days missed
}

export function calculateCategoryScore(
  actual: number,
  target: number
): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((actual / target) * 100));
}

export function generateCoachMessage(progress: UserProgress): string {
  const messages: string[] = [];

  if (progress.streak_days >= 7) {
    messages.push(`You're on a ${progress.streak_days}-day streak! Unstoppable.`);
  } else if (progress.streak_days >= 3) {
    messages.push(`${progress.streak_days}-day streak and growing. Keep showing up.`);
  }

  if (progress.workouts_completed === 0) {
    return "Ready for your first mission? Let's go.";
  }

  if (progress.strength_score > progress.endurance_score + 20) {
    messages.push('Your endurance is lagging behind strength. Add cardio focus.');
  } else if (progress.endurance_score > progress.strength_score + 20) {
    messages.push('Strength needs work. Push the calisthenics harder.');
  }

  if (progress.consistency_score >= 80) {
    messages.push("Consistency is your superpower. You're built different.");
  } else if (progress.consistency_score < 40) {
    messages.push('Consistency is key. Try to hit at least 4 sessions this week.');
  }

  return messages.length > 0
    ? messages[Math.floor(Math.random() * messages.length)]
    : 'Stay the course. Every rep counts.';
}
