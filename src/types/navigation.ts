export type RootTabParamList = {
  HomeTab: undefined;
  PlanTab: undefined;
  TestTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ProgramSelect: undefined;
  ProgramDetail: { programId: string };
  Paywall: undefined;
  DailyMission: { missionDate?: string };
  MissionComplete: { xpEarned: number; coinsEarned: number; leveledUp: boolean; newRank?: string };
  ExerciseDetail: { exerciseId: string };
  RunTracker: undefined;
};

export type MissionsStackParamList = {
  Plan: undefined;
  WorkoutCards: undefined;
  Achievements: undefined;
  Paywall: undefined;
  CardDetail: { cardId: string };
  ExerciseDetail: { exerciseId: string };
};

export type ProgressStackParamList = {
  Progress: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Achievements: undefined;
  ProgramSelect: undefined;
  ProgramDetail: { programId: string };
  Paywall: undefined;
  LeaderTools: undefined;
  ServiceProfile: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
};
