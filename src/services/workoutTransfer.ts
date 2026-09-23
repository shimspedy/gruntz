import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { matchExercise } from '../features/exerciseMatch';
import {
  formatStrongDate,
  parseStrongCsv,
  toStrongCsv,
  type ParsedStrongWorkout,
  type StrongRow,
} from '../features/strongCsv';
import { getLibraryItem } from '../data/exerciseLibrary';
import {
  MAX_ENTRIES_PER_EXERCISE,
  MAX_TRACKED_EXERCISES,
  toUnit,
  useExerciseLogStore,
  type ExerciseLogEntry,
} from '../store/useExerciseLogStore';
import { useExerciseNotesStore } from '../store/useExerciseNotesStore';

/**
 * Taking training history in and out of Gruntz, in Strong's CSV format.
 *
 * Strong's export is the de-facto interchange format for lifting apps, so using it
 * means an athlete arriving from Strong can bring their history, and one leaving
 * Gruntz can take it with them. Nobody's training should be locked in an app.
 *
 * Two deliberate limits, both of which the UI states rather than papering over:
 *
 * - Gruntz stores no per-workout duration and no per-exercise rest. Those columns
 *   are written empty rather than filled with a plausible-looking guess.
 * - Strong's CSV has no unit column. A file is imported in one unit, chosen by the
 *   athlete, and exported in one unit, named in the file.
 */

export type Unit = 'lb' | 'kg';

/** Rounded to 2dp for display; the conversion itself is the store's exact one. */
function convert(weight: number, from: Unit, to: Unit): number {
  if (from === to) return weight;
  return Math.round(toUnit(weight, from, to) * 100) / 100;
}

// ─── Export ────────────────────────────────────────────────────────────────

export type ExportOptions = {
  /** Write each exercise's saved note into the Notes column. */
  includeNotes: boolean;
  /** Everything is written in this unit — see `convert`. */
  unit: Unit;
};

export type ExportResult =
  | { status: 'shared'; workouts: number; sets: number; fileName: string }
  | { status: 'empty' }
  | { status: 'unavailable' }
  | { status: 'error' };

/**
 * One row per set, workouts ordered oldest first.
 *
 * Every entry logged at the same instant belongs to one workout — that is how a
 * finished session writes them — so grouping on the timestamp reassembles the
 * session without Gruntz having to store a session id.
 */
function buildRows(options: ExportOptions): StrongRow[] {
  const { logs } = useExerciseLogStore.getState();
  const { notes } = useExerciseNotesStore.getState();

  type Pending = { at: string; title: string; key: string; entry: ExerciseLogEntry };
  const pending: Pending[] = [];
  for (const [key, entries] of Object.entries(logs)) {
    for (const entry of entries) pending.push({ at: entry.at, title: entry.workoutTitle, key, entry });
  }

  pending.sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));

  const rows: StrongRow[] = [];
  for (const { at, title, key, entry } of pending) {
    const name = getLibraryItem(key)?.name ?? key;
    const note = options.includeNotes ? (notes[key] ?? '') : '';
    entry.sets.forEach((set, index) => {
      const weight = set.weight !== undefined ? convert(set.weight, entry.unit, options.unit) : undefined;
      rows.push({
        date: formatStrongDate(at),
        workoutName: title || 'Workout',
        // Gruntz does not persist how long a session took, so this stays empty
        // rather than being invented from the number of sets.
        duration: '',
        exerciseName: name,
        setOrder: String(index + 1),
        weight: weight !== undefined ? String(weight) : '',
        reps: set.reps !== undefined ? String(set.reps) : '',
        distance: set.distance ?? '',
        seconds: set.seconds !== undefined ? String(set.seconds) : '',
        notes: note,
        workoutNotes: '',
        rpe: '',
      });
    });
  }
  return rows;
}

export async function exportWorkouts(options: ExportOptions): Promise<ExportResult> {
  try {
    const rows = buildRows(options);
    if (!rows.length) return { status: 'empty' };

    if (!(await Sharing.isAvailableAsync())) return { status: 'unavailable' };

    // The unit is in the name because the format has nowhere else to put it.
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `gruntz_workouts_${stamp}_${options.unit}.csv`;
    const file = new File(Paths.cache, fileName);
    // A previous export of the same day would otherwise make `create` throw.
    if (file.exists) file.delete();
    file.create();
    file.write(toStrongCsv(rows));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Export workouts',
    });

    const workouts = new Set(rows.map((r) => r.date)).size;
    return { status: 'shared', workouts, sets: rows.length, fileName };
  } catch (error) {
    if (__DEV__) console.warn('[transfer] exportWorkouts failed', error);
    return { status: 'error' };
  }
}

