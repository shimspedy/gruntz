import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DailyChallenge } from '../data/dailyChallenges';
import { UserProgress, UserProfile, Rank, CompletedMission, UserAchievement, UserSettings } from '../types';
import { getLevelForXP, getRank, getXPToNextLevel, calculateMissionXP, calculateStreakBonus, isStreakAlive, getDefaultProgress } from '../utils/xp';
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
/**
 * Every id that counts toward an "exercise total" achievement.
 *
 * Two gaps this closes: `hand_release_pushups` was missing outright, and none of the
 * `lib:` ids were here at all — so a push-up done in any of the 528 library plans
 * (where it is logged as `lib:push-up`) never counted toward the push-up badges.
 * Pike and handstand push-ups are vertical pressing and deliberately excluded, as
 * are tricep pushdowns, which only share the word.
 */
const PUSHUP_LIBRARY_KEYS = [
  'push-up', 'pushup', 'knee-push-up', 'incline-push-up', 'decline-push-up', 'close-grip-push-up',
  'diamond-push-up', 'feet-elevated-push-up', 'feet-elevated-diamond-push-up', 'wide-push-up',
  'hands-release-push-up', 'clapping-push-up', 'weighted-push-up', 'dumbbell-push-up',
  'deficit-push-up-on-dumbbells', 'deep-push-up', 'push-up-on-risers', 'ring-push-up',
  'suspension-trainer-push-up', 'medicine-ball-push-up', 'bosu-ball-power-push-up',
  'band-resisted-push-up', 'band-resisted-feet-elevated-push-up', 'chinese-push-up',
  'single-leg-push-up', 'spiderman-push-up', 'three-way-push-up',
];

const EXERCISE_TOTAL_ALIASES: Record<string, string[]> = {
  pushups: [
    'pushups',
    'strict_pushups',
    'close_grip_pushups',
    'hand_release_pushups',
    'modified_pushups',
    'base_wall_pushups',
    'base_incline_pushups',
    'elbow_pushups',
    ...PUSHUP_LIBRARY_KEYS.map((key) => `lib:${key}`),
  ],
};

type PersistedUserState = {
  profile?: UserProfile | null;
  progress?: Partial<Omit<UserProgress, 'claimed_missions'>> & {
    claimed_missions?: unknown;
  };
  achievements?: UserAchievement[];
  isOnboarded?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeClaimedMissions(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (value instanceof Set) {
    return Array.from(value).filter((item): item is string => typeof item === 'string');
  }

  return [];
}

function migratePersistedUserState(persistedState: unknown): PersistedUserState {
  if (!isRecord(persistedState)) {
    return {};
  }

  const persisted = persistedState as PersistedUserState;

  const migratedProfile = persisted.profile && (persisted.profile.fitness_test_type as string) === 'air_force_pfa'
    ? { ...persisted.profile, fitness_test_type: 'air_force_pfra' as const }
    : persisted.profile;

  return {
    ...persisted,
    profile: migratedProfile,
    progress: persisted.progress
      ? {
          ...persisted.progress,
          claimed_missions: normalizeClaimedMissions(persisted.progress.claimed_missions),
        }
      : persisted.progress,
  };
}

function getClaimedWorkoutIds(claimedMissions: Set<string>) {
  return new Set(
    Array.from(claimedMissions)
      .map((claimKey) => claimKey.split(':').slice(1).join(':'))
      .filter(Boolean)
  );
}

/**
 * Has the athlete finished EVERY workout in a program week?
 *
 * This used to return true on the first claimed workout from that week, so
 * "Finish all missions in Week 1" unlocked after a single session. It now needs
 * the whole week, and stays program-agnostic: any one program's week counts, so a
 * 3-day Base Camp athlete can unlock the same tier as a Raider one.
 */
function hasCompletedProgramWeek(claimedWorkoutIds: Set<string>, week: number, daysPerWeek?: number | null) {
  const complete = (ids: string[]) => ids.length > 0 && ids.every((id) => claimedWorkoutIds.has(id));

  if (complete(getWorkoutDaysForWeek(week).map((day) => day.id))) return true;
  if (complete(getReconWeek(week).map((day) => day.id))) return true;

  // Base Camp days are generated per schedule, so its week is however many days the
  // athlete signed up for.
  const baseCampDays = Math.max(1, Math.min(7, daysPerWeek ?? 3));
  const baseCampPrefix = `basecamp_w${week}d`;
  const claimedBaseCamp = new Set(Array.from(claimedWorkoutIds).filter((id) => id.startsWith(baseCampPrefix)));
  if (claimedBaseCamp.size >= baseCampDays) return true;

  // Library plans and anything else that tags its ids with the week.
  const suffixes = [`_w${week}d`, `d_w${week}d`];
  const claimedTagged = Array.from(claimedWorkoutIds).filter((id) => suffixes.some((suffix) => id.includes(suffix)));
  return claimedTagged.length >= baseCampDays;
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
        const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
        if (!safe) return;
        set((state) => ({ progress: { ...state.progress, ...applyXP(state.progress, safe) } }));
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
            state.progress.last_challenge_date === summary.lastChallengeDate
          ) {
            return state;
          }

          return {
            progress: {
              ...state.progress,
              challenges_completed: summary.challengesCompleted,
              challenge_streak_days: summary.challengeStreakDays,
              // challenge_xp_earned is deliberately NOT synced. It is banked as each
              // challenge is completed; re-deriving it maps old dates through the
              // CURRENT challenge list, so adding one challenge silently rewrote how
              // much XP past days were worth.
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
            ? isStreakAlive(state.progress.last_workout_date, state.profile?.workout_days_per_week)
            : false;
          const alreadyToday = state.progress.last_workout_date === today;
          const newStreak = alreadyToday
            ? Math.max(1, state.progress.streak_days)
            : wasStreakAlive
              ? state.progress.streak_days + 1
              : 1;
          const streakBonus = calculateStreakBonus(newStreak, state.progress.streak_days);

          const totalXP = calculateMissionXP(mission, streakBonus);

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
              last_workout_date: state.progress.last_workout_date && state.progress.last_workout_date > today ? state.progress.last_workout_date : today,
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
          if (state.progress.last_workout_date && !isStreakAlive(state.progress.last_workout_date, state.profile?.workout_days_per_week)) {
            return {
              progress: {
                ...state.progress,
                streak_days: 0,
                last_workout_date: null,
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
              unlocked = hasCompletedProgramWeek(claimedWorkoutIds, achievement.condition_value, state.profile?.workout_days_per_week);
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
          // Unlock screens advertise "+250 XP"; pay it, instead of only recording the badge.
          const reward = newUnlocks.reduce((sum, id) => sum + (achievements.find((a) => a.id === id)?.xp_reward ?? 0), 0);
          set((state) => ({
            achievements: currentAchievements,
            progress: reward > 0 ? { ...state.progress, ...applyXP(state.progress, reward) } : state.progress,
          }));
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
      migrate: (persistedState) => migratePersistedUserState(persistedState),
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
        const persisted = migratePersistedUserState(persistedState);

        return {
          ...currentState,
          profile: 'profile' in persisted ? persisted.profile ?? null : currentState.profile,
          achievements: Array.isArray(persisted.achievements) ? persisted.achievements : currentState.achievements,
          isOnboarded:
            typeof persisted.isOnboarded === 'boolean' ? persisted.isOnboarded : currentState.isOnboarded,
          progress: persisted.progress
            ? {
                ...currentState.progress,
                ...persisted.progress,
                claimed_missions: new Set(normalizeClaimedMissions(persisted.progress.claimed_missions)),
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
