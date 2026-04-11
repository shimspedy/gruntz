import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupNotificationChannels, requestNotificationPermission } from './src/services/notifications';

// Suppress known RevenueCat config warnings during development.
// These fire when App Store Connect products haven't propagated yet —
// not a code issue. Remove this once products are live.
LogBox.ignoreLogs([
  '[RevenueCat]',
  'There is an issue with your configuration',
  'None of the products registered',
]);

export default function App() {
  useEffect(() => {
    setupNotificationChannels();
    requestNotificationPermission();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
