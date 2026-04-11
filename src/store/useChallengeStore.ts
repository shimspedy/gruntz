import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ChallengeState {
  currentProgress: number; // current progress toward today's challenge
  completedDates: string[]; // dates where challenge was completed (YYYY-MM-DD)
  todayCompleted: boolean;

  addProgress: (amount: number) => void;
  completeChallenge: () => void;
  resetDaily: () => void;
  getStreak: () => number; // consecutive days of completed challenges
}

const STORAGE_KEY = '@gruntz_challenges';

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateKey(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if two date strings are consecutive
 */
function areConsecutiveDates(dateA: string, dateB: string): boolean {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffTime = Math.abs(b.getTime() - a.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      currentProgress: 0,
      completedDates: [],
      todayCompleted: false,

      addProgress: (amount) => {
        set((state) => ({
          currentProgress: state.currentProgress + amount,
        }));
      },

      completeChallenge: () => {
        const todayKey = getTodayDateKey();
        set((state) => {
          // Avoid duplicates for the same day
          if (state.completedDates.includes(todayKey)) {
            return state;
          }

          return {
            currentProgress: 0,
            completedDates: [...state.completedDates, todayKey],
            todayCompleted: true,
          };
        });
      },

      resetDaily: () => {
        const todayKey = getTodayDateKey();
        const state = get();

        // Check if we need to reset (new day)
        if (state.completedDates.length > 0) {
          const lastCompletedDate = state.completedDates[state.completedDates.length - 1];
          // If last completion was today, don't reset
          if (lastCompletedDate === todayKey) {
            return;
          }
        }

        // Reset for a new day
        set({
          currentProgress: 0,
          todayCompleted: false,
        });
      },

      getStreak: () => {
        const state = get();
        const dates = state.completedDates.sort().reverse();

        if (dates.length === 0) {
          return 0;
        }

        let streak = 1;
        const today = getTodayDateKey();

        // If today is not in completedDates, streak breaks unless yesterday was
        if (!dates.includes(today)) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = yesterday.toISOString().split('T')[0];
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
      }),
    }
  )
);
