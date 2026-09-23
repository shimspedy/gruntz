import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getExerciseById, libraryExerciseId } from '../data/exercises';
import { routineMinutes, type Routine } from './useRoutineStore';
import { parsePlanSessionId, planSessionId, usePlanLibraryStore } from './usePlanLibraryStore';
import { estimated1RM, toUnit, useExerciseLogStore } from './useExerciseLogStore';
import { useUserStore } from './useUserStore';
import { cancelRestDone } from '../services/notifications';
import type { PlanDay, WorkoutPlan } from '../data/workoutPlans';
import type { CompletedExercise, CompletedMission, Exercise, WorkoutDay } from '../types';

/**
 * The live workout. Lives outside navigation so the session can collapse into the
 * mini bar above the tabs and keep running while the user looks at other screens.
 */

export type SetKind = 'reps' | 'time' | 'distance';

export interface SessionSet {
  id: string;
  /** Ramp-up sets: they don't count toward the exercise's required sets and aren't logged. */
  warmup?: boolean;
  reps?: number;
  weight?: number;
  seconds?: number;
  distance?: string;
  done: boolean;
}

export interface SessionExercise {
  key: string;
  exerciseId: string;
  section: string;
  kind: SetKind;
  weighted: boolean;
  requiredSets: number;
  sets: SessionSet[];
}

export interface PreviousSet {
  /** The unit the weight was logged in, so a later unit switch doesn't relabel old numbers. */
  unit?: 'lb' | 'kg';
  reps?: number;
  weight?: number;
  seconds?: number;
  distance?: string;
}

interface SessionState {
  active: boolean;
  minimized: boolean;
  workoutDayId: string | null;
  missionDate: string | null;
  title: string;
  estimatedMinutes: number;
  rewardXp: number;
  exercises: SessionExercise[];
  index: number;
  startedAt: number | null;
  restEndsAt: number | null;
  restTotal: number;
  /** The set whose completion started the current rest. */
  restSetId: string | null;
  /** Rest the athlete chose for an exercise. Persists across workouts and always wins. */
  restOverrides: Record<string, number>;
  /** Rest this plan/routine prescribes. Session-scoped, so it never edits a saved preference. */
  restPrescribed: Record<string, number>;
  previous: Record<string, PreviousSet[]>;

  start: (day: WorkoutDay, missionDate: string) => void;
  startRoutine: (routine: Routine, missionDate: string) => void;
  /** Runs one day of a library plan with its own sets, reps, times and rest. */
  startPlanDay: (plan: WorkoutPlan, day: PlanDay, missionDate: string) => void;
  setIndex: (index: number) => void;
  updateSet: (exKey: string, setId: string, patch: Partial<SessionSet>) => void;
  toggleSet: (exKey: string, setId: string) => { completedExercise: boolean; startedRest: boolean };
  addSet: (exKey: string) => void;
  removeSet: (exKey: string, setId: string) => void;
  /** Prepends light ramp-up sets worked back from the first working set. */
  addWarmupSets: (exKey: string, count?: number) => void;
  removeExercise: (exKey: string) => void;
  replaceExercise: (exKey: string, nextId: string) => void;
  /** Appends library clips to the running workout and jumps to the first one added. */
  addExercises: (keys: string[]) => void;
  setRestFor: (exerciseId: string, seconds: number) => void;
  /** Rest for an exercise: the athlete's choice, else what this workout prescribes, else the clip's. */
  restFor: (exerciseId: string) => number;
  startRest: (seconds: number) => void;
  adjustRest: (delta: number) => void;
  endRest: () => void;
  minimize: () => void;
  expand: () => void;
  buildMission: () => CompletedMission | null;
  finish: () => void;
  discard: () => void;
}

const WEIGHTED_EQUIPMENT = ['barbell', 'dumbbell', 'kettlebell', 'plate', 'sandbag', 'ammo', 'weight', 'cable', 'machine', 'vest'];

function isWeighted(ex: Exercise) {
  return ex.equipment.some((item) => WEIGHTED_EQUIPMENT.some((w) => item.toLowerCase().includes(w)));
}

function kindFor(ex: Exercise): SetKind {
  if (ex.reps) return 'reps';
  if (ex.duration_seconds) return 'time';
  if (ex.distance) return 'distance';
  return 'reps';
}

const STALE_SESSION_MS = 12 * 60 * 60 * 1000;

