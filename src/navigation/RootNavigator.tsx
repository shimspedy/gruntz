import { MovedDeviceSheet } from '../components/MovedDeviceSheet';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Platform, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { startBackupLifecycle } from '../services/backup';
import { startHealthSyncLifecycle } from '../services/healthSync';
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
import { SheetScreen } from '../ui/Sheet';
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
import ActivityHistoryScreen from '../screens/ActivityHistoryScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ServiceProfileScreen from '../screens/ServiceProfileScreen';
import BackupScreen from '../screens/BackupScreen';
import DataTransferScreen from '../screens/DataTransferScreen';
import HealthSyncScreen from '../screens/HealthSyncScreen';
import TeamScreen from '../screens/TeamScreen';
import AthletesScreen from '../screens/AthletesScreen';
import CommunitiesScreen from '../screens/CommunitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import WeeklyDebriefScreen from '../screens/WeeklyDebriefScreen';
import RetentionDiagnosticsScreen from '../screens/RetentionDiagnosticsScreen';
import StreakScreen from '../screens/StreakScreen';
import TestScreen from '../screens/TestScreen';
import TrainingPreferencesScreen from '../screens/TrainingPreferencesScreen';
import TrainScreen from '../screens/TrainScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import { useChallengeStore } from '../store/useChallengeStore';
import { useOnboardingDraftStore } from '../store/useOnboardingDraftStore';
import { scheduleWeeklyRecap, setNotificationsEnabled } from '../services/notifications';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useProgramStore } from '../store/useProgramStore';
import { useRoutineStore } from '../store/useRoutineStore';
import { useSessionStore } from '../store/useSessionStore';
import { useUiStore } from '../store/useUiStore';
import { useUserStore } from '../store/useUserStore';
import type { OnboardingStackParamList, RootStackParamList, TabParamList } from '../types/navigation';
import { LogoMark } from '../ui/Logo';
import { color } from '../ui/tokens';
import { navigationRef } from './ref';
import { useSavedNavigation } from './savedNavigation';
import { BootFailure } from './BootFailure';
import { TabBar } from './TabBar';
import { createInitialLinkResolver } from './initialLink';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useExerciseNotesStore } from '../store/useExerciseNotesStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { useTeamInboxStore } from '../store/useTeamInboxStore';
import { useSignedIn } from '../hooks/useSignedIn';
import { startInboxLifecycle } from '../services/teamInbox';
import { startRetentionLifecycle } from '../services/retentionLifecycle';
import { trackRetentionEvent } from '../services/retentionAnalytics';
import { resolveNotificationLink } from './notificationLink';
import { startMetaInstallTracking } from '../services/metaInstallTracking';


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
  return resolveNotificationLink(response?.notification.request.content.data, response?.notification.date);
}

const getInitialLink = createInitialLinkResolver({
  getLink: () => Linking.getInitialURL(),
  getNotificationLink: async () => notificationUrl(await Notifications.getLastNotificationResponseAsync()),
  clearNotification: () => Notifications.clearLastNotificationResponseAsync(),
});

