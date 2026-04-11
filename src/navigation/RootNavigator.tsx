import React, { useEffect } from 'react';
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
  useEffect(() => {
    if (hasHydrated && subscriptionHydrated) {
      updateStreak();
      initializeSubscription();
    }
  }, [hasHydrated, subscriptionHydrated, isOnboarded, initializeSubscription, updateStreak]);

  useEffect(() => {
    if (!hasHydrated || !subscriptionHydrated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        updateStreak();
        initializeSubscription();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasHydrated, subscriptionHydrated, initializeSubscription, updateStreak]);

  if (!hasHydrated || !subscriptionHydrated) {
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
