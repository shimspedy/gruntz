import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupNotificationChannels } from './src/services/notifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

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
  useEffect(() => {
    // Prepare notification channels silently. We do NOT request permission
    // at launch — that happens when the user enables the toggle in Settings.
    setupNotificationChannels();
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <RootNavigator />
    </ErrorBoundary>
  );
}
