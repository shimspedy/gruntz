import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { InboxCounts } from '../features/teamInbox';

/**
 * Unread team chat for the header badge. Where each chat was last read persists so a
 * relaunch does not re-announce lines already seen; the counts themselves are
 * recomputed from the server on every refresh.
 */
interface TeamInboxState extends InboxCounts {
  /** Teams this phone belongs to, from the last team fetch; what the badge can open. */
  teamIds: string[];
  lastReadAt: Record<string, string>;
  setCounts: (counts: InboxCounts) => void;
  setTeamIds: (ids: string[]) => void;
  /** Everything in `teamId` up to `at` has been seen. */
  markRead: (teamId: string, at?: string) => void;
  clear: () => void;
}

export const useTeamInboxStore = create<TeamInboxState>()(
  persist(
    (set) => ({
      unread: {},
      latestAt: {},
      teamIds: [],
      lastReadAt: {},
      setCounts: ({ unread, latestAt }) => set({ unread, latestAt }),
      setTeamIds: (teamIds) => set((s) => ({
        teamIds,
        // A team that is gone keeps no count.
        unread: Object.fromEntries(Object.entries(s.unread).filter(([id]) => teamIds.includes(id))),
      })),
      markRead: (teamId, at) => set((s) => {
        const stamp = at ?? new Date().toISOString();
        const previous = s.lastReadAt[teamId];
        const lastReadAt = previous && previous >= stamp ? s.lastReadAt : { ...s.lastReadAt, [teamId]: stamp };
        const unread = { ...s.unread };
        delete unread[teamId];
        return { lastReadAt, unread };
      }),
      clear: () => set({ unread: {}, latestAt: {}, teamIds: [] }),
    }),
    {
      name: '@gruntz_team_inbox',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ lastReadAt: s.lastReadAt, teamIds: s.teamIds, unread: s.unread, latestAt: s.latestAt }),
    },
  ),
);
