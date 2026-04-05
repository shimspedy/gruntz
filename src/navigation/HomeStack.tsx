import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProgramSelectScreen from '../screens/ProgramSelectScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import DailyMissionScreen from '../screens/DailyMissionScreen';
import MissionCompleteScreen from '../screens/MissionCompleteScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import CoachChatScreen from '../screens/CoachChatScreen';
import PlanGeneratorScreen from '../screens/PlanGeneratorScreen';
import FormAnalysisScreen from '../screens/FormAnalysisScreen';
import type { HomeStackParamList } from '../types/navigation';
import { useColors } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProgramSelect"
        component={ProgramSelectScreen}
        options={{ title: 'Programs', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{ title: 'Program Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="DailyMission"
        component={DailyMissionScreen}
        options={{ title: 'Mission', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="MissionComplete"
        component={MissionCompleteScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{ title: 'Exercise', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="CoachChat"
        component={CoachChatScreen}
        options={{ title: 'Ask the Coach', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="PlanGenerator"
        component={PlanGeneratorScreen}
        options={{ title: 'Plan Generator', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="FormAnalysis"
        component={FormAnalysisScreen}
        options={{ title: 'Form Guide', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}
