import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { XPBar } from '../components/XPBar';
import { useUserStore } from '../store/useUserStore';
import { getXPToNextLevel } from '../utils/xp';

export default function ProgressScreen() {
  const { progress } = useUserStore();
  const xpInfo = getXPToNextLevel(progress.current_xp);

  const skillCategories = [
    { name: 'Strength', score: progress.strength_score, color: colors.accentRed },
    { name: 'Endurance', score: progress.endurance_score, color: colors.accent },
    { name: 'Stamina', score: progress.stamina_score, color: colors.accentOrange },
    { name: 'Mobility', score: progress.mobility_score, color: colors.accentGreen },
    { name: 'Consistency', score: progress.consistency_score, color: colors.accentGold },
    { name: 'Recovery', score: progress.recovery_score, color: colors.textSecondary },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Progress Dashboard</Text>

        {/* Level & XP */}
        <Card style={styles.section}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
          <View style={styles.xpDetails}>
            <Text style={styles.totalXP}>{progress.current_xp.toLocaleString()} Total XP</Text>
            <Text style={styles.rankBadge}>{progress.current_rank}</Text>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="💪" value={progress.workouts_completed} label="Missions" color={colors.accent} />
          <View style={{ width: spacing.sm }} />
          <StatCard icon="🔥" value={progress.streak_days} label="Streak" color={colors.streakFire} />
        </View>
        <View style={styles.statsGrid}>
          <StatCard icon="🔄" value={progress.total_reps.toLocaleString()} label="Total Reps" color={colors.accentGreen} />
          <View style={{ width: spacing.sm }} />
          <StatCard icon="🏃" value={`${progress.total_distance_miles}`} label="Miles" color={colors.accentOrange} />
        </View>

        {/* Skill Categories */}
        <Card title="Skill Categories" style={styles.section}>
          {skillCategories.map((cat) => (
            <View key={cat.name} style={styles.skillRow}>
              <Text style={styles.skillName}>{cat.name}</Text>
              <View style={styles.skillBarTrack}>
                <View style={[styles.skillBarFill, { width: `${cat.score}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={[styles.skillScore, { color: cat.color }]}>{cat.score}</Text>
            </View>
          ))}
        </Card>

        {/* Personal Records */}
        <Card title="Personal Records" style={styles.section}>
          {Object.keys(progress.best_run_times).length > 0 ? (
            Object.entries(progress.best_run_times).map(([dist, time]) => (
              <View key={dist} style={styles.prRow}>
                <Text style={styles.prLabel}>{dist}</Text>
                <Text style={styles.prValue}>{time}s</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Complete missions to set records!</Text>
          )}
        </Card>

        {/* Exercise Totals */}
        <Card title="Exercise Totals" style={styles.section}>
          {Object.keys(progress.exercises_completed).length > 0 ? (
            Object.entries(progress.exercises_completed)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([exId, count]) => (
                <View key={exId} style={styles.prRow}>
                  <Text style={styles.prLabel}>{exId.replace(/_/g, ' ')}</Text>
                  <Text style={styles.prValue}>{count}</Text>
                </View>
              ))
          ) : (
            <Text style={styles.emptyText}>No exercises tracked yet.</Text>
          )}
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
  xpDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  totalXP: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rankBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentGold,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  skillName: {
    width: 90,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  skillBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  skillBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  skillScore: {
    width: 30,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  prLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
