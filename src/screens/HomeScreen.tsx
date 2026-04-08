import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { XPBar } from '../components/XPBar';
import { StatCard } from '../components/StatCard';
import { MissionButton } from '../components/MissionButton';
import { Card } from '../components/Card';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { useUserStore } from '../store/useUserStore';
import { useMissionStore } from '../store/useMissionStore';
import { useProgramStore } from '../store/useProgramStore';
import { getXPToNextLevel } from '../utils/xp';
import { generateCoachMessage } from '../utils/adaptive';
import { getTopInsights, CoachInsight } from '../services/coach';
import { getRankInfo } from '../data/ranks';
import { getProgramById } from '../data/programs';
import { getDisplayedMonthlyPrice } from '../config/monetization';
import { hapticLight } from '../utils/haptics';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { getAccessState, getTrialDaysRemaining, hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const { contentMaxWidth, horizontalPadding } = useAdaptiveLayout();
  const navigation = useNavigation<Nav>();
  const progress = useUserStore((s) => s.progress);
  const todaysMission = useMissionStore((s) => s.todaysMission);
  const isRestDay = useMissionStore((s) => s.isRestDay);
  const nextWorkout = useMissionStore((s) => s.nextWorkout);
  const loadTodaysMission = useMissionStore((s) => s.loadTodaysMission);
  const selectedProgram = useProgramStore((s) => s.selectedProgram);
  const currentWeek = useProgramStore((s) => s.currentWeek);
  const loadPersistedState = useProgramStore((s) => s.loadPersistedState);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);

  const program = selectedProgram ? getProgramById(selectedProgram) : null;

  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    let active = true;

    loadPersistedState().then(() => {
      if (active) {
        setHydrated(true);
      }
    });

    return () => {
      active = false;
    };
  }, [loadPersistedState]);

  // Load mission only after hydration, and when program/week changes
  useEffect(() => {
    if (hydrated) {
      loadTodaysMission();
    }
  }, [hydrated, selectedProgram, currentWeek, loadTodaysMission]);

  const xpInfo = getXPToNextLevel(progress.current_xp);
  const rankInfo = getRankInfo(progress.current_rank);
  const coachMessage = generateCoachMessage(progress);
  const coachInsights = getTopInsights(progress);
  const accessState = getAccessState({ trialStartedAt, entitlementActive });
  const trialDaysRemaining = getTrialDaysRemaining(trialStartedAt);
  const trainingUnlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const monthlyPrice = getDisplayedMonthlyPrice(currentOffering);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: horizontalPadding }]}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <View style={styles.headerMain}>
            <Text style={styles.greeting} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>READY FOR ACTION</Text>
            <View style={styles.rankRow}>
              <GameIcon name={rankInfo?.icon || 'rank'} size={34} color={colors.textPrimary} />
              <Text style={styles.rankTitle} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
                {progress.current_rank}
              </Text>
            </View>
            {program && (
              <View style={styles.programPill}>
                <GameIcon name={program.icon} size={20} color={colors.accent} variant="minimal" />
                <Text style={styles.programPillText}>
                  {program.name} · Wk {currentWeek}/{program.duration_weeks}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.streakBadge}>
            <GameIcon name="streak" size={26} color={colors.streakFire} />
            <View style={styles.streakMeta}>
              <Text style={styles.streakCount}>{progress.streak_days}</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </View>
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.membershipBanner,
            accessState === 'locked' && styles.membershipBannerLocked,
          ]}
          onPress={() => navigation.navigate('Paywall')}
          activeOpacity={accessState === 'subscriber' ? 1 : 0.85}
          disabled={accessState === 'subscriber'}
        >
          <GameIcon
            name={accessState === 'subscriber' ? 'rank' : accessState === 'trial' ? 'badge' : 'warning'}
            size={26}
            color={accessState === 'locked' ? colors.accentGold : colors.accent}
            variant="minimal"
            animated={accessState !== 'subscriber'}
          />
          <View style={styles.membershipBannerBody}>
            <Text style={styles.membershipBannerTitle}>
              {accessState === 'subscriber'
                ? 'GRUNTZ PRO ACTIVE'
                : accessState === 'trial'
                  ? `${trialDaysRemaining} DAY${trialDaysRemaining === 1 ? '' : 'S'} LEFT IN FREE ACCESS`
                  : 'TRIAL ENDED'}
            </Text>
            <Text style={styles.membershipBannerText}>
              {accessState === 'subscriber'
                ? 'Full programs and missions unlocked.'
                : accessState === 'trial'
                  ? `You have full access right now. Membership continues at ${monthlyPrice}.`
                  : `Subscribe for ${monthlyPrice} to keep running missions and full programs.`}
            </Text>
          </View>
          {accessState !== 'subscriber' ? (
            <Text style={styles.membershipBannerAction}>VIEW</Text>
          ) : null}
        </TouchableOpacity>

        {/* Choose Program (only shown when no program selected) */}
        {!program && (
          <TouchableOpacity
            style={styles.noProgramBanner}
            onPress={() => { hapticLight(); navigation.navigate('ProgramSelect'); }}
            activeOpacity={0.85}
          >
            <GameIcon name="program" size={28} color={colors.accent} />
            <View style={styles.programBannerText}>
              <Text style={styles.noProgramTitle}>Choose Your Program</Text>
              <Text style={styles.noProgramSub}>Raider or Recon — pick your path</Text>
            </View>
            <GameIcon name="target" size={20} color={colors.accent} variant="minimal" />
          </TouchableOpacity>
        )}

        {/* XP Bar */}
        <View style={styles.xpContainer}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="level" value={progress.current_level} label="Level" color={colors.accent} />
          <StatCard icon="streak" value={progress.streak_days} label="Streak" color={colors.streakFire} />
          <StatCard icon="mission" value={progress.workouts_completed} label="Ops" color={colors.accentGreen} />
        </View>

        {/* Today's Mission Card */}
        {todaysMission ? (
          <Card style={styles.missionCard}>
            <Text style={styles.missionLabel}>TODAY'S MISSION</Text>
            <Text style={styles.missionTitle}>{todaysMission.mission_title}</Text>
            <Text style={styles.missionSummary}>{todaysMission.mission_summary}</Text>
            <View style={styles.rewardRow}>
              <View style={styles.rewardPill}>
                <GameIcon name="xp" size={18} color={colors.accentGold} variant="minimal" />
                <Text style={styles.rewardText}>{todaysMission.reward_xp} XP</Text>
              </View>
              <View style={styles.rewardPill}>
                <GameIcon name="coin" size={18} color={colors.accentGold} variant="minimal" />
                <Text style={styles.rewardText}>{todaysMission.reward_coins} Coins</Text>
              </View>
            </View>
            <MissionButton
              title={
                todaysMission.completed
                  ? 'MISSION COMPLETE'
                  : trainingUnlocked
                    ? 'START MISSION'
                    : 'UNLOCK GRUNTZ PRO'
              }
              onPress={() => {
                if (trainingUnlocked) {
                  navigation.navigate('DailyMission', {});
                  return;
                }
                navigation.navigate('Paywall');
              }}
              variant={todaysMission.completed ? 'success' : 'primary'}
              disabled={todaysMission.completed}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : isRestDay ? (
          <Card style={styles.restDayCard}>
            <GameIcon name="rest" size={60} color={colors.accent} style={styles.restDayIcon} />
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
                  <View style={styles.rewardPill}>
                    <GameIcon name="xp" size={18} color={colors.accentGold} variant="minimal" />
                    <Text style={styles.rewardText}>{nextWorkout.rewards.xp} XP</Text>
                  </View>
                  <View style={styles.rewardPill}>
                    <GameIcon name="coin" size={18} color={colors.accentGold} variant="minimal" />
                    <Text style={styles.rewardText}>{nextWorkout.rewards.coins} Coins</Text>
                  </View>
                </View>
              </View>
            )}
          </Card>
        ) : null}

        {/* Coach Insights — Liquid Glass */}
        <GlassCard style={styles.coachCard}>
          <Text style={styles.coachLabel}>COACH NOTES</Text>
          <Text style={styles.coachMessage}>{coachMessage}</Text>
          {coachInsights.map((insight: CoachInsight, idx: number) => (
            <View key={idx} style={styles.insightRow}>
              <GameIcon name={insight.icon} size={24} color={colors.accent} style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.aiToolsRow}>
          <TouchableOpacity
            style={styles.aiToolCard}
            onPress={() => {
              hapticLight();
              if (program) {
                navigation.navigate('ProgramDetail', { programId: program.id });
                return;
              }
              navigation.navigate('ProgramSelect');
            }}
            activeOpacity={0.7}
          >
            <GameIcon name={program ? program.icon : 'program'} size={28} color={colors.accent} style={styles.aiToolIcon} />
            <Text style={styles.aiToolLabel}>{program ? 'Program Details' : 'Choose Program'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.aiToolCard}
            onPress={() => {
              hapticLight();
              if (trainingUnlocked) {
                navigation.navigate('RunTracker');
                return;
              }
              navigation.navigate('Paywall');
            }}
            activeOpacity={0.7}
          >
            <GameIcon name="run" size={28} color={colors.accent} style={styles.aiToolIcon} />
            <Text style={styles.aiToolLabel}>Run Tracker</Text>
          </TouchableOpacity>
        </View>

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
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerMain: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  rankTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  streakBadge: {
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 96,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 3,
  },
  streakMeta: {
    alignItems: 'flex-start',
  },
  streakCount: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.streakFire,
    lineHeight: 24,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  membershipBannerLocked: {
    borderColor: colors.accentGold,
  },
  membershipBannerBody: {
    flex: 1,
  },
  membershipBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  membershipBannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  membershipBannerAction: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
  },
  xpContainer: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    marginBottom: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: `${colors.cardBorder}66`,
  },
  insightIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
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
  aiToolsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiToolCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  aiToolIcon: {
    marginBottom: 4,
  },
  aiToolLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  programPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 6,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noProgramIcon: { marginRight: spacing.sm },
  noProgramTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  noProgramSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  noProgramArrow: {},
});
