import { useEffect } from 'react';
import { LogBox, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

  useEffect(() => {
    // Prepare notification channels silently. Permission is requested in context
    // (onboarding reminder step or the Settings toggle), never at launch.
    setupNotificationChannels();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          <RootNavigator fontsReady={fontsLoaded || !!fontError} />
          <ToastHost />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
});
