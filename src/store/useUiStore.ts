import { create } from 'zustand';

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
