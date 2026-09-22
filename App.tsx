import { useEffect } from 'react';
import { Linking, LogBox, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { color } from './src/ui/tokens';

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

  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    // A font that never resolves must not leave the app stuck behind the splash.
    if (fontsReady) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsReady]);

  useEffect(() => {
    const t = setTimeout(() => void SplashScreen.hideAsync().catch(() => undefined), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Prepare notification channels silently. Permission is requested in context
    // (onboarding reminder step or the Settings toggle), never at launch.
    setupNotificationChannels();
  }, []);

  useEffect(() => {
    if (!__DEV__) return;
    // Dev-only: `com.gruntz.fitness://seed-demo` loads screenshot demo data.
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('seed-demo')) require('./src/dev/seedDemo').seedDemo();
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          <RootNavigator fontsReady={fontsReady} />
          <ToastHost />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
