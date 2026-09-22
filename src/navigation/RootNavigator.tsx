import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, NavigationContainer, type InitialState, type NavigationState } from '@react-navigation/native';
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
import LibraryPlanDayScreen from '../screens/LibraryPlanDayScreen';
import LibraryPlanDetailScreen from '../screens/LibraryPlanDetailScreen';
import PaywallScreen from '../screens/PaywallScreen';
import PlanBrowseScreen from '../screens/PlanBrowseScreen';
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
import TrainingPreferencesScreen from '../screens/TrainingPreferencesScreen';
import TrainScreen from '../screens/TrainScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import { useChallengeStore } from '../store/useChallengeStore';
import { useOnboardingDraftStore } from '../store/useOnboardingDraftStore';
import { setNotificationsEnabled } from '../services/notifications';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import type { OnboardingStackParamList, RootStackParamList, TabParamList } from '../types/navigation';
import { LogoMark } from '../ui/Logo';
import { color } from '../ui/tokens';
import { navigationRef } from './ref';
import { TabBar } from './TabBar';

/** How long an entitlement check stays fresh before the next foreground re-checks. */
const ENTITLEMENT_REFRESH_MS = 30 * 60 * 1000;

/**
 * Deep links. Without a scheme and this config a notification tap could not route
 * anywhere — the app opened on whatever screen it was last on. Paths are kept flat
 * and stable so a link in a push payload survives navigator changes.
 */
const linking = {
  prefixes: ['gruntz://', 'https://gruntz.app'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Train: 'train',
          Ranks: 'ranks',
          Test: 'test',
          Plans: 'my-plans',
          Profile: 'profile',
        },
      },
      PlanBrowse: 'plans',
      LibraryPlanDetail: 'plans/:planId',
      LibraryPlanDay: 'plans/:planId/:dayId',
      ExerciseDetail: 'exercise/:mediaKey',
      Achievements: 'achievements',
      Streak: 'streak',
      Stats: 'stats',
      Settings: 'settings',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: color.accent, background: color.bg, card: color.bg, text: color.text, border: color.line },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  // The branch fitness-test board only makes sense for Military Prep; everyone else gets Plans.
  const military = useUserStore((s) => !!s.profile?.goals.includes('Military Prep'));
  return (
    <Animated.View entering={FadeIn.duration(420)} style={styles.fill}>
      <Tabs.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg }, animation: 'none' }}
      >
        <Tabs.Screen name="Train" component={TrainScreen} />
        <Tabs.Screen name="Ranks" component={RanksScreen} />
        {military ? <Tabs.Screen name="Test" component={TestScreen} /> : <Tabs.Screen name="Plans" component={PlanBrowseScreen} />}
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
      <Stack.Screen name="PlanBrowse" component={PlanBrowseScreen} />
      <Stack.Screen name="LibraryPlanDetail" component={LibraryPlanDetailScreen} />
      <Stack.Screen name="LibraryPlanDay" component={LibraryPlanDayScreen} />
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
      <Stack.Screen name="TrainingPreferences" component={TrainingPreferencesScreen} />
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

const NAV_KEY = '@gruntz_nav_state';
const NAV_MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Screens that only make sense in the moment they were opened; never restored after a relaunch. */
const TRANSIENT = new Set(['Celebration', 'Paywall', 'RunTracker', 'RoutineEditor']);
const isTransient = (r: { name: string; params?: object }) =>
  TRANSIENT.has(r.name) || (r.name === 'ExerciseLibrary' && !!(r.params as { pick?: boolean } | undefined)?.pick);

/** Drop transient screens (and anything stacked above them) from a saved navigation state. */
function restorable(state: InitialState | undefined): InitialState | undefined {
  const routes = state?.routes;
  if (!routes?.length) return undefined;
  const cut = routes.findIndex(isTransient);
  const kept = cut === -1 ? routes : routes.slice(0, cut);
  if (!kept.length) return undefined;
  return { ...state, routes: kept, index: kept.length - 1 } as InitialState;
}

/** Reopen on the screen the user left, if iOS closed the app while it was in the background. */
function useSavedNavigation(hydrated: boolean, onboarded: boolean) {
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<InitialState | undefined>();
  useEffect(() => {
    if (!hydrated || ready) return;
    if (!onboarded) return setReady(true);
    let cancelled = false;
    AsyncStorage.getItem(NAV_KEY)
      .then((raw) => {
        if (!raw || cancelled) return;
        const saved = JSON.parse(raw) as { savedAt: number; state: InitialState };
        if (Date.now() - saved.savedAt < NAV_MAX_AGE_MS) setInitial(restorable(saved.state));
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [hydrated, onboarded, ready]);
  const save = (state: NavigationState | undefined) => {
    if (state) void AsyncStorage.setItem(NAV_KEY, JSON.stringify({ savedAt: Date.now(), state })).catch(() => undefined);
  };
  return { ready, initial, save };
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
  const nav = useSavedNavigation(hasHydrated, isOnboarded);
  const remindersOn = useUserStore((s) => s.profile?.settings.notifications_enabled ?? true);
  useEffect(() => {
    setNotificationsEnabled(remindersOn);
  }, [remindersOn]);
  // Safety valve: never hold the splash more than 3 s on a slow store.
  const [timedOut, setTimedOut] = useState(false);

  // Saved onboarding answers are only needed until the user is in (they survive the paywall step).
  useEffect(() => {
    if (hasHydrated && isOnboarded) useOnboardingDraftStore.getState().clear();
  }, [hasHydrated, isOnboarded]);

  useEffect(() => {
    if (subscriptionHydrated) return;
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, [subscriptionHydrated]);

  // Entitlements barely change, and re-checking them on every single foreground
  // meant a RevenueCat round trip each time the user glanced at another app.
  // Streak and daily-challenge rollover are local and still run every time.
  const lastEntitlementCheck = useRef(0);
  useEffect(() => {
    if (!hasHydrated || !subscriptionHydrated) return;
    const refresh = () => {
      updateStreak();
      resetDailyChallenge();
      if (Date.now() - lastEntitlementCheck.current < ENTITLEMENT_REFRESH_MS) return;
      lastEntitlementCheck.current = Date.now();
      void initializeSubscription().catch((err) => {
        // A failed check must not count as done, or a recovered network is ignored.
        lastEntitlementCheck.current = 0;
        if (__DEV__) console.warn('[RootNavigator] initializeSubscription failed', err);
      });
    };
    refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [hasHydrated, subscriptionHydrated, initializeSubscription, updateStreak, resetDailyChallenge]);

  if (!fontsReady || !hasHydrated || !nav.ready || (!subscriptionHydrated && !timedOut)) return <Boot />;

  return (
    <View style={styles.fill}>
      <NavigationContainer
        ref={navigationRef}
        theme={theme}
        linking={linking}
        initialState={isOnboarded ? nav.initial : undefined}
        onStateChange={isOnboarded ? nav.save : undefined}
      >
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
