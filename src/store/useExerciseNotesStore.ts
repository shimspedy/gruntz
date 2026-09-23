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
          // Evict the oldest note that is NOT the one being written. Updating an
          // existing key does not move it in insertion order, so a user with >400
          // notes editing their oldest one deleted it on every keystroke.
          const keys = Object.keys(next).filter((k) => k !== key);
          if (Object.keys(next).length > 400 && keys.length) delete next[keys[0]];
          return { notes: next };
        }),
    }),
    { name: '@gruntz_exercise_notes', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