const linking = {
  prefixes: ['gruntz://'],
  getInitialURL: getInitialLink,
  subscribe(listener: (url: string) => void) {
    const linkSub = Linking.addEventListener('url', ({ url }) => listener(url));
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = notificationUrl(response);
      if (url) {
        listener(url);
        void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      }
    });
    return () => {
      linkSub.remove();
      responseSub.remove();
    };
  },
  config: {
    // A cold-start detail/notification link needs a home route underneath it,
    // otherwise its Back button has nowhere to go.
    initialRouteName: 'Tabs' as const,
    screens: {
      Tabs: {
        initialRouteName: 'Train' as const,
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
      WeeklyDebrief: 'weekly-debrief',
      ActivityHistory: 'activities',
      ActivityDetail: 'activities/:sessionId',
      Settings: 'settings',
      Paywall: 'paywall',
      // Social links only open a screen. Joining, following and posting still take a tap
      // there, and the server decides what the signed-in athlete may see.
      Team: 'team/:teamId',
      LeaderTools: 'join/:code',
      Athletes: 'athletes',
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

/**
 * iOS presents modal, form-sheet and full-screen-modal screens outside the app shell,
 * so the shell's side safe-area padding (see App.tsx) does not reach them. This wraps
 * those screens the same way. Android keeps modals inside the shell, so it needs nothing.
 */
function ModalInsets({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'ios') return <>{children}</>;
  return <View style={[styles.fill, { paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: 'transparent' }]}>{children}</View>;
}
const modalLayout = ({ children }: { children: React.ReactNode }) => <ModalInsets>{children}</ModalInsets>;
/** The exercise library is only a modal when it opens as a picker. */
const pickerLayout = ({ route, children }: { route: { params?: { pick?: unknown } }; children: React.ReactNode }) => (route.params?.pick ? <ModalInsets>{children}</ModalInsets> : <>{children}</>);

/** Counts unread team chat for the header badge, only while an account is signed in. */
function TeamInboxHost() {
  const signedIn = useSignedIn();
  const teamCount = useReadinessStore((s) => s.teamCount);
  useEffect(() => {
    // Null means the session is still being read: do nothing yet, or a cold launch would
    // wipe the persisted counts before sign-in state is known.
    if (signedIn === null) return undefined;
    if (!(signedIn || (__DEV__ && teamCount > 0))) { useTeamInboxStore.getState().clear(); return undefined; }
    return startInboxLifecycle();
  }, [signedIn, teamCount]);
  return null;
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
        layout={pickerLayout}
      />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} layout={modalLayout} options={{ presentation: 'modal', contentStyle: { backgroundColor: color.bgRaised } }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Streak" component={StreakScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="WeeklyDebrief" component={WeeklyDebriefScreen} />
      {__DEV__ ? <Stack.Screen name="RetentionDiagnostics" component={RetentionDiagnosticsScreen} /> : null}
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ServiceProfile" component={ServiceProfileScreen} />
      <Stack.Screen name="Backup" component={BackupScreen} />
      <Stack.Screen name="DataTransfer" component={DataTransferScreen} />
      <Stack.Screen name="HealthSync" component={HealthSyncScreen} />
      <Stack.Screen name="TrainingPreferences" component={TrainingPreferencesScreen} />
      <Stack.Screen name="LeaderTools" component={LeaderToolsScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
      <Stack.Screen name="Communities" component={CommunitiesScreen} />
      <Stack.Screen name="Athletes" component={AthletesScreen} />
      <Stack.Screen
        name="Sheet"
        component={SheetScreen}
        layout={modalLayout}
        options={({ route }) => ({
          presentation: 'formSheet',
          // Sized to its content; a body that may not fit opens tall and scrolls instead.
          sheetAllowedDetents: route.params.scroll ? [0.92] : 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 32,
          contentStyle: { backgroundColor: color.bgRaised },
        })}
      />
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal', gestureEnabled: false }} screenLayout={modalLayout}>
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="RunTracker" component={RunTrackerScreen} />
      </Stack.Group>
      <Stack.Screen name="Celebration" component={CelebrationScreen} layout={modalLayout} options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
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
      {/* Restoring onto a new phone, before any setup. A completed restore flips
          isOnboarded and this whole stack is replaced by the app. */}
      <OnboardingStack.Screen name="Backup" component={BackupScreen} />
    </OnboardingStack.Navigator>
  );
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
  const hydrationFailed = useUserStore((s) => s.hydrationFailed);
  const updateStreak = useUserStore((s) => s.updateStreak);
  const subscriptionHydrated = useSubscriptionStore((s) => s.hasHydrated);
  const initializeSubscription = useSubscriptionStore((s) => s.initialize);
  const resetDailyChallenge = useChallengeStore((s) => s.resetDaily);
  const nav = useSavedNavigation(hasHydrated, isOnboarded);
  const programHydrated = useProgramStore((s) => s.hasHydrated);
  const programHydrationFailed = useProgramStore((s) => s.hydrationFailed);
  const subscriptionHydrationFailed = useSubscriptionStore((s) => s.hydrationFailed);
  const [readyContainer, setReadyContainer] = useState<'app' | 'setup' | null>(null);
  useAndroidBack();
  const sessionHydrated = usePersistHydrated(useSessionStore);
  const routineHydrated = usePersistHydrated(useRoutineStore);
  const planHydrated = usePersistHydrated(usePlanLibraryStore);
  const logHydrated = usePersistHydrated(useExerciseLogStore);
  const readinessHydrated = usePersistHydrated(useReadinessStore);
  const challengeHydrated = usePersistHydrated(useChallengeStore);
  const draftHydrated = usePersistHydrated(useOnboardingDraftStore);
  const notesHydrated = usePersistHydrated(useExerciseNotesStore);
  const storesReady = programHydrated && sessionHydrated && routineHydrated && planHydrated && logHydrated && readinessHydrated && challengeHydrated && draftHydrated && notesHydrated;
  const remindersOn = useUserStore((s) => s.profile?.settings.notifications_enabled ?? true);
  useEffect(() => {
    setNotificationsEnabled(remindersOn);
  }, [remindersOn]);
  useEffect(() => {
    // Replace earlier weekly reminders whose destination was the lifetime Stats screen.
    if (hasHydrated && storesReady && isOnboarded && remindersOn) void scheduleWeeklyRecap();
  }, [hasHydrated, storesReady, isOnboarded, remindersOn]);
  // Flushes a pending backup when the app is backgrounded, so finishing a workout
  // and immediately closing does not leave that session unbacked. No-ops entirely
  // when the build has no backup keys.
  useEffect(() => startBackupLifecycle(), []);
  useEffect(() => startHealthSyncLifecycle(), []);
  useEffect(() => {
    if (!hasHydrated || !storesReady || hydrationFailed) return;
    return startRetentionLifecycle();
  }, [hasHydrated, storesReady, hydrationFailed]);
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
    getInitialLink()
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
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Entitlements barely change, and re-checking them on every single foreground
  // meant a RevenueCat round trip each time the user glanced at another app.
  // Streak and daily-challenge rollover are local and still run every time.
  const lastEntitlementCheck = useRef(0);
  useEffect(() => {
    if (!hasHydrated || !subscriptionHydrated || !storesReady || hydrationFailed || programHydrationFailed || subscriptionHydrationFailed) return;
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
  }, [hasHydrated, subscriptionHydrated, storesReady, hydrationFailed, programHydrationFailed, subscriptionHydrationFailed, initializeSubscription, updateStreak, resetDailyChallenge]);

  // The gate used to wait on the user and subscription stores only, so the program,
  // session, challenge and routine stores could render their defaults for a frame
  // and then jump once their own persisted state arrived.
  const waiting = !fontsReady || !hasHydrated || !nav.ready || launchedFromLink === null || !storesReady || !subscriptionHydrated;
  useEffect(() => {
    // Ask once after optional setup has finished and the normal app is usable.
    // Declining has no effect on access, and no SDK initializes before consent.
    if (waiting || !isOnboarded || readyContainer !== 'app' || !navigationRef.isReady() || hydrationFailed || programHydrationFailed || subscriptionHydrationFailed) return;
    return startMetaInstallTracking();
  }, [waiting, isOnboarded, readyContainer, hydrationFailed, programHydrationFailed, subscriptionHydrationFailed]);
  // "Try again" re-reads the stores, so the timeout only earns this screen when a store is
  // what is still missing. A slow font or link lookup keeps the boot screen instead.
  const storesPending = !hasHydrated || !storesReady || !subscriptionHydrated;
  if (hydrationFailed || programHydrationFailed || subscriptionHydrationFailed || (storesPending && timedOut)) {
    return <BootFailure />;
  }
  if (waiting) return <Boot />;

  return (
    <View style={styles.fill}>
      <NavigationContainer
        // Setup and the app are separate navigators. Without a fresh container, finishing
        // setup from Restore carried that screen into the app with nothing under it.
        key={isOnboarded ? 'app' : 'setup'}
        ref={navigationRef}
        theme={theme}
        linking={linking}
        initialState={isOnboarded && !launchedFromLink ? nav.initial : undefined}
        onReady={() => setReadyContainer(isOnboarded ? 'app' : 'setup')}
        onStateChange={isOnboarded ? (state) => {
          nav.save(state);
          const screen = navigationRef.getCurrentRoute()?.name;
          if (screen) trackRetentionEvent('screen_viewed', { screen });
        } : undefined}
      >
        {isOnboarded ? <AppStack /> : <OnboardingFlow />}
      </NavigationContainer>
      {isOnboarded ? (
        <>
          <WorkoutSessionHost />
          {/* These present through the navigator. Mounted before it is ready, a sheet that
              was already due (the moved-device notice is persisted) never opened at all. */}
          {readyContainer === 'app' ? (
            <>
              <ChallengeSheet />
              <ReadinessSheet />
              <TeamInboxHost />
              <MovedDeviceSheet />
            </>
          ) : null}
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
