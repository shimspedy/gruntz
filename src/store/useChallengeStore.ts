import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DailyChallenge } from '../data/dailyChallenges';
import { summarizeChallengeHistory } from '../utils/challengeStats';
import { getLocalDateKey, parseLocalDateKey } from '../utils/dateKey';
import { useUserStore } from './useUserStore';

export interface ChallengeProgressResult {
  currentProgress: number;
  todayCompleted: boolean;
  completedNow: boolean;
  xpAwarded: number;
  unlockedAchievementIds: string[];
}

interface ChallengeState {
  currentProgress: number; // current progress toward today's challenge
  completedDates: string[]; // dates where challenge was completed (YYYY-MM-DD)
  todayCompleted: boolean;
  activeDate: string | null;

  addProgress: (amount: number, challenge: DailyChallenge) => ChallengeProgressResult;
  completeChallenge: (challenge: DailyChallenge) => ChallengeProgressResult;
  resetDaily: () => void;
  getStreak: () => number; // consecutive days of completed challenges
}

const STORAGE_KEY = '@gruntz_challenges';
const DAY_MS = 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeCompletedDates(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')));
}

function migratePersistedChallengeState(persistedState: unknown): Partial<ChallengeState> {
  if (!isRecord(persistedState)) {
    return {};
  }

  const currentProgress =
    typeof persistedState.currentProgress === 'number' && Number.isFinite(persistedState.currentProgress)
      ? persistedState.currentProgress
      : 0;

  return {
    currentProgress: roundProgressValue(Math.max(0, currentProgress)),
    completedDates: normalizeCompletedDates(persistedState.completedDates),
    todayCompleted: persistedState.todayCompleted === true,
    activeDate: typeof persistedState.activeDate === 'string' ? persistedState.activeDate : null,
  };
}

function roundProgressValue(value: number) {
  return Math.round(value * 100) / 100;
}

function getTodayChallengeSnapshot(state: Pick<ChallengeState, 'activeDate' | 'completedDates' | 'currentProgress' | 'todayCompleted'>) {
  const todayKey = getLocalDateKey();
  const completedToday = state.completedDates.includes(todayKey);
  const progressToday = state.activeDate === todayKey ? state.currentProgress : 0;

  return {
    todayKey,
    completedToday,
    progressToday,
    todayCompleted: completedToday || (state.activeDate === todayKey && state.todayCompleted),
  };
}

/**
 * Check if two date strings are consecutive
 */
function areConsecutiveDates(dateA: string, dateB: string): boolean {
  const a = parseLocalDateKey(dateA);
  const b = parseLocalDateKey(dateB);

  if (!a || !b) {
    return false;
  }

  // Daylight-saving days are 23 or 25 hours long, so an exact-millisecond comparison
  // silently broke every challenge streak twice a year.
  return Math.round(Math.abs(b.getTime() - a.getTime()) / DAY_MS) === 1;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      currentProgress: 0,
      completedDates: [],
      todayCompleted: false,
      activeDate: null,

      addProgress: (amount, challenge) => {
        const safeAmount = roundProgressValue(Math.max(0, amount));
        const safeTarget = roundProgressValue(Math.max(0, challenge.target));
        let result: ChallengeProgressResult = {
          currentProgress: 0,
          todayCompleted: false,
          completedNow: false,
          xpAwarded: 0,
          unlockedAchievementIds: [],
        };
        let appliedAmount = 0;
        let completionDates: string[] = [];
        let challengeDate = getLocalDateKey();

        set((state) => {
          const { todayKey, completedToday, progressToday, todayCompleted } = getTodayChallengeSnapshot(state);
          challengeDate = todayKey;
          completionDates = state.completedDates;

          if (todayCompleted) {
            result = {
              currentProgress: safeTarget > 0 ? safeTarget : progressToday,
              todayCompleted: true,
              completedNow: false,
              xpAwarded: 0,
              unlockedAchievementIds: [],
            };

            return {
              activeDate: todayKey,
              currentProgress: result.currentProgress,
              todayCompleted: true,
            };
          }

          const nextProgress = safeTarget > 0
            ? Math.min(roundProgressValue(progressToday + safeAmount), safeTarget)
            : roundProgressValue(progressToday + safeAmount);
          const completedNow = safeTarget > 0 && nextProgress >= safeTarget && !completedToday;
          appliedAmount = roundProgressValue(nextProgress - progressToday);
          completionDates = completedNow ? [...state.completedDates, todayKey] : state.completedDates;

          result = {
            currentProgress: completedNow ? safeTarget : nextProgress,
            todayCompleted: completedNow,
            completedNow,
            xpAwarded: completedNow ? challenge.xpReward : 0,
            unlockedAchievementIds: [],
          };

          return {
            activeDate: todayKey,
            currentProgress: result.currentProgress,
            todayCompleted: completedNow,
            completedDates: completionDates,
          };
        });

        const userState = useUserStore.getState();

        if (appliedAmount > 0) {
          userState.recordChallengeActivity(challenge, appliedAmount);
        }

        if (result.completedNow && result.xpAwarded > 0) {
          result.unlockedAchievementIds = userState.recordChallengeCompletion({
            challengeDate,
            xpAmount: result.xpAwarded,
            completedDates: completionDates,
          });
        }

        return result;
      },

      completeChallenge: (challenge) => get().addProgress(challenge.target, challenge),

      resetDaily: () => {
        set((state) => {
          const { todayKey, completedToday, progressToday, todayCompleted } = getTodayChallengeSnapshot(state);

          if (
            state.activeDate === todayKey &&
            state.currentProgress === progressToday &&
            state.todayCompleted === todayCompleted
          ) {
            return state;
          }

          return {
            activeDate: todayKey,
            currentProgress: progressToday,
            todayCompleted: completedToday,
          };
        });
      },

      // One streak algorithm, shared with the profile summary: two implementations
      // over the same dates drifted apart and could disagree between screens.
      getStreak: () => summarizeChallengeHistory(get().completedDates).challengeStreakDays,
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => migratePersistedChallengeState(persistedState),
      partialize: (state) => ({
        currentProgress: state.currentProgress,
        completedDates: state.completedDates,
        todayCompleted: state.todayCompleted,
        activeDate: state.activeDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        // Writing into the user store before IT has hydrated applies challenge
        // stats to the default progress, which the user store then overwrites (or
        // merges over) — XP and streak could be recomputed from an empty array.
        const dates = state.completedDates;
        if (useUserStore.getState().hasHydrated) {
          useUserStore.getState().syncChallengeStats(dates);
          return;
        }
        const unsubscribe = useUserStore.subscribe((user) => {
          if (!user.hasHydrated) return;
          unsubscribe();
          useUserStore.getState().syncChallengeStats(dates);
        });
      },
    }
  )
);
