import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** One movement in a user-planned workout. `key` is a clip in the exercise library. */
export interface RoutineItem {
  uid: string;
  key: string;
  sets: number;
  reps: number;
  rest: number;
}

export interface Routine {
  id: string;
  name: string;
  items: RoutineItem[];
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
  createdAt: string;
  updatedAt: string;
}

export type RoutineDraft = Omit<Routine, 'createdAt' | 'updatedAt'> & { isNew: boolean };

interface RoutineState {
  routines: Routine[];
  /** The workout being edited. Lives in the store so the exercise picker can add to it. */
  draft: RoutineDraft | null;

  newDraft: (seedKeys?: string[]) => void;
  editDraft: (id: string) => void;
  updateDraft: (patch: Partial<RoutineDraft>) => void;
  addToDraft: (keys: string[]) => void;
  updateItem: (uid: string, patch: Partial<RoutineItem>) => void;
  removeItem: (uid: string) => void;
  moveItem: (uid: string, dir: -1 | 1) => void;
  saveDraft: () => Routine | null;
  discardDraft: () => void;
  addToRoutine: (id: string, key: string) => void;
  deleteRoutine: (id: string) => void;
}

let seq = 0;
const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`;
const item = (key: string): RoutineItem => ({ uid: uid(), key, sets: 3, reps: 10, rest: 60 });

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: [],
      draft: null,

      newDraft: (seedKeys = []) =>
        set({ draft: { id: `r${uid()}`, name: '', items: seedKeys.map(item), days: [], isNew: true } }),

      editDraft: (id) => {
        const r = get().routines.find((x) => x.id === id);
        if (r) set({ draft: { id: r.id, name: r.name, items: r.items.map((i) => ({ ...i })), days: [...r.days], isNew: false } });
      },

      updateDraft: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : s)),

      addToDraft: (keys) => set((s) => (s.draft ? { draft: { ...s.draft, items: [...s.draft.items, ...keys.map(item)] } } : s)),

      updateItem: (id, patch) =>
        set((s) => (s.draft ? { draft: { ...s.draft, items: s.draft.items.map((i) => (i.uid === id ? { ...i, ...patch } : i)) } } : s)),

      removeItem: (id) => set((s) => (s.draft ? { draft: { ...s.draft, items: s.draft.items.filter((i) => i.uid !== id) } } : s)),

      moveItem: (id, dir) =>
        set((s) => {
          if (!s.draft) return s;
          const items = [...s.draft.items];
          const i = items.findIndex((x) => x.uid === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= items.length) return s;
          [items[i], items[j]] = [items[j], items[i]];
          return { draft: { ...s.draft, items } };
        }),

      saveDraft: () => {
        const d = get().draft;
        if (!d || !d.items.length) return null;
        const now = new Date().toISOString();
        const existing = get().routines.find((r) => r.id === d.id);
        const routine: Routine = {
          id: d.id,
          name: d.name.trim() || 'My workout',
          items: d.items,
          days: [...d.days].sort(),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        set((s) => ({
          routines: existing ? s.routines.map((r) => (r.id === d.id ? routine : r)) : [routine, ...s.routines],
          draft: null,
        }));
        return routine;
      },

      discardDraft: () => set({ draft: null }),

      addToRoutine: (id, key) =>
        set((s) => ({
          routines: s.routines.map((r) => (r.id === id ? { ...r, items: [...r.items, item(key)], updatedAt: new Date().toISOString() } : r)),
        })),

      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
    }),
    {
      name: '@gruntz_routines',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ routines: s.routines }),
    },
  ),
);

/** Rough duration: work at ~40s per set plus the prescribed rest. */
export function routineMinutes(r: Pick<Routine, 'items'>) {
  const secs = r.items.reduce((t, i) => t + i.sets * 40 + Math.max(0, i.sets - 1) * i.rest, 0);
  return Math.max(5, Math.round(secs / 60 / 5) * 5);
}
