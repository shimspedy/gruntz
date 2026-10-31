import { useEffect, useState } from 'react';
import { Linking, LogBox, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_600SemiBold_Italic,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  DMSans_900Black,
} from '@expo-google-fonts/dm-sans';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupNotificationChannels } from './src/services/notifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastHost } from './src/ui/Toast';
import { useShellSideColor } from './src/ui/SideBleed';
import { color } from './src/ui/tokens';
import { initializeActivityTracking } from './src/services/activityTracking';
import { initializeLiveActivity } from './src/services/liveActivity';
import { initializeWorkoutPresence } from './src/services/workoutPresence';

// Dev-only: suppress known RevenueCat config warnings while App Store Connect
// products haven't propagated. In production we WANT these logs surfaced so
// crash reporting catches actual setup errors.
// Hold the native splash until fonts are resolved, so the app goes straight from
// the splash into the first real frame. Without this the splash dropped to the
// black root view and then to Boot — an extra black-to-black transition.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

if (__DEV__) {
  LogBox.ignoreLogs([
    '[RevenueCat]',
    'There is an issue with your configuration',
    'None of the products registered',
  ]);
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_600SemiBold_Italic,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    DMSans_900Black,
  });

  const [fontTimedOut, setFontTimedOut] = useState(false);
  const fontsReady = fontsLoaded || !!fontError || fontTimedOut;

  useEffect(() => {
    // A font that never resolves must not leave the app stuck behind the splash.
    if (fontsReady) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsReady]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFontTimedOut(true);
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Prepare notification channels silently. Permission is requested in context
    // (onboarding reminder step or the Settings toggle), never at launch.
    setupNotificationChannels();
    void initializeActivityTracking();
    // Lock Screen logs are applied before the Live Activity is next updated.
    initializeLiveActivity();
    initializeWorkoutPresence();
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    // Dev-only: `com.gruntz.fitness://seed-demo` loads screenshot demo data.
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('seed-demo')) require('./src/dev/seedDemo').seedDemo();
    });
    // Or start the bundler with EXPO_PUBLIC_SEED_DEMO=1: opening a link from outside the app
    // raises a system prompt that screenshot automation cannot answer.
    const seed = process.env.EXPO_PUBLIC_SEED_DEMO === '1' ? setTimeout(() => require('./src/dev/seedDemo').seedDemo(), 3500) : undefined;
    return () => {
      sub.remove();
      clearTimeout(seed);
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          {/* Side safe areas are cleared once, here: iPhone Duo folded shut puts the status bar in a
              vertical strip beside the content, and screens only ever pad top and bottom themselves. */}
          <SideInsets>
            <RootNavigator fontsReady={fontsReady} />
            <ToastHost />
          </SideInsets>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Keeps content out of the side safe areas and paints them in the colour the current screen asks for. */
function SideInsets({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const side = useShellSideColor();
  return <View style={[styles.root, { paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: side }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
