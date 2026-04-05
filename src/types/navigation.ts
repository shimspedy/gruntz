export type RootTabParamList = {
  HomeTab: undefined;
  MissionsTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  DailyMission: { missionDate?: string };
  MissionComplete: { xpEarned: number; coinsEarned: number; leveledUp: boolean; newRank?: string };
};

export type MissionsStackParamList = {
  Challenges: undefined;
  Achievements: undefined;
};

export type ProgressStackParamList = {
  Progress: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Avatar: undefined;
  Recovery: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
};
