import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocalDateKey } from '../utils/dateKey';
import type { ActivityType, RoutePoint } from '../types/activity';
import { prepareTrackedSession, splitTrackedSession } from '../features/activityHistory';
import { clearRoutes, inlineRoute, saveRoute } from './activityRoutes';
import { createFlushableStorage } from './flushableStorage';
import { READINESS_STORAGE_KEY, readinessStorage } from './readinessStorage';

const readinessPersistence = createFlushableStorage(readinessStorage);
export const flushReadinessPersistence = readinessPersistence.flush;
/** Zustand's persist.clearStorage() does not return the underlying async deletion. */
export async function clearReadinessPersistence(): Promise<void> {
  // A migration still writing routes would otherwise recreate them after the wipe.
  await routeMigrationSettled();
  await flushReadinessPersistence();
  // Routes go first: a summary without its route still lists, an orphaned route never would.
  await clearRoutes();
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
  /** How many GPS points this activity's route holds in route storage; absent when none was recorded. */
  routePoints?: number;
  startedAt?: string;
  steps?: number;
  caloriesEstimate?: number;
  title?: string;
  stepsLimited?: boolean;
}

/** An activity together with its route, as recorded, backed up or saved by an older build. */
export type RecordedActivity = TrackedSession & { route?: RoutePoint[] };

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
  /**
   * Adds a summary. True only for a newly saved activity, so callers award lifetime
   * stats once. An activity with a route is refused: use `saveTrackedActivity`, which
   * stores the route durably first.
   */
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
        if (inlineRoute(session)?.length) return false;
        const saved = prepareTrackedSession(session);
        if (!saved) return false;
        const { route: _empty, ...summary } = saved;
        set((state) => ({ trackedSessions: [summary, ...state.trackedSessions] }));
        return true;
      },
      setIncludeActivityRoutesInBackup: (include) => set({ includeActivityRoutesInBackup: include }),
      setTeam: (teamName, teamCode) => set({ teamName, teamCode }),
    }),
    {
      name: '@gruntz_readiness',
      storage: createJSONStorage(() => readinessPersistence.storage),
      // Deliberately not a persist `version` bump: an older build must still be able
      // to restore a backup made by this one.
      onRehydrateStorage: () => (_state, error) => {
        if (!error) void Promise.resolve().then(migrateInlineRoutes).catch(() => undefined);
      },
    },
  ),
);

/**
 * Save a finished activity. The route is durably written before its summary joins
 * the store, so history never points at a route that was not saved. A rejected
 * route write adds nothing; calling again with the same ID is safe and never
 * duplicates the activity.
 */
export async function saveTrackedActivity(session: RecordedActivity): Promise<boolean> {
  if (useReadinessStore.getState().trackedSessions.some((item) => item.id === session.id)) return false;
  const prepared = prepareTrackedSession(session);
  if (!prepared) return false;
  const { summary, route } = splitTrackedSession(prepared);
  if (route) await saveRoute(summary.id, route);
  return useReadinessStore.getState().addTrackedSession(summary);
}

let routeMigration: Promise<void> | null = null;

/**
 * Move routes that an older build stored inside the readiness blob into route
 * storage. Each route is written and read back first; only then is its inline copy
 * dropped, in a single store update once every write has been attempted. A route
 * whose write failed stays inline and is retried on the next launch, so at every
 * instant a route exists in at least one place.
 */
export function migrateInlineRoutes(): Promise<void> {
  routeMigration ??= moveInlineRoutes().finally(() => { routeMigration = null; });
  return routeMigration;
}

/** Resolves once any migration in progress has finished. */
export async function routeMigrationSettled(): Promise<void> {
  await routeMigration?.catch(() => undefined);
}

async function moveInlineRoutes(): Promise<void> {
  const sessions = useReadinessStore.getState().trackedSessions;
  const counts = new Map<string, number>();
  for (const session of sessions) counts.set(session.id, (counts.get(session.id) ?? 0) + 1);
  const moved = new Map<string, RoutePoint[]>();
  for (const session of sessions) {
    const route = inlineRoute(session);
    // Two records sharing an ID cannot share one route item; theirs stay inline.
    if (!route || counts.get(session.id) !== 1) continue;
    // Skip anything a restore or reset has replaced since this pass began.
    if (!useReadinessStore.getState().trackedSessions.includes(session)) continue;
    try {
      if (route.length) await saveRoute(session.id, route);
      moved.set(session.id, route);
    } catch { /* The inline copy stays; the next launch tries again. */ }
  }
  if (!moved.size) return;
  useReadinessStore.setState((state) => ({
    trackedSessions: state.trackedSessions.map((session) => {
      const route = inlineRoute(session);
      // Only the exact array that was written may be dropped.
      return route && moved.get(session.id) === route ? splitTrackedSession(session).summary : session;
    }),
  }));
}

export function getTodaysCheckIn(checkIns: DailyReadinessCheckIn[]) {
  return checkIns.find((item) => item.date === getLocalDateKey());
}