/**
 * Typing a weight rewrote the whole workout to disk on every keystroke. Writes are coalesced
 * to one per second, and flushed immediately when the app leaves the foreground so nothing
 * in flight is lost if iOS kills us.
 */
const debouncedStorage = (() => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: [string, string] | null = null;
  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (!pending) return;
    const [key, value] = pending;
    pending = null;
    void AsyncStorage.setItem(key, value);
  };
  AppState.addEventListener('change', (next) => {
    if (next !== 'active') flush();
  });
  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => {
      pending = [key, value];
      if (!timer) timer = setTimeout(flush, 1000);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      pending = null;
      clearTimeout(timer);
      timer = undefined;
      return AsyncStorage.removeItem(key);
    },
  };
})();

let setSeq = 0;
const newSetId = () => `s${Date.now().toString(36)}${(setSeq++).toString(36)}`;

function buildSets(ex: Exercise, count: number, previous?: PreviousSet[]): SessionSet[] {
  return Array.from({ length: count }, (_, i) => {
    const prev = previous?.[i] ?? previous?.[previous.length - 1];
    return {
      id: newSetId(),
      reps: ex.reps,
      weight: prev?.weight,
      seconds: ex.duration_seconds,
      distance: ex.distance,
      done: false,
    };
  });
}

export function buildSessionExercises(day: WorkoutDay, previous: Record<string, PreviousSet[]>): SessionExercise[] {
  const list: SessionExercise[] = [];
  day.sections.forEach((section) => {
    section.exercises.forEach((exerciseId, i) => {
      const ex = getExerciseById(exerciseId);
      if (!ex) return;
      const required = Math.max(1, ex.sets || 1);
      list.push({
        key: `${section.id}:${i}:${exerciseId}`,
        exerciseId,
        section: section.title,
        kind: kindFor(ex),
        weighted: isWeighted(ex),
        requiredSets: required,
        sets: buildSets(ex, required, previous[exerciseId]),
      });
    });
  });
  return list;
}

const KG_PER_LB = 0.45359237;

/** Converts the running workout's weights when the user changes units mid-session. */
export function convertSessionWeights(to: 'lb' | 'kg') {
  const round = (n: number) => Math.round(n * 2) / 2;
  useSessionStore.setState((s) => ({
    exercises: s.exercises.map((e) => ({
      ...e,
      sets: e.sets.map((st) => (st.weight ? { ...st, weight: round(to === 'kg' ? st.weight * KG_PER_LB : st.weight / KG_PER_LB) } : st)),
    })),
  }));
}

/**
 * Best single effort in a set list, on one comparable scale per kind:
 * an Epley 1RM estimate for weighted reps, plain reps for bodyweight, seconds for
 * holds. Returns null when there is nothing measurable to compare.
 */
function bestEffort(kind: SetKind, sets: { reps?: number; weight?: number; seconds?: number }[]): number | null {
  let best: number | null = null;
  for (const st of sets) {
    let value: number | null = null;
    if (kind === 'time') value = st.seconds ?? null;
    else if (st.weight && st.reps) value = estimated1RM(st.weight, st.reps);
    else if (st.reps) value = st.reps;
    if (value != null && (best == null || value > best)) best = value;
  }
  return best;
}

export const isExerciseDone = (e: SessionExercise) => e.sets.filter((s) => s.done && !s.warmup).length >= e.requiredSets;

