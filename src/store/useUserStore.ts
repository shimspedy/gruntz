import { create } from 'zustand';
import { UserProgress, UserProfile, Rank, CompletedMission, UserAchievement } from '../types';
import { getLevelForXP, getRank, getXPToNextLevel, calculateStreakBonus, isStreakAlive, getDefaultProgress } from '../utils/xp';
import { achievements } from '../data/achievements';

interface UserState {
  profile: UserProfile | null;
  progress: UserProgress;
  achievements: UserAchievement[];
  isLoading: boolean;
  isOnboarded: boolean;

  setProfile: (profile: UserProfile) => void;
  setOnboarded: (onboarded: boolean) => void;
  addXP: (amount: number) => void;
  completeMission: (mission: CompletedMission) => void;
  updateStreak: () => void;
  checkAchievements: () => string[];
  reset: () => void;
}

const initialProgress = getDefaultProgress('local');

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  progress: initialProgress,
  achievements: [],
  isLoading: false,
  isOnboarded: false,

  setProfile: (profile) => set({ profile }),

  setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

  addXP: (amount) => {
    set((state) => {
      const newXP = state.progress.current_xp + amount;
      const newLevel = getLevelForXP(newXP);
      const newRank = getRank(newLevel);
      return {
        progress: {
          ...state.progress,
          current_xp: newXP,
          current_level: newLevel,
          current_rank: newRank,
        },
      };
    });
  },

  completeMission: (mission) => {
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const wasStreakAlive = state.progress.last_workout_date
        ? isStreakAlive(state.progress.last_workout_date)
        : false;
      const newStreak = wasStreakAlive ? state.progress.streak_days + 1 : 1;
      const streakBonus = calculateStreakBonus(newStreak);

      const totalXP = mission.total_xp + mission.completion_bonus + mission.pr_bonus + streakBonus;
      const newXP = state.progress.current_xp + totalXP;
      const newLevel = getLevelForXP(newXP);
      const newRank = getRank(newLevel);

      const newExercisesCompleted = { ...state.progress.exercises_completed };
      let totalNewReps = 0;
      mission.exercises.forEach((ex) => {
        const reps = ex.completed_reps || 0;
        newExercisesCompleted[ex.exercise_id] = (newExercisesCompleted[ex.exercise_id] || 0) + reps;
        totalNewReps += reps;
      });

      return {
        progress: {
          ...state.progress,
          current_xp: newXP,
          current_level: newLevel,
          current_rank: newRank,
          streak_days: newStreak,
          last_workout_date: today,
          workouts_completed: state.progress.workouts_completed + 1,
          total_reps: state.progress.total_reps + totalNewReps,
          exercises_completed: newExercisesCompleted,
        },
      };
    });
  },

  updateStreak: () => {
    set((state) => {
      if (state.progress.last_workout_date && !isStreakAlive(state.progress.last_workout_date)) {
        return {
          progress: {
            ...state.progress,
            streak_days: 0,
          },
        };
      }
      return state;
    });
  },

  checkAchievements: () => {
    const state = get();
    const newUnlocks: string[] = [];
    const currentAchievements = [...state.achievements];

    achievements.forEach((achievement) => {
      const existing = currentAchievements.find((a) => a.achievement_id === achievement.id);
      if (existing?.unlocked) return;

      let unlocked = false;
      switch (achievement.condition_type) {
        case 'workouts_completed':
          unlocked = state.progress.workouts_completed >= achievement.condition_value;
          break;
        case 'streak_days':
          unlocked = state.progress.streak_days >= achievement.condition_value;
          break;
        case 'total_xp':
          unlocked = state.progress.current_xp >= achievement.condition_value;
          break;
        case 'level':
          unlocked = state.progress.current_level >= achievement.condition_value;
          break;
        default:
          if (achievement.condition_type.startsWith('exercise_total_')) {
            const exerciseId = achievement.condition_type.replace('exercise_total_', '');
            const total = state.progress.exercises_completed[exerciseId] || 0;
            unlocked = total >= achievement.condition_value;
          }
      }

      if (unlocked) {
        newUnlocks.push(achievement.id);
        const idx = currentAchievements.findIndex((a) => a.achievement_id === achievement.id);
        const ua = {
          achievement_id: achievement.id,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        };
        if (idx >= 0) {
          currentAchievements[idx] = ua;
        } else {
          currentAchievements.push(ua);
        }
      }
    });

    if (newUnlocks.length > 0) {
      set({ achievements: currentAchievements });
    }
    return newUnlocks;
  },

  reset: () => set({ profile: null, progress: initialProgress, achievements: [], isOnboarded: false }),
}));
