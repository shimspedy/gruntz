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
function csvRecords(text: string): { cells: string[]; line: number; malformed: boolean }[] {
  const records: { cells: string[]; line: number; malformed: boolean }[] = [];
  let cells: string[] = [];
  let field = '';
  let quoted = false;
  let line = 1;
  let startLine = 1;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      const newline = char === '\r' && text[i + 1] === '\n' ? '\r\n' : char;
      if (newline.length === 2) i += 1;
      if (quoted) field += newline;
      else {
        cells.push(field);
        if (cells.some((cell) => cell.trim())) records.push({ cells, line: startLine, malformed: false });
        cells = []; field = ''; startLine = line + 1;
      }
      line += 1;
    } else field += char;
  }
  cells.push(field);
  if (cells.some((cell) => cell.trim())) records.push({ cells, line: startLine, malformed: quoted });
  return records;
}

/** Strong uses local timestamps; ISO exports with explicit offsets retain theirs. */
export function parseStrongDate(value: string): string | null {
  const text = value.trim();
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(text);
  if (local) {
    const [, y, mo, d, h = '0', min = '0', s = '0'] = local;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(min), Number(s));
    // JavaScript rolls February 30 into March; reject it instead of changing history.
    if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1
      || date.getDate() !== Number(d) || date.getHours() !== Number(h)
      || date.getMinutes() !== Number(min) || date.getSeconds() !== Number(s)) return null;
    return date.toISOString();
  }
  // Only accept an explicit offset for ISO timestamps, avoiding engine-dependent
  // interpretation of unknown date formats on Hermes versus the browser.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    const ms = Date.parse(text);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }
  const spreadsheetDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (spreadsheetDate) {
    const [, month, day, year] = spreadsheetDate;
    return parseStrongDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  return null;
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
  const lines = csvRecords(text.replace(/^\uFEFF/, ''));
  const skipped: StrongParseResult['skipped'] = [];
  if (!lines.length) return { workouts: [], skipped };

  const header = lines[0]!.cells.map((h) => h.trim().toLowerCase());
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

  lines.slice(1).forEach(({ cells, line: lineNumber, malformed }) => {
    if (malformed) { skipped.push({ line: lineNumber, reason: 'Unclosed CSV quote' }); return; }
    const cell = (i: number) => (i >= 0 ? (cells[i] ?? '').trim() : '');

    const date = cell(idx.date);
    const exerciseName = cell(idx.exerciseName);
    if (!date || !exerciseName) {
      skipped.push({ line: lineNumber, reason: 'Missing date or exercise name' });
      return;
    }

    if (!parseStrongDate(date)) {
      skipped.push({ line: lineNumber, reason: 'Invalid workout date' });
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
    if (order === undefined || !Number.isInteger(order) || order < 1) {
      skipped.push({ line: lineNumber, reason: `Unrecognised Set Order "${setOrder}"` });
      return;
    }

    const notes = cell(idx.notes);
    if (notes && !exercise.notes) exercise.notes = notes;

    const distance = cell(idx.distance);
    const distanceValue = num(distance);
    const weight = num(cell(idx.weight));
    const reps = num(cell(idx.reps));
    const seconds = num(cell(idx.seconds));
    if ([weight, reps, seconds].some((value) => value !== undefined && value < 0)
      || (reps !== undefined && !Number.isInteger(reps))) {
      skipped.push({ line: lineNumber, reason: 'Invalid set values' });
      return;
    }
    exercise.sets.push({
      order,
      weight,
      reps: reps || undefined,
      seconds: seconds || undefined,
      // Strong writes a literal 0 for "no distance"; keeping it would render "0" on
      // every strength set.
      distance: distance && distanceValue !== 0 ? distance : undefined,
      rpe: num(cell(idx.rpe)),
    });
  });

  const workouts = [...byWorkout.values()].map((workout) => ({
    ...workout, exercises: workout.exercises.filter((exercise) => exercise.sets.length > 0),
  })).filter((workout) => workout.exercises.length > 0);
  for (const workout of workouts) {
    for (const exercise of workout.exercises) exercise.sets.sort((a, b) => a.order - b.order);
  }
  workouts.sort((a, b) => parseStrongDate(a.startedAt)!.localeCompare(parseStrongDate(b.startedAt)!));
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
