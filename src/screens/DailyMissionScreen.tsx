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
import { hapticMedium } from '../utils/haptics';
import { showWorkoutProgress, clearWorkoutProgress, showWorkoutComplete } from '../services/notifications';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import type { CompletedExercise, CompletedMission, Exercise } from '../types';
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

  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState(false);
  const [missionStartTime] = useState(() => new Date());
  const [restExerciseKey, setRestExerciseKey] = useState<string | null>(null);
  const [logTarget, setLogTarget] = useState<ExerciseInstance | null>(null);
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
  const exerciseInstanceMap = useMemo(
    () => new Map(allExerciseInstances.map((instance) => [instance.instanceKey, instance])),
    [allExerciseInstances]
  );
  const totalExercises = allExerciseInstances.length;
  const completedCount = completedKeys.size;
  const isPerfect = completedCount === totalExercises;

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

  // Live workout progress notification
  useEffect(() => {
    if (started && totalExercises > 0 && completedCount > 0) {
      showWorkoutProgress(completedCount, totalExercises, workoutDay?.title ?? 'Mission');
    }
  }, [started, completedCount, totalExercises]);

  const handleStart = () => {
    hapticMedium();
    setStarted(true);
    startMission();
  };

  const toggleExercise = (instance: ExerciseInstance) => {
    if (!completedKeys.has(instance.instanceKey)) {
      // Opening rep log modal for logging
      setLogTarget(instance);
      return;
    }
    // Un-toggle
    setCompletedKeys((prev) => {
      const next = new Set(prev);
      next.delete(instance.instanceKey);
      return next;
    });
  };

  const handleLogSave = (instance: ExerciseInstance) => {
    setCompletedKeys((prev) => {
      const next = new Set(prev);
      next.add(instance.instanceKey);
      return next;
    });
    setLogTarget(null);
    // Start rest timer if exercise has rest
    if (instance.exercise.rest_seconds > 0) {
      setRestExerciseKey(instance.instanceKey);
    }
  };

  const handleRestComplete = () => {
    setRestExerciseKey(null);
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

    const exercises: CompletedExercise[] = Array.from(completedKeys).reduce<CompletedExercise[]>(
      (acc, instanceKey) => {
        const instance = exerciseInstanceMap.get(instanceKey);
        if (!instance) {
          return acc;
        }
        const ex = instance.exercise;
        acc.push({
          exercise_id: instance.exerciseId,
          completed_reps: ex.reps,
          completed_sets: ex.sets,
          completed_duration_seconds: ex.duration_seconds,
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
    showWorkoutComplete(totalExXP + completionBonus, 0);

    const newAchievements = checkAchievements();

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
                        completed={completedKeys.has(instance.instanceKey)}
                        onToggle={() => toggleExercise(instance)}
                        restSeconds={instance.exercise.rest_seconds}
                        illustration={instance.exercise.illustration}
                        onInfo={() => handleExerciseInfo(instance.exerciseId)}
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
            seconds={exerciseInstanceMap.get(restExerciseKey)?.exercise.rest_seconds || 60}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
        )}

        {/* Rep Log Modal */}
        {logTarget && (
          <RepLogModal
            exercise={logTarget.exercise}
            visible={!!logTarget}
            onClose={() => setLogTarget(null)}
            onSave={() => handleLogSave(logTarget)}
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
