import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChallengeSheet } from '../components/ChallengeSheet';
import { ReadinessSheet } from '../components/ReadinessSheet';
import { WorkoutSessionHost } from '../components/session/WorkoutSession';
import AchievementsScreen from '../screens/AchievementsScreen';
import CardDetailScreen from '../screens/CardDetailScreen';
import CardLibraryScreen from '../screens/CardLibraryScreen';
import CelebrationScreen from '../screens/CelebrationScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import ExerciseLibraryScreen from '../screens/ExerciseLibraryScreen';
import RoutineDetailScreen from '../screens/RoutineDetailScreen';
import RoutineEditorScreen from '../screens/RoutineEditorScreen';
import LeaderToolsScreen from '../screens/LeaderToolsScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import PaywallScreen from '../screens/PaywallScreen';
import PlanScreen from '../screens/PlanScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import ProgramSelectScreen from '../screens/ProgramSelectScreen';
import RanksScreen from '../screens/RanksScreen';
import RunTrackerScreen from '../screens/RunTrackerScreen';
import ServiceProfileScreen from '../screens/ServiceProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import StreakScreen from '../screens/StreakScreen';
import TestScreen from '../screens/TestScreen';
import TrainScreen from '../screens/TrainScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import { useChallengeStore } from '../store/useChallengeStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import type { OnboardingStackParamList, RootStackParamList, TabParamList } from '../types/navigation';
import { LogoMark } from '../ui/Logo';
import { color } from '../ui/tokens';
import { navigationRef } from './ref';
import { TabBar } from './TabBar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: color.accent, background: color.bg, card: color.bg, text: color.text, border: color.line },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View entering={FadeIn.duration(420)} style={styles.fill}>
      <Tabs.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg }, animation: 'none' }}
      >
        <Tabs.Screen name="Train" component={TrainScreen} />
        <Tabs.Screen name="Ranks" component={RanksScreen} />
        <Tabs.Screen name="Test" component={TestScreen} />
        <Tabs.Screen name="Profile" component={ProfileScreen} />
      </Tabs.Navigator>
      {/* Content scrolls under the status bar into black, never behind the clock. */}
      <LinearGradient
        pointerEvents="none"
        colors={[color.bg, 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']}
        locations={[0, 0.6, 1]}
        style={[styles.statusScrim, { height: insets.top + 14 }]}
      />
    </Animated.View>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="Plan" component={PlanScreen} />
      <Stack.Screen name="ProgramSelect" component={ProgramSelectScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen name="CardLibrary" component={CardLibraryScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen
        name="ExerciseLibrary"
        component={ExerciseLibraryScreen}
        options={({ route }) => (route.params?.pick ? { presentation: 'modal', contentStyle: { backgroundColor: color.bg } } : {})}
      />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} options={{ presentation: 'modal', contentStyle: { backgroundColor: color.bgRaised } }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Streak" component={StreakScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ServiceProfile" component={ServiceProfileScreen} />
      <Stack.Screen name="LeaderTools" component={LeaderToolsScreen} />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal', gestureEnabled: false }}>
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="RunTracker" component={RunTrackerScreen} />
      </Stack.Group>
      <Stack.Screen name="Celebration" component={CelebrationScreen} options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

function OnboardingFlow() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
      <OnboardingStack.Screen
        name="OnboardingPaywall"
        component={PaywallScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </OnboardingStack.Navigator>
  );
}

/** Same frame as the native splash, held until persisted state resolves: no flash, no jump. */
function Boot() {
  return (
    <View style={[styles.fill, styles.boot]}>
      <LogoMark size={96} />
    </View>
  );
}

export function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const updateStreak = useUserStore((s) => s.updateStreak);
  const subscriptionHydrated = useSubscriptionStore((s) => s.hasHydrated);
  const initializeSubscription = useSubscriptionStore((s) => s.initialize);
  const resetDailyChallenge = useChallengeStore((s) => s.resetDaily);
  // Safety valve: never hold the splash more than 3 s on a slow store.
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (subscriptionHydrated) return;
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, [subscriptionHydrated]);

  useEffect(() => {
    if (!hasHydrated || !subscriptionHydrated) return;
    const refresh = () => {
      updateStreak();
      resetDailyChallenge();
      void initializeSubscription().catch((err) => {
        if (__DEV__) console.warn('[RootNavigator] initializeSubscription failed', err);
      });
    };
    refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [hasHydrated, subscriptionHydrated, initializeSubscription, updateStreak, resetDailyChallenge]);

  if (!fontsReady || !hasHydrated || (!subscriptionHydrated && !timedOut)) return <Boot />;

  return (
    <View style={styles.fill}>
      <NavigationContainer ref={navigationRef} theme={theme}>
        {isOnboarded ? <AppStack /> : <OnboardingFlow />}
      </NavigationContainer>
      {isOnboarded ? (
        <>
          <WorkoutSessionHost />
          <ChallengeSheet />
          <ReadinessSheet />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.bg },
  boot: { alignItems: 'center', justifyContent: 'center' },
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
});
