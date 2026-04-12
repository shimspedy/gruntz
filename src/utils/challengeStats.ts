import { getChallengeForDate } from '../data/dailyChallenges';
import type { DailyChallenge } from '../data/dailyChallenges';
import { getLocalDayDiffFromToday, parseLocalDateKey } from './dateKey';

const KM_TO_MILES = 0.621371;

export interface ChallengeHistorySummary {
  challengesCompleted: number;
  challengeStreakDays: number;
  lastChallengeDate: string;
  challengeXpEarned: number;
}

export function normalizeChallengeDates(completedDates: string[]) {
  return Array.from(new Set(completedDates))
    .filter((dateKey) => Boolean(parseLocalDateKey(dateKey)))
    .sort((a, b) => b.localeCompare(a));
}

export function summarizeChallengeHistory(completedDates: string[]): ChallengeHistorySummary {
  const normalizedDates = normalizeChallengeDates(completedDates);

  if (normalizedDates.length === 0) {
    return {
      challengesCompleted: 0,
      challengeStreakDays: 0,
      lastChallengeDate: '',
      challengeXpEarned: 0,
    };
  }

  const challengeXpEarned = normalizedDates.reduce((sum, dateKey) => {
    const parsed = parseLocalDateKey(dateKey);
    if (!parsed) {
      return sum;
    }

    return sum + getChallengeForDate(parsed).xpReward;
  }, 0);

  const latestDate = normalizedDates[0];
  let challengeStreakDays = 0;

  if (getLocalDayDiffFromToday(latestDate) <= 1) {
    challengeStreakDays = 1;

    for (let index = 1; index < normalizedDates.length; index += 1) {
      const previous = parseLocalDateKey(normalizedDates[index - 1]);
      const current = parseLocalDateKey(normalizedDates[index]);

      if (!previous || !current) {
        break;
      }

      const dayDiff = Math.round((previous.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));
      if (dayDiff !== 1) {
        break;
      }

      challengeStreakDays += 1;
    }
  }

  return {
    challengesCompleted: normalizedDates.length,
    challengeStreakDays,
    lastChallengeDate: latestDate,
    challengeXpEarned,
  };
}

export function getChallengeDistanceMiles(
  challenge: Pick<DailyChallenge, 'unit'>,
  amount: number
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  if (challenge.unit === 'miles') {
    return amount;
  }

  if (challenge.unit === 'km') {
    return amount * KM_TO_MILES;
  }

  return 0;
}

export function getChallengeDurationSeconds(
  challenge: Pick<DailyChallenge, 'unit'>,
  amount: number
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  if (challenge.unit === 'seconds') {
    return amount;
  }

  if (challenge.unit === 'minutes') {
    return amount * 60;
  }

  return 0;
}

export function getTrackedChallengeExerciseId(challengeId: string) {
  if (challengeId.startsWith('pushup_')) return 'pushups';
  if (challengeId.startsWith('pullup_')) return 'pullups';
  if (challengeId.startsWith('squat_')) return 'air_squats';
  if (challengeId.startsWith('burpee_')) return 'burpees';
  if (challengeId.startsWith('situp_')) return 'strict_situps';
  if (challengeId.startsWith('crunch_')) return 'usmc_crunches';
  if (challengeId.startsWith('mountain_climber_')) return 'mountain_climbers';
  if (challengeId.startsWith('plank_')) return 'forward_plank';

  return null;
}
