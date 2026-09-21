import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getExerciseById, libraryExerciseId } from '../data/exercises';
import { routineMinutes, type Routine } from './useRoutineStore';
import type { CompletedExercise, CompletedMission, Exercise, WorkoutDay } from '../types';

/**
 * The live workout. Lives outside navigation so the session can collapse into the
 * mini bar above the tabs and keep running while the user looks at other screens.
 */

export type SetKind = 'reps' | 'time' | 'distance';

export interface SessionSet {
  id: string;
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
  restOverrides: Record<string, number>;
  previous: Record<string, PreviousSet[]>;

  start: (day: WorkoutDay, missionDate: string) => void;
  startRoutine: (routine: Routine, missionDate: string) => void;
  setIndex: (index: number) => void;
  updateSet: (exKey: string, setId: string, patch: Partial<SessionSet>) => void;
  toggleSet: (exKey: string, setId: string) => { completedExercise: boolean; startedRest: boolean };
  addSet: (exKey: string) => void;
  removeExercise: (exKey: string) => void;
  replaceExercise: (exKey: string, nextId: string) => void;
  setRestFor: (exerciseId: string, seconds: number) => void;
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

export const isExerciseDone = (e: SessionExercise) => e.sets.filter((s) => s.done).length >= e.requiredSets;

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
        const overrides = { ...get().restOverrides };
        routine.items.forEach((it) => (overrides[libraryExerciseId(it.key)] = it.rest));
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
          restOverrides: overrides,
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
        const exercises = get().exercises.map((e) =>
          e.key !== exKey ? e : { ...e, sets: e.sets.map((st) => (st.id === setId ? { ...st, done: nowDone } : st)) },
        );
        set({ exercises });
        const after = exercises.find((e) => e.key === exKey)!;
        const completedExercise = nowDone && isExerciseDone(after) && !isExerciseDone(before);
        let startedRest = false;
        if (nowDone && !completedExercise) {
          const ex = getExerciseById(after.exerciseId);
          const rest = get().restOverrides[after.exerciseId] ?? ex?.rest_seconds ?? 0;
          if (rest > 0) {
            get().startRest(rest);
            startedRest = true;
          }
        }
        return { completedExercise, startedRest };
      },

      addSet: (exKey) =>
        set((s) => ({
          exercises: s.exercises.map((e) => {
            if (e.key !== exKey) return e;
            const last = e.sets[e.sets.length - 1];
            return { ...e, sets: [...e.sets, { ...last, id: newSetId(), done: false }] };
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
            return {
              ...e,
              key: `${e.key}>${nextId}`,
              exerciseId: nextId,
              kind: kindFor(ex),
              weighted: isWeighted(ex),
              requiredSets: Math.max(1, ex.sets || 1),
              sets: buildSets(ex, Math.max(1, ex.sets || 1), s.previous[nextId]),
            };
          }),
        })),

      setRestFor: (exerciseId, seconds) => set((s) => ({ restOverrides: { ...s.restOverrides, [exerciseId]: seconds } })),
      startRest: (seconds) => set({ restEndsAt: Date.now() + seconds * 1000, restTotal: seconds }),
      adjustRest: (delta) =>
        set((s) => {
          if (!s.restEndsAt) return s;
          const next = Math.max(Date.now() + 1000, s.restEndsAt + delta * 1000);
          return { restEndsAt: next, restTotal: Math.max(1, s.restTotal + delta) };
        }),
      endRest: () => set({ restEndsAt: null, restTotal: 0 }),
      minimize: () => set({ minimized: true }),
      expand: () => set({ minimized: false }),

      buildMission: () => {
        const s = get();
        if (!s.workoutDayId || !s.missionDate) return null;
        const completed = s.exercises.filter(isExerciseDone);
        const exercises: CompletedExercise[] = completed.map((e) => {
          const ex = getExerciseById(e.exerciseId);
          const done = e.sets.filter((st) => st.done);
          const reps = done.reduce((sum, st) => sum + (st.reps ?? 0), 0);
          const secs = done.reduce((sum, st) => sum + (st.seconds ?? 0), 0);
          const distances = done.map((st) => st.distance?.trim()).filter((d): d is string => !!d);
          return {
            exercise_id: e.exerciseId,
            completed_reps: e.kind === 'reps' ? reps : ex?.reps,
            completed_sets: done.length,
            completed_duration_seconds: e.kind === 'time' ? secs : ex?.duration_seconds,
            completed_distance: distances.length ? (distances.length === 1 ? distances[0] : distances.join(', ')) : ex?.distance,
            xp_earned: ex?.xp_value || 0,
            is_personal_record: false,
          };
        });
        const isPerfect = completed.length === s.exercises.length && s.exercises.length > 0;
        const totalXp = exercises.reduce((sum, e) => sum + e.xp_earned, 0);
        const minutes = s.startedAt ? Math.max(1, Math.round((Date.now() - s.startedAt) / 60000)) : s.estimatedMinutes;
        return {
          mission_date: s.missionDate,
          workout_day_id: s.workoutDayId,
          exercises,
          total_xp: totalXp,
          completion_bonus: isPerfect ? s.rewardXp : Math.floor(s.rewardXp * 0.5),
          is_perfect: isPerfect,
          has_personal_record: false,
          pr_bonus: 0,
          duration_minutes: minutes,
          completed_at: new Date().toISOString(),
        };
      },

      finish: () => {
        // Remember what was lifted so the next session can show it in the "Previous" column.
        const previous = { ...get().previous };
        get().exercises.forEach((e) => {
          const done = e.sets.filter((st) => st.done);
          if (done.length) {
            previous[e.exerciseId] = done.map(({ reps, weight, seconds, distance }) => ({ reps, weight, seconds, distance }));
          }
        });
        set({ ...initial, previous });
      },

      discard: () => set({ ...initial }),
    }),
    {
      name: '@gruntz_session',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        active: s.active,
        minimized: s.active ? true : false,
        workoutDayId: s.workoutDayId,
        missionDate: s.missionDate,
        title: s.title,
        estimatedMinutes: s.estimatedMinutes,
        rewardXp: s.rewardXp,
        exercises: s.exercises,
        index: s.index,
        startedAt: s.startedAt,
        restOverrides: s.restOverrides,
        previous: s.previous,
      }),
    },
  ),
);
