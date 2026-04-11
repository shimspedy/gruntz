import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { XPBar } from '../components/XPBar';
import { StatCard } from '../components/StatCard';
import { MissionButton } from '../components/MissionButton';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { MuscleBodyMap } from '../components/MuscleBodyMap';
import { useUserStore } from '../store/useUserStore';
import { useMissionStore } from '../store/useMissionStore';
import { useProgramStore } from '../store/useProgramStore';
import { useChallengeStore } from '../store/useChallengeStore';
import { getXPToNextLevel } from '../utils/xp';
import { getRankInfo } from '../data/ranks';
import { getProgramById } from '../data/programs';
import { getExerciseById } from '../data/exercises';
import { getWorkoutDay } from '../data/workouts';
import { getReconWorkoutDay } from '../data/reconWorkouts';
import { getTodaysChallenge } from '../data/dailyChallenges';
import { getDisplayedMonthlyPrice } from '../config/monetization';
import { hapticLight } from '../utils/haptics';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { getAccessState, getTrialDaysRemaining, hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

/**
 * Get active muscle groups from today's mission by looking up the workout day data
 */
function getActiveMuscleGroups(
  todaysMission: { workout_day_id: string } | null,
  selectedProgram: string | null,
): string[] {
  if (!todaysMission || !selectedProgram) return [];

  const workoutDay = selectedProgram === 'recon'
    ? getReconWorkoutDay(todaysMission.workout_day_id)
    : getWorkoutDay(todaysMission.workout_day_id);

  if (!workoutDay) return [];

  const muscleGroups = new Set<string>();
  workoutDay.sections.forEach((section) => {
    section.exercises.forEach((exerciseId: string) => {
      const exercise = getExerciseById(exerciseId);
      if (exercise?.muscle_groups && Array.isArray(exercise.muscle_groups)) {
        exercise.muscle_groups.forEach((mg) => muscleGroups.add(mg));
      }
    });
  });

  return Array.from(muscleGroups);
}

export default function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const { contentMaxWidth, horizontalPadding } = useAdaptiveLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  // User & progress
  const progress = useUserStore((s) => s.progress);

  // Mission state
  const todaysMission = useMissionStore((s) => s.todaysMission);
  const isRestDay = useMissionStore((s) => s.isRestDay);
  const nextWorkout = useMissionStore((s) => s.nextWorkout);
  const loadTodaysMission = useMissionStore((s) => s.loadTodaysMission);

  // Program state
  const selectedProgram = useProgramStore((s) => s.selectedProgram);
  const currentWeek = useProgramStore((s) => s.currentWeek);
  const loadPersistedState = useProgramStore((s) => s.loadPersistedState);

  // Challenge state
  const challengeProgress = useChallengeStore((s) => s.currentProgress);

  // Subscription state
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);

  const program = selectedProgram ? getProgramById(selectedProgram) : null;
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    let active = true;
    loadPersistedState().then(() => {
      if (active) setHydrated(true);
    });
    return () => { active = false; };
  }, [loadPersistedState]);

  useEffect(() => {
    if (hydrated) loadTodaysMission();
  }, [hydrated, selectedProgram, currentWeek, loadTodaysMission]);

  // Computed values
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const rankInfo = getRankInfo(progress.current_rank);
  const accessState = getAccessState({ trialStartedAt, entitlementActive });
  const trialDaysRemaining = getTrialDaysRemaining(trialStartedAt);
  const trainingUnlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const monthlyPrice = getDisplayedMonthlyPrice(currentOffering);
  const todaysChallenge = getTodaysChallenge();
  const activeMuscles = getActiveMuscleGroups(todaysMission, selectedProgram);
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomContentPadding,
          },
        ]}
      >
        {/* SECTION 1: Header */}
        <Animated.View style={[styles.header, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.rankText}>{progress.current_rank}</Text>
          </View>
          <GlassCard style={styles.streakPill} variant="default">
            <View style={styles.streakPillContent}>
              <GameIcon name="streak" size={18} color={colors.accent} />
              <Text style={styles.streakPillText}>{progress.streak_days}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* SECTION 2: XP Bar */}
        <View style={styles.xpSection}>
          <XPBar current={xpInfo.current} required={xpInfo.required} level={progress.current_level} />
        </View>

        {/* SECTION 3: Muscle Body Map (Hero) */}
        {program && (
          <GlassCard style={styles.muscleMapCard} variant="default">
            <View style={styles.muscleMapContainer}>
              <MuscleBodyMap activeMuscles={activeMuscles} />
              {activeMuscles.length > 0 && (
                <View style={styles.muscleChips}>
                  {activeMuscles.map((muscle) => (
                    <View key={muscle} style={styles.muscleChip}>
                      <Text style={styles.muscleChipText}>{muscle}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </GlassCard>
        )}

        {/* SECTION 4: Today's Mission Card */}
        {todaysMission && !isRestDay && (
          <GlassCard style={styles.missionSection} variant="accent">
            <Text style={styles.sectionLabel}>TODAY'S MISSION</Text>
            <Text style={styles.missionTitle}>{todaysMission.mission_title}</Text>
            <Text style={styles.missionSummary}>{todaysMission.mission_summary}</Text>

            {/* Mission info chips */}
            <View style={styles.missionChips}>
              <View style={styles.infoChip}>
                <GameIcon name="timer" size={14} color={colors.accent} />
                <Text style={styles.chipText}>~45 min</Text>
              </View>
              <View style={styles.infoChip}>
                <GameIcon name="xp" size={14} color={colors.accent} />
                <Text style={styles.chipText}>{todaysMission.reward_xp} XP</Text>
              </View>
              <View style={styles.infoChip}>
                <GameIcon name="mission" size={14} color={colors.accent} />
                <Text style={styles.chipText}>
                  {(() => {
                    const wd = selectedProgram === 'recon'
                      ? getReconWorkoutDay(todaysMission.workout_day_id)
                      : getWorkoutDay(todaysMission.workout_day_id);
                    return wd?.sections.reduce((sum, s) => sum + s.exercises.length, 0) || 0;
                  })()} exercises
                </Text>
              </View>
            </View>

            <MissionButton
              title={
                todaysMission.completed
                  ? 'MISSION COMPLETE'
                  : trainingUnlocked
                    ? 'START MISSION'
                    : 'UNLOCK PRO'
              }
              onPress={() => {
                if (trainingUnlocked) {
                  navigation.navigate('DailyMission', {});
                } else {
                  navigation.navigate('Paywall');
                }
              }}
              variant={todaysMission.completed ? 'success' : 'primary'}
              disabled={todaysMission.completed}
              style={{ marginTop: spacing.lg }}
            />
          </GlassCard>
        )}

        {/* Rest Day Card */}
        {isRestDay && (
          <GlassCard style={styles.restDaySection} variant="default">
            <View style={styles.restDayContent}>
              <GameIcon name="rest" size={48} color={colors.accent} />
              <Text style={styles.restDayTitle}>REST & RECOVER</Text>
              <Text style={styles.restDayMessage}>
                Your body needs time to adapt. Hydrate, stretch, and prepare for tomorrow's mission.
              </Text>
            </View>
            {nextWorkout && (
              <View style={styles.nextWorkoutBox}>
                <Text style={styles.nextLabel}>TOMORROW'S MISSION</Text>
                <Text style={styles.nextTitle}>{nextWorkout.title}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* No Program Selected */}
        {!program && (
          <GlassCard style={styles.noProgramSection} variant="accent">
            <View style={styles.noProgramContent}>
              <GameIcon name="program" size={40} color={colors.accent} />
              <Text style={styles.noProgramTitle}>Select a Program</Text>
              <Text style={styles.noProgramText}>Choose your path: Raider or Recon</Text>
              <MissionButton
                title="CHOOSE PROGRAM"
                onPress={() => {
                  hapticLight();
                  navigation.navigate('ProgramSelect');
                }}
                variant="primary"
                style={{ marginTop: spacing.md }}
              />
            </View>
          </GlassCard>
        )}

        {/* SECTION 5: Daily Challenge Card */}
        {todaysChallenge && (
          <GlassCard style={styles.challengeSection} variant="default">
            <View style={styles.challengeHeader}>
              <GameIcon name={todaysChallenge.icon} size={28} color={colors.accent} />
              <View style={styles.challengeTitleBox}>
                <Text style={styles.sectionLabel}>DAILY CHALLENGE</Text>
                <Text style={styles.challengeName}>{todaysChallenge.name}</Text>
              </View>
            </View>

            <Text style={styles.challengeDesc}>{todaysChallenge.description}</Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((challengeProgress / todaysChallenge.target) * 100, 100)}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {challengeProgress} / {todaysChallenge.target} {todaysChallenge.unit}
              </Text>
            </View>

            {/* Difficulty & Reward row */}
            <View style={styles.challengeFooter}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(todaysChallenge.difficulty, colors) }]}>
                <Text style={styles.difficultyText}>{todaysChallenge.difficulty.toUpperCase()}</Text>
              </View>
              <View style={styles.rewardBadge}>
                <GameIcon name="xp" size={14} color={colors.accent} />
                <Text style={styles.rewardBadgeText}>{todaysChallenge.xpReward} XP</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* SECTION 6: Quick Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="level" value={progress.current_level} label="Level" color={colors.accent} />
          <StatCard icon="streak" value={progress.streak_days} label="Streak" color={colors.streakFire} />
          <StatCard icon="mission" value={progress.workouts_completed} label="Missions" color={colors.accentGreen} />
        </View>

        {/* SECTION 7: Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              hapticLight();
              if (program) {
                navigation.navigate('ProgramDetail', { programId: program.id });
              } else {
                navigation.navigate('ProgramSelect');
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.qaIcon}>
              <GameIcon name={program ? program.icon : 'program'} size={32} color={colors.accent} />
            </View>
            <Text style={styles.qaLabel}>Program</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              hapticLight();
              if (trainingUnlocked) {
                navigation.navigate('RunTracker');
              } else {
                navigation.navigate('Paywall');
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.qaIcon}>
              <GameIcon name="run" size={32} color={colors.accent} />
            </View>
            <Text style={styles.qaLabel}>Run Tracker</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 8: Membership Banner */}
        {accessState !== 'subscriber' && (
          <TouchableOpacity
            style={styles.membershipBanner}
            onPress={() => navigation.navigate('Paywall')}
            activeOpacity={0.85}
          >
            <GameIcon
              name={accessState === 'trial' ? 'badge' : 'warning'}
              size={24}
              color={colors.accent}
            />
            <View style={styles.membershipBody}>
              <Text style={styles.membershipTitle}>
                {accessState === 'trial'
                  ? `${trialDaysRemaining} DAYS LEFT`
                  : 'UPGRADE TO PRO'}
              </Text>
              <Text style={styles.membershipDesc}>
                {accessState === 'trial'
                  ? 'Full access to all programs'
                  : 'Unlock premium features'}
              </Text>
            </View>
            <GameIcon name="arrow" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Get difficulty color for challenge badges
 */
function getDifficultyColor(difficulty: string, colors: ThemeColors): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return colors.accentGreen + '30';
    case 'medium':
      return colors.accent + '30';
    case 'hard':
      return colors.accentRed + '30';
    default:
      return colors.accent + '30';
  }
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

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  rankText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  streakPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
  },
  streakPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  streakPillText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent,
  },

  // XP SECTION
  xpSection: {
    marginBottom: spacing.lg,
  },

  // MUSCLE MAP
  muscleMapCard: {
    marginBottom: spacing.lg,
  },
  muscleMapContainer: {
    alignItems: 'center',
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  muscleChip: {
    backgroundColor: colors.accent + '20',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  muscleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },

  // MISSION SECTION
  missionSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  missionSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  missionChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // REST DAY
  restDaySection: {
    marginBottom: spacing.lg,
  },
  restDayContent: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  restDayTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  restDayMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  nextWorkoutBox: {
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // NO PROGRAM
  noProgramSection: {
    marginBottom: spacing.lg,
  },
  noProgramContent: {
    alignItems: 'center',
  },
  noProgramTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  noProgramText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // CHALLENGE SECTION
  challengeSection: {
    marginBottom: spacing.lg,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  challengeTitleBox: {
    flex: 1,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  challengeDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: 'auto',
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },

  // STATS ROW
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  // QUICK ACTIONS
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.lg,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  qaIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  qaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },

  // MEMBERSHIP BANNER
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  membershipBody: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  membershipDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
