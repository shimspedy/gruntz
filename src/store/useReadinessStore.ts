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

export function calculateDailyReadiness(checkIn?: DailyReadinessCheckIn) {
  if (!checkIn) return 70;
  const sleep = Math.min(checkIn.sleepHours / 8, 1) * 30;
  const energy = (checkIn.energy / 5) * 25;
  const hydration = (checkIn.hydration / 5) * 15;
  const soreness = ((6 - checkIn.soreness) / 5) * 15;
  const stress = ((6 - checkIn.stress) / 5) * 15;
  return Math.round(Math.max(0, Math.min(100, sleep + energy + hydration + soreness + stress)));
}

export const useReadinessStore = create<ReadinessState>()(
  persist(
    (set) => ({
      checkIns: [], testScores: {}, targetScores: {}, fieldMode: false, audioCues: true,
      keepScreenAwake: true, batterySaver: false, trackedSessions: [], teamName: '', teamCode: '',
      saveCheckIn: (checkIn) => set((state) => ({
        checkIns: [checkIn, ...state.checkIns.filter((item) => item.date !== checkIn.date)].slice(0, 60),
      })),
      setTestScore: (eventId, value) => set((state) => ({ testScores: { ...state.testScores, [eventId]: value } })),
      setTargetScore: (eventId, value) => set((state) => ({ targetScores: { ...state.targetScores, [eventId]: value } })),
      setFieldPreference: (key, value) => set({ [key]: value }),
      addTrackedSession: (session) => set((state) => ({ trackedSessions: [session, ...state.trackedSessions].slice(0, 100) })),
      setTeam: (teamName, teamCode) => set({ teamName, teamCode }),
    }),
    { name: '@gruntz_readiness', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function getTodaysCheckIn(checkIns: DailyReadinessCheckIn[]) {
  return checkIns.find((item) => item.date === getLocalDateKey());
}
