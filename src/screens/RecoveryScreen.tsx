import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Card } from '../components/Card';

const stretchRoutine = [
  { name: 'Hamstring Stretch', duration: '30s each side', icon: '🦵' },
  { name: 'Hip Flexor Stretch', duration: '30s each side', icon: '🦿' },
  { name: 'Shoulder Stretch', duration: '30s each arm', icon: '💪' },
  { name: 'Child\'s Pose', duration: '60s', icon: '🧘' },
  { name: 'Cat-Cow Stretch', duration: '10 reps', icon: '🐱' },
  { name: 'Pigeon Pose', duration: '30s each side', icon: '🕊️' },
];

const recoveryTips = [
  { title: 'Sleep 7-9 Hours', description: 'Quality sleep is the #1 recovery tool. Prioritize it.', icon: '😴' },
  { title: 'Hydrate', description: 'Drink at least half your body weight in ounces of water daily.', icon: '💧' },
  { title: 'Post-Workout Protein', description: 'Consume 20-40g protein within 60 minutes of training.', icon: '🥩' },
  { title: 'Foam Roll', description: 'Spend 5-10 minutes foam rolling sore muscle groups.', icon: '🧱' },
  { title: 'Active Recovery', description: 'Light walking, swimming, or yoga on rest days.', icon: '🚶' },
  { title: 'Manage Stress', description: 'Chronic stress impairs recovery. Practice breathing exercises.', icon: '🧠' },
];

export default function RecoveryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recovery Hub</Text>
        <Text style={styles.subtitle}>Rest is where growth happens.</Text>

        {/* Stretch Routine */}
        <Text style={styles.sectionTitle}>🧘 Quick Stretch Routine</Text>
        <Card style={styles.section}>
          {stretchRoutine.map((stretch, idx) => (
            <View key={idx} style={styles.stretchRow}>
              <Text style={styles.stretchIcon}>{stretch.icon}</Text>
              <View style={styles.stretchInfo}>
                <Text style={styles.stretchName}>{stretch.name}</Text>
                <Text style={styles.stretchDuration}>{stretch.duration}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Recovery Tips */}
        <Text style={styles.sectionTitle}>💡 Recovery Tips</Text>
        {recoveryTips.map((tip, idx) => (
          <Card key={idx} style={styles.tipCard}>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>{tip.icon}</Text>
              <View style={styles.tipInfo}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.description}</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Hydration Reminder */}
        <Card style={[styles.section, styles.hydrationCard]}>
          <Text style={styles.hydrationTitle}>💧 Hydration Check</Text>
          <Text style={styles.hydrationText}>
            Have you had enough water today? Aim for at least 8 glasses. Dehydration kills performance.
          </Text>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  stretchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  stretchIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  stretchInfo: {
    flex: 1,
  },
  stretchName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stretchDuration: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  tipCard: {
    marginBottom: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    marginTop: 2,
  },
  tipInfo: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tipDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
  hydrationCard: {
    borderColor: colors.accent,
    borderWidth: 1,
  },
  hydrationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  hydrationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
