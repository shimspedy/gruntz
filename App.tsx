import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setupNotificationChannels, requestNotificationPermission } from './src/services/notifications';

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
