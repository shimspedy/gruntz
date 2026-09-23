import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Platform, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { startBackupLifecycle } from '../services/backup';
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
import BackupScreen from '../screens/BackupScreen';
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
import { useProgramStore } from '../store/useProgramStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useSessionStore } from '../store/useSessionStore';
import { getLocalDateKey } from '../utils/dateKey';
import { useUiStore } from '../store/useUiStore';
import { useUserStore } from '../store/useUserStore';
import type { OnboardingStackParamList, RootStackParamList, TabParamList } from '../types/navigation';
import { LogoMark } from '../ui/Logo';
import { color } from '../ui/tokens';
import { navigationRef } from './ref';
import { TabBar } from './TabBar';

/** Coalesce navigation-state writes; a tab tap should not cost a disk write. */
const NAV_SAVE_DEBOUNCE_MS = 600;

/** How long an entitlement check stays fresh before the next foreground re-checks. */
const ENTITLEMENT_REFRESH_MS = 30 * 60 * 1000;

/**
 * Deep links. Paths are kept flat and stable so a link in a push payload survives
 * navigator changes.
 *
 * `getInitialURL`/`subscribe` are overridden because React Navigation only listens
 * to `Linking` URL events, and a notification tap never produces one — so every
 * reminder ("Time to train", "Rest's up", "Week In Review", "Your access ends
 * soon") simply resumed whatever screen the app was last on. Each payload now
 * carries the `url` it is about, and these two bridges feed it in: `getInitialURL`
 * for a tap that cold-starts the app, `subscribe` for one that arrives while it is
 * running or backgrounded.
 */
function notificationUrl(response: Notifications.NotificationResponse | null | undefined) {
  const url = response?.notification.request.content.data?.url;
  return typeof url === 'string' ? url : null;
}

