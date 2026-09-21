import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Rank } from './index';

export type TabParamList = {
  Train: undefined;
  Ranks: undefined;
  Test: undefined;
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
  CardLibrary: { category?: string } | undefined;
  CardDetail: { cardId: string };
  ExerciseDetail: { exerciseId?: string; mediaKey?: string };
  ExerciseLibrary: { pick?: boolean } | undefined;
  RoutineEditor: undefined;
  RoutineDetail: { routineId: string };
  Achievements: undefined;
  Streak: undefined;
  Stats: undefined;
  Settings: undefined;
  ServiceProfile: undefined;
  LeaderTools: undefined;
  Paywall: undefined;
  RunTracker: { type?: 'run' | 'ruck' } | undefined;
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
