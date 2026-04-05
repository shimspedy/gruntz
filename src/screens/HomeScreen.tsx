import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import { XPBar } from '../components/XPBar';
import { StatCard } from '../components/StatCard';
import { MissionButton } from '../components/MissionButton';
import { Card } from '../components/Card';
import { useUserStore } from '../store/useUserStore';
import { useMissionStore } from '../store/useMissionStore';
import { useProgramStore } from '../store/useProgramStore';
import { getXPToNextLevel } from '../utils/xp';
import { generateCoachMessage } from '../utils/adaptive';
import { getRankInfo } from '../data/ranks';
import { getProgramById } from '../data/programs';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useUserStore();
  const { todaysMission, isRestDay, nextWorkout, loadTodaysMission } = useMissionStore();
  const { selectedProgram, currentWeek, loadPersistedState } = useProgramStore();

  const program = selectedProgram ? getProgramById(selectedProgram) : null;

  useEffect(() => {
    loadPersistedState().then(() => {
      loadTodaysMission();
    });
  }, []);

  // Reload mission when program changes
  useEffect(() => {
    loadTodaysMission();
  }, [selectedProgram, currentWeek]);

  const xpInfo = getXPToNextLevel(progress.current_xp);
  const rankInfo = getRankInfo(progress.current_rank);
  const coachMessage = generateCoachMessage(progress);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>READY FOR ACTION</Text>
            <Text style={styles.rankTitle}>
              {rankInfo?.icon} {progress.current_rank}
            </Text>
            {program && (
              <View style={styles.programPill}>
                <Text style={styles.programPillText}>
                  {program.icon} {program.name} · Wk {currentWeek}/{program.duration_weeks}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakCount}>{progress.streak_days}</Text>
          </View>
        </View>

        {/* Choose Program (only shown when no program selected) */}
        {!program && (
          <TouchableOpacity
            style={styles.noProgramBanner}
            onPress={() => navigation.navigate('ProgramSelect')}
            activeOpacity={0.85}
          >
            <Text style={styles.noProgramIcon}>⚡</Text>
            <View style={styles.programBannerText}>
              <Text style={styles.noProgramTitle}>Choose Your Program</Text>
              <Text style={styles.noProgramSub}>MARSOC or Ranger — pick your path</Text>
            </View>
            <Text style={styles.noProgramArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* XP Bar */}
        <View style={styles.xpContainer}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="⚡" value={progress.current_level} label="Level" color={colors.accent} />
          <View style={{ width: spacing.sm }} />
          <StatCard icon="🔥" value={progress.streak_days} label="Streak" color={colors.streakFire} />
          <View style={{ width: spacing.sm }} />
          <StatCard icon="💪" value={progress.workouts_completed} label="Missions" color={colors.accentGreen} />
        </View>

        {/* Today's Mission Card */}
        {todaysMission ? (
          <Card style={styles.missionCard}>
            <Text style={styles.missionLabel}>TODAY'S MISSION</Text>
            <Text style={styles.missionTitle}>{todaysMission.mission_title}</Text>
            <Text style={styles.missionSummary}>{todaysMission.mission_summary}</Text>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardText}>⭐ {todaysMission.reward_xp} XP</Text>
              <Text style={styles.rewardText}>🪙 {todaysMission.reward_coins} Coins</Text>
            </View>
            <MissionButton
              title={todaysMission.completed ? '✓ COMPLETED' : 'START MISSION'}
              onPress={() => navigation.navigate('DailyMission', {})}
              variant={todaysMission.completed ? 'success' : 'primary'}
              disabled={todaysMission.completed}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : isRestDay ? (
          <Card style={styles.restDayCard}>
            <Text style={styles.restDayIcon}>🛌</Text>
            <Text style={styles.restDayTitle}>REST DAY</Text>
            <Text style={styles.restDayMessage}>
              Recovery is part of the mission. Hydrate, stretch, and prepare for tomorrow.
            </Text>
            {nextWorkout && (
              <View style={styles.nextWorkoutPreview}>
                <Text style={styles.nextWorkoutLabel}>TOMORROW'S MISSION</Text>
                <Text style={styles.nextWorkoutTitle}>{nextWorkout.title}</Text>
                <Text style={styles.nextWorkoutSummary}>{nextWorkout.objective}</Text>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardText}>⭐ {nextWorkout.rewards.xp} XP</Text>
                  <Text style={styles.rewardText}>🪙 {nextWorkout.rewards.coins} Coins</Text>
                </View>
              </View>
            )}
          </Card>
        ) : null}

        {/* Coach Message */}
        <Card style={styles.coachCard}>
          <Text style={styles.coachLabel}>🎯 COACH</Text>
          <Text style={styles.coachMessage}>{coachMessage}</Text>
        </Card>

        {/* Quick Stats */}
        <Card title="Quick Stats">
          <View style={styles.quickStatRow}>
            <Text style={styles.quickStatLabel}>Total XP</Text>
            <Text style={styles.quickStatValue}>{progress.current_xp.toLocaleString()}</Text>
          </View>
          <View style={styles.quickStatRow}>
            <Text style={styles.quickStatLabel}>Total Reps</Text>
            <Text style={styles.quickStatValue}>{progress.total_reps.toLocaleString()}</Text>
          </View>
          <View style={styles.quickStatRow}>
            <Text style={styles.quickStatLabel}>Missions Done</Text>
            <Text style={styles.quickStatValue}>{progress.workouts_completed}</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  rankTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  streakBadge: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  streakIcon: {
    fontSize: 20,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.streakFire,
    marginTop: 2,
  },
  xpContainer: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  missionCard: {
    marginBottom: spacing.md,
  },
  restDayCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  restDayIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  restDayTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.accentGold,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  restDayMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  nextWorkoutPreview: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  nextWorkoutLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  nextWorkoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  nextWorkoutSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  missionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  missionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  missionSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accentGold,
  },
  coachCard: {
    marginBottom: spacing.md,
  },
  coachLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  coachMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  quickStatLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  programPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  programPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  programBannerText: { flex: 1 },
  noProgramBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noProgramIcon: { fontSize: 28, marginRight: spacing.sm },
  noProgramTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  noProgramSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  noProgramArrow: { fontSize: 20, color: colors.accent, fontWeight: '800' },
});