const linking = {
  prefixes: ['gruntz://', 'https://gruntz.app'],
  async getInitialURL() {
    const fromLink = await Linking.getInitialURL();
    if (fromLink) return fromLink;
    return notificationUrl(await Notifications.getLastNotificationResponseAsync());
  },
  subscribe(listener: (url: string) => void) {
    const linkSub = Linking.addEventListener('url', ({ url }) => listener(url));
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = notificationUrl(response);
      if (url) listener(url);
    });
    return () => {
      linkSub.remove();
      responseSub.remove();
    };
  },
  config: {
    screens: {
      Tabs: {
        screens: {
          Train: 'train',
          Ranks: 'ranks',
          // Only registered for Military Prep athletes; the link does not resolve
          // for anyone else, so do not put it in general marketing.
          Test: 'test',
          Profile: 'profile',
        },
      },
      // Reachable by every athlete, unlike the Plans *tab* the removed `my-plans`
      // alias pointed at.
      PlanBrowse: 'plans',
      LibraryPlanDetail: 'plans/:planId',
      LibraryPlanDay: 'plans/:planId/:dayId',
      ExerciseDetail: 'exercise/:mediaKey',
      Achievements: 'achievements',
      Streak: 'streak',
      Stats: 'stats',
      Settings: 'settings',
      Paywall: 'paywall',
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
      <Stack.Screen name="Backup" component={BackupScreen} />
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
const isTransient = (r: { name: string; params?: object }) => {
  if (TRANSIENT.has(r.name)) return true;
  if (r.name === 'ExerciseLibrary' && !!(r.params as { pick?: boolean } | undefined)?.pick) return true;
  // A screen pinned to a date is only valid on that date. Restoring one saved up to
  // twelve hours ago could present yesterday's workout as today's.
  const dateKey = (r.params as { dateKey?: string } | undefined)?.dateKey;
  return !!dateKey && dateKey !== getLocalDateKey();
};

/**
 * Drop transient screens (and anything stacked above them) from a saved navigation
 * state, at every level. Filtering only the top-level routes left a transient screen
 * nested inside a tab's own stack to be restored anyway.
 */
function restorable(state: InitialState | undefined): InitialState | undefined {
  const routes = state?.routes;
  if (!routes?.length) return undefined;
  const cut = routes.findIndex(isTransient);
  const kept = (cut === -1 ? routes : routes.slice(0, cut)).map((route) =>
    route.state ? { ...route, state: restorable(route.state as InitialState) } : route,
  );
  if (!kept.length) return undefined;
  // A stack's index is its top; a TAB navigator's index is the selected tab, and
  // forcing it to the last entry reopened the app on the last tab (Profile) on
  // every cold start, whatever the user was actually looking at. Keep the saved
  // index where it still points at a surviving route, and only clamp when the
  // screens above it were dropped.
  const saved = typeof state?.index === 'number' ? state.index : kept.length - 1;
  return { ...state, routes: kept, index: Math.min(Math.max(saved, 0), kept.length - 1) } as InitialState;
}

/**
 * Android's hardware back should close whatever is on top. Neither the + menu nor
 * the full-screen workout overlay is a navigator screen, so back used to fall
 * through them and leave the app instead.
 */
function useAndroidBack() {
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (useUiStore.getState().createMenuOpen) {
        useUiStore.getState().setCreateMenu(false);
        return true;
      }
      const session = useSessionStore.getState();
      if (session.active && !session.minimized) {
        session.minimize();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);
}

/** Subscribes to a persisted store's hydration so the boot gate actually re-renders. */
function usePersistHydrated(store: { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } }) {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return undefined;
    if (store.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }
    return store.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated, store]);
  return hydrated;
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
  // onStateChange fires on every navigation, including each tab tap and every step
  // of a gesture, and each one serialised the whole tree to disk. Coalesced to one
  // write, and flushed when the app leaves the foreground so nothing in flight is
  // lost if iOS kills us.
  const pending = useRef<NavigationState | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const flush = () => {
      clearTimeout(timer.current);
      timer.current = undefined;
      const state = pending.current;
      pending.current = undefined;
      if (state) void AsyncStorage.setItem(NAV_KEY, JSON.stringify({ savedAt: Date.now(), state })).catch(() => undefined);
    };
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, []);

  const save = (state: NavigationState | undefined) => {
    if (!state) return;
    pending.current = state;
    if (timer.current) return;
    timer.current = setTimeout(() => {
      clearTimeout(timer.current);
      timer.current = undefined;
      const next = pending.current;
      pending.current = undefined;
      if (next) void AsyncStorage.setItem(NAV_KEY, JSON.stringify({ savedAt: Date.now(), state: next })).catch(() => undefined);
    }, NAV_SAVE_DEBOUNCE_MS);
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
  const programHydrated = useProgramStore((s) => s.hasHydrated);
  useAndroidBack();
  const sessionHydrated = usePersistHydrated(useSessionStore);
  const routineHydrated = usePersistHydrated(useRoutineStore);
  const remindersOn = useUserStore((s) => s.profile?.settings.notifications_enabled ?? true);
  useEffect(() => {
    setNotificationsEnabled(remindersOn);
  }, [remindersOn]);
  // Flushes a pending backup when the app is backgrounded, so finishing a workout
  // and immediately closing does not leave that session unbacked. No-ops entirely
  // when the build has no backup keys.
  useEffect(() => startBackupLifecycle(), []);
  /**
   * Whether this launch came from a deep link.
   *
   * `initialState` beats the URL-derived state in React Navigation and
   * short-circuits the wait for it, so passing the saved state unconditionally
   * meant a `gruntz://plans/:planId` tapped from a message or an ad opened the
   * user's last screen instead of the plan — for everyone whose saved state was
   * under 12 h old, i.e. exactly the engaged users most likely to tap one.
   * `null` means "not resolved yet"; boot waits for it, which is a single
   * already-resolved call on a cold start.
   */
  const [launchedFromLink, setLaunchedFromLink] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    Linking.getInitialURL()
      .then((url) => { if (!cancelled) setLaunchedFromLink(Boolean(url)); })
      .catch(() => { if (!cancelled) setLaunchedFromLink(false); });
    return () => { cancelled = true; };
  }, []);

  // Safety valve: never hold the splash more than 3 s on a slow store.
  const [timedOut, setTimedOut] = useState(false);

  // Saved onboarding answers are only needed until the user is in (they survive the paywall step).
  useEffect(() => {
    // Both stores must have hydrated: clearing on the user store's flag alone
    // could wipe the draft a moment before the draft store restored it.
    if (!hasHydrated || !isOnboarded) return;
    if (useOnboardingDraftStore.persist.hasHydrated()) {
      useOnboardingDraftStore.getState().clear();
      return;
    }
    const unsubscribe = useOnboardingDraftStore.persist.onFinishHydration(() => {
      useOnboardingDraftStore.getState().clear();
    });
    return unsubscribe;
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

    // Rollover only ever happened on foreground, so an app left open across
    // midnight kept yesterday's mission and daily challenge until it was
    // backgrounded and reopened. Fire at the next local midnight and reschedule.
    let midnight: ReturnType<typeof setTimeout> | undefined;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      midnight = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, Math.max(1000, next.getTime() - now.getTime()));
    };
    scheduleMidnight();

    return () => {
      sub.remove();
      clearTimeout(midnight);
    };
  }, [hasHydrated, subscriptionHydrated, initializeSubscription, updateStreak, resetDailyChallenge]);

  // The gate used to wait on the user and subscription stores only, so the program,
  // session, challenge and routine stores could render their defaults for a frame
  // and then jump once their own persisted state arrived.
  const storesReady = programHydrated && sessionHydrated && routineHydrated;
  if (!fontsReady || !hasHydrated || !nav.ready || (launchedFromLink === null && !timedOut) || (!storesReady && !timedOut) || (!subscriptionHydrated && !timedOut)) return <Boot />;

  return (
    <View style={styles.fill}>
      <NavigationContainer
        ref={navigationRef}
        theme={theme}
        linking={linking}
        initialState={isOnboarded && !launchedFromLink ? nav.initial : undefined}
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
