import type { ExerciseLogEntry } from '../store/useExerciseLogStore';
import type { SessionSet } from '../store/useSessionStore';
import { getLocalDateKey } from '../utils/dateKey';
import { trainingWeekdays } from '../utils/trainingDays';
import { isSameCanonicalMovement } from './exerciseProvenance';

function validDay(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  return getLocalDateKey(parsed) === value ? value : null;
}

function dayFromTimestamp(value: string): string | null {
  if (value.length === 10) return validDay(value);
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? getLocalDateKey(date) : null;
}

/**
 * One performed day of training, however many workouts or activities it held.
 * Mission claims use the SCHEDULED date (a Friday mission may be done Monday),
 * so attendance comes only from timestamped logs and recorded activities.
 */
export function trainingDateKeys(
  logs: Record<string, ExerciseLogEntry[]> = {},
  activities: { date: string }[] = [],
): Set<string> {
  const dates = new Set<string>();
  for (const entries of Object.values(logs)) for (const entry of entries) {
    if (!entry.sets.length) continue;
    const date = dayFromTimestamp(entry.at);
    if (date) dates.add(date);
  }
  for (const activity of activities) {
    const date = dayFromTimestamp(activity.date);
    if (date) dates.add(date);
  }
  return dates;
}

export function mondayOfWeek(anchor = new Date()): Date {
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

export function previousWeekStart(now = new Date()): Date {
  const monday = mondayOfWeek(now);
  monday.setDate(monday.getDate() - 7);
  return monday;
}

/** Historical attendance is compared; today's preference is explicitly only the current target. */
export function summarizeTrainingWeek(dates: Iterable<string>, daysPerWeek: number | null | undefined, anchor = new Date()) {
  const start = mondayOfWeek(anchor);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const previous = new Date(start);
  previous.setDate(previous.getDate() - 7);
  const startKey = getLocalDateKey(start);
  const endKey = getLocalDateKey(end);
  const previousKey = getLocalDateKey(previous);
  const unique = new Set(Array.from(dates).filter((date) => validDay(date)));
  const trainingDays = Array.from(unique).filter((date) => date >= startKey && date < endKey).length;
  const previousTrainingDays = Array.from(unique).filter((date) => date >= previousKey && date < startKey).length;
  return { start, end, startKey, trainingDays, previousTrainingDays, currentTarget: trainingWeekdays(daysPerWeek).length };
}

export function nextTrainingDay(daysPerWeek: number | null | undefined, trained: Iterable<string>, now = new Date()) {
  const dates = new Set(trained);
  const scheduled = trainingWeekdays(daysPerWeek);
  for (let offset = 0; offset < 8; offset += 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const dateKey = getLocalDateKey(date);
    if (!scheduled.includes(date.getDay()) || dates.has(dateKey)) continue;
    const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    return { date, dateKey, label };
  }
  // Every schedule has a day within seven days; retained for defensive callers.
  return { date: new Date(now), dateKey: getLocalDateKey(now), label: 'Your next training day' };
}

export function comebackDays(dates: Iterable<string>, now = new Date()): number | null {
  const today = getLocalDateKey(now);
  const latest = Array.from(dates).filter((date) => validDay(date) && date <= today).sort().at(-1);
  if (!latest) return null;
  const ordinal = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
  const gap = ordinal(today) - ordinal(latest);
  return gap >= 7 ? gap : null;
}

export interface DebriefExercise {
  name: string;
  exerciseId: string;
  logKey: string;
  kind: 'reps' | 'time' | 'distance';
  /** A different movement sharing a demonstration clip is not a comparable exercise. */
  comparable: boolean;
  sets: SessionSet[];
}

export interface SessionWin { winTitle: string; winDetail: string; }
const positive = (value: number | undefined): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;
const weightIn = (weight: number, from: 'lb' | 'kg', to: 'lb' | 'kg') => from === to ? weight : from === 'lb' ? weight * 0.45359237 : weight / 0.45359237;
const readable = (value: number) => Number(value.toFixed(1)).toLocaleString();

/** Compare performed sets to saved history BEFORE this session is written. Never infer fitness gains from XP. */
export function sessionWin(exercises: DebriefExercise[], logs: Record<string, ExerciseLogEntry[]>, unit: 'lb' | 'kg', firstWorkout: boolean): SessionWin {
  let setsDone = 0;
  let movementCount = 0;
  for (const exercise of exercises) {
    const done = exercise.sets.filter((set) => set.done && !set.warmup);
    setsDone += done.length;
    if (done.length) movementCount += 1;
    if (!exercise.comparable || exercise.kind !== 'reps') continue;
    const history = (logs[exercise.logKey] ?? [])
      .filter((entry) => isSameCanonicalMovement(entry.movement, exercise.exerciseId))
      .filter((entry) => entry.unit === 'lb' || entry.unit === 'kg')
      .flatMap((entry) => entry.sets
        .filter((set) => set.weight === undefined || (typeof set.weight === 'number' && Number.isFinite(set.weight) && set.weight >= 0))
        .map((set) => ({ ...set, weight: weightIn(set.weight ?? 0, entry.unit, unit) })));
    if (!history.length) continue;
    for (const current of done) {
      if (!positive(current.reps)) continue;
      const load = current.weight ?? 0;
      if (!Number.isFinite(load) || load < 0) continue;
      const sameLoad = history.filter((set) => positive(set.reps) && Math.abs((set.weight ?? 0) - load) < 0.1);
      const bestReps = Math.max(0, ...sameLoad.map((set) => set.reps!));
      if (bestReps > 0 && current.reps > bestReps) return {
        winTitle: `${current.reps - bestReps} more ${current.reps - bestReps === 1 ? 'rep' : 'reps'} in a set`,
        winDetail: `${exercise.name}: ${current.reps} reps${load > 0 ? ` at ${readable(load)} ${unit}` : ''}, above your saved best of ${bestReps}${load > 0 ? ' at that load' : ''}.`,
      };
      const sameReps = history.filter((set) => set.reps === current.reps && positive(set.weight));
      const bestLoad = Math.max(0, ...sameReps.map((set) => set.weight));
      // A small tolerance avoids calling a rounded lb/kg conversion an improvement.
      if (bestLoad > 0 && load > bestLoad + 0.1) return {
        winTitle: `A heavier set at ${current.reps} reps`,
        winDetail: `${exercise.name}: ${readable(load)} ${unit}, up from your saved best of ${readable(bestLoad)} ${unit} for ${current.reps} reps.`,
      };
    }
  }
  return {
    winTitle: firstWorkout ? 'Your starting point is saved' : 'Your work is on the record',
    winDetail: `${setsDone} working ${setsDone === 1 ? 'set' : 'sets'} across ${movementCount} ${movementCount === 1 ? 'movement' : 'movements'}. ${firstWorkout ? 'Your next sessions can build on this.' : 'Every logged session gives you something real to look back on.'}`,
  };
}
