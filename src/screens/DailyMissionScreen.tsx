import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFadeInUp } from '../utils/animations';
import { useColors, spacing, MAX_FONT_MULTIPLIER, borderRadius } from '../theme';
import type { ThemeColors } from '../theme';
import { GlassCard } from '../components/GlassCard';
import { MissionButton } from '../components/MissionButton';
import { GameIcon } from '../components/GameIcon';
import { RestTimer } from '../components/RestTimer';
import { RepLogModal } from '../components/RepLogModal';
import { LottieReward } from '../components/LottieReward';
import { useMissionStore } from '../store/useMissionStore';
import { useProgramStore } from '../store/useProgramStore';
import { useUserStore } from '../store/useUserStore';
import { getWorkoutDay } from '../data/workouts';
import { getReconWorkoutDay } from '../data/reconWorkouts';
import { getExerciseById } from '../data/exercises';
import { achievements } from '../data/achievements';
import { getDisplayedMonthlyPrice } from '../config/monetization';
import { hapticMedium, hapticLevelUp } from '../utils/haptics';
import { showWorkoutProgress, clearWorkoutProgress, showWorkoutComplete, showAchievementUnlocked } from '../services/notifications';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { CompletedExercise, CompletedMission, Exercise, SetLog } from '../types';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'DailyMission'>;

type ExerciseInstance = {
  instanceKey: string;
  exerciseId: string;
  exercise: Exercise;
  detail: string;
};

const sectionIcons: Record<string, string> = {
  warmup: 'warmup',
  workout: 'strength',
  cardio: 'run',
  recovery: 'recovery',
  test: 'test',
};

