import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { Card } from '../components/Card';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { hapticLight } from '../utils/haptics';
import { requestNotificationPermission, scheduleDailyReminder, cancelDailyReminder, setupNotificationChannels } from '../services/notifications';

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useUserStore((s) => s.profile);
  const updateSettings = useUserStore((s) => s.updateSettings);

  const notificationsEnabled = profile?.settings.notifications_enabled ?? true;
  const imperialUnits = (profile?.settings.units ?? 'imperial') === 'imperial';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Settings</Text>

        {/* Preferences */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <GameIcon name="badge" size={20} color={colors.accent} variant="minimal" />
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
                <GameIcon name="stats" size={20} color={colors.accent} variant="minimal" />
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
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  aboutText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});
