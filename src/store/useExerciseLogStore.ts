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

export const MAX_ENTRIES_PER_EXERCISE = 300;
/** Whole-log ceiling: a year of training shouldn't turn every set into a slower write. */
export const MAX_TRACKED_EXERCISES = 400;

interface ExerciseLogState {
  /** Keyed by the exercise's clip key (library slug) so an app exercise and its clip share history. */
  logs: Record<string, ExerciseLogEntry[]>;
  record: (key: string, entry: ExerciseLogEntry) => void;
  /** Merge many entries at once — see `mergeEntries`. */
  mergeEntries: (incoming: Record<string, ExerciseLogEntry[]>) => MergeReport;
  removeEntry: (key: string, entryId: string) => void;
}

/**
 * What a merge actually did, as opposed to what it was asked to do.
 *
 * Every number here is counted *after* the caps have been applied, because the point
 * of this type is to stop the UI reporting work the store then threw away.
 */
export type MergeReport = {
  /** Entries from this batch that are stored now. */
  entries: number;
  /** Sets inside those surviving entries. */
  sets: number;
  /** Exercises that gained at least one entry. */
  exercises: number;
  /** Previously-stored entries the caps pushed out to make room. */
  evictedEntries: number;
  /** Previously-tracked exercises dropped whole to make room. */
  evictedExercises: number;
};

/**
 * The merge itself, as a pure function of the log before and the batch coming in.
 *
 * Kept out of the store so it can be exercised directly — the counts it returns are
 * what the import screen tells someone happened to their training history, and
 * "1,800 sets imported" when 1,200 were kept is the kind of claim that has to be
 * testable rather than merely reasoned about.
 */
export function mergeLogs(
  before: Record<string, ExerciseLogEntry[]>,
  incoming: Record<string, ExerciseLogEntry[]>,
): { logs: Record<string, ExerciseLogEntry[]>; report: MergeReport } {
  const logs = { ...before };
  const freshIds = new Map<string, Set<string>>();

  for (const [key, entries] of Object.entries(incoming)) {
    if (!entries.length) continue;
    const existing = logs[key] ?? [];
    const seen = new Set(existing.map((e) => e.id));
    const fresh: ExerciseLogEntry[] = [];
    for (const entry of entries) {
      // Deduped against the batch as well as against storage: two source workouts
      // can normalise onto one instant (a CSV whose dates lost their clock time),
      // and writing both would store one entry twice under a single id, which
      // `removeEntry` would then delete in pairs.
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      fresh.push(entry);
    }
    if (!fresh.length) continue;
    freshIds.set(key, new Set(fresh.map((e) => e.id)));
    logs[key] = [...existing, ...fresh]
      .sort((a, b) => a.at.localeCompare(b.at))
      .slice(-MAX_ENTRIES_PER_EXERCISE);
  }

  const keys = Object.keys(logs);
  let evictedExercises = 0;
  if (keys.length > MAX_TRACKED_EXERCISES) {
    // Same rule as `record`: whatever was trained longest ago goes first.
    const stalest = keys
      .sort((a, b) => (logs[a].at(-1)?.at ?? '').localeCompare(logs[b].at(-1)?.at ?? ''))
      .slice(0, keys.length - MAX_TRACKED_EXERCISES);
    for (const key of stalest) {
      if (before[key]?.length) evictedExercises += 1;
      delete logs[key];
    }
  }

  let entries = 0;
  let sets = 0;
  let exercises = 0;
  for (const [key, ids] of freshIds) {
    let landedHere = 0;
    for (const entry of logs[key] ?? []) {
      if (!ids.has(entry.id)) continue;
      landedHere += 1;
      sets += entry.sets.length;
    }
    if (landedHere) exercises += 1;
    entries += landedHere;
  }

  let evictedEntries = 0;
  for (const [key, was] of Object.entries(before)) {
    const now = logs[key];
    if (!now) { evictedEntries += was.length; continue; }
    const surviving = new Set(now.map((e) => e.id));
    for (const entry of was) if (!surviving.has(entry.id)) evictedEntries += 1;
  }

  return { logs, report: { entries, sets, exercises, evictedEntries, evictedExercises } };
}

export const useExerciseLogStore = create<ExerciseLogState>()(
  persist(
    (set, get) => ({
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
      /**
       * Merge a batch of entries in one write — the import path.
       *
       * Calling `record` in a loop would re-serialise the whole log to AsyncStorage
       * once per entry; a few hundred imported sessions made that a visible freeze.
       *
       * Entries are deduped by `id`, which for an import is derived from the source
       * workout's own identity, so importing the same file twice adds nothing the
       * second time instead of doubling someone's history.
       *
       * Everything in the returned `MergeReport` is counted against the log as it
       * ends up, never against what was handed in. Two things make those differ, and
       * both are invisible to the caller otherwise:
       *
       * - The caps discard the overflow. Reporting the attempted count told an
       *   athlete with years of history that 1,800 sets had imported when 1,200 were
       *   kept.
       * - The caps evict the *oldest*, so importing data newer than what is already
       *   logged deletes existing entries. That is the long-standing policy — but as
       *   one large batch rather than gradually while training, so it has to be
       *   reported rather than absorbed in silence.
       */
      mergeEntries: (incoming) => {
        const { logs, report } = mergeLogs(get().logs, incoming);
        set({ logs });
        return report;
      },
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
