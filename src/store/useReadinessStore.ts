import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateKey } from '../utils/dateKey';

export interface DailyReadinessCheckIn {
  date: string;
  sleepHours: number;
  soreness: number;
  energy: number;
  stress: number;
  hydration: number;
}

export interface TrackedSession {
  id: string;
  type: 'run' | 'ruck';
  date: string;
  distanceMiles: number;
  durationSeconds: number;
  elevationFeet: number;
  packWeightPounds?: number;
  terrain?: string;
  notes?: string;
}

interface ReadinessState {
  checkIns: DailyReadinessCheckIn[];
  testScores: Record<string, number>;
  targetScores: Record<string, number>;
  fieldMode: boolean;
  audioCues: boolean;
  keepScreenAwake: boolean;
  batterySaver: boolean;
  trackedSessions: TrackedSession[];
  teamName: string;
  teamCode: string;
  saveCheckIn: (checkIn: DailyReadinessCheckIn) => void;
  setTestScore: (eventId: string, value: number) => void;
  setTargetScore: (eventId: string, value: number) => void;
  setFieldPreference: (key: 'fieldMode' | 'audioCues' | 'keepScreenAwake' | 'batterySaver', value: boolean) => void;
  addTrackedSession: (session: TrackedSession) => void;
  setTeam: (name: string, code: string) => void;
}

/** Clamp to a range, falling back when the value is missing or not a number. */
const scale = (value: number | undefined, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value as number)) : fallback;

/**
 * Retention caps. These are deliberate, not incidental: a readiness check-in is
 * only useful against recent training, and the run/ruck list backs the charts.
 * Named and documented because silently dropping a year-old entry from an
 * unexplained `slice(0, 60)` is indistinguishable from losing data.
 */
const MAX_CHECKINS = 180;
const MAX_TRACKED_SESSIONS = 400;

export function calculateDailyReadiness(checkIn?: DailyReadinessCheckIn) {
  if (!checkIn) return 70;
  // Every field is clamped and defaulted: one missing value (a check-in saved by an
  // older build, a partially written record) turned the whole sum into NaN, which
  // reached the UI as "NaN%".
  const sleep = (scale(checkIn.sleepHours, 0, 8, 7) / 8) * 30;
  const energy = (scale(checkIn.energy, 1, 5, 3) / 5) * 25;
  const hydration = (scale(checkIn.hydration, 1, 5, 3) / 5) * 15;
  const soreness = ((6 - scale(checkIn.soreness, 1, 5, 3)) / 5) * 15;
  const stress = ((6 - scale(checkIn.stress, 1, 5, 3)) / 5) * 15;
  return Math.round(Math.max(0, Math.min(100, sleep + energy + hydration + soreness + stress)));
}

export const useReadinessStore = create<ReadinessState>()(
  persist(
    (set) => ({
      checkIns: [], testScores: {}, targetScores: {}, fieldMode: false, audioCues: true,
      keepScreenAwake: true, batterySaver: false, trackedSessions: [], teamName: '', teamCode: '',
      saveCheckIn: (checkIn) => set((state) => ({
        checkIns: [checkIn, ...state.checkIns.filter((item) => item.date !== checkIn.date)].slice(0, MAX_CHECKINS),
      })),
      setTestScore: (eventId, value) => set((state) => ({ testScores: { ...state.testScores, [eventId]: value } })),
      setTargetScore: (eventId, value) => set((state) => ({ targetScores: { ...state.targetScores, [eventId]: value } })),
      setFieldPreference: (key, value) => set({ [key]: value }),
      addTrackedSession: (session) => set((state) => ({ trackedSessions: [session, ...state.trackedSessions].slice(0, MAX_TRACKED_SESSIONS) })),
      setTeam: (teamName, teamCode) => set({ teamName, teamCode }),
    }),
    { name: '@gruntz_readiness', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function getTodaysCheckIn(checkIns: DailyReadinessCheckIn[]) {
  return checkIns.find((item) => item.date === getLocalDateKey());
}
