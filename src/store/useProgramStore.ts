import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { ProgramId, UserAssessment } from '../types';
import { getProgramMaxWeek } from '../data/programWorkouts';

const VALID_PROGRAMS: ProgramId[] = ['basecamp', 'raider', 'recon'];

function isValidProgramId(val: unknown): val is ProgramId {
  return typeof val === 'string' && VALID_PROGRAMS.includes(val as ProgramId);
}

function isValidWeek(val: unknown, program: ProgramId | null): boolean {
  if (typeof val !== 'number' || !Number.isInteger(val)) return false;
  const max = getProgramMaxWeek(program);
  return val >= 1 && val <= max;
}

function sanitizeAssessment(raw: unknown): UserAssessment {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const result: UserAssessment = {};
  const numericFields = [
    'five_mile_time_minutes', 'mile_split_seconds',
    'max_pushups', 'max_situps', 'max_chinups', 'max_pullups',
  ] as const;
  for (const key of numericFields) {
    const val = obj[key];
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 10000) {
      result[key] = val;
    }
  }
  if (typeof obj.assessed_at === 'string' && obj.assessed_at.length < 50) {
    result.assessed_at = obj.assessed_at;
  }
  return result;
}

interface ProgramState {
  selectedProgram: ProgramId | null;
  currentWeek: number;
  assessment: UserAssessment;
  hasSeenProgramSelect: boolean;
  hasHydrated: boolean;

  selectProgram: (id: ProgramId) => void;
  setAssessment: (assessment: Partial<UserAssessment>) => void;
  setHasSeenProgramSelect: (seen: boolean) => void;
  loadPersistedState: () => Promise<void>;
}

const STORAGE_KEY = '@gruntz_program';
const ASSESSMENT_KEY = 'gruntz_assessment';

type PersistedProgramState = {
  selectedProgram?: ProgramId | null;
  currentWeek?: number;
  hasSeenProgramSelect?: boolean;
};

function migratePersistedProgramState(persistedState: unknown): PersistedProgramState {
  if (!persistedState || typeof persistedState !== 'object') {
    return {};
  }
  const raw = persistedState as Record<string, unknown>;
  const program = isValidProgramId(raw.selectedProgram) ? (raw.selectedProgram as ProgramId) : null;
  const week = isValidWeek(raw.currentWeek, program) ? (raw.currentWeek as number) : 1;
  return {
    selectedProgram: program,
    currentWeek: week,
    hasSeenProgramSelect: raw.hasSeenProgramSelect === true,
  };
}

export const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      selectedProgram: null,
      currentWeek: 1,
      assessment: {},
      hasSeenProgramSelect: false,
      hasHydrated: false,

      selectProgram: (id) => {
        set({ selectedProgram: id, currentWeek: 1 });
      },

      setAssessment: (partial) => {
        const updated = { ...get().assessment, ...partial, assessed_at: new Date().toISOString() };
        const sanitized = sanitizeAssessment(updated);
        set({ assessment: sanitized });
        // Assessment lives in SecureStore — separate from the persist middleware.
        SecureStore.setItemAsync(ASSESSMENT_KEY, JSON.stringify(sanitized)).catch((err) => {
          if (__DEV__) {
            console.warn('[useProgramStore] failed to persist assessment', err);
          }
        });
      },

      setHasSeenProgramSelect: (seen) => {
        set({ hasSeenProgramSelect: seen });
      },

      loadPersistedState: async () => {
        try {
          const assessmentRaw = await SecureStore.getItemAsync(ASSESSMENT_KEY);
          if (assessmentRaw) {
            const assessment = sanitizeAssessment(JSON.parse(assessmentRaw));
            set({ assessment });
          }
        } catch (err) {
          if (__DEV__) {
            console.warn('[useProgramStore] failed to load assessment', err);
          }
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => migratePersistedProgramState(persistedState),
      partialize: (state) => ({
        selectedProgram: state.selectedProgram,
        currentWeek: state.currentWeek,
        hasSeenProgramSelect: state.hasSeenProgramSelect,
      }),
      merge: (persistedState, currentState) => {
        const persisted = migratePersistedProgramState(persistedState);
        return {
          ...currentState,
          selectedProgram:
            persisted.selectedProgram !== undefined ? persisted.selectedProgram ?? null : currentState.selectedProgram,
          currentWeek:
            typeof persisted.currentWeek === 'number' ? persisted.currentWeek : currentState.currentWeek,
          hasSeenProgramSelect:
            typeof persisted.hasSeenProgramSelect === 'boolean'
              ? persisted.hasSeenProgramSelect
              : currentState.hasSeenProgramSelect,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error && __DEV__) {
          console.warn('[useProgramStore] rehydrate failed', error);
        }
        useProgramStore.setState({ hasHydrated: true });
        // Load assessment from SecureStore after main state is hydrated.
        void useProgramStore.getState().loadPersistedState();
      },
    }
  )
);