// ─── Import ────────────────────────────────────────────────────────────────

/** One exercise found in the file, and what will become of it. */
export type ImportPlanRow = {
  foreignName: string;
  sets: number;
  sessions: number;
  /** `null` when the Gruntz library has no equivalent movement. */
  match: { key: string; name: string } | null;
};

export type ImportPlan = {
  fileName: string;
  rows: ImportPlanRow[];
  workouts: number;
  firstDate: string | null;
  lastDate: string | null;
  /** Rows the parser could not read, reported rather than silently dropped. */
  skippedLines: number;
  /** Kept so the unit can be changed before committing. */
  parsed: ParsedStrongWorkout[];
};

export type PickResult =
  | { status: 'ready'; plan: ImportPlan }
  | { status: 'canceled' }
  | { status: 'not-strong' }
  | { status: 'empty' }
  | { status: 'error' };

/**
 * Read a file and work out what it would do — without touching the log.
 *
 * Nothing is written here on purpose. The athlete sees the whole plan first,
 * including the exercises that will *not* come across, and then decides. An import
 * that silently drops a third of someone's history is the thing this prevents.
 */
export async function pickImportFile(): Promise<PickResult> {
  try {
    // MIME types, not UTIs — iOS maps these through `UTType(mimeType:)` and silently
    // drops anything it cannot map. `text/plain` is included because a CSV that
    // reached Files without a proper type would otherwise be greyed out in the
    // picker, leaving the athlete unable to select the very file they came to import.
    // Picking the wrong kind of file is recoverable; not being able to pick is not.
    const picked = await File.pickFileAsync({ mimeTypes: ['text/csv', 'text/plain'] });
    if (picked.canceled || !picked.result) return { status: 'canceled' };

    const file = picked.result;
    const text = await file.text();
    const { workouts, skipped } = parseStrongCsv(text);

    if (!workouts.length) {
      const looksWrong = skipped.some((s) => s.line === 1);
      return { status: looksWrong ? 'not-strong' : 'empty' };
    }

    return { status: 'ready', plan: buildPlan(file.name, workouts, skipped.length) };
  } catch (error) {
    if (__DEV__) console.warn('[transfer] pickImportFile failed', error);
    return { status: 'error' };
  }
}

export function buildPlan(fileName: string, parsed: ParsedStrongWorkout[], skippedLines: number): ImportPlan {
  const byName = new Map<string, ImportPlanRow>();

  for (const workout of parsed) {
    for (const exercise of workout.exercises) {
      if (!exercise.sets.length) continue;
      let row = byName.get(exercise.name);
      if (!row) {
        const found = matchExercise(exercise.name);
        row = {
          foreignName: exercise.name,
          sets: 0,
          sessions: 0,
          match: found ? { key: found.key, name: found.name } : null,
        };
        byName.set(exercise.name, row);
      }
      row.sets += exercise.sets.length;
      row.sessions += 1;
    }
  }

  // Matched first, each group heaviest-used first: the athlete reads what matters
  // before the exceptions, and the exceptions stay together at the bottom.
  const rows = [...byName.values()].sort((a, b) => {
    if (!!a.match !== !!b.match) return a.match ? -1 : 1;
    return b.sets - a.sets || a.foreignName.localeCompare(b.foreignName);
  });

  const dates = parsed.map((w) => w.startedAt).sort();
  return {
    fileName,
    rows,
    workouts: parsed.length,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
    skippedLines,
    parsed,
  };
}

/**
 * Whether committing this plan would run into the log's caps — checked *before* it
 * is committed.
 *
 * Gruntz keeps a bounded history and evicts the oldest to stay inside it. During
 * normal training that ceiling is reached one session at a time and nobody notices.
 * An import arrives as one batch and can cross it immediately, deleting sessions
 * already on the phone. Telling someone afterwards is not consent, so the review
 * screen asks this first and says so while they can still back out.
 */
