import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { colors, spacing } from '../theme';
import { Card } from '../components/Card';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [imperialUnits, setImperialUnits] = React.useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

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

const styles = StyleSheet.create({
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
});
