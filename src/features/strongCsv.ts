/**
 * Strong's workout CSV, read and written.
 *
 * The format is one row per SET, with the workout's identity (`Date` + `Workout
 * Name`) repeated on every row, taken from a real export:
 *
 *   Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
 *   2026-09-22 12:25:05,Strong 5x5 - Workout B,1m,Squat (Barbell),1,25.0,5.0,0,0.0,,,
 *
 * Two things about it are easy to get wrong:
 *
 * - `Set Order` is not always a number. A row with `Rest Timer` there is not a set
 *   at all — it carries that exercise's rest duration in `Seconds`. Parsing it as a
 *   set invents a 0-rep set that the athlete never performed.
 * - There is no unit column. Strong exports in whatever unit the athlete had set, so
 *   the importer has to be told, and the exporter has to say what it wrote.
 */

export type StrongRow = {
  date: string;
  workoutName: string;
  duration: string;
  exerciseName: string;
  setOrder: string;
  weight: string;
  reps: string;
  distance: string;
  seconds: string;
  notes: string;
  workoutNotes: string;
  rpe: string;
};

export const STRONG_HEADER = [
  'Date', 'Workout Name', 'Duration', 'Exercise Name', 'Set Order',
  'Weight', 'Reps', 'Distance', 'Seconds', 'Notes', 'Workout Notes', 'RPE',
] as const;

/** A row whose Set Order is this is a rest setting, not a performed set. */
const REST_TIMER_ROW = 'rest timer';

/**
 * Split one CSV line, honouring quotes.
 *
 * Exercise names and notes contain commas ("Squat (Barbell), paused"), and a naive
 * `split(',')` silently shifts every later column — which would put reps in the
 * distance field rather than failing loudly.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else field += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === ',') { out.push(field); field = ''; continue; }
    field += char;
  }
  out.push(field);
  return out;
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export type ParsedStrongWorkout = {
  /** `Date` verbatim, which is also the workout's identity along with the name. */
  startedAt: string;
  name: string;
  durationLabel: string;
  workoutNotes: string;
  exercises: {
    name: string;
    /** From the `Rest Timer` row, when the export included one. */
    restSeconds?: number;
    notes?: string;
    sets: { order: number; weight?: number; reps?: number; seconds?: number; distance?: string; rpe?: number }[];
  }[];
};

export type StrongParseResult = {
  workouts: ParsedStrongWorkout[];
  /** Lines that could not be read, with their 1-based number, for honest reporting. */
  skipped: { line: number; reason: string }[];
};

function num(value: string): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseStrongCsv(text: string): StrongParseResult {
  const lines = text.split(/\r\n|\n|\r/).filter((line) => line.trim().length);
  const skipped: StrongParseResult['skipped'] = [];
  if (!lines.length) return { workouts: [], skipped };

  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const at = (name: string) => header.indexOf(name.toLowerCase());
  const idx = {
    date: at('Date'), workoutName: at('Workout Name'), duration: at('Duration'),
    exerciseName: at('Exercise Name'), setOrder: at('Set Order'), weight: at('Weight'),
    reps: at('Reps'), distance: at('Distance'), seconds: at('Seconds'),
    notes: at('Notes'), workoutNotes: at('Workout Notes'), rpe: at('RPE'),
  };
  if (idx.date < 0 || idx.exerciseName < 0 || idx.setOrder < 0) {
    return { workouts: [], skipped: [{ line: 1, reason: 'Not a Strong export: missing Date, Exercise Name or Set Order.' }] };
  }

  // Keyed by date+name so the rows of one workout regroup no matter their order.
  const byWorkout = new Map<string, ParsedStrongWorkout>();

  lines.slice(1).forEach((line, offset) => {
    const lineNumber = offset + 2;
    const cells = splitCsvLine(line);
    const cell = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '');

    const date = cell(idx.date);
    const exerciseName = cell(idx.exerciseName);
    if (!date || !exerciseName) {
      skipped.push({ line: lineNumber, reason: 'Missing date or exercise name' });
      return;
    }

    const workoutName = cell(idx.workoutName) || 'Workout';
    const key = `${date}::${workoutName}`;
    let workout = byWorkout.get(key);
    if (!workout) {
      workout = {
        startedAt: date,
        name: workoutName,
        durationLabel: cell(idx.duration),
        workoutNotes: cell(idx.workoutNotes),
        exercises: [],
      };
      byWorkout.set(key, workout);
    }

    let exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise) {
      exercise = { name: exerciseName, sets: [] };
      workout.exercises.push(exercise);
    }

    const setOrder = cell(idx.setOrder);
    if (setOrder.toLowerCase() === REST_TIMER_ROW) {
      // Not a set: the rest configured for this exercise.
      const rest = num(cell(idx.seconds));
      if (rest) exercise.restSeconds = rest;
      return;
    }

    const order = num(setOrder);
    if (order === undefined) {
      skipped.push({ line: lineNumber, reason: `Unrecognised Set Order "${setOrder}"` });
      return;
    }

    const notes = cell(idx.notes);
    if (notes && !exercise.notes) exercise.notes = notes;

    const distance = cell(idx.distance);
    const distanceValue = num(distance);
    exercise.sets.push({
      order,
      weight: num(cell(idx.weight)) || undefined,
      reps: num(cell(idx.reps)) || undefined,
      seconds: num(cell(idx.seconds)) || undefined,
      // Strong writes a literal 0 for "no distance"; keeping it would render "0" on
      // every strength set.
      distance: distanceValue ? distance : undefined,
      rpe: num(cell(idx.rpe)),
    });
  });

  const workouts = [...byWorkout.values()];
  for (const workout of workouts) {
    for (const exercise of workout.exercises) exercise.sets.sort((a, b) => a.order - b.order);
  }
  workouts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return { workouts, skipped };
}

/** `1h 23m`, the shape Strong writes. */
export function formatStrongDuration(totalSeconds: number): string {
  const minutes = Math.max(0, Math.round(totalSeconds / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** `2026-09-22 12:25:05` in local time, which is how Strong writes its dates. */
export function formatStrongDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function toStrongCsv(rows: StrongRow[]): string {
  const body = rows.map((r) => [
    r.date, r.workoutName, r.duration, r.exerciseName, r.setOrder,
    r.weight, r.reps, r.distance, r.seconds, r.notes, r.workoutNotes, r.rpe,
  ].map(escapeCsv).join(','));
  return [STRONG_HEADER.join(','), ...body].join('\n');
}
