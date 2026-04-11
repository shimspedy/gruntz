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

export function isStreakAlive(lastWorkoutDate: string): boolean {
  return getLocalDayDiffFromToday(lastWorkoutDate) <= 1;
}

export function getDefaultProgress(userId: string): UserProgress {
  return {
    user_id: userId,
    current_level: 1,
    current_xp: 0,
    current_rank: 'Recruit',
    streak_days: 0,
    last_workout_date: '',
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
    exercises_completed: {},
    weekly_workouts: [],
    claimed_missions: new Set(),
  };
}
