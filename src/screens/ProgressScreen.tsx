import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { SectionHeader } from '../components/SectionHeader';
import { XPBar } from '../components/XPBar';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import { useUserStore } from '../store/useUserStore';
import { getXPToNextLevel } from '../utils/xp';
import { useFloatingTabBarSpacing } from '../hooks/useFloatingTabBarSpacing';
import { useReadinessStore } from '../store/useReadinessStore';

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
  const { bottomContentPadding, insets } = useFloatingTabBarSpacing();
  const navigation = useNavigation();
  const progress = useUserStore((s) => s.progress);
  const trackedSessions = useReadinessStore((s) => s.trackedSessions);
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const hasAnyActivity = progress.workouts_completed > 0 || progress.total_reps > 0;
  const goToHome = () =>
    navigation.dispatch(CommonActions.navigate({ name: 'HomeTab' as never }));

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
  const progressMetrics = [
    { icon: 'mission', label: 'Missions', value: progress.workouts_completed, color: colors.accent },
    { icon: 'streak', label: 'Streak', value: progress.streak_days, color: colors.streakFire },
    { icon: 'reps', label: 'Reps', value: progress.total_reps.toLocaleString(), color: colors.accentGreen },
    { icon: 'run', label: 'Miles', value: progress.total_distance_miles, color: colors.accentOrange },
    { icon: 'achievement', label: 'Challenges', value: progress.challenges_completed, color: colors.accentGold },
    { icon: 'xp', label: 'Challenge XP', value: progress.challenge_xp_earned.toLocaleString(), color: colors.accent },
  ];

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.kicker}>MISSION INTEL</Text>
              <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>Progress</Text>
              <Text style={styles.subtitle}>
                {xpRemaining > 0
                  ? `${xpRemaining} XP until Level ${progress.current_level + 1}`
                  : 'Level complete. Keep stacking missions.'}
              </Text>
            </View>
            <View style={styles.rankChip}>
              <Text style={styles.rankChipText}>{progress.current_rank}</Text>
            </View>
          </View>

          {!hasAnyActivity && (
            <GlassCard style={styles.startCard} variant="accent">
              <View style={styles.startCardIcon}>
                <GameIcon name="mission" size={22} color={colors.accent} variant="minimal" animated={false} />
              </View>
              <View style={styles.startCardBody}>
                <Text style={styles.startCardTitle}>Start your first mission</Text>
                <Text style={styles.startCardText}>
                  Complete one workout to unlock meaningful scores, records, and movement trends.
                </Text>
              </View>
              <MissionButton title="START MISSION" onPress={goToHome} variant="primary" style={styles.startCardButton} />
            </GlassCard>
          )}

          {/* XP Overview */}
          <GlassCard style={styles.section}>
            <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
            <View style={styles.xpDetails}>
              <Text style={styles.totalXP}>{progress.current_xp.toLocaleString()} XP</Text>
              <View style={styles.skillHighlights}>
                <View style={styles.skillHighlight}>
                  <Text style={styles.skillHighlightLabel}>TOP SKILL</Text>
                  <Text style={[styles.skillHighlightValue, { color: strongestSkill.color }]}>{strongestSkill.name}</Text>
                </View>
                <View style={styles.skillHighlight}>
                  <Text style={styles.skillHighlightLabel}>FOCUS</Text>
                  <Text style={[styles.skillHighlightValue, { color: focusSkill.color }]}>{focusSkill.name}</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* Metrics */}
          <GlassCard style={styles.section}>
            <View style={styles.metricsGrid}>
              {progressMetrics.map((metric) => (
                <View key={metric.label} style={styles.metricItem}>
                  <View style={[styles.metricIcon, { backgroundColor: `${metric.color}12` }]}>
                    <GameIcon name={metric.icon} size={14} color={metric.color} variant="minimal" animated={false} />
                  </View>
                  <View style={styles.metricTextWrap}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>

          {trackedSessions.length > 0 && (
            <>
              <SectionHeader title="Field Sessions" subtitle="Recent GPS-tracked run and ruck efforts." icon="ruck" />
              <GlassCard style={styles.section}>
                {trackedSessions.slice(0, 6).map((session, index) => (
                  <View key={session.id} style={[styles.prRow, index === Math.min(trackedSessions.length, 6) - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.recordLabelWrap}>
                      <View style={[styles.recordIcon, { backgroundColor: `${colors.accentGreen}12` }]}>
                        <GameIcon name={session.type === 'ruck' ? 'ruck' : 'run'} size={12} color={colors.accentGreen} variant="minimal" animated={false} />
                      </View>
                      <View>
                        <Text style={styles.prLabel}>{session.type.toUpperCase()} · {session.distanceMiles.toFixed(2)} MI</Text>
                        <Text style={styles.sessionMeta}>
                          {new Date(session.date).toLocaleDateString()}{session.packWeightPounds ? ` · ${session.packWeightPounds} lb` : ''}{session.terrain ? ` · ${session.terrain}` : ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.prValue}>{formatDurationLabel(session.durationSeconds)}</Text>
                  </View>
                ))}
              </GlassCard>
            </>
          )}

          {/* Operator Profile */}
          <SectionHeader title="Operator Profile" subtitle="Strengths and gaps from completed work." icon="stats" />
          <GlassCard style={styles.section}>
            {skillCategories.map((cat) => (
              <View key={cat.name} style={styles.skillRow}>
                <View style={styles.skillNameWrap}>
                  <GameIcon name={getSkillIcon(cat.name)} size={16} color={cat.color} variant="minimal" animated={false} />
                  <Text style={styles.skillName}>{cat.name}</Text>
                </View>
                <View style={styles.skillBarTrack}>
                  <View style={[styles.skillBarFill, { width: `${cat.score}%`, backgroundColor: cat.color }]} />
                </View>
                <Text style={[styles.skillScore, { color: cat.color }]}>{cat.score}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Personal Records */}
          <SectionHeader title="Records" subtitle="Best logged efforts across run, ruck, and swim." icon="achievement" />
          <GlassCard style={styles.section}>
            {records.length > 0 ? (
              records.slice(0, 8).map((record) => (
                <View key={record.label} style={styles.prRow}>
                  <View style={styles.recordLabelWrap}>
                    <View style={[styles.recordIcon, { backgroundColor: `${colors.accent}12` }]}>
                      <GameIcon name={record.icon} size={12} color={colors.accent} variant="minimal" animated={false} />
                    </View>
                    <Text style={styles.prLabel}>{record.label}</Text>
                  </View>
                  <Text style={styles.prValue}>{formatDurationLabel(record.value)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIllustration}>
                  <GameIcon name="achievement" size={28} color={colors.accentGold} variant="minimal" animated={false} />
                </View>
                <Text style={styles.emptyTitle}>No records logged yet</Text>
                <Text style={styles.emptyText}>Complete timed missions and tracked runs to populate your board.</Text>
              </View>
            )}
          </GlassCard>

          {/* Top Movements */}
          <SectionHeader title="Top Movements" subtitle="Your most repeated exercises so far." icon="strength" />
          <GlassCard style={styles.section}>
            {topExercises.length > 0 ? (
              topExercises.map((exercise, index) => (
                <View key={exercise.id} style={[styles.prRow, index === topExercises.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.prLabel}>{exercise.id.replace(/_/g, ' ')}</Text>
                    <View style={styles.exerciseBarTrack}>
                      <View
                        style={[
                          styles.exerciseBarFill,
                          { width: `${Math.max((exercise.count / topExerciseMax) * 100, 10)}%`, backgroundColor: colors.accent },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.prValue}>{exercise.count}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIllustration}>
                  <GameIcon name="strength" size={28} color={colors.accent} variant="minimal" animated={false} />
                </View>
                <Text style={styles.emptyTitle}>Movement log is empty</Text>
                <Text style={styles.emptyText}>Your most-used exercises will show up here once you finish missions.</Text>
              </View>
            )}
          </GlassCard>
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
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleWrap: {
    flex: 1,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  rankChip: {
    backgroundColor: `${colors.accent}0D`,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  rankChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: spacing.lg,
  },
  startCard: {
    marginBottom: spacing.lg,
  },
  startCardIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  startCardBody: {
    marginBottom: spacing.md,
  },
  startCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  startCardText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  startCardButton: {
    marginTop: spacing.xs,
  },
  xpDetails: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  totalXP: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  skillHighlights: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skillHighlight: {
    flex: 1,
    backgroundColor: `${colors.textPrimary}04`,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.textPrimary}08`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  skillHighlightLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  skillHighlightValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroStatRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  metricItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrap: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  sessionMeta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  skillNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: 100,
  },
  skillName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  skillBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: `${colors.textPrimary}08`,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  skillBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  skillScore: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.textPrimary}08`,
  },
  recordLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  recordIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exerciseInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  exerciseBarTrack: {
    marginTop: spacing.xs,
    height: 6,
    backgroundColor: `${colors.textPrimary}08`,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  exerciseBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  prLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyIllustration: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.accent}0D`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
