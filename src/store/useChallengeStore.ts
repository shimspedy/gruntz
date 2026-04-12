import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DailyChallenge } from '../data/dailyChallenges';
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

  return Math.abs(b.getTime() - a.getTime()) === DAY_MS;
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

      getStreak: () => {
        const state = get();
        const dates = Array.from(new Set(state.completedDates)).sort((a, b) => b.localeCompare(a));

        if (dates.length === 0) {
          return 0;
        }

        let streak = 1;
        const today = getLocalDateKey();

        // If today is not in completedDates, streak breaks unless yesterday was
        if (!dates.includes(today)) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = getLocalDateKey(yesterday);
          if (!dates.includes(yesterdayKey)) {
            return 0;
          }
          // Streak continues from yesterday
          streak = 1;
        }

        // Count consecutive days from most recent completion
        for (let i = 1; i < dates.length; i++) {
          if (areConsecutiveDates(dates[i], dates[i - 1])) {
            streak++;
          } else {
            break;
          }
        }

        return streak;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
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

        useUserStore.getState().syncChallengeStats(state.completedDates);
      },
    }
  )
);