const initial = {
  active: false,
  minimized: false,
  workoutDayId: null,
  missionDate: null,
  title: '',
  estimatedMinutes: 0,
  rewardXp: 0,
  exercises: [] as SessionExercise[],
  index: 0,
  startedAt: null,
  restEndsAt: null,
  restTotal: 0,
  restSetId: null as string | null,
  restPrescribed: {} as Record<string, number>,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initial,
      restOverrides: {},
      previous: {},

      start: (day, missionDate) => {
        set({
          active: true,
          minimized: false,
          workoutDayId: day.id,
          missionDate,
          title: day.title,
          estimatedMinutes: day.estimated_duration,
          rewardXp: day.rewards.xp,
          exercises: buildSessionExercises(day, get().previous),
          index: 0,
          startedAt: Date.now(),
          restEndsAt: null,
          restTotal: 0,
        });
      },

      startRoutine: (routine, missionDate) => {
        const previous = get().previous;
        const exercisesList: SessionExercise[] = routine.items.flatMap((it, i) => {
          const id = libraryExerciseId(it.key);
          const ex = getExerciseById(id);
          if (!ex) return [];
          const sets = Array.from({ length: Math.max(1, it.sets) }, (_, n) => {
            const prev = previous[id]?.[n] ?? previous[id]?.[previous[id].length - 1];
            return { id: newSetId(), reps: ex.reps ? it.reps : undefined, seconds: ex.duration_seconds, weight: prev?.weight, done: false };
          });
          return [{ key: `${routine.id}:${i}:${it.key}`, exerciseId: id, section: routine.name, kind: kindFor(ex), weighted: isWeighted(ex), requiredSets: sets.length, sets }];
        });
        const prescribed: Record<string, number> = {};
        routine.items.forEach((it) => (prescribed[libraryExerciseId(it.key)] = it.rest));
        set({
          active: true,
          minimized: false,
          workoutDayId: `routine:${routine.id}`,
          missionDate,
          title: routine.name,
          estimatedMinutes: routineMinutes(routine),
          rewardXp: 20 + routine.items.length * 5,
          exercises: exercisesList,
          index: 0,
          startedAt: Date.now(),
          restEndsAt: null,
          restTotal: 0,
          restPrescribed: prescribed,
        });
      },

      startPlanDay: (plan, day, missionDate) => {
        const previous = get().previous;
        const prescribed: Record<string, number> = {};
        const exercisesList: SessionExercise[] = day.exercises.flatMap((slot, i) => {
          if (!slot.video_key) return [];
          const id = libraryExerciseId(slot.video_key);
          const ex = getExerciseById(id);
          if (!ex) return [];
          const kind: SetKind = slot.measure === 'time' ? 'time' : slot.measure === 'distance' ? 'distance' : 'reps';
          const sets = Array.from({ length: Math.max(1, slot.sets) }, (_, n) => {
            const prev = previous[id]?.[n] ?? previous[id]?.[previous[id].length - 1];
            return {
              id: newSetId(),
              reps: kind === 'reps' ? (slot.rep_scheme?.[n] ?? slot.reps) : undefined,
              seconds: kind === 'time' ? slot.duration_seconds : undefined,
              distance: kind === 'distance' && slot.distance_meters ? `${slot.distance_meters} m` : undefined,
              weight: prev?.weight,
              done: false,
            };
          });
          prescribed[id] = slot.rest_seconds;
          // Counted before the warm-ups go in. `isExerciseDone` only counts working
          // sets, so folding warm-ups into requiredSets made the target unreachable:
          // the exercise never ticked, Finish never appeared, and because buildMission
          // filters on isExerciseDone the whole exercise was dropped from the saved
          // workout — no XP, no PR check, absent from history.
          const workingSets = sets.length;
          if (slot.warmup_sets) {
            const w = Math.min(3, slot.warmup_sets);
            const fr = [0.5, 0.7, 0.85].slice(-w);
            const rp = [8, 5, 3].slice(-w);
            sets.unshift(...fr.map((_, n) => ({ id: newSetId(), warmup: true, reps: rp[n], seconds: undefined, distance: undefined, weight: undefined, done: false })));
          }
          return [{ key: `${day.id}:${i}:${slot.video_key}`, exerciseId: id, section: day.title, kind, weighted: isWeighted(ex), requiredSets: workingSets, sets }];
        });
        set({
          active: true,
          minimized: false,
          workoutDayId: planSessionId(plan.id, day.id),
          missionDate,
          title: `${plan.title} · ${day.title}`,
          estimatedMinutes: day.estimated_minutes,
          rewardXp: 20 + exercisesList.length * 5,
          exercises: exercisesList,
          index: 0,
          startedAt: Date.now(),
          restEndsAt: null,
          restTotal: 0,
          restPrescribed: prescribed,
        });
      },

      setIndex: (index) => set({ index: Math.max(0, Math.min(index, get().exercises.length - 1)) }),

      updateSet: (exKey, setId, patch) =>
        set((s) => ({
          exercises: s.exercises.map((e) =>
            e.key !== exKey ? e : { ...e, sets: e.sets.map((st) => (st.id === setId ? { ...st, ...patch } : st)) },
          ),
        })),

      toggleSet: (exKey, setId) => {
        const before = get().exercises.find((e) => e.key === exKey);
        if (!before) return { completedExercise: false, startedRest: false };
        const target = before.sets.find((st) => st.id === setId);
        const nowDone = !target?.done;
        // Ticking a set whose value was cleared used to log an empty row. Fall back to
        // what this exercise prescribes (or the last time you did it) so a logged set
        // always says how much work it was.
        const filled = (st: SessionSet) => {
          if (!nowDone) return st;
          const ex = getExerciseById(before.exerciseId);
          const prev = get().previous[before.exerciseId];
          const at = before.sets.findIndex((x) => x.id === setId);
          const last = prev?.[at] ?? prev?.[prev.length - 1];
          if (before.kind === 'reps' && st.reps == null) return { ...st, reps: last?.reps ?? ex?.reps ?? undefined };
          if (before.kind === 'time' && st.seconds == null) return { ...st, seconds: ex?.duration_seconds ?? undefined };
          if (before.kind === 'distance' && !st.distance?.trim()) return { ...st, distance: ex?.distance ?? undefined };
          return st;
        };
        const exercises = get().exercises.map((e) =>
          e.key !== exKey ? e : { ...e, sets: e.sets.map((st) => (st.id === setId ? { ...filled(st), done: nowDone } : st)) },
        );
        set({ exercises });
        const after = exercises.find((e) => e.key === exKey)!;
        const completedExercise = nowDone && isExerciseDone(after) && !isExerciseDone(before);
        // Un-logging the set that started the rest cancels that rest.
        if (!nowDone && get().restSetId === setId) get().endRest();
        let startedRest = false;
        // Resting after the last set matters too (circuits, supersets, next exercise).
        if (nowDone) {
          const ex = getExerciseById(after.exerciseId);
          const rest = get().restFor(after.exerciseId);
          if (rest > 0) {
            get().startRest(rest);
            set({ restSetId: setId });
            startedRest = true;
          }
        }
        return { completedExercise, startedRest };
      },

      removeSet: (exKey, setId) =>
        set((s) => ({
          exercises: s.exercises.map((e) =>
            e.key !== exKey || e.sets.length <= 1 ? e : { ...e, sets: e.sets.filter((st) => st.id !== setId) },
          ),
          ...(s.restSetId === setId ? { restEndsAt: null, restTotal: 0, restSetId: null } : {}),
        })),

      addWarmupSets: (exKey, count = 3) => {
        const fractions = [0.5, 0.7, 0.85].slice(-count);
        const reps = [8, 5, 3].slice(-count);
        // Plates come in different sizes per unit: 5 lb steps are right on an
        // imperial bar, but a metric lifter loads 2.5 kg. Rounding everyone to 5
        // handed kg users warm-ups they could not actually load.
        const metric = useUserStore.getState().profile?.settings.units === 'metric';
        const step = metric ? 2.5 : 5;
        const roundToStep = (w: number) => Math.max(step, Math.round(w / step) * step);
        set((s) => ({
          exercises: s.exercises.map((e) => {
            if (e.key !== exKey || e.sets.some((st) => st.warmup)) return e;
            const work = e.sets.find((st) => !st.warmup);
            const warmups: SessionSet[] = fractions.map((f, i) => ({
              id: newSetId(),
              warmup: true,
              reps: reps[i],
              weight: work?.weight ? roundToStep(work.weight * f) : undefined,
              seconds: work?.seconds,
              done: false,
            }));
            return { ...e, sets: [...warmups, ...e.sets] };
          }),
        }));
      },

      addSet: (exKey) =>
        set((s) => ({
          exercises: s.exercises.map((e) => {
            if (e.key !== exKey) return e;
            const last = [...e.sets].reverse().find((st) => !st.warmup) ?? e.sets[e.sets.length - 1];
            return {
              ...e,
              sets: [...e.sets, { id: newSetId(), reps: last?.reps, weight: last?.weight, seconds: last?.seconds, done: false }],
            };
          }),
        })),

      removeExercise: (exKey) =>
        set((s) => {
          const exercises = s.exercises.filter((e) => e.key !== exKey);
          return { exercises, index: Math.min(s.index, Math.max(0, exercises.length - 1)) };
        }),

      replaceExercise: (exKey, nextId) =>
        set((s) => ({
          exercises: s.exercises.map((e) => {
            if (e.key !== exKey) return e;
            const ex = getExerciseById(nextId);
            if (!ex) return e;
            // Keep the sets already logged: swapping used to wipe them with no undo.
            const logged = e.sets.filter((st) => st.done);
            const keep = logged.length ? logged : e.sets;
            return {
              ...e,
              exerciseId: nextId,
              kind: kindFor(ex),
              weighted: isWeighted(ex),
              requiredSets: Math.max(logged.length, e.requiredSets),
              sets: keep,
            };
          }),
        })),

      addExercises: (keys) =>
        set((s) => {
          const added: SessionExercise[] = keys.flatMap((k, i) => {
            const id = libraryExerciseId(k);
            const ex = getExerciseById(id);
            if (!ex) return [];
            const count = Math.max(1, ex.sets || 3);
            return [{ key: `added:${Date.now().toString(36)}:${i}:${k}`, exerciseId: id, section: 'Added', kind: kindFor(ex), weighted: isWeighted(ex), requiredSets: count, sets: buildSets(ex, count, s.previous[id]) }];
          });
          if (!added.length) return s;
          // Stay on the set you were logging; the toast offers the jump instead of
          // yanking you to the end of the list mid-exercise.
          return { exercises: [...s.exercises, ...added] };
        }),

      setRestFor: (exerciseId, seconds) => set((s) => ({ restOverrides: { ...s.restOverrides, [exerciseId]: seconds } })),

      restFor: (exerciseId) => {
        const s = get();
        return s.restOverrides[exerciseId] ?? s.restPrescribed[exerciseId] ?? getExerciseById(exerciseId)?.rest_seconds ?? 0;
      },
      startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }),
      adjustRest: (delta) =>
        set((s) => {
          if (!s.restEndsAt) return s;
          const next = Math.max(Date.now() + 1000, s.restEndsAt + delta * 1000);
          // Keep the ring honest: total must cover what's actually left.
          const remaining = Math.ceil((next - Date.now()) / 1000);
          return { restEndsAt: next, restTotal: Math.max(remaining, s.restTotal + delta) };
        }),
      endRest: () => {
        set({ restEndsAt: null, restTotal: 0, restSetId: null });
        void cancelRestDone();
      },
      minimize: () => set({ minimized: true }),
      expand: () => set({ minimized: false }),

      buildMission: () => {
        const s = get();
        if (!s.workoutDayId || !s.missionDate) return null;
        // Today's sets are in the unit set right now; history carries its own.
        const unit: 'lb' | 'kg' = useUserStore.getState().profile?.settings.units === 'metric' ? 'kg' : 'lb';
        const completed = s.exercises.filter(isExerciseDone);
        const exercises: CompletedExercise[] = completed.map((e) => {
          const ex = getExerciseById(e.exerciseId);
          // Working sets only, matching the exercise log and isExerciseDone. Counting
          // warm-ups here made the summary and the log disagree about the same workout.
          const done = e.sets.filter((st) => st.done && !st.warmup);
          const reps = done.reduce((sum, st) => sum + (st.reps ?? 0), 0);
          const secs = done.reduce((sum, st) => sum + (st.seconds ?? 0), 0);
          const distances = done.map((st) => st.distance?.trim()).filter((d): d is string => !!d);
          // A personal record: today's best effort on this movement beats every
          // previous session's. The log has not been written yet at this point, so
          // the history compared against genuinely excludes today.
          const today = bestEffort(e.kind, done);
          const key = ex?.media_key ?? e.exerciseId;
          const history = useExerciseLogStore.getState().logs[key] ?? [];
          // History is stored in whatever unit was set when it was lifted, and today's
          // sets are in the current one. Comparing the raw numbers meant switching
          // lb -> kg ended PRs forever (45 kg never beats a 100 lb history) and kg -> lb
          // awarded a false PR on every weighted lift, plus 25 XP each. The Records tab
          // already converts, so the PR badge and the Records tab disagreed about the
          // same lift.
          const previousBest = history.reduce<number | null>((best, entry) => {
            const sets = entry.unit === unit
              ? entry.sets
              : entry.sets.map((st) => (st.weight ? { ...st, weight: toUnit(st.weight, entry.unit, unit) } : st));
            const value = bestEffort(e.kind, sets);
            return value != null && (best == null || value > best) ? value : best;
          }, null);
          // Needs a prior session to beat — the first time you do a movement is not a PR.
          const isPr = today != null && previousBest != null && today > previousBest;
          return {
            exercise_id: e.exerciseId,
            // Only rep work reports reps. A plank or a ruck used to fall back to the
            // exercise's nominal rep count, inflating total_reps and the rep badges
            // with reps nobody performed.
            completed_reps: e.kind === 'reps' ? reps : undefined,
            completed_sets: done.length,
            completed_duration_seconds: e.kind === 'time' ? secs : ex?.duration_seconds,
            completed_distance: distances.length ? (distances.length === 1 ? distances[0] : distances.join(', ')) : ex?.distance,
            xp_earned: ex?.xp_value || 0,
            is_personal_record: isPr,
          };
        });
        const isPerfect = completed.length === s.exercises.length && s.exercises.length > 0;
        const prCount = exercises.filter((e) => e.is_personal_record).length;
        const totalXp = exercises.reduce((sum, e) => sum + e.xp_earned, 0);
        // A session left open overnight would otherwise log hundreds of minutes of
        // "training". Past the stale cutoff the clock is meaningless, so fall back to
        // what the workout was estimated to take.
        const elapsed = s.startedAt ? Date.now() - s.startedAt : null;
        const minutes = elapsed !== null && elapsed <= STALE_SESSION_MS
          ? Math.max(1, Math.round(elapsed / 60000))
          : s.estimatedMinutes;
        return {
          mission_date: s.missionDate,
          workout_day_id: s.workoutDayId,
          exercises,
          total_xp: totalXp,
          completion_bonus: isPerfect ? s.rewardXp : Math.floor(s.rewardXp * 0.5),
          is_perfect: isPerfect,
          has_personal_record: prCount > 0,
          pr_bonus: prCount * 25,
          duration_minutes: minutes,
          completed_at: new Date().toISOString(),
        };
      },

      finish: () => {
        void cancelRestDone();
        // Every completed set goes into the exercise's own history (History, Charts, Records).
        const at = new Date().toISOString();
        const unit = useUserStore.getState().profile?.settings.units === 'metric' ? 'kg' : 'lb';
        const log = useExerciseLogStore.getState();
        get().exercises.forEach((e) => {
          const sets = e.sets.filter((st) => st.done && !st.warmup).map(({ reps, weight, seconds, distance }) => ({ reps, weight, seconds, distance }));
          if (!sets.length) return;
          const key = getExerciseById(e.exerciseId)?.media_key ?? e.exerciseId;
          log.record(key, { id: `${get().startedAt ?? at}:${e.key}`, at, workoutTitle: get().title, unit, sets });
        });

        const planDay = parsePlanSessionId(get().workoutDayId);
        if (planDay && get().exercises.some((e) => e.sets.some((st) => st.done))) {
          usePlanLibraryStore.getState().markDayDone(planDay.dayId);
        }
        // Remember what was lifted so the next session can show it in the "Previous" column.
        const previous = { ...get().previous };
        get().exercises.forEach((e) => {
          const done = e.sets.filter((st) => st.done && !st.warmup);
          if (done.length) {
            previous[e.exerciseId] = done.map(({ reps, weight, seconds, distance }) => ({ reps, weight, seconds, distance, unit }));
          }
        });
        // Keep the most recent exercises only: this blob is rewritten on every set logged.
        const trimmed = Object.fromEntries(Object.entries(previous).slice(-200));
        set({ ...initial, previous: trimmed });
      },

      discard: () => {
        void cancelRestDone();
        set({ ...initial });
      },
    }),
    {
      name: '@gruntz_session',
      version: 1,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (s) => ({
        active: s.active,
        // Reopen exactly as the user left it (full screen mid-set, or the mini bar).
        minimized: s.active ? s.minimized : false,
        workoutDayId: s.workoutDayId,
        missionDate: s.missionDate,
        title: s.title,
        estimatedMinutes: s.estimatedMinutes,
        rewardXp: s.rewardXp,
        exercises: s.exercises,
        index: s.index,
        startedAt: s.startedAt,
        restOverrides: s.restOverrides,
        restPrescribed: s.restPrescribed,
        previous: s.previous,
        // Rest is a wall-clock deadline, so it keeps counting down while the phone is locked.
        restEndsAt: s.restEndsAt,
        restTotal: s.restTotal,
        restSetId: s.restSetId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.active) return;
        const patch: Partial<SessionState> = {};
        if (state.restEndsAt && state.restEndsAt <= Date.now()) Object.assign(patch, { restEndsAt: null, restTotal: 0 });
        // A workout left open overnight comes back as the mini bar, not full screen.
        if (state.startedAt && Date.now() - state.startedAt > STALE_SESSION_MS) patch.minimized = true;
        if (Object.keys(patch).length) useSessionStore.setState(patch);
      },
    },
  ),
);
