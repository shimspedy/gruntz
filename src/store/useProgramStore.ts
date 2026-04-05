import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProgramId, UserAssessment } from '../types';

interface ProgramState {
  selectedProgram: ProgramId | null;
  currentWeek: number;
  assessment: UserAssessment;
  hasSeenProgramSelect: boolean;

  selectProgram: (id: ProgramId) => void;
  setCurrentWeek: (week: number) => void;
  setAssessment: (assessment: Partial<UserAssessment>) => void;
  setHasSeenProgramSelect: (seen: boolean) => void;
  loadPersistedState: () => Promise<void>;
}

const STORAGE_KEY = '@gruntz_program';

export const useProgramStore = create<ProgramState>((set, get) => ({
  selectedProgram: null,
  currentWeek: 1,
  assessment: {},
  hasSeenProgramSelect: false,

  selectProgram: (id) => {
    set({ selectedProgram: id, currentWeek: 1 });
    persistState({ ...get(), selectedProgram: id, currentWeek: 1 });
  },

  setCurrentWeek: (week) => {
    const maxWeek = get().selectedProgram === 'ranger' ? 12 : 10;
    const clamped = Math.max(1, Math.min(maxWeek, week));
    set({ currentWeek: clamped });
    persistState({ ...get(), currentWeek: clamped });
  },

  setAssessment: (partial) => {
    const updated = { ...get().assessment, ...partial, assessed_at: new Date().toISOString() };
    set({ assessment: updated });
    persistState({ ...get(), assessment: updated });
  },

  setHasSeenProgramSelect: (seen) => {
    set({ hasSeenProgramSelect: seen });
    persistState({ ...get(), hasSeenProgramSelect: seen });
  },

  loadPersistedState: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          selectedProgram: parsed.selectedProgram ?? null,
          currentWeek: parsed.currentWeek ?? 1,
          assessment: parsed.assessment ?? {},
          hasSeenProgramSelect: parsed.hasSeenProgramSelect ?? false,
        });
      }
    } catch {
      // Silently fail — use defaults
    }
  },
}));

function persistState(state: Partial<ProgramState>) {
  const toSave = {
    selectedProgram: state.selectedProgram,
    currentWeek: state.currentWeek,
    assessment: state.assessment,
    hasSeenProgramSelect: state.hasSeenProgramSelect,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
}
