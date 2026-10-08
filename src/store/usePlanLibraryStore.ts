import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { getWorkoutPlan, plansLoaded, type PlanDay, type WorkoutPlan } from '../data/workoutPlans';

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
  markDayDone: (dayId: string, planId?: string) => void;
  /** Un-marks a day the user completed by mistake. */
  unmarkDay: (dayId: string) => void;
  /** Set when the final day of a plan is finished, so the app can mark the moment once. */
  justCompleted: string | null;
  clearJustCompleted: () => void;
  restartPlan: (planId?: string) => void;
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
        if (!getWorkoutPlan(planId)) return;
        const { activePlanId, completedDayIds, cycle, startedAt, progressByPlan } = get();
        if (activePlanId === planId) return;
        // Park the current plan's progress before switching, and pick up where this one left off.
        const parked = activePlanId && startedAt ? { ...progressByPlan, [activePlanId]: { completedDayIds, cycle, startedAt } } : progressByPlan;
        const resumed = parked[planId];
        set({
          // Cleared on switch: justCompleted refers to the plan that finished, but
          // completedDayIds always belongs to the ACTIVE plan — so a stale card left
          // on screen could "Run this plan again" and blank the new plan's progress.
          justCompleted: null,
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
          justCompleted: null,
          startedAt: null,
          completedDayIds: [],
          cycle: 0,
          progressByPlan: activePlanId && startedAt ? { ...progressByPlan, [activePlanId]: { completedDayIds, cycle, startedAt } } : progressByPlan,
        });
      },

      markDayDone: (dayId, planId) => {
        const state = get();
        const targetId = planId ?? state.activePlanId;
        const plan = targetId ? getWorkoutPlan(targetId) : undefined;
        const progress = targetId === state.activePlanId ? state : targetId ? state.progressByPlan[targetId] : undefined;
        if (!progress) return;
        const { completedDayIds, cycle } = progress;
        if (!plan || !plan.days.some((d) => d.id === dayId) || completedDayIds.includes(dayId)) return;
        const done = [...completedDayIds, dayId];
        // The final day keeps every tick visible; the next day started begins the new cycle.
        const finishedPlan = plan.days.every((d) => done.includes(d.id));
        if (targetId !== state.activePlanId) {
          set({ progressByPlan: { ...state.progressByPlan, [plan.id]: { completedDayIds: done, cycle: cycle + (finishedPlan ? 1 : 0), startedAt: progress.startedAt ?? new Date().toISOString() } } });
        } else {
          set(finishedPlan ? { completedDayIds: done, cycle: cycle + 1, justCompleted: plan.id } : { completedDayIds: done });
        }
      },

      unmarkDay: (dayId) =>
        set((s) => {
          if (!s.completedDayIds.includes(dayId)) return s;
          const plan = s.activePlanId ? getWorkoutPlan(s.activePlanId) : undefined;
          const wasComplete = !!plan?.days.length && plan.days.every((d) => s.completedDayIds.includes(d.id));
          return { completedDayIds: s.completedDayIds.filter((id) => id !== dayId), cycle: Math.max(0, s.cycle - (wasComplete ? 1 : 0)), justCompleted: null };
        }),

      clearJustCompleted: () => set({ justCompleted: null }),

      /**
       * Start the active plan again from day one, keeping the rounds counter.
       *
       * `planId` guards against restarting the wrong plan: the completion card can
       * outlive the plan it describes, and `completedDayIds` always belongs to
       * whichever plan is active now.
       */
      restartPlan: (planId) => set((state) => (
        planId && state.activePlanId !== planId ? state : { completedDayIds: [], justCompleted: null }
      )),
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

/**
 * The active plan for the first screen of the app. Parsing the plan file takes long enough
 * to stall launch, so on a cold start this reports `pending` for the first frame and reads
 * the file once that frame is on screen. After that it is immediate.
 */
export function useActivePlanDeferred(): { plan: WorkoutPlan | undefined; pending: boolean } {
  const id = usePlanLibraryStore((s) => s.activePlanId);
  const [ready, setReady] = useState(plansLoaded);
  useEffect(() => {
    if (ready) return undefined;
    const frame = requestAnimationFrame(() => setTimeout(() => setReady(true), 0));
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  if (!id) return { plan: undefined, pending: false };
  return ready ? { plan: getWorkoutPlan(id), pending: false } : { plan: undefined, pending: true };
}

export function useActivePlan(): WorkoutPlan | undefined {
  const id = usePlanLibraryStore((s) => s.activePlanId);
  return id ? getWorkoutPlan(id) : undefined;
}
