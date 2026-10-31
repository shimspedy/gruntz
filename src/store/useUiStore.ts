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
  /** Cards swiped away: card key → last local date key it stays hidden on. */
  dismissedCards: Record<string, string>;
  /** Hides a card through `untilKey` (today for daily cards, the week's last day for weekly ones). */
  dismissCard: (key: string, untilKey: string, todayKey: string) => void;
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
      // Expired entries are dropped on each write, so the record never grows.
      dismissCard: (key, untilKey, todayKey) => set((s) => ({
        dismissedCards: { ...Object.fromEntries(Object.entries(s.dismissedCards).filter(([, until]) => until >= todayKey)), [key]: untilKey },
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

/** Whether a swiped-away card is still hidden today. Date keys compare as strings. */
export const isCardHidden = (dismissed: Record<string, string>, key: string, todayKey: string) => (dismissed[key] ?? '') >= todayKey;
