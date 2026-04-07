import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, spacing, themeMetas, palettes, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors, ThemeId } from '../theme';
import { useThemeStore } from '../store/useThemeStore';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { SectionHeader } from '../components/SectionHeader';
import { hapticSelection, hapticLight } from '../utils/haptics';
import { scheduleDailyReminder, cancelDailyReminder } from '../services/notifications';

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [imperialUnits, setImperialUnits] = React.useState(true);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  const tacticalThemes = themeMetas.filter((m) => m.group === 'tactical');
  const branchThemes = themeMetas.filter((m) => m.group === 'branch');

  const renderThemeChip = (meta: typeof themeMetas[0]) => {
    const isActive = meta.id === themeId;
    const palette = palettes[meta.id];
    return (
      <TouchableOpacity
        key={meta.id}
        style={[
          styles.themeChip,
          { borderColor: isActive ? palette.accent : colors.cardBorder },
          isActive && { borderWidth: 2 },
        ]}
        onPress={() => { hapticSelection(); setTheme(meta.id); }}
        activeOpacity={0.7}
      >
        <View style={[styles.chipAccent, { backgroundColor: palette.accent }]} />
        <View style={[styles.chipSwatch, { backgroundColor: palette.background }]}>
          <View style={[styles.chipDot, { backgroundColor: palette.accent }]} />
        </View>
        <View style={styles.chipTextWrap}>
          <View style={styles.chipNameRow}>
            <GameIcon name={meta.icon} size={18} color={isActive ? palette.accent : colors.textPrimary} variant="minimal" />
            <Text style={[styles.chipName, isActive && { color: palette.accent }]}>{meta.name}</Text>
          </View>
        </View>
        {isActive && (
          <View style={[styles.chipCheck, { backgroundColor: palette.accent }]}>
            <GameIcon name="check" size={14} color={palette.background} variant="minimal" animated={false} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* ── Tactical Themes ── */}
        <SectionHeader title="Tactical Themes" icon="theme" />
        <View style={styles.themeGrid}>
          {tacticalThemes.map(renderThemeChip)}
        </View>

        {/* ── Branch Themes ── */}
        <SectionHeader title="Rep Your Branch" icon="program" subtitle="US Military" />
        <View style={styles.themeGrid}>
          {branchThemes.map(renderThemeChip)}
        </View>

        <SectionHeader title="Preferences" icon="settings" />
        <Card style={styles.section}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Daily mission reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => {
                hapticLight();
                setNotificationsEnabled(v);
                if (v) { scheduleDailyReminder(7, 0); } else { cancelDailyReminder(); }
              }}
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
              onValueChange={(v) => { hapticLight(); setImperialUnits(v); }}
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
    marginBottom: spacing.md,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 10,
    paddingRight: 12,
    overflow: 'hidden',
    width: '47%',
  },
  chipAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  chipSwatch: {
    width: 24,
    height: 24,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginLeft: 4,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipTextWrap: {
    flex: 1,
  },
  chipNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  chipCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
