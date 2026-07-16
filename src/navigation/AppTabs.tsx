import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from './HomeStack';
import { MissionsStack } from './MissionsStack';
import ProgressScreen from '../screens/ProgressScreen';
import { ProfileStack } from './ProfileStack';
import { spacing, useColors } from '../theme';
import { hapticSelection } from '../utils/haptics';
import { GlassTabBar } from '../components/GlassTabBar';
import { GameIcon } from '../components/GameIcon';
import { FLOATING_TAB_BAR_BOTTOM_OFFSET, FLOATING_TAB_BAR_HEIGHT } from '../hooks/useFloatingTabBarSpacing';
import type { RootTabParamList } from '../types/navigation';
import TestCenterScreen from '../screens/TestCenterScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppTabs() {
  const colors = useColors();
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET + spacing.sm,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: 'home' | 'mission' | 'progress' | 'profile' | 'achievement' = 'home';
          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'PlanTab':
              iconName = 'mission';
              break;
            case 'TestTab':
              iconName = 'achievement';
              break;
            case 'ProgressTab':
              iconName = 'progress';
              break;
            case 'ProfileTab':
              iconName = 'profile';
              break;
          }
          return (
            <GameIcon
              name={iconName}
              size={Math.max(size + 8, 30)}
              color={color}
              variant="minimal"
              animated={focused}
            />
          );
        },
      })}
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Today' }} />
      <Tab.Screen name="PlanTab" component={MissionsStack} options={{ title: 'Plan' }} />
      <Tab.Screen name="TestTab" component={TestCenterScreen} options={{ title: 'Test' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
