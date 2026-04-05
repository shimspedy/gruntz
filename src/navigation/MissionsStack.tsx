import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChallengesScreen from '../screens/ChallengesScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import type { MissionsStackParamList } from '../types/navigation';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<MissionsStackParamList>();

export function MissionsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
    </Stack.Navigator>
  );
}
