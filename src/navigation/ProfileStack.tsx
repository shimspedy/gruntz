import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AvatarScreen from '../screens/AvatarScreen';
import RecoveryScreen from '../screens/RecoveryScreen';
import ProgramSelectScreen from '../screens/ProgramSelectScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import type { ProfileStackParamList } from '../types/navigation';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
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
      <Stack.Screen name="Avatar" component={AvatarScreen} options={{ title: 'Avatar & Gear' }} />
      <Stack.Screen name="Recovery" component={RecoveryScreen} options={{ title: 'Recovery Hub' }} />
      <Stack.Screen name="ProgramSelect" component={ProgramSelectScreen} options={{ title: 'Programs', headerBackTitle: 'Back' }} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ title: 'Program Details', headerBackTitle: 'Back' }} />
    </Stack.Navigator>
  );
}
