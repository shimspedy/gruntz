import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import { Card } from '../components/Card';
import { ExerciseRow } from '../components/ExerciseRow';
import { SectionHeader } from '../components/SectionHeader';
import { MissionButton } from '../components/MissionButton';
import { useMissionStore } from '../store/useMissionStore';
import { useUserStore } from '../store/useUserStore';
import { getWorkoutDay } from '../data/workouts';
import { getExerciseById } from '../data/exercises';
import type { CompletedExercise, CompletedMission } from '../types';
import type { HomeStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'DailyMission'>;

const sectionIcons: Record<string, string> = {
  warmup: '🔥',
  workout: '💪',
  cardio: '🏃',
  recovery: '🧘',
  test: '📋',
};

export default function DailyMissionScreen() {
  const navigation = useNavigation<Nav>();
  const { todaysMission, startMission, finishMission, isActive } = useMissionStore();
  const { completeMission, addXP, checkAchievements } = useUserStore();

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState(false);

  const workoutDay = todaysMission ? getWorkoutDay(todaysMission.workout_day_id) : null;

  const allExerciseIds: string[] = workoutDay
    ? workoutDay.sections.flatMap((s) => s.exercises)
    : [];
  const totalExercises = allExerciseIds.length;
  const completedCount = completedIds.size;
  const isPerfect = completedCount === totalExercises;

  const handleStart = () => {
    setStarted(true);
    startMission();
  };

  const toggleExercise = (exerciseId: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleFinish = () => {
    if (!todaysMission || !workoutDay) return;
    if (completedCount === 0) {
      Alert.alert('No exercises completed', 'Complete at least one exercise before finishing.');
      return;
    }

    const exercises: CompletedExercise[] = Array.from(completedIds).map((id) => {
      const ex = getExerciseById(id);
      return {
        exercise_id: id,
        completed_reps: ex?.reps,
        completed_sets: ex?.sets,
        completed_duration_seconds: ex?.duration_seconds,
        xp_earned: ex?.xp_value || 0,
        is_personal_record: false,
      };
    });

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
    const newAchievements = checkAchievements();

    navigation.navigate('MissionComplete', {
      xpEarned: totalExXP + completionBonus,
      coinsEarned: workoutDay.rewards.coins,
      leveledUp: false,
      newRank: undefined,
    });
  };

  if (!todaysMission || !workoutDay) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No mission loaded. Head back to Home.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Mission Header */}
        <View style={styles.header}>
          <Text style={styles.missionLabel}>TODAY'S MISSION</Text>
          <Text style={styles.title}>{workoutDay.title}</Text>
          <Text style={styles.objective}>{workoutDay.objective}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>⏱ {workoutDay.estimated_duration} min</Text>
            <Text style={styles.metaText}>⭐ {workoutDay.rewards.xp} XP</Text>
            <Text style={styles.metaText}>
              ✅ {completedCount}/{totalExercises}
            </Text>
          </View>
        </View>

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
          <MissionButton title="START MISSION" onPress={handleStart} style={{ marginVertical: spacing.lg }} />
        ) : (
          <>
            {/* Sections */}
            {workoutDay.sections.map((section) => (
              <View key={section.id}>
                <SectionHeader
                  title={section.title}
                  subtitle={section.instructions}
                  icon={sectionIcons[section.type]}
                />
                <Card>
                  {section.exercises.map((exId) => {
                    const ex = getExerciseById(exId);
                    if (!ex) return null;
                    const detail = ex.reps
                      ? `${ex.sets || 1} × ${ex.reps} reps`
                      : ex.duration_seconds
                      ? `${ex.duration_seconds}s`
                      : ex.distance || '';
                    return (
                      <ExerciseRow
                        key={exId}
                        name={ex.name}
                        detail={detail}
                        completed={completedIds.has(exId)}
                        onToggle={() => toggleExercise(exId)}
                      />
                    );
                  })}
                </Card>
              </View>
            ))}

            {/* Finish Button */}
            <MissionButton
              title={isPerfect ? '🏆 FINISH — PERFECT!' : 'FINISH MISSION'}
              onPress={handleFinish}
              variant={isPerfect ? 'success' : 'primary'}
              style={{ marginTop: spacing.xl }}
            />
          </>
        )}
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
    gap: spacing.md,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.md,
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
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