export function estimateCapPressure(plan: ImportPlan): {
  crowdedExercises: number;
  exceedsExerciseCeiling: boolean;
} {
  const { logs } = useExerciseLogStore.getState();
  const keyByName = new Map<string, string>();
  for (const row of plan.rows) if (row.match) keyByName.set(row.foreignName, row.match.key);

  const incomingByKey = new Map<string, number>();
  for (const workout of plan.parsed) {
    for (const exercise of workout.exercises) {
      const key = keyByName.get(exercise.name);
      if (!key || !exercise.sets.length) continue;
      incomingByKey.set(key, (incomingByKey.get(key) ?? 0) + 1);
    }
  }

  let crowdedExercises = 0;
  for (const [key, count] of incomingByKey) {
    if ((logs[key]?.length ?? 0) + count > MAX_ENTRIES_PER_EXERCISE) crowdedExercises += 1;
  }

  const union = new Set([...Object.keys(logs), ...incomingByKey.keys()]);
  return { crowdedExercises, exceedsExerciseCeiling: union.size > MAX_TRACKED_EXERCISES };
}

/** `2026-09-22 12:25:05` (local, as Strong writes it) -> an ISO instant. */
function toIso(strongDate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(strongDate.trim());
  if (!m) {
    const fallback = new Date(strongDate);
    return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
  }
  const [, y, mo, d, h, min, s] = m;
  // Built field by field rather than handed to `new Date(string)`, whose handling of
  // a space-separated date is engine-dependent — on one engine local, on another
  // UTC, which would shift every imported workout by the timezone offset.
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(min), Number(s ?? '0'));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * What the import did. Every count is post-cap — see `mergeEntries`.
 *
 * `sets` and `exercises` are what is *stored now*, not what the file offered, so the
 * screen can never congratulate someone on history the log immediately discarded.
 */
export type ImportResult = {
  entries: number;
  sets: number;
  exercises: number;
  /** In the file, but with no library match — never written. */
  skippedExercises: number;
  /** Sets the caps refused to store. */
  droppedSets: number;
  /** Existing entries the caps evicted to make room for the import. */
  evictedEntries: number;
  evictedExercises: number;
};

/**
 * Write the plan into the exercise log.
 *
 * Only matched exercises are written. An unmatched name has no library key, and the
 * log is only ever read *by* key — so inventing one would store data that no screen
 * can ever display: invisible, unreachable, and impossible to delete from the UI.
 * Reporting the gap is the honest outcome.
 */
export function applyImport(plan: ImportPlan, unit: Unit): ImportResult {
  const keyByName = new Map<string, string>();
  for (const row of plan.rows) if (row.match) keyByName.set(row.foreignName, row.match.key);

  const incoming: Record<string, ExerciseLogEntry[]> = {};
  let sets = 0;

  for (const workout of plan.parsed) {
    const at = toIso(workout.startedAt);
    if (!at) continue;

    for (const exercise of workout.exercises) {
      const key = keyByName.get(exercise.name);
      if (!key || !exercise.sets.length) continue;

      const entry: ExerciseLogEntry = {
        // Derived from the source workout so re-importing the same file is a no-op
        // rather than a second copy of everything.
        //
        // Built from the normalised instant, not the raw `Date` cell: `09:05` and
        // `09:05:00` are the same workout, and keying on the raw text would give them
        // two different ids and import that session twice.
        //
        // The workout name is part of it because the instant alone is not always
        // unique. Opening the CSV in a spreadsheet and saving it rewrites the Date
        // column to `9/22/2026`, dropping the clock — every workout that day then
        // normalises to midnight, and two sessions sharing an exercise would collide
        // on one id. Date + name is exactly how the source file itself identifies a
        // workout, so this matches its own grouping.
        id: `strong:${at}:${workout.name}:${key}`,
        at,
        workoutTitle: workout.name || 'Imported workout',
        unit,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          seconds: set.seconds,
          distance: set.distance,
        })),
      };
      sets += entry.sets.length;
      (incoming[key] ??= []).push(entry);
    }
  }

  const report = useExerciseLogStore.getState().mergeEntries(incoming);
  return {
    entries: report.entries,
    sets: report.sets,
    exercises: report.exercises,
    skippedExercises: plan.rows.filter((r) => !r.match).length,
    // `sets` here was the number built; the report's is the number kept.
    droppedSets: Math.max(0, sets - report.sets),
    evictedEntries: report.evictedEntries,
    evictedExercises: report.evictedExercises,
  };
}
