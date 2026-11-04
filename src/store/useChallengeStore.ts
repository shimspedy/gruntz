import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CHALLENGE_BONUS_SCALE_STEP,
  CHALLENGE_SCALE_STEP,
  CHALLENGE_START_SCALE,
  challengeMode,
  type ChallengeMode,
  type DailyChallenge,
  type FitnessLevel,
} from '../data/dailyChallenges';
import { summarizeChallengeHistory } from '../utils/challengeStats';
import { getLocalDateKey } from '../utils/dateKey';
import { useUserStore } from './useUserStore';

export interface ChallengeProgressResult {
  currentProgress: number;
  todayCompleted: boolean;
  completedNow: boolean;
  /** The athlete reached the full, unscaled target on this log. */
  bonusNow: boolean;
  xpAwarded: number;
  unlockedAchievementIds: string[];
}

interface ChallengeState {
  currentProgress: number; // current progress toward today's challenge
  completedDates: string[]; // dates where challenge was completed (YYYY-MM-DD)
  /** Dates where the full target was reached on top of a scaled one (bonus paid). */
  bonusDates: string[];
  todayCompleted: boolean;
  activeDate: string | null;
  /**
   * How far toward the full target each kind of challenge is scaled, 0..1. Absent
   * until the athlete completes one of that kind; `scaleFor` then falls back to the
   * profile's fitness level, so changing the level in Training Preferences still
   * moves the start point for kinds that have not begun climbing yet.
   */
  scaleByMode: Partial<Record<ChallengeMode, number>>;

  addProgress: (amount: number, challenge: DailyChallenge) => ChallengeProgressResult;
  completeChallenge: (challenge: DailyChallenge) => ChallengeProgressResult;
  resetDaily: () => void;
  getStreak: () => number; // consecutive days of completed challenges
  scaleFor: (mode: ChallengeMode, level: FitnessLevel | undefined) => number;
}

export function challengeScale(scaleByMode: Partial<Record<ChallengeMode, number>>, mode: ChallengeMode, level: FitnessLevel | undefined): number {
  const stored = scaleByMode[mode];
  if (typeof stored === 'number' && Number.isFinite(stored)) return Math.min(1, Math.max(0, stored));
  return CHALLENGE_START_SCALE[level ?? 'beginner'] ?? 1;
}

const STORAGE_KEY = '@gruntz_challenges';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeCompletedDates(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')));
}

function normalizeScaleByMode(value: unknown): Partial<Record<ChallengeMode, number>> {
  if (!isRecord(value)) return {};
  const out: Partial<Record<ChallengeMode, number>> = {};
  for (const mode of ['reps', 'time', 'distance'] as const) {
    const v = value[mode];
    if (typeof v === 'number' && Number.isFinite(v)) out[mode] = Math.min(1, Math.max(0, roundProgressValue(v)));
  }
  return out;
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
    bonusDates: normalizeCompletedDates(persistedState.bonusDates),
    todayCompleted: persistedState.todayCompleted === true,
    activeDate: typeof persistedState.activeDate === 'string' ? persistedState.activeDate : null,
    scaleByMode: normalizeScaleByMode(persistedState.scaleByMode),
  };
}

function roundProgressValue(value: number) {
  return Math.round(value * 100) / 100;
}

