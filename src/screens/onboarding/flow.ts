import type { ServiceBranch } from '../../types';

export type OnboardingStep =
  | 'welcome' | 'goals' | 'level' | 'branch' | 'testChoice' | 'testDate'
  | 'days' | 'minutes' | 'equipment' | 'guardrails' | 'ready' | 'practice';

/** Only answers that change the starting plan belong before the first workout. */
export function onboardingSteps(military: boolean, branch: ServiceBranch | null): OnboardingStep[] {
  const steps: OnboardingStep[] = ['welcome', 'goals', 'level'];
  if (military) {
    steps.push('branch');
    if (branch === 'marines') steps.push('testChoice');
    steps.push('testDate');
  }
  steps.push('days', 'minutes', 'equipment', 'guardrails', 'ready', 'practice');
  return steps;
}

/** Keep an in-progress draft useful when optional screens disappear in an update. */
export function resumedOnboardingStep(saved: string | undefined, steps: OnboardingStep[]): OnboardingStep {
  if (saved && steps.includes(saved as OnboardingStep)) return saved as OnboardingStep;
  if (saved === 'story1') return steps.includes('branch') ? 'branch' : 'days';
  if (saved === 'status') return steps.includes('testChoice') ? 'testChoice' : steps.includes('testDate') ? 'testDate' : 'days';
  if (saved === 'story2') return 'days';
  if (saved === 'commit') return 'practice';
  if (['age', 'intensity', 'name', 'notify', 'generating'].includes(saved ?? '')) return 'ready';
  return 'welcome';
}

export function preferredOnboardingPlan(
  military: boolean,
  builtin: string,
  libraryIds: string[],
  choice: string | null,
): string {
  if (choice === builtin && (military || libraryIds.length === 0)) return choice;
  if (choice && libraryIds.includes(choice)) return choice;
  return military ? builtin : libraryIds[0] ?? builtin;
}

export interface PracticeLog { reps: number; loggedReps: number | null }
export type PracticeAction = { type: 'adjust'; amount: 1 | -1 } | { type: 'log' } | { type: 'reset' };
export const INITIAL_PRACTICE_LOG: PracticeLog = { reps: 8, loggedReps: null };

/** Deliberately isolated from workout, XP, achievement and progression stores. */
export function practiceLogReducer(state: PracticeLog, action: PracticeAction): PracticeLog {
  if (action.type === 'reset') return { ...INITIAL_PRACTICE_LOG };
  if (state.loggedReps !== null) return state;
  if (action.type === 'log') return { ...state, loggedReps: state.reps };
  return { ...state, reps: Math.max(1, Math.min(50, state.reps + action.amount)) };
}
