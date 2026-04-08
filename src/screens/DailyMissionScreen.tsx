import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFadeInUp } from '../utils/animations';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { ExerciseRow } from '../components/ExerciseRow';
import { SectionHeader } from '../components/SectionHeader';
import { MissionButton } from '../components/MissionButton';
import { GameIcon } from '../components/GameIcon';
import { RestTimer } from '../components/RestTimer';
import { RepLogModal } from '../components/RepLogModal';
import { useMissionStore } from '../store/useMissionStore';
import { useProgramStore } from '../store/useProgramStore';
import { useUserStore } from '../store/useUserStore';
import { getWorkoutDay } from '../data/workouts';
import { getReconWorkoutDay } from '../data/reconWorkouts';
import { getExerciseById } from '../data/exercises';
import { achievements } from '../data/achievements';
import { getDisplayedMonthlyPrice } from '../config/monetization';
import { hapticMedium } from '../utils/haptics';
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

    navigation.navigate('MissionComplete', {
      xpEarned: totalExXP + completionBonus,
      coinsEarned: workoutDay.rewards.coins,
      leveledUp: false,
      newRank: undefined,
    });
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            width: '100%',
            maxWidth: contentMaxWidth,
            alignSelf: 'center',
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        {/* Mission Header */}
        <Animated.View style={[styles.header, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <Text style={styles.missionLabel}>TODAY'S MISSION</Text>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{workoutDay.title}</Text>
          <Text style={styles.objective}>{workoutDay.objective}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <GameIcon name="time" size={18} color={colors.accent} variant="minimal" />
              <Text style={styles.metaText}>{workoutDay.estimated_duration} min</Text>
            </View>
            <View style={styles.metaChip}>
              <GameIcon name="xp" size={18} color={colors.accentGold} variant="minimal" />
              <Text style={styles.metaText}>{workoutDay.rewards.xp} XP</Text>
            </View>
            <View style={styles.metaChip}>
              <GameIcon name="check" size={18} color={colors.accentGreen} variant="minimal" />
              <Text style={styles.metaText}>{completedCount}/{totalExercises}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}%` },
            ]}
          />
        </View>

        {!started ? (
          <View style={styles.actionWrap}>
            <MissionButton title="START MISSION" onPress={handleStart} style={{ marginVertical: spacing.lg }} />
          </View>
        ) : (
          <>
            {/* Sections */}
            {sectionInstances.map((section) => (
              <View key={section.id} style={styles.sectionBlock}>
                <SectionHeader
                  title={section.title}
                  subtitle={section.instructions}
                  icon={sectionIcons[section.type]}
                />
                <Card style={styles.sectionCard}>
                  {section.exerciseInstances.map((instance) => {
                    return (
                      <ExerciseRow
                        key={instance.instanceKey}
                        name={instance.exercise.name}
                        detail={instance.detail}
                        completed={isExerciseComplete(instance.instanceKey)}
                        onToggle={() => toggleExercise(instance)}
                        restSeconds={instance.exercise.rest_seconds}
                        illustration={instance.exercise.illustration}
                        onInfo={() => handleExerciseInfo(instance.exerciseId)}
                        loggedSummary={getLoggedSummary(instance.instanceKey)}
                      />
                    );
                  })}
                </Card>
              </View>
            ))}

            {/* Finish Button */}
            <View style={styles.actionWrap}>
              <MissionButton
                title={isPerfect ? 'FINISH — PERFECT' : 'FINISH MISSION'}
                onPress={handleFinish}
                variant={isPerfect ? 'success' : 'primary'}
                style={{ marginTop: spacing.xl }}
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
  header: {
    width: '100%',
    marginBottom: spacing.md,
  },
  missionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  objective: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  sectionBlock: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  sectionCard: {
    width: '100%',
  },
  actionWrap: {
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentGreen,
    borderRadius: 3,
  },
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
  },
  nextWorkoutLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: spacing.xs,
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
