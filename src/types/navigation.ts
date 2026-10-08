import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Rank } from './index';
import type { ActivityType } from './activity';

export type TabParamList = {
  Train: undefined;
  Ranks: undefined;
  /** Military Prep only; other users get `Plans` in this slot. */
  Test: undefined;
  Plans: undefined;
  Profile: undefined;
};

export interface CelebrationParams {
  xpEarned: number;
  levelBefore: number;
  levelAfter: number;
  rankBefore: Rank;
  rankAfter: Rank;
  streak: number;
  achievementIds: string[];
  title: string;
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  WorkoutDetail: { workoutId: string; dateKey: string };
  Plan: undefined;
  ProgramSelect: undefined;
  ProgramDetail: { programId: string };
  /** Library plans: browse, one plan, one day of a plan. */
  PlanBrowse: undefined;
  LibraryPlanDetail: { planId: string };
  LibraryPlanDay: { planId: string; dayId: string };
  CardLibrary: { category?: string } | undefined;
  CardDetail: { cardId: string };
  ExerciseDetail: { exerciseId?: string; mediaKey?: string };
  /** `pick` opens multi-select; `target: 'session'` adds the picks to the running workout instead of the routine draft. */
  ExerciseLibrary: { pick?: boolean; target?: 'routine' | 'session' } | undefined;
  RoutineEditor: undefined;
  RoutineDetail: { routineId: string };
  Achievements: undefined;
  Streak: undefined;
  Stats: undefined;
  Settings: undefined;
  ServiceProfile: undefined;
  Backup: undefined;
  DataTransfer: undefined;
  TrainingPreferences: undefined;
  LeaderTools: undefined;
  /** The route behind every `<Sheet>`; `id` names the content its owner published. */
  Sheet: { id: string; scroll?: boolean };
  Paywall: undefined;
  RunTracker: { type?: ActivityType } | undefined;
  ActivityHistory: undefined;
  ActivityDetail: { sessionId: string };
  Celebration: CelebrationParams;
};

export type OnboardingStackParamList = {
  Onboarding: undefined;
  OnboardingPaywall: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
