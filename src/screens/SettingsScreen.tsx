import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, spacing, themeMetas } from '../theme';
import type { ThemeColors, ThemeId } from '../theme';
import { useThemeStore } from '../store/useThemeStore';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [imperialUnits, setImperialUnits] = React.useState(true);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* ── Theme Picker ── */}
        <SectionHeader title="Theme" icon="🎨" />
        <View style={styles.themeGrid}>
          {themeMetas.map((meta) => {
            const isActive = meta.id === themeId;
            const palette = require('../theme/palettes').palettes[meta.id];
            return (
              <TouchableOpacity
                key={meta.id}
                style={[
                  styles.themeCard,
                  { borderColor: isActive ? palette.accent : colors.cardBorder },
                  isActive && { borderWidth: 2 },
                ]}
                onPress={() => setTheme(meta.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.themeAccentStrip, { backgroundColor: palette.accent }]} />
                <View style={[styles.themePreview, { backgroundColor: palette.background }]}>
                  <View style={[styles.themePreviewBar, { backgroundColor: palette.card }]}>
                    <View style={[styles.themePreviewDot, { backgroundColor: palette.accent }]} />
                    <View style={[styles.themePreviewLine, { backgroundColor: palette.textMuted }]} />
                  </View>
                  <View style={[styles.themePreviewBar, { backgroundColor: palette.card }]}>
                    <View style={[styles.themePreviewDot, { backgroundColor: palette.accentGold }]} />
                    <View style={[styles.themePreviewLine, { backgroundColor: palette.textMuted }]} />
                  </View>
                </View>
                <Text style={styles.themeIcon}>{meta.icon}</Text>
                <Text style={[styles.themeName, isActive && { color: palette.accent }]}>{meta.name}</Text>
                <Text style={styles.themeDesc}>{meta.description}</Text>
                {isActive && (
                  <View style={[styles.activeIndicator, { backgroundColor: palette.accent }]}>
                    <Text style={styles.activeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader title="Preferences" icon="⚙️" />
        <Card style={styles.section}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Daily mission reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.backgroundSecondary, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Imperial Units</Text>
              <Text style={styles.settingDesc}>Miles, pounds, feet</Text>
            </View>
            <Switch
              value={imperialUnits}
              onValueChange={setImperialUnits}
              trackColor={{ false: colors.backgroundSecondary, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </Card>

        <Card title="About" style={styles.section}>
          <Text style={styles.aboutText}>Gruntz — Military Fitness App</Text>
          <Text style={styles.versionText}>Version 1.0.0 (MVP)</Text>
        </Card>
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
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
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
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  themeAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  themePreview: {
    width: '100%',
    height: 48,
    borderRadius: 2,
    marginBottom: spacing.sm,
    padding: 6,
    justifyContent: 'space-between',
  },
  themePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    borderRadius: 2,
    paddingHorizontal: 6,
    gap: 6,
  },
  themePreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themePreviewLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  themeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  themeDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.background,
  },
});
