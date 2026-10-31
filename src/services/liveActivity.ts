import { AppState } from 'react-native';
import { getExerciseById } from '../data/exercises';
import { hasSetResult, useSessionStore, type SessionExercise, type SessionSet } from '../store/useSessionStore';
import { useUserStore } from '../store/useUserStore';
import { drainNativeLoggedSets, endNativeLiveActivity, liveActivitySupported, syncNativeLiveActivity } from '../../modules/gruntz-live-activity';
import { reportHandled } from './crashReporting';

/** How many sets ahead the Lock Screen can log without the app. */
const UPCOMING = 8;

export type LiveUpcomingSet = { exKey: string; setId: string; exerciseName: string; setLabel: string; detail: string; restSeconds: number };
export type LiveWorkoutPayload = {
  title: string;
  startedAt: number;
  state: {
    exerciseName: string;
    setLabel: string;
    detail: string;
    exercisesDone: number;
    exercisesTotal: number;
    restEndsAt: number | null;
    lastActivityAt: number;
    upcoming: LiveUpcomingSet[];
    loggedFromLockScreen: number;
  };
};

type SessionView = {
  active: boolean;
  title: string;
  startedAt: number | null;
  lastActivityAt: number | null;
  restEndsAt: number | null;
  index: number;
  exercises: SessionExercise[];
  restFor: (exerciseId: string, slotKey?: string) => number;
};

const exerciseName = (e: SessionExercise) => e.prescribedName ?? getExerciseById(e.exerciseId)?.name ?? 'Exercise';

function setDetail(e: SessionExercise, set: SessionSet, unit: string): string {
  const parts: string[] = [];
  if (e.kind === 'reps' && set.reps) parts.push(`${set.reps} reps`);
  if (e.kind === 'time' && set.seconds) parts.push(set.seconds >= 60 ? `${Math.floor(set.seconds / 60)}:${String(set.seconds % 60).padStart(2, '0')}` : `${set.seconds}s`);
  if (e.kind === 'distance' && set.distance) parts.push(set.distance);
  if (e.weighted && set.weight) parts.push(`${set.weight} ${unit}`);
  if (set.warmup) parts.push('warm-up');
  return parts.join(' · ');
}

function setLabel(e: SessionExercise, set: SessionSet): string {
  if (set.warmup) return 'Warm-up set';
  const working = e.sets.filter((s) => !s.warmup);
  return `Set ${working.findIndex((s) => s.id === set.id) + 1} of ${working.length}`;
}

const isDone = (e: SessionExercise) => e.sets.filter((s) => !s.warmup && s.done).length >= e.requiredSets;

/**
 * What the Lock Screen and Dynamic Island show for a running workout, and the sets
 * they can log on their own. Only sets with a prescribed result are offered: an
 * AMRAP or a cleared field needs the athlete's number, so it waits for the app.
 */
export function liveWorkoutPayload(s: SessionView, unit: string, now: number): LiveWorkoutPayload | null {
  if (!s.active || s.startedAt === null || !s.exercises.length) return null;
  const order = [...s.exercises.slice(s.index), ...s.exercises.slice(0, s.index)];
  const upcoming: LiveUpcomingSet[] = [];
  for (const e of order) {
    for (const set of e.sets) {
      if (set.done) continue;
      if (!hasSetResult(e.kind, set)) break; // Keeps the order honest: never skip past a set that needs input.
      upcoming.push({ exKey: e.key, setId: set.id, exerciseName: exerciseName(e), setLabel: setLabel(e, set), detail: setDetail(e, set, unit), restSeconds: Math.max(0, Math.round(s.restFor(e.exerciseId, e.key))) });
      if (upcoming.length >= UPCOMING) break;
    }
    if (upcoming.length >= UPCOMING) break;
    if (e.sets.some((set) => !set.done)) break;
  }
  const current = s.exercises[s.index] ?? s.exercises[0]!;
  const head = upcoming[0];
  const allDone = s.exercises.every(isDone);
  return {
    title: s.title || 'Workout',
    startedAt: s.startedAt,
    state: {
      exerciseName: head?.exerciseName ?? exerciseName(current),
      setLabel: head?.setLabel ?? (allDone ? 'All sets logged' : 'Next set needs your result'),
      detail: head?.detail ?? (allDone ? 'Open Gruntz to finish' : 'Open Gruntz to log it'),
      exercisesDone: s.exercises.filter(isDone).length,
      exercisesTotal: s.exercises.length,
      restEndsAt: s.restEndsAt && s.restEndsAt > now ? s.restEndsAt : null,
      lastActivityAt: s.lastActivityAt ?? s.startedAt,
      upcoming,
      loggedFromLockScreen: 0,
    },
  };
}

/**
 * Applies sets logged from the Lock Screen while the app was away: ticks them in
 * order, keeps the rest that is still running, and dates the activity to when the
 * set was actually logged rather than when the app came back.
 */
export function applyLoggedSets(logged: { exKey: string; setId: string; at: number }[], now: number) {
  if (!logged.length) return;
  const store = useSessionStore.getState();
  if (!store.active) return;
  let last: { at: number; exKey: string } | null = null;
  // A log can only have happened during this workout, never after now.
  const earliest = store.startedAt ?? 0;
  const entries = logged.map((e) => ({ ...e, at: Math.min(now, Math.max(earliest, e.at)) }));
  for (const entry of entries.sort((a, b) => a.at - b.at)) {
    const set = useSessionStore.getState().exercises.find((e) => e.key === entry.exKey)?.sets.find((st) => st.id === entry.setId);
    if (!set || set.done) continue;
    useSessionStore.getState().toggleSet(entry.exKey, entry.setId);
    last = { at: entry.at, exKey: entry.exKey };
  }
  if (!last) return;
  const exercise = useSessionStore.getState().exercises.find((e) => e.key === last.exKey);
  const rest = exercise ? useSessionStore.getState().restFor(exercise.exerciseId, exercise.key) : 0;
  const restEndsAt = last.at + rest * 1000;
  useSessionStore.setState({ lastActivityAt: last.at });
  if (restEndsAt > now + 1000) useSessionStore.setState({ restEndsAt, restTotal: rest });
  else useSessionStore.getState().endRest();
}

let lastSignature = '';
// False at launch, so an activity left behind by a crash is ended when no workout is open.
let ended = false;

/** Keeps the Live Activity in step with the running workout. Safe to call on every store change. */
export async function syncLiveActivity(s: SessionView) {
  if (!liveActivitySupported()) return;
  try {
    const unit = useUserStore.getState().profile?.settings.units === 'metric' ? 'kg' : 'lb';
    const payload = liveWorkoutPayload(s, unit, Date.now());
    if (!payload) {
      lastSignature = '';
      if (!ended) {
        ended = true;
        await endNativeLiveActivity();
      }
      return;
    }
    const signature = JSON.stringify(payload);
    if (signature === lastSignature) return;
    lastSignature = signature;
    ended = false;
    await syncNativeLiveActivity(payload);
  } catch (error) {
    reportHandled(error, 'liveActivity.sync');
  }
}

let started = false;

/** Pulls in Lock Screen logs whenever the app comes back, and once at launch. */
export function initializeLiveActivity() {
  if (started) return;
  started = true;
  const drain = () => {
    try {
      applyLoggedSets(drainNativeLoggedSets(), Date.now());
    } catch (error) {
      reportHandled(error, 'liveActivity.drain');
    }
  };
  drain();
  AppState.addEventListener('change', (next) => {
    if (next === 'active') drain();
  });
}
