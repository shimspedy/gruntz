import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DailyMissionScreen from '../screens/DailyMissionScreen';
import MissionCompleteScreen from '../screens/MissionCompleteScreen';
import type { HomeStackParamList } from '../types/navigation';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
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
        name="DailyMission"
        component={DailyMissionScreen}
        options={{ title: 'Mission', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="MissionComplete"
        component={MissionCompleteScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
