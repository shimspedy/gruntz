import { Rank, CompletedMission, UserProgress } from '../types';
import { getLocalDayDiffFromToday } from './dateKey';

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.5));
}

const MAX_LEVEL = 999;

export function getLevelForXP(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && getXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export function getXPToNextLevel(currentXP: number): { current: number; required: number; progress: number } {
  const level = getLevelForXP(currentXP);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const required = nextLevelXP - currentLevelXP;
  const current = currentXP - currentLevelXP;
  return {
    current,
    required,
    progress: required > 0 ? current / required : 1,
  };
}

export function getRank(level: number): Rank {
  if (level >= 50) return 'Apex';
  if (level >= 40) return 'Shadow';
  if (level >= 30) return 'Elite';
  if (level >= 20) return 'Veteran';
  if (level >= 10) return 'Operator';
  if (level >= 5) return 'Cadet';
  return 'Recruit';
}

/**
 * The XP a finished workout is worth. One implementation: the summary screen and the
 * award path each had their own, and they disagreed — the summary left out the PR
 * bonus the award included, so the number you were shown was not the number you got.
 *
 * A perfect mission is already paid through the larger `completion_bonus`, so there is
 * no extra multiplier here.
 */
export function calculateMissionXP(mission: CompletedMission, streakBonus = 0): number {
  const pr = mission.has_personal_record ? mission.pr_bonus : 0;
  return mission.total_xp + mission.completion_bonus + pr + streakBonus;
}

/**
 * Milestone bonus for reaching `streakDays`, given what the streak was before.
 *
 * Milestones used to need exact equality, so a streak that jumped 6 → 8 (which the
 * grace-day rule makes routine) skipped the 7-day bonus and could never earn it again.
 * Every milestone crossed since the last workout pays out.
 */
export function calculateStreakBonus(streakDays: number, previousStreakDays = streakDays - 1): number {
  const from = Math.max(0, previousStreakDays);
  return STREAK_MILESTONES.filter((m) => m > from && m <= streakDays).reduce((sum, m) => sum + 10 * m, 0);
}

/**
 * How many days may pass before a streak breaks, based on how often the user plans to train.
 * A 3-day-a-week plan has two rest days between sessions, so a strict 1-day rule punished
 * people for following their own plan.
 */
export function streakGraceDays(daysPerWeek?: number | null): number {
  if (!daysPerWeek || daysPerWeek >= 6) return 1;
  return Math.min(4, Math.ceil(7 / daysPerWeek) + 1);
}

export function isStreakAlive(lastWorkoutDate: string, daysPerWeek?: number | null): boolean {
  // A date in the future (travel, clock change) must not keep a streak alive forever.
  const diff = getLocalDayDiffFromToday(lastWorkoutDate);
  return diff >= 0 && diff <= streakGraceDays(daysPerWeek);
}

export function getDefaultProgress(userId: string): UserProgress {
  return {
    user_id: userId,
    current_level: 1,
    current_xp: 0,
    current_rank: 'Recruit',
    streak_days: 0,
    last_workout_date: null,
    workouts_completed: 0,
    total_reps: 0,
    total_distance_miles: 0,
    best_run_times: {},
    best_ruck_times: {},
    best_swim_times: {},
    strength_score: 0,
    endurance_score: 0,
    stamina_score: 0,
    mobility_score: 0,
    consistency_score: 0,
    recovery_score: 0,
    challenges_completed: 0,
    challenge_streak_days: 0,
    challenge_xp_earned: 0,
    challenge_time_seconds_logged: 0,
    last_challenge_date: null,
    exercises_completed: {},
    weekly_workouts: [],
    claimed_missions: new Set(),
  };
}
