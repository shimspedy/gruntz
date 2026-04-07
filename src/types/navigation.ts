export type RootTabParamList = {
  HomeTab: undefined;
  MissionsTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ProgramSelect: undefined;
  ProgramDetail: { programId: string };
  DailyMission: { missionDate?: string };
  MissionComplete: { xpEarned: number; coinsEarned: number; leveledUp: boolean; newRank?: string };
  ExerciseDetail: { exerciseId: string };
  RunTracker: undefined;
};

export type MissionsStackParamList = {
  WorkoutCards: undefined;
  Achievements: undefined;
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
};

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
};
