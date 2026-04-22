import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, AppState } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors, spacing, borderRadius } from '../theme';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { XPBar } from '../components/XPBar';
import { StatCard } from '../components/StatCard';
import { MissionButton } from '../components/MissionButton';
import { ChallengeLogModal } from '../components/ChallengeLogModal';
import { GlassCard } from '../components/GlassCard';
import { GameIcon } from '../components/GameIcon';
import { MuscleBodyMap } from '../components/MuscleBodyMap';
import { achievements } from '../data/achievements';
import type { DailyChallenge } from '../data/dailyChallenges';
import { useUserStore } from '../store/useUserStore';
import { useMissionStore } from '../store/useMissionStore';
import { useProgramStore } from '../store/useProgramStore';
import { useChallengeStore } from '../store/useChallengeStore';
import { getXPToNextLevel } from '../utils/xp';
import { getProgramById } from '../data/programs';
import { getExerciseById } from '../data/exercises';
import { getProgramWorkoutDay } from '../data/programWorkouts';
import { formatChallengeAmount, getTodaysChallenge } from '../data/dailyChallenges';
import { showAchievementUnlocked } from '../services/notifications';
import { hapticLight, hapticDoubleTap } from '../utils/haptics';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { getAccessState, getTrialDaysRemaining, hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { ProgramId, UserProfile } from '../types';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

/**
 * Get active muscle groups from today's mission by looking up the workout day data
 */
function getActiveMuscleGroups(
  todaysMission: { workout_day_id: string } | null,
  selectedProgram: ProgramId | null,
  profile: UserProfile | null,
): string[] {
  if (!todaysMission || !selectedProgram) return [];

  const workoutDay = getProgramWorkoutDay(selectedProgram, todaysMission.workout_day_id, profile);

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
  const profile = useUserStore((s) => s.profile);

  // Mission state
  const todaysMission = useMissionStore((s) => s.todaysMission);
  const isRestDay = useMissionStore((s) => s.isRestDay);
  const nextWorkout = useMissionStore((s) => s.nextWorkout);
  const loadTodaysMission = useMissionStore((s) => s.loadTodaysMission);

  // Program state
  const selectedProgram = useProgramStore((s) => s.selectedProgram);
  const currentWeek = useProgramStore((s) => s.currentWeek);
  const loadPersistedState = useProgramStore((s) => s.loadPersistedState);
  const programStoreHydrated = useProgramStore((s) => s.hasHydrated);

  // Challenge state
  const challengeProgress = useChallengeStore((s) => s.currentProgress);
  const challengeTodayCompleted = useChallengeStore((s) => s.todayCompleted);
  const addChallengeProgress = useChallengeStore((s) => s.addProgress);
  const completeDailyChallenge = useChallengeStore((s) => s.completeChallenge);
  const resetDailyChallenge = useChallengeStore((s) => s.resetDaily);

  // Subscription state
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);

  const program = selectedProgram ? getProgramById(selectedProgram) : null;
  const [hydrated, setHydrated] = React.useState(false);
  const [hydrationError, setHydrationError] = React.useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = React.useState(false);
  const streakBounce = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef<number | null>(null);
  const challengeGlow = useRef(new Animated.Value(0)).current;

  const hydratePersistedState = React.useCallback(() => {
    let active = true;
    setHydrationError(false);
    loadPersistedState()
      .catch((err) => {
        if (__DEV__) {
          console.warn('[HomeScreen] loadPersistedState failed', err);
        }
        if (active) setHydrationError(true);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => { active = false; };
  }, [loadPersistedState]);

  useEffect(() => hydratePersistedState(), [hydratePersistedState]);

  useEffect(() => {
    if (hydrated && programStoreHydrated) loadTodaysMission();
  }, [hydrated, programStoreHydrated, selectedProgram, currentWeek, loadTodaysMission]);

  // Bounce streak pill when streak_days increments
  useEffect(() => {
    if (prevStreak.current !== null && progress.streak_days > prevStreak.current) {
      Animated.sequence([
        Animated.spring(streakBounce, { toValue: 1.25, damping: 6, stiffness: 260, useNativeDriver: true }),
        Animated.spring(streakBounce, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
      ]).start();
    }
    prevStreak.current = progress.streak_days;
  }, [progress.streak_days, streakBounce]);

  useEffect(() => {
    resetDailyChallenge();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        resetDailyChallenge();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [resetDailyChallenge]);

  // Computed values
  const xpInfo = getXPToNextLevel(progress.current_xp);
  const accessState = getAccessState({ trialStartedAt, entitlementActive });
  const trialDaysRemaining = getTrialDaysRemaining(trialStartedAt);
  const trainingUnlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const todaysChallenge = getTodaysChallenge();
  const displayedChallengeProgress = todaysChallenge
    ? Math.min(challengeTodayCompleted ? todaysChallenge.target : challengeProgress, todaysChallenge.target)
    : 0;
  const challengeRemaining = todaysChallenge
    ? Math.max(todaysChallenge.target - displayedChallengeProgress, 0)
    : 0;
  const activeMuscles = useMemo(
    () => getActiveMuscleGroups(todaysMission, selectedProgram, profile),
    [todaysMission, selectedProgram, profile],
  );
  const currentWorkoutDay = useMemo(
    () => (todaysMission ? getProgramWorkoutDay(selectedProgram, todaysMission.workout_day_id, profile) : undefined),
    [profile, selectedProgram, todaysMission],
  );
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleChallengeRewards = (achievementIds: string[]) => {
    achievementIds.forEach((achievementId) => {
      const achievement = achievements.find((item) => item.id === achievementId);
      if (!achievement) {
        return;
      }

      void showAchievementUnlocked(achievement.name, achievement.icon);
    });
  };

  const handleAddChallengeProgress = (amount: number) => {
    if (!todaysChallenge || amount <= 0) {
      return;
    }

    const result = addChallengeProgress(amount, todaysChallenge);
    if (result.completedNow) {
      void hapticDoubleTap();
      runChallengeGlow();
      handleChallengeRewards(result.unlockedAchievementIds);
    }
  };

  const handleCompleteChallenge = () => {
    if (!todaysChallenge) {
      return;
    }

    const result = completeDailyChallenge(todaysChallenge);
    if (result.completedNow) {
      void hapticDoubleTap();
      runChallengeGlow();
      handleChallengeRewards(result.unlockedAchievementIds);
    }
  };

  const runChallengeGlow = () => {
    Animated.sequence([
      Animated.timing(challengeGlow, { toValue: 1, duration: 250, useNativeDriver: false }),
      Animated.timing(challengeGlow, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.skelLine, { width: 140, height: 18, marginBottom: spacing.lg }]} />
          <View style={[styles.skelLine, { width: '100%', height: 48, marginBottom: spacing.lg }]} />
          <View style={[styles.skelCard, { height: 220, marginBottom: spacing.lg }]} />
          <View style={[styles.skelCard, { height: 180, marginBottom: spacing.lg }]} />
          <View style={styles.skelStatsRow}>
            <View style={[styles.skelCard, { flex: 1, height: 120 }]} />
            <View style={[styles.skelCard, { flex: 1, height: 120 }]} />
            <View style={[styles.skelCard, { flex: 1, height: 120 }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Animated.View style={{ transform: [{ scale: streakBounce }] }}>
            <GlassCard style={styles.streakPill} variant="default">
              <View style={styles.streakPillContent}>
                <GameIcon name="streak" size={18} color={colors.streakFire} animated />
                <Text style={styles.streakPillText}>{progress.streak_days}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        </Animated.View>

        {hydrationError && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={() => {
              hapticLight();
              hydratePersistedState();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reload saved state"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <GameIcon name="warning" size={16} color={colors.accentOrange} variant="minimal" animated={false} />
            <Text style={styles.errorBannerText}>
              Couldn&apos;t load saved progress. Tap to retry.
            </Text>
          </TouchableOpacity>
        )}

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
                <GameIcon name="timer" size={14} color={colors.accent} animated={false} />
                <Text style={styles.chipText}>~{currentWorkoutDay?.estimated_duration ?? 45} min</Text>
              </View>
              <View style={styles.infoChip}>
                <GameIcon name="xp" size={14} color={colors.accent} animated={false} />
                <Text style={styles.chipText}>{todaysMission.reward_xp} XP</Text>
              </View>
              <View style={styles.infoChip}>
                <GameIcon name="mission" size={14} color={colors.accent} animated={false} />
                <Text style={styles.chipText}>
                  {currentWorkoutDay?.sections.reduce((sum, s) => sum + s.exercises.length, 0) || 0} exercises
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
              <GameIcon name="rest" size={32} color={colors.accent} animated={false} />
              <Text style={styles.restDayTitle}>REST & RECOVER</Text>
              <Text style={styles.restDayMessage}>
                Your body needs time to adapt. Hydrate, stretch, and prepare for tomorrow's mission.
              </Text>
            </View>
            {nextWorkout && (
              <View style={styles.nextWorkoutBox}>
                <Text style={styles.nextLabel}>NEXT MISSION</Text>
                <Text style={styles.nextTitle}>{nextWorkout.title}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* No Program Selected */}
        {!program && (
          <GlassCard style={styles.noProgramSection} variant="accent">
            <View style={styles.noProgramContent}>
              <GameIcon name="program" size={28} color={colors.accent} animated={false} />
              <Text style={styles.noProgramTitle}>Select a Program</Text>
              <Text style={styles.noProgramText}>Choose Base Camp, Raider, or Recon</Text>
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
              <GameIcon name={todaysChallenge.icon} size={20} color={colors.accent} animated={false} />
              <View style={styles.challengeTitleBox}>
                <Text style={styles.sectionLabel}>DAILY CHALLENGE</Text>
                <Text style={styles.challengeName}>{todaysChallenge.name}</Text>
              </View>
            </View>

            <Text style={styles.challengeDesc}>{todaysChallenge.description}</Text>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressTrack,
                  {
                    shadowColor: colors.accentGreen,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: challengeGlow,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((displayedChallengeProgress / todaysChallenge.target) * 100, 100)}%`,
                      backgroundColor: challengeTodayCompleted ? colors.accentGreen : colors.accent,
                    },
                  ]}
                />
              </Animated.View>
              <Text style={styles.progressText}>
                {formatChallengeProgressLabel(displayedChallengeProgress, todaysChallenge)}
              </Text>
            </View>

            {/* Difficulty & Reward row */}
            <View style={styles.challengeFooter}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(todaysChallenge.difficulty, colors) }]}>
                <Text style={styles.difficultyText}>{todaysChallenge.difficulty.toUpperCase()}</Text>
              </View>
              <View style={styles.rewardBadge}>
                <GameIcon name="xp" size={14} color={colors.accent} animated={false} />
                <Text style={styles.rewardBadgeText}>{todaysChallenge.xpReward} XP</Text>
              </View>
            </View>

            {challengeTodayCompleted ? (
              <View style={styles.challengeStatusBanner}>
                <GameIcon name="xp" size={16} color={colors.accentGreen} animated={false} />
                <Text style={styles.challengeStatusText}>
                  Challenge complete. Today&apos;s XP is already added.
                </Text>
              </View>
            ) : (
              <Text style={styles.challengeRemainingText}>
                {formatChallengeMetric(challengeRemaining, todaysChallenge)} left to earn {todaysChallenge.xpReward} XP.
              </Text>
            )}

            <MissionButton
              title={challengeTodayCompleted ? 'VIEW DETAILS' : 'LOG PROGRESS'}
              onPress={() => setChallengeModalVisible(true)}
              variant={challengeTodayCompleted ? 'secondary' : 'primary'}
              style={styles.challengeButton}
            />
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
            accessibilityRole="button"
            accessibilityLabel={program ? `Open ${program.name}` : 'Choose a program'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.qaIcon}>
              <GameIcon name={program ? program.icon : 'program'} size={24} color={colors.accent} animated={false} />
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
            accessibilityRole="button"
            accessibilityLabel="Open run tracker"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.qaIcon}>
              <GameIcon name="run" size={24} color={colors.accent} animated={false} />
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
            accessibilityRole="button"
            accessibilityLabel={accessState === 'trial' ? 'View access status' : 'Upgrade to Pro'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <GameIcon
              name={accessState === 'trial' ? 'badge' : 'warning'}
              size={18}
              color={colors.accent}
              animated={false}
            />
            <View style={styles.membershipBody}>
              <Text style={styles.membershipTitle}>
                {accessState === 'trial'
                  ? `${trialDaysRemaining} DAYS LEFT`
                  : 'UPGRADE TO PRO'}
              </Text>
              <Text style={styles.membershipDesc}>
                {accessState === 'trial'
                  ? 'Included app access is active'
                  : 'Unlock premium features'}
              </Text>
            </View>
            <GameIcon name="arrow" size={14} color={colors.textMuted} animated={false} />
          </TouchableOpacity>
        )}
      </ScrollView>
      <ChallengeLogModal
        visible={challengeModalVisible}
        challenge={todaysChallenge}
        currentProgress={displayedChallengeProgress}
        todayCompleted={challengeTodayCompleted}
        onAddProgress={handleAddChallengeProgress}
        onComplete={handleCompleteChallenge}
        onClose={() => setChallengeModalVisible(false)}
      />
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

function formatChallengeMetric(value: number, challenge: DailyChallenge): string {
  if (challenge.unit === 'seconds') {
    return formatChallengeAmount(value, challenge);
  }

  return `${formatChallengeAmount(value, challenge)} ${challenge.unit}`;
}

function formatChallengeProgressLabel(progress: number, challenge: DailyChallenge): string {
  if (challenge.unit === 'seconds') {
    return `${formatChallengeAmount(progress, challenge)} / ${formatChallengeAmount(challenge.target, challenge)}`;
  }

  return `${formatChallengeAmount(progress, challenge)} / ${formatChallengeAmount(challenge.target, challenge)} ${challenge.unit}`;
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
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  rankText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  streakPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    minWidth: 56,
  },
  streakPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  streakPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // XP SECTION
  xpSection: {
    marginBottom: spacing.lg,
  },

  // ERROR BANNER
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.accentOrange}12`,
    borderWidth: 1,
    borderColor: `${colors.accentOrange}40`,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.accentOrange,
    fontWeight: '700',
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent + '40',
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  missionSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  missionChips: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // REST DAY
  restDaySection: {
    marginBottom: spacing.lg,
  },
  restDayContent: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  restDayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: spacing.sm,
    letterSpacing: 0.5,
  },
  restDayMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  nextWorkoutBox: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  nextTitle: {
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  noProgramText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 19,
  },

  // CHALLENGE SECTION
  challengeSection: {
    marginBottom: spacing.lg,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  challengeTitleBox: {
    flex: 1,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  challengeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 4,
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
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  difficultyBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  challengeStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentGreen + '0D',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentGreen + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  challengeStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.accentGreen,
    lineHeight: 17,
  },
  challengeRemainingText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
  challengeButton: {
    marginTop: spacing.md,
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
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.md,
  },
  qaIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  qaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },

  // MEMBERSHIP BANNER
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  membershipBody: {
    flex: 1,
  },
  membershipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  membershipDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // SKELETON
  skelLine: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  skelCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  skelStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
