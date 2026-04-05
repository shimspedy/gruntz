import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { ProgramId, UserAssessment } from '../types';

const VALID_PROGRAMS: ProgramId[] = ['raider', 'recon'];

function isValidProgramId(val: unknown): val is ProgramId {
  return typeof val === 'string' && VALID_PROGRAMS.includes(val as ProgramId);
}

function isValidWeek(val: unknown, program: ProgramId | null): boolean {
  if (typeof val !== 'number' || !Number.isInteger(val)) return false;
  const max = program === 'recon' ? 12 : 10;
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

  selectProgram: (id: ProgramId) => void;
  setCurrentWeek: (week: number) => void;
  setAssessment: (assessment: Partial<UserAssessment>) => void;
  setHasSeenProgramSelect: (seen: boolean) => void;
  loadPersistedState: () => Promise<void>;
}

const STORAGE_KEY = '@gruntz_program';
const ASSESSMENT_KEY = 'gruntz_assessment';

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
    const maxWeek = get().selectedProgram === 'recon' ? 12 : 10;
    const clamped = Math.max(1, Math.min(maxWeek, week));
    set({ currentWeek: clamped });
    persistState({ ...get(), currentWeek: clamped });
  },

  setAssessment: (partial) => {
    const updated = { ...get().assessment, ...partial, assessed_at: new Date().toISOString() };
    const sanitized = sanitizeAssessment(updated);
    set({ assessment: sanitized });
    persistState({ ...get(), assessment: sanitized });
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
        const program = isValidProgramId(parsed.selectedProgram) ? parsed.selectedProgram : null;
        const week = isValidWeek(parsed.currentWeek, program) ? parsed.currentWeek : 1;
        set({
          selectedProgram: program,
          currentWeek: week,
          hasSeenProgramSelect: parsed.hasSeenProgramSelect === true,
        });
      }
      // Assessment stored securely
      const assessmentRaw = await SecureStore.getItemAsync(ASSESSMENT_KEY);
      if (assessmentRaw) {
        const assessment = sanitizeAssessment(JSON.parse(assessmentRaw));
        set({ assessment });
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
    hasSeenProgramSelect: state.hasSeenProgramSelect,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  // Assessment stored securely (separate from general state)
  if (state.assessment) {
    SecureStore.setItemAsync(ASSESSMENT_KEY, JSON.stringify(state.assessment)).catch(() => {});
  }
}
