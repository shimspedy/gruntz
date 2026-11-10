/**
 * What the phone and the Gruntz watch app say to each other. The phone owns the
 * workout; the watch shows it and sends back what the athlete did on the wrist.
 * Pure data and validation only, so both directions can be tested without a watch.
 */

export const WATCH_PROTOCOL = 1;
const MAX_EXERCISES = 40;
const MAX_SETS = 12;
const MAX_WORKOUTS = 12;
/** A start that sat in a queue this long is no longer what the athlete is asking for. */
export const START_MAX_AGE_MS = 2 * 60_000;
export const FINISH_MAX_AGE_MS = 15 * 60_000;

export type WatchSetKind = 'reps' | 'time' | 'distance';

export interface WatchSet {
  id: string;
  warmup?: boolean;
  reps?: number;
  weight?: number;
  seconds?: number;
  distance?: string;
  done: boolean;
}

export interface WatchExercise {
  key: string;
  name: string;
  kind: WatchSetKind;
  weighted: boolean;
  /** Seconds of rest after a set of this exercise. */
  rest: number;
  required: number;
  sets: WatchSet[];
}

export interface WatchLive {
  /** The session's start time: a later workout never accepts an earlier one's commands. */
  id: number;
  title: string;
  startedAt: number;
  index: number;
  restEndsAt: number | null;
  exercises: WatchExercise[];
}

/** A workout the watch can ask the phone to start. */
export interface WatchWorkout {
  id: string;
  title: string;
  detail: string;
  /** Needs Gruntz Pro; the watch says so instead of failing silently. */
  locked?: boolean;
}

export interface WatchResult {
  session: number;
  xp: number;
  sets: number;
  minutes: number;
  personalRecords: number;
}

export interface WatchNotice { at: number; text: string }

export interface WatchState {
  v: number;
  unit: 'lb' | 'kg';
  live: WatchLive | null;
  workouts: WatchWorkout[];
  /** The last workout finished from the wrist, so the watch can show what it earned. */
  result: WatchResult | null;
  /** Why the last request from the watch did nothing. */
  notice: WatchNotice | null;
}

