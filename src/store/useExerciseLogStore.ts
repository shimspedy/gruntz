import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** One completed set, as logged. Weight is in `unit` (the user's setting when they lifted it). */
export interface LoggedSet {
  reps?: number;
  weight?: number;
  seconds?: number;
  distance?: string;
}

/** Every completed set of one exercise in one workout. */
export interface ExerciseLogEntry {
  id: string;
  /** ISO timestamp the workout was finished. */
  at: string;
  workoutTitle: string;
  unit: 'lb' | 'kg';
  sets: LoggedSet[];
}

const MAX_ENTRIES_PER_EXERCISE = 300;
/** Whole-log ceiling: a year of training shouldn't turn every set into a slower write. */
const MAX_TRACKED_EXERCISES = 400;

interface ExerciseLogState {
  /** Keyed by the exercise's clip key (library slug) so an app exercise and its clip share history. */
  logs: Record<string, ExerciseLogEntry[]>;
  record: (key: string, entry: ExerciseLogEntry) => void;
  removeEntry: (key: string, entryId: string) => void;
}

export const useExerciseLogStore = create<ExerciseLogState>()(
  persist(
    (set) => ({
      logs: {},
      record: (key, entry) =>
        set((s) => {
          const list = [...(s.logs[key] ?? []).filter((e) => e.id !== entry.id), entry];
          list.sort((a, b) => a.at.localeCompare(b.at));
          const logs = { ...s.logs, [key]: list.slice(-MAX_ENTRIES_PER_EXERCISE) };
          const keys = Object.keys(logs);
          if (keys.length > MAX_TRACKED_EXERCISES) {
            // Drop whichever exercise was trained longest ago, never the one being logged.
            const oldest = keys
              .filter((k) => k !== key)
              .sort((a, b) => (logs[a][logs[a].length - 1]?.at ?? '').localeCompare(logs[b][logs[b].length - 1]?.at ?? ''))[0];
            if (oldest) delete logs[oldest];
          }
          return { logs };
        }),
      removeEntry: (key, entryId) =>
        set((s) => ({ logs: { ...s.logs, [key]: (s.logs[key] ?? []).filter((e) => e.id !== entryId) } })),
    }),
    { name: '@gruntz_exercise_log', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

// ─── Derived numbers (all computed from the log, never stored) ─────────────

export const KG_PER_LB = 0.45359237;

export function toUnit(weight: number, from: 'lb' | 'kg', to: 'lb' | 'kg'): number {
  if (from === to) return weight;
  return to === 'kg' ? weight * KG_PER_LB : weight / KG_PER_LB;
}

/** Epley estimate; only meaningful for weighted sets of 1–12 reps. */
export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export interface SessionSummary {
  entry: ExerciseLogEntry;
  date: Date;
  totalReps: number;
  maxReps: number;
  /** Heaviest single set, in the display unit. */
  bestWeight: number;
  /** sum(weight × reps), in the display unit. */
  volume: number;
  best1RM: number;
  totalSeconds: number;
  bestSet: LoggedSet | null;
}

export function summarize(entry: ExerciseLogEntry, unit: 'lb' | 'kg'): SessionSummary {
  let totalReps = 0;
  let maxReps = 0;
  let bestWeight = 0;
  let volume = 0;
  let best1RM = 0;
  let totalSeconds = 0;
  let bestSet: LoggedSet | null = null;
  let bestScore = -1;
  for (const st of entry.sets) {
    const reps = st.reps ?? 0;
    const w = st.weight ? toUnit(st.weight, entry.unit, unit) : 0;
    totalReps += reps;
    maxReps = Math.max(maxReps, reps);
    bestWeight = Math.max(bestWeight, w);
    volume += w * reps;
    totalSeconds += st.seconds ?? 0;
    const e1 = reps <= 12 ? estimated1RM(w, reps) : 0;
    best1RM = Math.max(best1RM, e1);
    // Sets are ranked within their own kind, and kinds are ranked against each
    // other: loaded work beats bodyweight reps beats a timed hold. Scoring them on
    // one number meant a 60-second plank outranked a 15-rep set of the same
    // movement purely because 60 > 15.
    const tier = w > 0 ? 2 : reps > 0 ? 1 : 0;
    const within = w > 0 ? e1 || w : reps || st.seconds || 0;
    const score = tier * 1e6 + within;
    if (score > bestScore) {
      bestScore = score;
      bestSet = st;
    }
  }
  return { entry, date: new Date(entry.at), totalReps, maxReps, bestWeight, volume, best1RM, totalSeconds, bestSet };
}

/** Each time a metric beat its previous best, oldest first. */
export function recordProgression(sessions: SessionSummary[], pick: (s: SessionSummary) => number): { value: number; date: Date }[] {
  const out: { value: number; date: Date }[] = [];
  // Starting from zero hid the very first session whenever its value was zero, so
  // a progression chart could open with no baseline to improve on.
  let best = Number.NEGATIVE_INFINITY;
  for (const s of sessions) {
    const v = pick(s);
    if (v > best) {
      best = v;
      out.push({ value: v, date: s.date });
    }
  }
  return out;
}
