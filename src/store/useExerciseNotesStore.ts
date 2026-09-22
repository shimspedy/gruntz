import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Notes that stick to an exercise across workouts: setup, cues, machine settings. */
interface ExerciseNotesState {
  /** Keyed like the exercise log: the clip key (library slug), else the exercise id. */
  notes: Record<string, string>;
  setNote: (key: string, note: string) => void;
}

export const useExerciseNotesStore = create<ExerciseNotesState>()(
  persist(
    (set) => ({
      notes: {},
      setNote: (key, note) =>
        set((s) => {
          const next = { ...s.notes };
          const trimmed = note.trim().slice(0, 500);
          if (trimmed) next[key] = trimmed;
          else delete next[key];
          const keys = Object.keys(next);
          if (keys.length > 400) delete next[keys[0]];
          return { notes: next };
        }),
    }),
    { name: '@gruntz_exercise_notes', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
