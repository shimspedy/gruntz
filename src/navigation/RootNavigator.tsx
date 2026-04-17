import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppTabs } from './AppTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useUserStore } from '../store/useUserStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { useColors } from '../theme';

export function RootNavigator() {
  const colors = useColors();
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const updateStreak = useUserStore((s) => s.updateStreak);
  const subscriptionHydrated = useSubscriptionStore((s) => s.hasHydrated);
  const initializeSubscription = useSubscriptionStore((s) => s.initialize);
  // Safety valve: if subscription hydration hangs (offline, RevenueCat down),
  // unblock the UI after 3 s so the user isn't stuck on a loading spinner.
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);
  useEffect(() => {
    if (subscriptionHydrated) return;
    const timer = setTimeout(() => setHydrationTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [subscriptionHydrated]);
  useEffect(() => {
    if (hasHydrated && subscriptionHydrated) {
      updateStreak();
      void initializeSubscription().catch((err) => {
        if (__DEV__) console.warn('[RootNavigator] initializeSubscription failed', err);
      });
    }
  }, [hasHydrated, subscriptionHydrated, isOnboarded, initializeSubscription, updateStreak]);

  useEffect(() => {
    if (!hasHydrated || !subscriptionHydrated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        updateStreak();
        void initializeSubscription().catch((err) => {
          if (__DEV__) console.warn('[RootNavigator] initializeSubscription failed', err);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasHydrated, subscriptionHydrated, initializeSubscription, updateStreak]);

  if (!hasHydrated || (!subscriptionHydrated && !hydrationTimedOut)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.background,
          text: colors.textPrimary,
          border: colors.cardBorder,
          notification: colors.accentRed,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      {isOnboarded ? (
        <AppTabs />
      ) : (
        <OnboardingScreen onComplete={() => {}} />
      )}
    </NavigationContainer>
  );
}
