import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from './HomeStack';
import { MissionsStack } from './MissionsStack';
import ProgressScreen from '../screens/ProgressScreen';
import { ProfileStack } from './ProfileStack';
import { useColors } from '../theme';
import { hapticSelection } from '../utils/haptics';
import { GlassTabBar } from '../components/GlassTabBar';
import { GameIcon } from '../components/GameIcon';
import type { RootTabParamList } from '../types/navigation';

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
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: 'home' | 'mission' | 'progress' | 'profile' = 'home';
          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'MissionsTab':
              iconName = 'mission';
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
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="MissionsTab" component={MissionsStack} options={{ title: 'Missions' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
