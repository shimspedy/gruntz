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

export function calculateMissionXP(mission: CompletedMission): number {
  let xp = mission.exercises.reduce((sum, ex) => sum + ex.xp_earned, 0);
  xp += mission.completion_bonus;
  if (mission.is_perfect) {
    xp = Math.floor(xp * 1.5);
  }
  if (mission.has_personal_record) {
    xp += mission.pr_bonus;
  }
  return xp;
}

export function calculateStreakBonus(streakDays: number): number {
  if (STREAK_MILESTONES.includes(streakDays)) {
    return 10 * streakDays;
  }
  return 0;
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
