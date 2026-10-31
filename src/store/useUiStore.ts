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
  /** Cards swiped away on Train: card key → local date key it was hidden on. */
  dismissedCards: Record<string, string>;
  dismissCard: (key: string, dateKey: string) => void;
  /** The "what a team sees" note on Leader tools has been read and closed. */
  leaderPrivacyDismissed: boolean;
  setLeaderPrivacyDismissed: (dismissed: boolean) => void;
  /** File name of the profile photo in the documents folder; device-local, never backed up. */
  profilePhotoFile: string | null;
  setProfilePhotoFile: (file: string | null) => void;
  /** The photo file name last uploaded for teammates to see; null when none is up there. */
  teamAvatarSynced: string | null;
  setTeamAvatarSynced: (file: string | null) => void;
}

export const useChromePrefs = create<ChromePrefs>()(
  persist(
    (set) => ({
      challengePillHiddenOn: null,
      hideChallengePill: (challengePillHiddenOn) => set({ challengePillHiddenOn }),
      dismissedCards: {},
      // Only today's entries are kept, so the record never grows.
      dismissCard: (key, dateKey) => set((s) => ({
        dismissedCards: { ...Object.fromEntries(Object.entries(s.dismissedCards).filter(([, day]) => day === dateKey)), [key]: dateKey },
      })),
      leaderPrivacyDismissed: false,
      setLeaderPrivacyDismissed: (leaderPrivacyDismissed) => set({ leaderPrivacyDismissed }),
      profilePhotoFile: null,
      setProfilePhotoFile: (profilePhotoFile) => set({ profilePhotoFile }),
      teamAvatarSynced: null,
      setTeamAvatarSynced: (teamAvatarSynced) => set({ teamAvatarSynced }),
    }),
    { name: '@gruntz_chrome', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
