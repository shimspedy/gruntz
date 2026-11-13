import { AppState } from 'react-native';
import { drainWatchCommands, onWatchCommands, onWatchStatus, pushWatchState, watchLinkStatus } from '../../modules/gruntz-watch-link';
import { getExerciseById } from '../data/exercises';
import { getProgramWorkoutDay } from '../data/programWorkouts';
import { getWorkoutPlan, plansLoaded } from '../data/workoutPlans';
import { getPlanWeek, plural, workoutExercises } from '../features/plan';
import {
  FINISH_MAX_AGE_MS, START_MAX_AGE_MS, parseWatchCommands, parseWorkoutRef, planWorkoutRef, programWorkoutRef, routineWorkoutRef,
  watchLive, watchState, type WatchCommand, type WatchNotice, type WatchResult, type WatchWorkout,
} from '../features/watchState';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { nextPlanDay, usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useSessionStore, type SessionSet } from '../store/useSessionStore';
import { hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import { getLocalDateKey } from '../utils/dateKey';
import { reportHandled } from './crashReporting';
import { applyLoggedSets } from './liveActivity';
import { commitSession, onSessionCommitted, presentCommit } from './sessionCommit';

/** Reading the plan library is slow enough to stall launch, so the watch waits for it. */
const PLAN_READ_DELAY_MS = 4000;
const PUSH_DEBOUNCE_MS = 300;
const MAX_ROUTINES = 8;
const MAX_REST_AHEAD_MS = 60 * 60_000;

let bootAt = 0;
let result: WatchResult | null = null;
let notice: WatchNotice | null = null;
const seen = new Set<string>();

const unlocked = () => hasTrainingAccess(useSubscriptionStore.getState());
const storesReady = () => useSessionStore.persist.hasHydrated() && useUserStore.getState().hasHydrated && !useUserStore.getState().hydrationFailed
  && useRoutineStore.persist.hasHydrated() && usePlanLibraryStore.persist.hasHydrated() && useProgramStore.persist.hasHydrated()
  // A finish cannot be committed before the log is read back; draining earlier consumed
  // the command and answered "log at least one set".
  && useExerciseLogStore.persist.hasHydrated();

/** What the watch can start: the day the Train tab is offering, then the athlete's own workouts. */
function startableWorkouts(now: number, readPlans = false): WatchWorkout[] {
  const workouts: WatchWorkout[] = [];
  const locked = !unlocked();
  const { activePlanId, completedDayIds } = usePlanLibraryStore.getState();
  if (activePlanId) {
    if (readPlans || plansLoaded() || now - bootAt > PLAN_READ_DELAY_MS) {
      const plan = getWorkoutPlan(activePlanId);
      const day = plan ? nextPlanDay(plan, completedDayIds) : undefined;
      if (plan && day) workouts.push({ id: planWorkoutRef(plan.id, day.id), title: day.title, detail: `${plan.title} · ${day.label}`, ...(locked ? { locked } : {}) });
    }
  } else {
    const { selectedProgram, currentWeek } = useProgramStore.getState();
    const user = useUserStore.getState();
    if (selectedProgram) {
      const days = getPlanWeek(selectedProgram, currentWeek, user.profile, user.progress.claimed_missions, new Date(now));
      const next = days.find((day) => day.isToday && day.workout && !day.completed) ?? days.find((day) => !day.isPast && day.workout && !day.completed);
      const count = workoutExercises(next?.workout).length;
      if (next?.workout && count) {
        workouts.push({
          id: programWorkoutRef(next.dateKey, next.workout.id), title: next.workout.title,
          detail: `${next.isToday ? 'Today' : next.weekday} · ${plural(count, 'exercise')}`, ...(locked ? { locked } : {}),
        });
      }
    }
  }
  for (const routine of useRoutineStore.getState().routines.slice(0, MAX_ROUTINES)) {
    if (!routine.items.length) continue;
    workouts.push({ id: routineWorkoutRef(routine.id), title: routine.name || 'My workout', detail: plural(routine.items.length, 'exercise') });
  }
  return workouts;
}

function currentState(now: number) {
  const session = useSessionStore.getState();
  const live = watchLive({
    active: session.active,
    title: session.title,
    startedAt: session.startedAt,
    index: session.index,
    restEndsAt: session.restEndsAt,
    exercises: session.exercises.map((exercise) => ({
      key: exercise.key,
      name: exercise.prescribedName ?? getExerciseById(exercise.exerciseId)?.name ?? 'Exercise',
      kind: exercise.kind,
      weighted: exercise.weighted,
      rest: session.restFor(exercise.exerciseId, exercise.key),
      requiredSets: exercise.requiredSets,
      sets: exercise.sets,
    })),
  }, now);
  return watchState({
    unit: useUserStore.getState().profile?.settings.units === 'metric' ? 'kg' : 'lb',
    live,
    // Nothing else can start while a workout is open, so the list would only be noise.
    workouts: live ? [] : startableWorkouts(now),
    result: live ? null : result,
    notice,
  });
}

let lastSignature = '';
/**
 * Cached from the native side: asked on every store change, it would cost a bridge call per keystroke.
 * A paired watch is enough. Whether the watch app is installed is reported late and, on some
 * setups, never; sending to a watch without the app is refused by the system and costs nothing.
 */
let paired = false;
const refreshStatus = () => { paired = watchLinkStatus().paired; return paired; };
let timer: ReturnType<typeof setTimeout> | undefined;

function pushNow(force = false) {
  clearTimeout(timer);
  timer = undefined;
  if (!storesReady() || !refreshStatus()) return;
  try {
    const state = currentState(Date.now());
    const signature = JSON.stringify(state);
    if (!force && signature === lastSignature) return;
    lastSignature = signature;
    // Stamped outside the signature: the watch uses it to drop a snapshot that arrives after a newer one.
    void pushWatchState({ ...state, at: Date.now() }).catch((error: unknown) => reportHandled(error, 'watchLink.push'));
  } catch (error) {
    reportHandled(error, 'watchLink.state');
  }
}

function schedulePush() {
  timer ??= setTimeout(() => pushNow(), PUSH_DEBOUNCE_MS);
}

const tell = (text: string, now: number) => { notice = { at: now, text }; };

function startFromWatch(id: string, now: number) {
  const session = useSessionStore.getState();
  // Already training: the watch simply shows that workout.
  if (session.active) return;
  const ref = parseWorkoutRef(id);
  // Only what the phone is offering right now: the watch never picks a plan day or a date of its own.
  if (!ref || !startableWorkouts(now, true).some((workout) => workout.id === id)) return tell('That workout is no longer available.', now);
  const today = getLocalDateKey(new Date(now));
  if (ref.source === 'routine') {
    const routine = useRoutineStore.getState().routines.find((item) => item.id === ref.routineId);
    if (!routine) return tell('That workout was removed on your iPhone.', now);
    session.startRoutine(routine, today);
  } else {
    // Plans and programs are what Gruntz Pro sells, on the wrist as on the phone.
    if (!unlocked()) return tell('Unlock Gruntz Pro on your iPhone to start this workout.', now);
    if (ref.source === 'plan') {
      const plan = getWorkoutPlan(ref.planId);
      const day = plan?.days.find((item) => item.id === ref.dayId);
      if (!plan || !day) return tell('That workout is no longer in your plan.', now);
      session.startPlanDay(plan, day, today);
    } else {
      const user = useUserStore.getState();
      const day = getProgramWorkoutDay(useProgramStore.getState().selectedProgram, ref.workoutId, user.profile);
      if (!day) return tell('That workout is no longer in your program.', now);
      if (user.progress.claimed_missions.has(`${ref.dateKey}:${day.id}`)) return tell('You already completed that workout.', now);
      session.start(day, ref.dateKey);
    }
  }
  if (useSessionStore.getState().active) {
    result = null;
    notice = null;
  } else {
    tell('That workout could not be started. Open Gruntz on your iPhone.', now);
  }
}

function logFromWatch(command: Extract<WatchCommand, { t: 'log' }>, now: number) {
  const session = useSessionStore.getState();
  if (!session.active || session.startedAt !== command.session) return;
  const exercise = session.exercises.find((item) => item.key === command.exKey);
  const set = exercise?.sets.find((item) => item.id === command.setId);
  if (!exercise || !set || set.done) return;
  // Only the fields this kind of set actually has: a rep count never lands on a plank.
  const patch: Partial<SessionSet> = {};
  if (exercise.kind === 'reps' && command.reps !== undefined && command.reps !== set.reps) patch.reps = command.reps;
  if (exercise.kind === 'time' && command.seconds !== undefined && command.seconds !== set.seconds) patch.seconds = command.seconds;
  if (exercise.weighted && command.weight !== undefined && command.weight !== (set.weight ?? 0)) patch.weight = command.weight > 0 ? command.weight : undefined;
  if (Object.keys(patch).length) session.updateSet(exercise.key, set.id, patch);
  // The same path as a set logged from the Lock Screen: ticked, dated to when it
  // happened on the wrist, with the rest counted from that moment.
  applyLoggedSets([{ exKey: exercise.key, setId: set.id, at: command.at }], now);
}

function apply(command: WatchCommand, now: number) {
  const session = useSessionStore.getState();
  switch (command.t) {
    case 'log':
      return logFromWatch(command, now);
    case 'rest':
      if (!session.active || session.startedAt !== command.session || !session.restEndsAt) return;
      if (command.action === 'skip') session.endRest();
      // Repeated adds must not push the rest clock out without limit.
      else if (command.seconds && session.restEndsAt + command.seconds * 1000 - now <= MAX_REST_AHEAD_MS) session.adjustRest(command.seconds);
      return;
    case 'start':
      if (Math.abs(now - command.at) > START_MAX_AGE_MS) return;
      return startFromWatch(command.workout, now);
    case 'finish': {
      if (Math.abs(now - command.at) > FINISH_MAX_AGE_MS || !session.active || session.startedAt !== command.session) return;
      const outcome = commitSession();
      if (!outcome) return tell('Log at least one set before you finish.', now);
      result = { session: command.session, xp: outcome.celebration.xpEarned, sets: outcome.sets, minutes: outcome.minutes, personalRecords: outcome.personalRecords };
      notice = null;
      presentCommit(outcome);
      return;
    }
    case 'sync':
      return;
  }
}

function drain() {
  // Against stores that have not loaded yet a command would be judged stale and lost.
  if (!storesReady()) return;
  const commands = parseWatchCommands(drainWatchCommands(), seen);
  if (!commands.length) return;
  const now = Date.now();
  for (const command of commands) {
    try {
      apply(command, now);
    } catch (error) {
      reportHandled(error, `watchLink.${command.t}`);
    }
  }
  if (seen.size > 2000) seen.clear();
  // Always answer, even when nothing changed: the watch is waiting to hear.
  pushNow(true);
}

let started = false;

/** Erasing the phone's data also forgets what the watch was last told and anything it still had queued. */
export function resetWatchLink() {
  result = null;
  notice = null;
  seen.clear();
  lastSignature = '';
  if (watchLinkStatus().supported) drainWatchCommands();
}

/**
 * Keeps the Gruntz watch app in step with the phone and applies what the athlete does
 * on the wrist. Does nothing on a phone with no watch paired.
 */
export function initializeWatchLink() {
  if (started) return;
  started = true;
  if (!watchLinkStatus().supported) return;
  bootAt = Date.now();
  refreshStatus();
  // A workout finished on the phone is saved on the wrist too, not thrown away as abandoned.
  onSessionCommitted((outcome) => {
    if (outcome.session === null) return;
    result = { session: outcome.session, xp: outcome.celebration.xpEarned, sets: outcome.sets, minutes: outcome.minutes, personalRecords: outcome.personalRecords };
    notice = null;
  });
  const changed = () => { if (paired) schedulePush(); };
  const ready = () => { drain(); pushNow(); };
  useSessionStore.subscribe(changed);
  useRoutineStore.subscribe(changed);
  useProgramStore.subscribe(changed);
  usePlanLibraryStore.subscribe(changed);
  useSubscriptionStore.subscribe(changed);
  useUserStore.subscribe((next, previous) => {
    if (next.hasHydrated !== previous.hasHydrated) ready();
    else if (next.profile?.settings.units !== previous.profile?.settings.units || next.progress.claimed_missions !== previous.progress.claimed_missions) changed();
  });
  for (const store of [useSessionStore, useRoutineStore, useProgramStore, usePlanLibraryStore, useExerciseLogStore]) store.persist.onFinishHydration(ready);
  onWatchCommands(drain);
  onWatchStatus(() => pushNow(true));
  AppState.addEventListener('change', (next) => { if (next === 'active') ready(); });
  ready();
  // The plan library is read late on purpose; this picks up the day it offers.
  setTimeout(() => pushNow(), PLAN_READ_DELAY_MS + 500);
}
