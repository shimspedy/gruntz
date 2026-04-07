import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppTabs } from './AppTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useUserStore } from '../store/useUserStore';
import { useThemeStore } from '../store/useThemeStore';
import { useColors } from '../theme';

export function RootNavigator() {
  const colors = useColors();
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const loadTheme = useThemeStore(s => s.loadPersistedTheme);
  useEffect(() => { loadTheme(); }, []);

  if (!hasHydrated) {
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
