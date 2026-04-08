import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { XPBar } from '../components/XPBar';
import { GameIcon } from '../components/GameIcon';
import { useUserStore } from '../store/useUserStore';
import { getXPToNextLevel } from '../utils/xp';

function formatDurationLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function getSkillIcon(skill: string) {
  switch (skill) {
    case 'Endurance':
    case 'Stamina':
      return 'run' as const;
    case 'Mobility':
    case 'Recovery':
      return 'recovery' as const;
    case 'Consistency':
      return 'mission' as const;
    default:
      return 'strength' as const;
  }
}

export default function ProgressScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const progress = useUserStore((s) => s.progress);
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  const skillCategories = [
    { name: 'Strength', score: progress.strength_score, color: colors.accentRed },
    { name: 'Endurance', score: progress.endurance_score, color: colors.accent },
    { name: 'Stamina', score: progress.stamina_score, color: colors.accentOrange },
    { name: 'Mobility', score: progress.mobility_score, color: colors.accentGreen },
    { name: 'Consistency', score: progress.consistency_score, color: colors.accentGold },
    { name: 'Recovery', score: progress.recovery_score, color: colors.textSecondary },
  ];
  const strongestSkill = [...skillCategories].sort((a, b) => b.score - a.score)[0];
  const focusSkill = [...skillCategories].sort((a, b) => a.score - b.score)[0];
  const xpRemaining = Math.max(xpInfo.required - xpInfo.current, 0);
  const records = [
    ...Object.entries(progress.best_run_times).map(([label, value]) => ({ label: `Run ${label}`, value, icon: 'run' as const })),
    ...Object.entries(progress.best_ruck_times).map(([label, value]) => ({ label: `Ruck ${label}`, value, icon: 'ruck' as const })),
    ...Object.entries(progress.best_swim_times).map(([label, value]) => ({ label: `Swim ${label}`, value, icon: 'swim' as const })),
  ].sort((a, b) => a.value - b.value);
  const topExercises = Object.entries(progress.exercises_completed)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));
  const topExerciseMax = topExercises[0]?.count ?? 1;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: bottomContentPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.kicker}>MISSION INTEL</Text>
              <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Progress</Text>
              <Text style={styles.subtitle}>
                {xpRemaining > 0
                  ? `${xpRemaining} XP until your next level.`
                  : 'Level complete. Keep stacking missions.'}
              </Text>
            </View>
            <View style={styles.rankChip}>
              <GameIcon name="rank" size={24} color={colors.accentGold} variant="minimal" />
              <Text style={styles.rankChipText}>{progress.current_rank}</Text>
            </View>
          </View>

          {/* Level & XP */}
          <Card style={styles.section}>
            <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
            <View style={styles.xpDetails}>
              <Text style={styles.totalXP}>{progress.current_xp.toLocaleString()} Total XP</Text>
              <Text style={styles.rankBadge}>{progress.current_rank}</Text>
            </View>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <GameIcon name="xp" size={16} color={colors.accentGold} variant="minimal" animated={false} />
                <Text style={styles.heroMetaLabel}>NEXT</Text>
                <Text style={styles.heroMetaValue}>{xpRemaining}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <GameIcon name={getSkillIcon(strongestSkill.name)} size={16} color={strongestSkill.color} variant="minimal" animated={false} />
                <Text style={styles.heroMetaLabel}>STRONGEST</Text>
                <Text style={[styles.heroMetaValue, { color: strongestSkill.color }]}>{strongestSkill.name}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <GameIcon name={getSkillIcon(focusSkill.name)} size={16} color={focusSkill.color} variant="minimal" animated={false} />
                <Text style={styles.heroMetaLabel}>FOCUS</Text>
                <Text style={[styles.heroMetaValue, { color: focusSkill.color }]}>{focusSkill.name}</Text>
              </View>
            </View>
          </Card>

          {/* Stats Grid */}
          <SectionHeader title="Mission Totals" subtitle="Core numbers that move rank and streak." icon="mission" />
          <View style={styles.statsGrid}>
            <StatCard icon="mission" value={progress.workouts_completed} label="Missions" color={colors.accent} />
            <StatCard icon="streak" value={progress.streak_days} label="Streak" color={colors.streakFire} />
          </View>
          <View style={styles.statsGrid}>
            <StatCard icon="reps" value={progress.total_reps.toLocaleString()} label="Total Reps" color={colors.accentGreen} />
            <StatCard icon="run" value={`${progress.total_distance_miles}`} label="Miles" color={colors.accentOrange} />
          </View>

          {/* Skill Categories */}
          <SectionHeader title="Operator Profile" subtitle="Strengths and gaps from completed work." icon="stats" />
          <Card title="Skill Categories" style={styles.section}>
            <View style={styles.skillHighlights}>
              <View style={styles.skillHighlight}>
                <Text style={styles.skillHighlightLabel}>TOP</Text>
                <Text style={[styles.skillHighlightValue, { color: strongestSkill.color }]}>{strongestSkill.name}</Text>
              </View>
              <View style={styles.skillHighlight}>
                <Text style={styles.skillHighlightLabel}>TRAIN NEXT</Text>
                <Text style={[styles.skillHighlightValue, { color: focusSkill.color }]}>{focusSkill.name}</Text>
              </View>
            </View>
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
          <SectionHeader title="Records" subtitle="Best logged efforts across run, ruck, and swim." icon="achievement" />
          <Card title="Personal Records" style={styles.section}>
            {records.length > 0 ? (
              records.slice(0, 8).map((record) => (
                <View key={record.label} style={styles.prRow}>
                  <View style={styles.recordLabelWrap}>
                    <GameIcon name={record.icon} size={18} color={colors.textSecondary} variant="minimal" animated={false} />
                    <Text style={styles.prLabel}>{record.label}</Text>
                  </View>
                  <Text style={styles.prValue}>{formatDurationLabel(record.value)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <GameIcon name="achievement" size={26} color={colors.textMuted} variant="minimal" animated={false} />
                <Text style={styles.emptyTitle}>No records logged yet</Text>
                <Text style={styles.emptyText}>Complete timed missions and tracked runs to populate your board.</Text>
              </View>
            )}
          </Card>

          {/* Exercise Totals */}
          <SectionHeader title="Top Movements" subtitle="Your most repeated exercises so far." icon="strength" />
          <Card title="Exercise Totals" style={styles.section}>
            {topExercises.length > 0 ? (
              topExercises.map((exercise) => (
                <View key={exercise.id} style={styles.prRow}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.prLabel}>{exercise.id.replace(/_/g, ' ')}</Text>
                    <View style={styles.exerciseBarTrack}>
                      <View
                        style={[
                          styles.exerciseBarFill,
                          { width: `${Math.max((exercise.count / topExerciseMax) * 100, 10)}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.prValue}>{exercise.count}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <GameIcon name="strength" size={26} color={colors.textMuted} variant="minimal" animated={false} />
                <Text style={styles.emptyTitle}>Movement log is empty</Text>
                <Text style={styles.emptyText}>Your most-used exercises will show up here once you finish missions.</Text>
              </View>
            )}
          </Card>
        </View>
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
    paddingVertical: spacing.md,
  },
  inner: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleWrap: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '42%',
  },
  rankChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.accentGold,
    flexShrink: 1,
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
  heroMetaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroMetaPill: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 3,
  },
  heroMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: colors.textMuted,
  },
  heroMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  rankBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accentGold,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  skillHighlights: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skillHighlight: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  skillHighlightLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: colors.textMuted,
    marginBottom: 4,
  },
  skillHighlightValue: {
    fontSize: 14,
    fontWeight: '800',
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
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  recordLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    paddingRight: spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  exerciseBarTrack: {
    marginTop: 6,
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  exerciseBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
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
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
