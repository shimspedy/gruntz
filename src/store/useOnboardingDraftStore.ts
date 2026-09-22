import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FitnessTestType, ServiceBranch, ServiceStatus, UserProfile } from '../types';

/** Onboarding answers saved as they're given, so closing the app mid-way resumes at the same question. */
export interface OnboardingDraft {
  step: string;
  name: string;
  goals: string[];
  level: UserProfile['fitness_level'] | null;
  branch: ServiceBranch | null;
  status: ServiceStatus | null;
  testType: FitnessTestType;
  weeksOut: number;
  noDate: boolean;
  days: number | null;
  minutes: number | null;
  gear: string[];
  guardrails: string[];
  age: NonNullable<UserProfile['age_range']> | null;
  intensity: UserProfile['preferred_intensity'] | null;
  remindersOn: boolean;
  planChoice: string | null;
}

interface OnboardingDraftState {
  draft: OnboardingDraft | null;
  save: (draft: OnboardingDraft) => void;
  clear: () => void;
}

export const useOnboardingDraftStore = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      draft: null,
      save: (draft) => set({ draft }),
      clear: () => set({ draft: null }),
    }),
    { name: '@gruntz_onboarding_draft', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function useOnboardingDraftHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useOnboardingDraftStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    const unsub = useOnboardingDraftStore.persist.onFinishHydration(() => setHydrated(true));
    if (useOnboardingDraftStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [hydrated]);
  return hydrated;
}
