import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateKey } from '../utils/dateKey';
import type { ActivityType, RoutePoint } from '../types/activity';
import { prepareTrackedSession } from '../features/activityHistory';
import { createFlushableStorage } from './flushableStorage';
import { READINESS_STORAGE_KEY, readinessStorage } from './readinessStorage';

const readinessPersistence = createFlushableStorage(readinessStorage);
export const flushReadinessPersistence = readinessPersistence.flush;
/** Zustand's persist.clearStorage() does not return the underlying async deletion. */
export async function clearReadinessPersistence(): Promise<void> {
  await flushReadinessPersistence();
  await readinessStorage.removeItem(READINESS_STORAGE_KEY);
}

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
  type: ActivityType;
  date: string;
  distanceMiles: number;
  durationSeconds: number;
  elevationFeet: number;
  packWeightPounds?: number;
  terrain?: string;
  notes?: string;
  route?: RoutePoint[];
  startedAt?: string;
  steps?: number;
  caloriesEstimate?: number;
  title?: string;
  stepsLimited?: boolean;
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
  includeActivityRoutesInBackup: boolean;
  teamName: string;
  teamCode: string;
  saveCheckIn: (checkIn: DailyReadinessCheckIn) => void;
  setTestScore: (eventId: string, value: number) => void;
  setTargetScore: (eventId: string, value: number) => void;
  setFieldPreference: (key: 'fieldMode' | 'audioCues' | 'keepScreenAwake' | 'batterySaver', value: boolean) => void;
  /** True only for a newly saved activity, so callers award lifetime stats once. */
  addTrackedSession: (session: TrackedSession) => boolean;
  setIncludeActivityRoutesInBackup: (include: boolean) => void;
  setTeam: (name: string, code: string) => void;
}

/** Clamp to a range, falling back when the value is missing or not a number. */
const scale = (value: number | undefined, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value as number)) : fallback;

/**
 * Daily readiness is a recent trend. Completed activity history is retained;
 * map samples are bounded separately without deleting older activities.
 */
const MAX_CHECKINS = 180;

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
    (set, get) => ({
      checkIns: [], testScores: {}, targetScores: {}, fieldMode: false, audioCues: true,
      keepScreenAwake: true, batterySaver: false, trackedSessions: [], teamName: '', teamCode: '',
      includeActivityRoutesInBackup: false,
      saveCheckIn: (checkIn) => set((state) => ({
        checkIns: [checkIn, ...state.checkIns.filter((item) => item.date !== checkIn.date)].slice(0, MAX_CHECKINS),
      })),
      setTestScore: (eventId, value) => set((state) => ({ testScores: { ...state.testScores, [eventId]: value } })),
      setTargetScore: (eventId, value) => set((state) => ({ targetScores: { ...state.targetScores, [eventId]: value } })),
      setFieldPreference: (key, value) => set({ [key]: value }),
      addTrackedSession: (session) => {
        if (get().trackedSessions.some((item) => item.id === session.id)) return false;
        const saved = prepareTrackedSession(session);
        if (!saved) return false;
        set((state) => ({ trackedSessions: [saved, ...state.trackedSessions] }));
        return true;
      },
      setIncludeActivityRoutesInBackup: (include) => set({ includeActivityRoutesInBackup: include }),
      setTeam: (teamName, teamCode) => set({ teamName, teamCode }),
    }),
    { name: '@gruntz_readiness', storage: createJSONStorage(() => readinessPersistence.storage) },
  ),
);

export function getTodaysCheckIn(checkIns: DailyReadinessCheckIn[]) {
  return checkIns.find((item) => item.date === getLocalDateKey());
}
