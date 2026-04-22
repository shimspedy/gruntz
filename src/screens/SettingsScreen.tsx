import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { hapticLight, hapticWarning } from '../utils/haptics';
import { requestNotificationPermission, scheduleDailyReminder, cancelDailyReminder, setupNotificationChannels } from '../services/notifications';
import {
  GRUNTZ_PRIVACY_POLICY_URL,
  GRUNTZ_SUPPORT_URL,
  GRUNTZ_TERMS_OF_USE_URL,
} from '../config/legal';
import { openExternalUrl } from '../utils/externalLinks';

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useUserStore((s) => s.profile);
  const updateSettings = useUserStore((s) => s.updateSettings);
  const resetUser = useUserStore((s) => s.reset);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  const notificationsEnabled = profile?.settings.notifications_enabled ?? true;
  const imperialUnits = (profile?.settings.units ?? 'imperial') === 'imperial';

  const handleOpenLink = async (url: string, label: string) => {
    const opened = await openExternalUrl(url);
    if (!opened) {
      Alert.alert('Link unavailable', `Unable to open ${label.toLowerCase()} right now.`);
    }
  };

  const handleDeleteAccount = () => {
    hapticWarning();
    Alert.alert(
      'Delete all data?',
      'This will erase your profile, missions, streaks, challenges, and achievements. This cannot be undone. Your subscription is managed by the App Store and must be cancelled separately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                // Clear AsyncStorage FIRST so Zustand persist middleware
                // can't flush stale state back after we call reset.
                const keys = await AsyncStorage.getAllKeys();
                const gruntzKeys = keys.filter((k) => k.startsWith('@gruntz'));
                if (gruntzKeys.length > 0) {
                  await AsyncStorage.multiRemove(gruntzKeys);
                }
                // Clear SecureStore items (fitness assessment is stored here).
                await SecureStore.deleteItemAsync('gruntz_assessment').catch(() => {});
                // Finally reset in-memory state.
                resetUser();
                Alert.alert(
                  'Data erased',
                  'Restart Gruntz to complete the reset.',
                );
              } catch {
                Alert.alert('Could not erase all data', 'Try again, or reinstall the app to fully reset.');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Settings</Text>

        {/* Preferences */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <GameIcon name="badge" size={16} color={colors.textSecondary} variant="minimal" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Daily mission reminders</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => {
                hapticLight();
                void (async () => {
                  try {
                    if (v) {
                      const granted = await requestNotificationPermission();
                      if (!granted) {
                        updateSettings({ notifications_enabled: false });
                        Alert.alert(
                          'Notifications unavailable',
                          'Enable notifications in system settings if you want daily mission reminders.'
                        );
                        return;
                      }
                      await setupNotificationChannels();
                      await scheduleDailyReminder(7, 0);
                      updateSettings({ notifications_enabled: true, reminder_time: '07:00' });
                      return;
                    }
                    await cancelDailyReminder();
                    updateSettings({ notifications_enabled: false });
                  } catch {
                    Alert.alert('Error', 'Could not update notification settings. Try again.');
                  }
                })();
              }}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <GameIcon name="stats" size={16} color={colors.textSecondary} variant="minimal" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Imperial Units</Text>
                <Text style={styles.settingDesc}>Miles, pounds, feet</Text>
              </View>
            </View>
            <Switch
              value={imperialUnits}
              onValueChange={(v) => {
                hapticLight();
                updateSettings({ units: v ? 'imperial' : 'metric' });
              }}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>ABOUT</Text>
          <Text style={styles.aboutText}>Gruntz — Military Fitness App</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>LEGAL</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.linkRow}
            onPress={() => {
              hapticLight();
              void handleOpenLink(GRUNTZ_PRIVACY_POLICY_URL, 'Privacy Policy');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDesc}>View how training and billing data are handled</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.linkRow}
            onPress={() => {
              hapticLight();
              void handleOpenLink(GRUNTZ_TERMS_OF_USE_URL, 'Terms of Use');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Terms of Use</Text>
                <Text style={styles.settingDesc}>Open the Gruntz subscription and usage terms</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.linkRow, { borderBottomWidth: 0 }]}
            onPress={() => {
              hapticLight();
              void handleOpenLink(GRUNTZ_SUPPORT_URL, 'Support');
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Support</Text>
                <Text style={styles.settingDesc}>Contact support and subscription help</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.accentRed }]}>DANGER ZONE</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.linkRow, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            accessibilityLabel="Delete all data"
            accessibilityHint="Permanently erases your profile, missions, streaks, challenges, and achievements"
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Ionicons name="trash-outline" size={16} color={colors.accentRed} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.accentRed }]}>Delete all data</Text>
                <Text style={styles.settingDesc}>Erase your profile, missions, streaks, and achievements on this device</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.accentRed} />
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
  },
  settingIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  aboutText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});