export default function DailyMissionScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const { contentMaxWidth, horizontalPadding } = useAdaptiveLayout();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);
  const navigation = useNavigation<Nav>();
  const todaysMission = useMissionStore((s) => s.todaysMission);
  const isRestDay = useMissionStore((s) => s.isRestDay);
  const nextWorkout = useMissionStore((s) => s.nextWorkout);
  const loadTodaysMission = useMissionStore((s) => s.loadTodaysMission);
  const startMission = useMissionStore((s) => s.startMission);
  const finishMission = useMissionStore((s) => s.finishMission);
  const completeMission = useUserStore((s) => s.completeMission);
  const checkAchievements = useUserStore((s) => s.checkAchievements);
  const selectedProgram = useProgramStore((s) => s.selectedProgram);
  const loadPersistedState = useProgramStore((s) => s.loadPersistedState);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const currentOffering = useSubscriptionStore((s) => s.currentOffering);

  const [started, setStarted] = useState(false);
  const [missionStartTime] = useState(() => new Date());
  const [restExerciseKey, setRestExerciseKey] = useState<string | null>(null);
  const [logTarget, setLogTarget] = useState<ExerciseInstance | null>(null);
  const [loggedSetsByKey, setLoggedSetsByKey] = useState<Record<string, SetLog[]>>({});
  const [isHydrating, setIsHydrating] = useState(true);
  const [missionCompleteVisible, setMissionCompleteVisible] = useState(false);
  const pendingMissionCompleteParams = useRef<{
    xpEarned: number;
    coinsEarned: number;
    leveledUp: boolean;
    newRank?: string;
  } | null>(null);

  const workoutDay = todaysMission
    ? selectedProgram === 'recon'
      ? getReconWorkoutDay(todaysMission.workout_day_id) ?? null
      : getWorkoutDay(todaysMission.workout_day_id) ?? null
    : null;

  const sectionInstances = useMemo(
    () =>
      workoutDay
        ? workoutDay.sections.map((section) => ({
            ...section,
            exerciseInstances: section.exercises
              .map((exerciseId, index) => {
                const exercise = getExerciseById(exerciseId);
                if (!exercise) {
                  return null;
                }
                const detail = exercise.reps
                  ? `${exercise.sets || 1} × ${exercise.reps} reps`
                  : exercise.duration_seconds
                  ? `${exercise.duration_seconds}s`
                  : exercise.distance || '';

                return {
                  instanceKey: `${section.id}:${index}:${exerciseId}`,
                  exerciseId,
                  exercise,
                  detail,
                } satisfies ExerciseInstance;
              })
              .filter((item): item is ExerciseInstance => item !== null),
          }))
        : [],
    [workoutDay]
  );

  const allExerciseInstances = useMemo(
    () => sectionInstances.flatMap((section) => section.exerciseInstances),
    [sectionInstances]
  );
  const trainingUnlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const monthlyPrice = getDisplayedMonthlyPrice(currentOffering);
  const exerciseInstanceMap = useMemo(
    () => new Map(allExerciseInstances.map((instance) => [instance.instanceKey, instance])),
    [allExerciseInstances]
  );
  const getRequiredSets = (instance: ExerciseInstance) => Math.max(1, instance.exercise.sets || 1);
  const isExerciseComplete = (instanceKey: string) => {
    const instance = exerciseInstanceMap.get(instanceKey);
    if (!instance) {
      return false;
    }
    return (loggedSetsByKey[instanceKey]?.length || 0) >= getRequiredSets(instance);
  };
  const totalExercises = allExerciseInstances.length;
  const completedCount = allExerciseInstances.filter((instance) => isExerciseComplete(instance.instanceKey)).length;
  const isPerfect = completedCount === totalExercises;
  const restExercise = restExerciseKey ? exerciseInstanceMap.get(restExerciseKey) ?? null : null;

  const getLoggedSummary = (instanceKey: string) => {
    const instance = exerciseInstanceMap.get(instanceKey);
    const loggedSets = loggedSetsByKey[instanceKey];
    if (!instance || !loggedSets || loggedSets.length === 0) {
      return null;
    }

    const requiredSets = getRequiredSets(instance);
    const totalReps = loggedSets.reduce((sum, set) => sum + (set.reps_completed ?? 0), 0);
    const totalDuration = loggedSets.reduce((sum, set) => sum + (set.duration_seconds ?? 0), 0);
    const distanceEntries = loggedSets
      .map((set) => set.distance?.trim())
      .filter((value): value is string => Boolean(value));

    const parts = [
      `${loggedSets.length}/${requiredSets} set${requiredSets === 1 ? '' : 's'} logged`,
    ];
    if (totalReps > 0) {
      parts.push(`${totalReps} reps`);
    }
    if (totalDuration > 0) {
      parts.push(`${totalDuration}s total`);
    }
    if (distanceEntries.length > 0) {
      parts.push(distanceEntries.length === 1 ? distanceEntries[0] : `${distanceEntries.length} distance entries`);
    }
    return parts.join(' · ');
  };

  useEffect(() => {
    let active = true;

    (async () => {
      await loadPersistedState();
      loadTodaysMission();
      if (active) {
        setIsHydrating(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [loadPersistedState, loadTodaysMission]);

  useEffect(() => {
    setStarted(false);
    setRestExerciseKey(null);
    setLogTarget(null);
    setLoggedSetsByKey({});
  }, [todaysMission?.date, todaysMission?.workout_day_id]);

  // Live workout progress notification
  useEffect(() => {
    if (started && totalExercises > 0 && completedCount > 0) {
      showWorkoutProgress(completedCount, totalExercises, workoutDay?.title ?? 'Mission');
      return;
    }

    clearWorkoutProgress();
  }, [started, completedCount, totalExercises, workoutDay?.title]);

  useEffect(() => {
    return () => {
      clearWorkoutProgress();
    };
  }, []);

  const handleStart = () => {
    hapticMedium();
    setStarted(true);
    startMission();
  };

  const toggleExercise = (instance: ExerciseInstance) => {
    if (!isExerciseComplete(instance.instanceKey)) {
      setLogTarget(instance);
      return;
    }
    Alert.alert(
      'Reset exercise?',
      'This will remove all logged sets for this exercise so you can record it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setLoggedSetsByKey((prev) => {
              if (!prev[instance.instanceKey]) {
                return prev;
              }
              const next = { ...prev };
              delete next[instance.instanceKey];
              return next;
            });
            if (restExerciseKey === instance.instanceKey) {
              setRestExerciseKey(null);
            }
          },
        },
      ]
    );
  };

  const handleRemoveLastLoggedSet = (instance: ExerciseInstance) => {
    setLoggedSetsByKey((prev) => {
      const current = prev[instance.instanceKey];
      if (!current || current.length === 0) {
        return prev;
      }
      const nextSets = current.slice(0, -1);
      if (nextSets.length === 0) {
        const next = { ...prev };
        delete next[instance.instanceKey];
        return next;
      }
      return {
        ...prev,
        [instance.instanceKey]: nextSets,
      };
    });
  };

  const handleLogSave = (instance: ExerciseInstance, setLog: SetLog) => {
    const currentSets = loggedSetsByKey[instance.instanceKey] || [];
    const nextSets = [...currentSets, setLog];
    const requiredSets = getRequiredSets(instance);
    const hasMoreSets = nextSets.length < requiredSets;

    setLoggedSetsByKey((prev) => ({
      ...prev,
      [instance.instanceKey]: nextSets,
    }));

    if (!hasMoreSets) {
      setLogTarget(null);
      setRestExerciseKey(null);
      return;
    }

    if (instance.exercise.rest_seconds > 0) {
      setLogTarget(null);
      setRestExerciseKey(instance.instanceKey);
      return;
    }

    setLogTarget(instance);
  };

  const handleRestComplete = () => {
    if (!restExerciseKey) {
      return;
    }

    const instance = exerciseInstanceMap.get(restExerciseKey) ?? null;
    setRestExerciseKey(null);

    if (instance && !isExerciseComplete(instance.instanceKey)) {
      setLogTarget(instance);
    }
  };

  const handleExerciseInfo = (exerciseId: string) => {
    navigation.navigate('ExerciseDetail', { exerciseId });
  };

  const handleFinish = () => {
    if (!todaysMission || !workoutDay) return;
    if (completedCount === 0) {
      Alert.alert('No exercises completed', 'Complete at least one exercise before finishing.');
      return;
    }

    const exercises: CompletedExercise[] = allExerciseInstances.reduce<CompletedExercise[]>(
      (acc, instance) => {
        if (!isExerciseComplete(instance.instanceKey)) {
          return acc;
        }
        const instanceKey = instance.instanceKey;
        if (!instance) {
          return acc;
        }
        const ex = instance.exercise;
        const loggedSets = loggedSetsByKey[instanceKey];
        const completedReps =
          loggedSets && loggedSets.some((set) => typeof set.reps_completed === 'number')
            ? loggedSets.reduce((sum, set) => sum + (set.reps_completed ?? 0), 0)
            : ex.reps;
        const completedSets = loggedSets?.length || ex.sets;
        const completedDuration =
          loggedSets && loggedSets.some((set) => typeof set.duration_seconds === 'number')
            ? loggedSets.reduce((sum, set) => sum + (set.duration_seconds ?? 0), 0)
            : ex.duration_seconds;
        const loggedDistances = loggedSets
          ?.map((set) => set.distance?.trim())
          .filter((value): value is string => Boolean(value));

        acc.push({
          exercise_id: instance.exerciseId,
          completed_reps: completedReps,
          completed_sets: completedSets,
          completed_duration_seconds: completedDuration,
          completed_distance:
            loggedDistances && loggedDistances.length > 0
              ? loggedDistances.length === 1
                ? loggedDistances[0]
                : loggedDistances.join(', ')
              : ex.distance,
          xp_earned: ex.xp_value || 0,
          is_personal_record: false,
        });
        return acc;
      },
      []
    );

    const totalExXP = exercises.reduce((s, e) => s + e.xp_earned, 0);
    const completionBonus = isPerfect ? workoutDay.rewards.xp : Math.floor(workoutDay.rewards.xp * 0.5);

    const mission: CompletedMission = {
      mission_date: todaysMission.date,
      workout_day_id: todaysMission.workout_day_id,
      exercises,
      total_xp: totalExXP,
      completion_bonus: completionBonus,
      is_perfect: isPerfect,
      has_personal_record: false,
      pr_bonus: 0,
      duration_minutes: Math.round(workoutDay.estimated_duration),
      completed_at: new Date().toISOString(),
    };

    completeMission(mission);
    finishMission();
    clearWorkoutProgress();
    const updatedProgress = useUserStore.getState().progress;
    void showWorkoutComplete(totalExXP + completionBonus, updatedProgress.streak_days);

    const newAchievementIds = checkAchievements();
    newAchievementIds.forEach((achievementId) => {
      const achievement = achievements.find((item) => item.id === achievementId);
      if (!achievement) {
        return;
      }
      void showAchievementUnlocked(achievement.name, achievement.icon);
    });

    // Celebratory dwell before navigation — confetti + haptic cascade.
    // Navigation is driven by LottieReward's onComplete so reduce-motion
    // users don't wait the full animation window unnecessarily.
    pendingMissionCompleteParams.current = {
      xpEarned: totalExXP + completionBonus,
      coinsEarned: workoutDay.rewards.coins,
      leveledUp: false,
      newRank: undefined,
    };
    setMissionCompleteVisible(true);
    void hapticLevelUp();
  };

  const handleMissionCompleteDone = () => {
    const params = pendingMissionCompleteParams.current;
    pendingMissionCompleteParams.current = null;
    setMissionCompleteVisible(false);
    if (params) {
      navigation.navigate('MissionComplete', params);
    }
  };

  if (isHydrating) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.emptyTitle}>Loading mission...</Text>
          <Text style={styles.emptySubtext}>Syncing today&apos;s training block.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedProgram) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No program selected</Text>
          <Text style={styles.emptySubtext}>
            Pick Raider or Recon before opening a daily mission.
          </Text>
          <View style={styles.emptyActions}>
            <MissionButton title="CHOOSE PROGRAM" onPress={() => navigation.replace('ProgramSelect')} />
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!trainingUnlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <GameIcon name="warning" size={48} color={colors.accentGold} style={styles.lockedIcon} />
          <Text style={styles.emptyTitle}>Training locked</Text>
          <Text style={styles.emptySubtext}>
            Your free access window has ended. Subscribe for {monthlyPrice} to keep running daily missions.
          </Text>
          <View style={styles.emptyActions}>
            <MissionButton title="UNLOCK GRUNTZ PRO" onPress={() => navigation.navigate('Paywall')} />
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isRestDay) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Recovery day</Text>
          <Text style={styles.emptySubtext}>
            There is no mission scheduled for today. Recover and come back ready.
          </Text>
          {nextWorkout ? (
            <View style={styles.nextWorkoutCard}>
              <Text style={styles.nextWorkoutLabel}>NEXT UP</Text>
              <Text style={styles.nextWorkoutTitle}>{nextWorkout.title}</Text>
              <Text style={styles.nextWorkoutSummary}>{nextWorkout.objective}</Text>
            </View>
          ) : null}
          <View style={styles.emptyActions}>
            <MissionButton title="BACK TO HOME" onPress={() => navigation.navigate('Home')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!todaysMission || !workoutDay) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Mission unavailable</Text>
          <Text style={styles.emptySubtext}>
            Today&apos;s mission did not load correctly. Reload it or head back home.
          </Text>
          <View style={styles.emptyActions}>
            <MissionButton title="RELOAD MISSION" onPress={loadTodaysMission} />
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (todaysMission.completed && !started) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <GameIcon name="check" size={48} color={colors.accentGreen} style={styles.lockedIcon} />
          <Text style={styles.emptyTitle}>Mission already completed</Text>
          <Text style={styles.emptySubtext}>
            You already cleared today&apos;s training block. Recover, review your progress, or come back tomorrow.
          </Text>
          <View style={styles.emptyActions}>
            <MissionButton title="BACK TO HOME" onPress={() => navigation.navigate('Home')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LottieReward type="mission_complete" visible={missionCompleteVisible} onComplete={handleMissionCompleteDone} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            width: '100%',
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomContentPadding,
          },
        ]}
      >
        {/* Pre-Start: Mission Header & Preview */}
        {!started && (
          <Animated.View style={[styles.heroSection, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
            <Text style={styles.missionLabel}>TODAY'S MISSION</Text>
            <Text style={styles.heroTitle} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{workoutDay.title}</Text>
            <Text style={styles.heroObjective}>{workoutDay.objective}</Text>

            {/* Mission Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <GameIcon name="time" size={24} color={colors.accent} variant="minimal" />
                <Text style={styles.statValue}>{workoutDay.estimated_duration}</Text>
                <Text style={styles.statLabel}>minutes</Text>
              </View>
              <View style={styles.statCard}>
                <GameIcon name="xp" size={24} color={colors.accentGold} variant="minimal" />
                <Text style={styles.statValue}>{workoutDay.rewards.xp}</Text>
                <Text style={styles.statLabel}>XP</Text>
              </View>
              <View style={styles.statCard}>
                <GameIcon name="strength" size={24} color={colors.accent} variant="minimal" />
                <Text style={styles.statValue}>{totalExercises}</Text>
                <Text style={styles.statLabel}>exercises</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Active Workout: Progress Bar */}
        {started && (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>WORKOUT PROGRESS</Text>
                <Text style={styles.progressPercent}>{Math.round((completedCount / totalExercises) * 100)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressCounter}>
                {completedCount} of {totalExercises} exercises
              </Text>
            </View>
          </>
        )}

        {!started ? (
          <View style={styles.actionWrap}>
            <MissionButton title="START MISSION" onPress={handleStart} style={{ marginVertical: spacing.lg }} />
          </View>
        ) : (
          <>
            {/* Sections with Glass Cards */}
            {sectionInstances.map((section) => (
              <View key={section.id} style={styles.sectionBlock}>
                <View style={styles.sectionTitleRow}>
                  <GameIcon name={sectionIcons[section.type]} size={20} color={colors.accent} variant="minimal" />
                  <View style={styles.sectionTextWrap}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionInstruction}>{section.instructions}</Text>
                  </View>
                </View>

                {/* Exercise Glass Cards */}
                <View style={styles.exercisesContainer}>
                  {section.exerciseInstances.map((instance) => {
                    const isComplete = isExerciseComplete(instance.instanceKey);
                    return (
                      <TouchableOpacity
                        key={instance.instanceKey}
                        onPress={() => toggleExercise(instance)}
                        activeOpacity={0.8}
                        style={styles.exerciseCardTouchable}
                      >
                        <View style={[styles.exerciseCard, isComplete && styles.exerciseCardComplete]}>
                          {/* Left: Icon */}
                          <View style={styles.exerciseIconWrap}>
                            <GameIcon
                              name={sectionIcons[section.type]}
                              size={32}
                              color={isComplete ? colors.accentGreen : colors.accent}
                              variant="minimal"
                            />
                          </View>

                          {/* Middle: Details */}
                          <View style={styles.exerciseDetailsWrap}>
                            <Text style={styles.exerciseName}>{instance.exercise.name}</Text>
                            <Text style={styles.exerciseDetail}>{instance.detail}</Text>
                            {getLoggedSummary(instance.instanceKey) && (
                              <Text style={styles.loggedSummary}>
                                {getLoggedSummary(instance.instanceKey)}
                              </Text>
                            )}
                          </View>

                          {/* Right: Completion Indicator */}
                          <View style={styles.completionIndicator}>
                            {isComplete ? (
                              <View style={styles.completedCheckCircle}>
                                <GameIcon name="check" size={20} color={colors.background} variant="minimal" />
                              </View>
                            ) : (
                              <View style={styles.incompleteCircle} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Finish Button */}
            <View style={styles.actionWrap}>
              <MissionButton
                title={isPerfect ? 'FINISH — PERFECT' : 'FINISH MISSION'}
                onPress={handleFinish}
                variant={isPerfect ? 'success' : 'primary'}
                style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}
              />
            </View>
          </>
        )}

        {/* Rest Timer Overlay */}
        {restExerciseKey && (
          <RestTimer
            seconds={restExercise?.exercise.rest_seconds || 60}
            exerciseName={restExercise?.exercise.name}
            loggedSummary={restExercise ? getLoggedSummary(restExercise.instanceKey) : null}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
        )}

        {/* Rep Log Modal */}
        {logTarget && (
          <RepLogModal
            exercise={logTarget.exercise}
            visible={!!logTarget}
            existingSets={loggedSetsByKey[logTarget.instanceKey] || []}
            onClose={() => setLogTarget(null)}
            onRemoveLast={
              (loggedSetsByKey[logTarget.instanceKey] || []).length > 0
                ? () => handleRemoveLastLoggedSet(logTarget)
                : undefined
            }
            onSave={(setLog) => handleLogSave(logTarget, setLog)}
          />
        )}
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
    width: '100%',
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  /* === HERO SECTION (Pre-Start) === */
  heroSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  missionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2.5,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 40,
  },
  heroObjective: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: `${colors.background}80`,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.accent,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'lowercase',
  },

  /* === PROGRESS SECTION (Active) === */
  progressSection: {
    width: '100%',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: `${colors.card}60`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressCounter: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },

  /* === SECTION BLOCK === */
  sectionBlock: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionInstruction: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    lineHeight: 18,
  },

  /* === EXERCISE CARDS === */
  exercisesContainer: {
    gap: spacing.md,
  },
  exerciseCardTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: `${colors.card}80`,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    minHeight: 100,
  },
  exerciseCardComplete: {
    backgroundColor: `${colors.accentGreen}15`,
    borderColor: colors.accentGreen,
  },
  exerciseIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
  },
  exerciseDetailsWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  loggedSummary: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  completionIndicator: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheckCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompleteCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: 'transparent',
  },

  /* === ACTION BUTTON === */
  actionWrap: {
    width: '100%',
  },

  /* === EMPTY STATES === */
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  lockedIcon: {
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  secondaryActionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  nextWorkoutCard: {
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  nextWorkoutLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  nextWorkoutTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  nextWorkoutSummary: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
