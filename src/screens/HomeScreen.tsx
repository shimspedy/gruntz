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
  const { todaysMission, loadTodaysMission } = useMissionStore();
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
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakCount}>{progress.streak_days}</Text>
          </View>
        </View>

        {/* Program Banner */}
        {program ? (
          <TouchableOpacity
            style={[styles.programBanner, { borderColor: program.id === 'marsoc' ? colors.accent : colors.accentOrange }]}
            onPress={() => navigation.navigate('ProgramSelect')}
            activeOpacity={0.85}
          >
            <Text style={styles.programIcon}>{program.icon}</Text>
            <View style={styles.programBannerText}>
              <Text style={styles.programName}>{program.name}</Text>
              <Text style={styles.programWeek}>Week {currentWeek} of {program.duration_weeks}</Text>
            </View>
            <Text style={styles.programSwitch}>SWITCH</Text>
          </TouchableOpacity>
        ) : (
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
        {todaysMission && (
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
        )}

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
  programBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  programIcon: { fontSize: 28, marginRight: spacing.sm },
  programBannerText: { flex: 1 },
  programName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  programWeek: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  programSwitch: {
    fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 1,
  },
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
