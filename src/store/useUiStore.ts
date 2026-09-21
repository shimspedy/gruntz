import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Ephemeral, app-wide presentation state (which overlay is open). Never persisted. */
interface UiState {
  createMenuOpen: boolean;
  challengeOpen: boolean;
  readinessOpen: boolean;
  setCreateMenu: (open: boolean) => void;
  setChallenge: (open: boolean) => void;
  setReadiness: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  createMenuOpen: false,
  challengeOpen: false,
  readinessOpen: false,
  setCreateMenu: (createMenuOpen) => set({ createMenuOpen }),
  setChallenge: (challengeOpen) => set({ challengeOpen }),
  setReadiness: (readinessOpen) => set({ readinessOpen }),
}));

/** Small persisted chrome preferences. */
interface ChromePrefs {
  /** Local date key the daily-challenge pill was swiped away on. */
  challengePillHiddenOn: string | null;
  hideChallengePill: (dateKey: string | null) => void;
}

export const useChromePrefs = create<ChromePrefs>()(
  persist(
    (set) => ({
      challengePillHiddenOn: null,
      hideChallengePill: (challengePillHiddenOn) => set({ challengePillHiddenOn }),
    }),
    { name: '@gruntz_chrome', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
