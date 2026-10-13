import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** More than a sync ever looks back over, so an exported activity is never forgotten while it matters. */
const MAX_EXPORTED_IDS = 500;

/**
 * Apple Health / Health Connect preferences. Kept out of backups on purpose: access
 * is granted per device, so a restored phone has to be connected again.
 */
interface HealthState {
  connected: boolean;
  /** Save finished runs, rucks and hikes to the health platform. */
  writeActivities: boolean;
  /** Bring in watch-recorded workouts and heart rate. */
  importWorkouts: boolean;
  exportedIds: string[];
  /** Activity ID → when heart rate was last looked up for it. */
  heartRateChecked: Record<string, number>;
  lastSyncAt: number | null;
  setConnected: (connected: boolean) => void;
  setPreference: (key: 'writeActivities' | 'importWorkouts', value: boolean) => void;
  markExported: (id: string) => void;
  noteHeartRateChecked: (id: string, at: number) => void;
  finishedSync: (at: number) => void;
}

/** Older than any sync looks back; entries past it are dropped. */
const HEART_RATE_MEMORY_MS = 40 * 86_400_000;

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      connected: false,
      writeActivities: true,
      importWorkouts: true,
      exportedIds: [],
      heartRateChecked: {},
      lastSyncAt: null,
      // Disconnecting forgets the sync position: reconnecting looks back afresh.
      setConnected: (connected) => set(connected ? { connected } : { connected, lastSyncAt: null, heartRateChecked: {} }),
      setPreference: (key, value) => set({ [key]: value }),
      markExported: (id) => set((state) => (state.exportedIds.includes(id)
        ? state : { exportedIds: [...state.exportedIds, id].slice(-MAX_EXPORTED_IDS) })),
      noteHeartRateChecked: (id, at) => set((state) => {
        const heartRateChecked: Record<string, number> = { [id]: at };
        for (const [key, when] of Object.entries(state.heartRateChecked)) if (at - when < HEART_RATE_MEMORY_MS) heartRateChecked[key] = when;
        return { heartRateChecked };
      }),
      finishedSync: (lastSyncAt) => set({ lastSyncAt }),
    }),
    { name: '@gruntz_health', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
