import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DailyChallenge } from '../data/dailyChallenges';
import { UserProgress, UserProfile, Rank, CompletedMission, UserAchievement, UserSettings } from '../types';
import { getLevelForXP, getRank, getXPToNextLevel, calculateStreakBonus, isStreakAlive, getDefaultProgress } from '../utils/xp';
import { achievements } from '../data/achievements';
import { getReconWeek } from '../data/reconWorkouts';
import { getWorkoutDaysForWeek } from '../data/workouts';
import { getLocalDateKey } from '../utils/dateKey';
import {
  getChallengeDistanceMiles,
  getChallengeDurationSeconds,
  getTrackedChallengeExerciseId,
  summarizeChallengeHistory,
} from '../utils/challengeStats';

interface UserState {
  profile: UserProfile | null;
  progress: UserProgress;
  achievements: UserAchievement[];
  isLoading: boolean;
  isOnboarded: boolean;
  hasHydrated: boolean;

  setProfile: (profile: UserProfile) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setOnboarded: (onboarded: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  addXP: (amount: number) => void;
  recordChallengeActivity: (challenge: Pick<DailyChallenge, 'id' | 'type' | 'unit'>, amount: number) => void;
  recordChallengeCompletion: (params: {
    challengeDate: string;
    xpAmount: number;
    completedDates: string[];
  }) => string[];
  syncChallengeStats: (completedDates: string[]) => void;
  completeMission: (mission: CompletedMission) => void;
  updateStreak: () => void;
  checkAchievements: () => string[];
  reset: () => void;
}

const initialProgress = getDefaultProgress('local');
const STORAGE_KEY = '@gruntz_user';
const EXERCISE_TOTAL_ALIASES: Record<string, string[]> = {
  pushups: ['pushups', 'strict_pushups', 'close_grip_pushups'],
};

function getClaimedWorkoutIds(claimedMissions: Set<string>) {
  return new Set(
    Array.from(claimedMissions)
      .map((claimKey) => claimKey.split(':').slice(1).join(':'))
      .filter(Boolean)
  );
}

function hasCompletedProgramWeek(claimedWorkoutIds: Set<string>, week: number) {
  const raiderIds = getWorkoutDaysForWeek(week).map((day) => day.id);
  const reconIds = getReconWeek(week).map((day) => day.id);

  const hasAll = (ids: string[]) => ids.length > 0 && ids.every((id) => claimedWorkoutIds.has(id));
  return hasAll(raiderIds) || hasAll(reconIds);
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

function applyXP(progress: UserProgress, amount: number): Pick<UserProgress, 'current_xp' | 'current_level' | 'current_rank'> {
  const newXP = progress.current_xp + amount;
  const newLevel = getLevelForXP(newXP);
  const newRank = getRank(newLevel);

  return {
    current_xp: newXP,
    current_level: newLevel,
    current_rank: newRank,
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      progress: initialProgress,
      achievements: [],
      isLoading: false,
      isOnboarded: false,
      hasHydrated: false,

      setProfile: (profile) => set({ profile }),
      updateSettings: (settings) =>
        set((state) => {
          if (!state.profile) {
            return state;
          }

          return {
            profile: {
              ...state.profile,
              settings: {
                ...state.profile.settings,
                ...settings,
              },
            },
          };
        }),

      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      addXP: (amount) => {
        set((state) => {
          return {
            progress: {
              ...state.progress,
              ...applyXP(state.progress, amount),
            },
          };
        });
      },

      recordChallengeActivity: (challenge, amount) => {
        const safeAmount = roundMetric(Math.max(0, amount));
        if (safeAmount <= 0) {
          return;
        }

        set((state) => {
          const nextExercisesCompleted = { ...state.progress.exercises_completed };
          const trackedExerciseId = getTrackedChallengeExerciseId(challenge.id);

          if (trackedExerciseId) {
            nextExercisesCompleted[trackedExerciseId] = roundMetric(
              (nextExercisesCompleted[trackedExerciseId] || 0) + safeAmount
            );
          }

          const repGain = challenge.type === 'reps' ? safeAmount : 0;
          const distanceGain = getChallengeDistanceMiles(challenge, safeAmount);
          const timeGain = getChallengeDurationSeconds(challenge, safeAmount);

          return {
            progress: {
              ...state.progress,
              total_reps: roundMetric(state.progress.total_reps + repGain),
              total_distance_miles: roundMetric(state.progress.total_distance_miles + distanceGain),
              challenge_time_seconds_logged: roundMetric(state.progress.challenge_time_seconds_logged + timeGain),
              exercises_completed: trackedExerciseId ? nextExercisesCompleted : state.progress.exercises_completed,
            },
          };
        });
      },

      recordChallengeCompletion: ({ challengeDate, xpAmount, completedDates }) => {
        const summary = summarizeChallengeHistory(completedDates);
        const safeXP = Math.max(0, xpAmount);
        let recordedNewCompletion = false;

        set((state) => {
          const duplicateCompletion =
            challengeDate === state.progress.last_challenge_date &&
            summary.challengesCompleted <= state.progress.challenges_completed;
          const xpGain = duplicateCompletion ? 0 : safeXP;

          if (xpGain > 0) {
            recordedNewCompletion = true;
          }

          return {
            progress: {
              ...state.progress,
              ...applyXP(state.progress, xpGain),
              challenges_completed: summary.challengesCompleted,
              challenge_streak_days: summary.challengeStreakDays,
              challenge_xp_earned: Math.max(
                roundMetric(state.progress.challenge_xp_earned + xpGain),
                summary.challengeXpEarned
              ),
              last_challenge_date: summary.lastChallengeDate,
            },
          };
        });

        if (!recordedNewCompletion) {
          return [];
        }

        return get().checkAchievements();
      },

      syncChallengeStats: (completedDates) => {
        const summary = summarizeChallengeHistory(completedDates);

        set((state) => {
          if (
            state.progress.challenges_completed === summary.challengesCompleted &&
            state.progress.challenge_streak_days === summary.challengeStreakDays &&
            state.progress.challenge_xp_earned === summary.challengeXpEarned &&
            state.progress.last_challenge_date === summary.lastChallengeDate
          ) {
            return state;
          }

          return {
            progress: {
              ...state.progress,
              challenges_completed: summary.challengesCompleted,
              challenge_streak_days: summary.challengeStreakDays,
              challenge_xp_earned: summary.challengeXpEarned,
              last_challenge_date: summary.lastChallengeDate,
            },
          };
        });
      },

      completeMission: (mission) => {
        set((state) => {
          // Dedupe: reject if this mission_date + workout_day_id was already claimed
          const claimKey = `${mission.mission_date}:${mission.workout_day_id}`;
          if (state.progress.claimed_missions?.has(claimKey)) {
            return state;
          }

          const today = mission.mission_date || getLocalDateKey();
          const wasStreakAlive = state.progress.last_workout_date
            ? isStreakAlive(state.progress.last_workout_date)
            : false;
          const newStreak = wasStreakAlive ? state.progress.streak_days + 1 : 1;
          const streakBonus = calculateStreakBonus(newStreak);

          const totalXP = mission.total_xp + mission.completion_bonus + mission.pr_bonus + streakBonus;

          const newExercisesCompleted = { ...state.progress.exercises_completed };
          let totalNewReps = 0;
          mission.exercises.forEach((ex) => {
            const reps = ex.completed_reps || 0;
            newExercisesCompleted[ex.exercise_id] = (newExercisesCompleted[ex.exercise_id] || 0) + reps;
            totalNewReps += reps;
          });

          const newClaimed = new Set(state.progress.claimed_missions);
          newClaimed.add(claimKey);

          return {
            progress: {
              ...state.progress,
              ...applyXP(state.progress, totalXP),
              streak_days: newStreak,
              last_workout_date: today,
              workouts_completed: state.progress.workouts_completed + 1,
              total_reps: state.progress.total_reps + totalNewReps,
              exercises_completed: newExercisesCompleted,
              claimed_missions: newClaimed,
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
        const claimedWorkoutIds = getClaimedWorkoutIds(state.progress.claimed_missions);

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
            case 'week_completed':
              unlocked = hasCompletedProgramWeek(claimedWorkoutIds, achievement.condition_value);
              break;
            default:
              if (achievement.condition_type.startsWith('exercise_total_')) {
                const exerciseId = achievement.condition_type.replace('exercise_total_', '');
                const relatedExerciseIds = EXERCISE_TOTAL_ALIASES[exerciseId] ?? [exerciseId];
                const total = relatedExerciseIds.reduce(
                  (sum, id) => sum + (state.progress.exercises_completed[id] || 0),
                  0
                );
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

      reset: () =>
        set({
          profile: null,
          progress: getDefaultProgress('local'),
          achievements: [],
          isOnboarded: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        progress: {
          ...state.progress,
          claimed_missions: Array.from(state.progress.claimed_missions),
        },
        achievements: state.achievements,
        isOnboarded: state.isOnboarded,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<UserState> & {
          progress?: Partial<UserProgress> & { claimed_missions?: string[] };
        };

        return {
          ...currentState,
          ...persisted,
          progress: persisted.progress
            ? {
                ...currentState.progress,
                ...persisted.progress,
                claimed_missions: new Set(persisted.progress.claimed_missions ?? []),
              }
            : currentState.progress,
        };
      },
      onRehydrateStorage: () => () => {
        useUserStore.setState({ hasHydrated: true });
      },
    }
  )
);
