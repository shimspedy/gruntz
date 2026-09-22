import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getWorkoutPlan, type PlanDay, type WorkoutPlan } from '../data/workoutPlans';

/** The library plan the user follows, and which of its days they have finished. */
interface PlanLibraryState {
  activePlanId: string | null;
  startedAt: string | null;
  completedDayIds: string[];
  /** Full passes through the plan; completing every day starts the next cycle. */
  cycle: number;
  /** Progress kept per plan, so switching plans (or looking at another) never erases it. */
  progressByPlan: Record<string, { completedDayIds: string[]; cycle: number; startedAt: string }>;

  follow: (planId: string) => void;
  unfollow: () => void;
  markDayDone: (dayId: string) => void;
  /** Un-marks a day the user completed by mistake. */
  unmarkDay: (dayId: string) => void;
  /** Set when the final day of a plan is finished, so the app can mark the moment once. */
  justCompleted: string | null;
  clearJustCompleted: () => void;
  restartPlan: () => void;
}

export const usePlanLibraryStore = create<PlanLibraryState>()(
  persist(
    (set, get) => ({
      activePlanId: null,
      startedAt: null,
      completedDayIds: [],
      cycle: 0,
      progressByPlan: {},
      justCompleted: null,

      follow: (planId) => {
        const { activePlanId, completedDayIds, cycle, startedAt, progressByPlan } = get();
        if (activePlanId === planId) return;
        // Park the current plan's progress before switching, and pick up where this one left off.
        const parked = activePlanId && startedAt ? { ...progressByPlan, [activePlanId]: { completedDayIds, cycle, startedAt } } : progressByPlan;
        const resumed = parked[planId];
        set({
          activePlanId: planId,
          startedAt: resumed?.startedAt ?? new Date().toISOString(),
          completedDayIds: resumed?.completedDayIds ?? [],
          cycle: resumed?.cycle ?? 0,
          progressByPlan: parked,
        });
      },

      unfollow: () => {
        const { activePlanId, completedDayIds, cycle, startedAt, progressByPlan } = get();
        set({
          activePlanId: null,
          startedAt: null,
          completedDayIds: [],
          cycle: 0,
          progressByPlan: activePlanId && startedAt ? { ...progressByPlan, [activePlanId]: { completedDayIds, cycle, startedAt } } : progressByPlan,
        });
      },

      markDayDone: (dayId) => {
        const { activePlanId, completedDayIds, cycle } = get();
        const plan = activePlanId ? getWorkoutPlan(activePlanId) : undefined;
        if (!plan || !plan.days.some((d) => d.id === dayId) || completedDayIds.includes(dayId)) return;
        const done = [...completedDayIds, dayId];
        // The final day keeps every tick visible; the next day started begins the new cycle.
        const finishedPlan = plan.days.every((d) => done.includes(d.id));
        set(finishedPlan ? { completedDayIds: done, cycle: cycle + 1, justCompleted: plan.id } : { completedDayIds: done });
      },

      unmarkDay: (dayId) =>
        set((s) => ({ completedDayIds: s.completedDayIds.filter((id) => id !== dayId) })),

      clearJustCompleted: () => set({ justCompleted: null }),

      /** Start the same plan again from day one, keeping the rounds counter. */
      restartPlan: () => set({ completedDayIds: [], justCompleted: null }),
    }),
    {
      name: '@gruntz_plan_library',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Session id for a plan day, so a finished workout can be credited back to the plan. */
export const planSessionId = (planId: string, dayId: string) => `plan:${planId}:${dayId}`;

export function parsePlanSessionId(id: string | null): { planId: string; dayId: string } | null {
  if (!id?.startsWith('plan:')) return null;
  const [, planId, dayId] = id.split(':');
  return planId && dayId ? { planId, dayId } : null;
}

/** The first day not yet completed; after a finished cycle it wraps to day one. */
export function nextPlanDay(plan: WorkoutPlan, completedDayIds: string[]): PlanDay {
  return plan.days.find((d) => !completedDayIds.includes(d.id)) ?? plan.days[0];
}

/** Days finished in the current pass, for progress bars. */
export function planProgress(plan: WorkoutPlan, completedDayIds: string[]) {
  const done = plan.days.filter((d) => completedDayIds.includes(d.id)).length;
  return { done, total: plan.days.length, fraction: plan.days.length ? done / plan.days.length : 0 };
}

export function useActivePlan(): WorkoutPlan | undefined {
  const id = usePlanLibraryStore((s) => s.activePlanId);
  return id ? getWorkoutPlan(id) : undefined;
}
