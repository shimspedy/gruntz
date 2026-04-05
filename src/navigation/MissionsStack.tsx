import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChallengesScreen from '../screens/ChallengesScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import WorkoutCardsScreen from '../screens/WorkoutCardsScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import type { MissionsStackParamList } from '../types/navigation';
import { useColors } from '../theme';

const Stack = createNativeStackNavigator<MissionsStackParamList>();

export function MissionsStack() {
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
      <Stack.Screen name="Challenges" component={ChallengesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="WorkoutCards" component={WorkoutCardsScreen} options={{ title: 'Training Cards' }} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} options={{ title: 'Card Detail' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: 'Exercise' }} />
    </Stack.Navigator>
  );
}
