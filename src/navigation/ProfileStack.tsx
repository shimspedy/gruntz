import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ProgramSelectScreen from '../screens/ProgramSelectScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import PaywallScreen from '../screens/PaywallScreen';
import type { ProfileStackParamList } from '../types/navigation';
import { useColors } from '../theme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
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
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Achievements' }} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Gruntz Pro', headerBackTitle: 'Back' }} />
      <Stack.Screen name="ProgramSelect" component={ProgramSelectScreen} options={{ title: 'Programs', headerBackTitle: 'Back' }} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ title: 'Program Details', headerBackTitle: 'Back' }} />
    </Stack.Navigator>
  );
}