function getTodayChallengeSnapshot(state: Pick<ChallengeState, 'activeDate' | 'completedDates' | 'bonusDates' | 'currentProgress' | 'todayCompleted'>) {
  const todayKey = getLocalDateKey();
  const completedToday = state.completedDates.includes(todayKey);
  const progressToday = state.activeDate === todayKey ? state.currentProgress : 0;

  return {
    todayKey,
    completedToday,
    bonusToday: state.bonusDates.includes(todayKey),
    progressToday,
    todayCompleted: completedToday || (state.activeDate === todayKey && state.todayCompleted),
  };
}

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      currentProgress: 0,
      completedDates: [],
      bonusDates: [],
      todayCompleted: false,
      activeDate: null,
      scaleByMode: {},

      addProgress: (amount, challenge) => {
        const safeAmount = roundProgressValue(Math.max(0, amount));
        const safeTarget = roundProgressValue(Math.max(0, challenge.target));
        // Logging keeps going past a scaled target up to the full one, so the
        // athlete can chase the bonus. At full scale the two are the same number.
        const safeFull = roundProgressValue(Math.max(safeTarget, challenge.fullTarget || 0));
        const bonusXp = safeFull > safeTarget ? Math.max(0, Math.round(challenge.bonusXp || 0)) : 0;
        let result: ChallengeProgressResult = {
          currentProgress: 0,
          todayCompleted: false,
          completedNow: false,
          bonusNow: false,
          xpAwarded: 0,
          unlockedAchievementIds: [],
        };
        let appliedAmount = 0;
        let completionDates: string[] = [];
        let challengeDate = getLocalDateKey();

        set((state) => {
          const { todayKey, completedToday, bonusToday, progressToday, todayCompleted } = getTodayChallengeSnapshot(state);
          challengeDate = todayKey;
          completionDates = state.completedDates;
          const cap = safeFull > 0 ? safeFull : Number.POSITIVE_INFINITY;

          if (bonusToday || (todayCompleted && bonusXp <= 0)) {
            // Nothing left to earn today. Pin progress at the ceiling it reached.
            const pinned = safeFull > 0 ? (bonusToday ? safeFull : Math.max(safeTarget, Math.min(progressToday, safeFull))) : progressToday;
            result = {
              currentProgress: pinned,
              todayCompleted: true,
              completedNow: false,
              bonusNow: false,
              xpAwarded: 0,
              unlockedAchievementIds: [],
            };

            return {
              activeDate: todayKey,
              currentProgress: result.currentProgress,
              todayCompleted: true,
            };
          }

          const nextProgress = Math.min(roundProgressValue(progressToday + safeAmount), cap);
          const completedNow = safeTarget > 0 && nextProgress >= safeTarget && !completedToday;
          const bonusNow = bonusXp > 0 && nextProgress >= safeFull && !bonusToday;
          appliedAmount = roundProgressValue(nextProgress - progressToday);
          completionDates = completedNow ? [...state.completedDates, todayKey] : state.completedDates;
          const nowCompleted = completedNow || todayCompleted;

          const mode = challengeMode(challenge);
          let scaleByMode = state.scaleByMode;
          if (completedNow || bonusNow) {
            const current = challengeScale(state.scaleByMode, mode, useUserStore.getState().profile?.fitness_level);
            const climb = (completedNow ? CHALLENGE_SCALE_STEP : 0) + (bonusNow ? CHALLENGE_BONUS_SCALE_STEP : 0);
            scaleByMode = { ...state.scaleByMode, [mode]: Math.min(1, roundProgressValue(current + climb)) };
          }

          result = {
            currentProgress: nextProgress,
            todayCompleted: nowCompleted,
            completedNow,
            bonusNow,
            xpAwarded: (completedNow ? challenge.xpReward : 0) + (bonusNow ? bonusXp : 0),
            unlockedAchievementIds: [],
          };

          return {
            activeDate: todayKey,
            currentProgress: result.currentProgress,
            todayCompleted: nowCompleted,
            completedDates: completionDates,
            bonusDates: bonusNow ? [...state.bonusDates, todayKey] : state.bonusDates,
            scaleByMode,
          };
        });

        const userState = useUserStore.getState();

        if (appliedAmount > 0) {
          userState.recordChallengeActivity(challenge, appliedAmount);
        }

        if (result.completedNow && challenge.xpReward > 0) {
          result.unlockedAchievementIds = userState.recordChallengeCompletion({
            challengeDate,
            xpAmount: challenge.xpReward,
            completedDates: completionDates,
          });
        }

        if (result.bonusNow && bonusXp > 0) {
          const ids = userState.recordChallengeBonus({ xpAmount: bonusXp });
          result.unlockedAchievementIds = Array.from(new Set([...result.unlockedAchievementIds, ...ids]));
        }

        return result;
      },

      // Only the gap to the personal target is logged, so "Mark as complete" never
      // overshoots into the full target and pays a bonus the athlete did not earn.
      completeChallenge: (challenge) => {
        const { progressToday } = getTodayChallengeSnapshot(get());
        return get().addProgress(Math.max(0, challenge.target - progressToday), challenge);
      },

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

      scaleFor: (mode, level) => challengeScale(get().scaleByMode, mode, level),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => migratePersistedChallengeState(persistedState),
      // `migrate` only runs on a version mismatch. A restored backup that already claims
      // this version skips it, so the same normalisation runs on every rehydrate: a
      // malformed own-backup payload cannot leave `bonusDates` or `scaleByMode` in a
      // shape the daily-challenge hook would throw on.
      merge: (persistedState, currentState) => ({ ...currentState, ...migratePersistedChallengeState(persistedState) }),
      partialize: (state) => ({
        currentProgress: state.currentProgress,
        completedDates: state.completedDates,
        bonusDates: state.bonusDates,
        todayCompleted: state.todayCompleted,
        activeDate: state.activeDate,
        scaleByMode: state.scaleByMode,
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