export interface WatchSessionView {
  active: boolean;
  title: string;
  startedAt: number | null;
  index: number;
  restEndsAt: number | null;
  exercises: {
    key: string;
    name: string;
    kind: WatchSetKind;
    weighted: boolean;
    rest: number;
    requiredSets: number;
    sets: WatchSet[];
  }[];
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
/** The watch turns these into integers; a value outside what a workout can hold must never reach it. */
const clampTo = (value: number, max: number) => Math.max(0, Math.min(value, max));
const wholeTo = (value: unknown, max: number) => (finite(value) ? clampTo(Math.round(value), max) : 0);
const MAX_REST_SECONDS = 3600;
const MAX_REST_AHEAD_MS = 24 * 60 * 60_000;

/** The running workout as the watch needs it, or null when none is open. */
export function watchLive(session: WatchSessionView, now: number): WatchLive | null {
  if (!session.active || session.startedAt === null || !session.exercises.length) return null;
  const exercises = session.exercises.slice(0, MAX_EXERCISES);
  return {
    id: session.startedAt,
    title: clip(session.title || 'Workout', 80),
    startedAt: session.startedAt,
    index: wholeTo(session.index, exercises.length - 1),
    restEndsAt: finite(session.restEndsAt) && session.restEndsAt > now ? Math.min(Math.round(session.restEndsAt), now + MAX_REST_AHEAD_MS) : null,
    exercises: exercises.map((exercise) => ({
      key: exercise.key,
      name: clip(exercise.name, 80),
      kind: exercise.kind,
      weighted: exercise.weighted,
      rest: wholeTo(exercise.rest, MAX_REST_SECONDS),
      required: wholeTo(exercise.requiredSets, 99),
      sets: exercise.sets.slice(0, MAX_SETS).map((set) => ({
        id: set.id,
        ...(set.warmup ? { warmup: true } : {}),
        ...(finite(set.reps) ? { reps: clampTo(set.reps, 9999) } : {}),
        ...(finite(set.weight) ? { weight: clampTo(set.weight, 99_999) } : {}),
        ...(finite(set.seconds) ? { seconds: clampTo(set.seconds, 86_400) } : {}),
        ...(set.distance ? { distance: clip(set.distance, 40) } : {}),
        done: set.done,
      })),
    })),
  };
}

export function watchState(input: Omit<WatchState, 'v' | 'workouts'> & { workouts: WatchWorkout[] }): WatchState {
  return {
    v: WATCH_PROTOCOL,
    unit: input.unit,
    live: input.live,
    workouts: input.workouts.slice(0, MAX_WORKOUTS).map((workout) => ({
      id: workout.id, title: clip(workout.title, 80), detail: clip(workout.detail, 80), ...(workout.locked ? { locked: true } : {}),
    })),
    result: input.result && {
      session: input.result.session, xp: wholeTo(input.result.xp, 1e9), sets: wholeTo(input.result.sets, 1e6),
      minutes: wholeTo(input.result.minutes, 1e6), personalRecords: wholeTo(input.result.personalRecords, 1e6),
    },
    notice: input.notice,
  };
}

export type WatchCommand =
  | { id: string; t: 'log'; at: number; session: number; exKey: string; setId: string; reps?: number; weight?: number; seconds?: number }
  | { id: string; t: 'start'; at: number; workout: string }
  | { id: string; t: 'finish'; at: number; session: number }
  | { id: string; t: 'rest'; at: number; session: number; action: 'skip' | 'add'; seconds: number }
  | { id: string; t: 'sync'; at: number };

const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;
const whole = (value: unknown, min: number, max: number): value is number => finite(value) && Number.isInteger(value) && value >= min && value <= max;
const optional = <T,>(value: unknown, check: (v: unknown) => v is T): value is T | undefined => value === undefined || check(value);

/**
 * One command from the watch, or null when it is not one. The watch is the athlete's
 * own device, but this is still a parser on a wire: every field is bounded and anything
 * unexpected is dropped rather than passed on to the workout.
 */
export function parseWatchCommand(raw: unknown): WatchCommand | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (!text(c.id, 64) || !finite(c.at) || c.at < 0 || c.at > 8.64e15) return null;
  const base = { id: c.id, at: c.at };
  switch (c.t) {
    case 'log': {
      const reps = (v: unknown): v is number => whole(v, 1, 999);
      const weight = (v: unknown): v is number => finite(v) && v >= 0 && v <= 2000;
      const seconds = (v: unknown): v is number => whole(v, 1, 36_000);
      if (!finite(c.session) || !text(c.exKey, 300) || !text(c.setId, 64)
        || !optional(c.reps, reps) || !optional(c.weight, weight) || !optional(c.seconds, seconds)) return null;
      return {
        ...base, t: 'log', session: c.session, exKey: c.exKey, setId: c.setId,
        ...(c.reps !== undefined ? { reps: c.reps } : {}),
        ...(c.weight !== undefined ? { weight: Math.round(c.weight * 100) / 100 } : {}),
        ...(c.seconds !== undefined ? { seconds: c.seconds } : {}),
      };
    }
    case 'start':
      return text(c.workout, 300) ? { ...base, t: 'start', workout: c.workout } : null;
    case 'finish':
      return finite(c.session) ? { ...base, t: 'finish', session: c.session } : null;
    case 'rest':
      if (!finite(c.session) || (c.action !== 'skip' && c.action !== 'add')) return null;
      return { ...base, t: 'rest', session: c.session, action: c.action, seconds: c.action === 'add' && whole(c.seconds, -600, 600) ? c.seconds : 0 };
    case 'sync':
      return { ...base, t: 'sync' };
    default:
      return null;
  }
}

/** Every valid command in a drained queue, oldest first, each ID once. */
export function parseWatchCommands(raw: unknown, seen: Set<string> = new Set()): WatchCommand[] {
  if (!Array.isArray(raw)) return [];
  const commands: WatchCommand[] = [];
  for (const entry of raw.slice(0, 500)) {
    const command = parseWatchCommand(entry);
    if (!command || seen.has(command.id)) continue;
    seen.add(command.id);
    commands.push(command);
  }
  return commands.sort((a, b) => a.at - b.at);
}

export type WatchWorkoutRef =
  | { source: 'program'; dateKey: string; workoutId: string }
  | { source: 'plan'; planId: string; dayId: string }
  | { source: 'routine'; routineId: string };

export const programWorkoutRef = (dateKey: string, workoutId: string) => `program:${dateKey}:${workoutId}`;
export const planWorkoutRef = (planId: string, dayId: string) => `plan:${planId}:${dayId}`;
export const routineWorkoutRef = (routineId: string) => `routine:${routineId}`;

/** Reads back an ID this file handed to the watch; null for anything else. */
export function parseWorkoutRef(id: string): WatchWorkoutRef | null {
  const program = /^program:(\d{4}-\d{2}-\d{2}):(.+)$/.exec(id);
  if (program) return { source: 'program', dateKey: program[1]!, workoutId: program[2]! };
  const plan = /^plan:([^:]+):([^:]+)$/.exec(id);
  if (plan) return { source: 'plan', planId: plan[1]!, dayId: plan[2]! };
  const routine = /^routine:(.+)$/.exec(id);
  if (routine) return { source: 'routine', routineId: routine[1]! };
  return null;
}
