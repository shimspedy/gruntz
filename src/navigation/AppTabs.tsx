import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeStack } from './HomeStack';
import { MissionsStack } from './MissionsStack';
import ProgressScreen from '../screens/ProgressScreen';
import { ProfileStack } from './ProfileStack';
import { useColors } from '../theme';
import { hapticSelection } from '../utils/haptics';
import type { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'MissionsTab':
              iconName = 'trophy';
              break;
            case 'ProgressTab':
              iconName = 'bar-chart';
              break;
            case 'ProfileTab':
              iconName = 'person';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="MissionsTab" component={MissionsStack} options={{ title: 'Missions' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
