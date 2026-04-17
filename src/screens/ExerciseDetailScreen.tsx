import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import { hapticMedium } from '../utils/haptics';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { GameIcon } from '../components/GameIcon';
import { MissionButton } from '../components/MissionButton';
import { RepLogModal } from '../components/RepLogModal';
import { getExerciseById } from '../data/exercises';
import type { HomeStackParamList } from '../types/navigation';
import type { SetLog } from '../types';

type ExerciseDetailRoute = RouteProp<HomeStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const route = useRoute<ExerciseDetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const exercise = getExerciseById(route.params.exerciseId);
  const [showLogModal, setShowLogModal] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomContentPadding = Math.max(spacing.xxl, tabBarHeight + insets.bottom + spacing.lg);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyContainer}>
          <Text style={styles.errorTitle}>Exercise unavailable</Text>
          <Text style={styles.errorText}>
            This exercise could not be loaded. Go back and reopen it from the mission or card list.
          </Text>
          <MissionButton title="GO BACK" onPress={() => navigation.goBack()} style={styles.errorButton} />
        </View>
      </SafeAreaView>
    );
  }

  const handleLog = (_set: SetLog) => {
    setShowLogModal(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: bottomContentPadding }]}>
        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <GameIcon name={exercise.illustration || exercise.category} size={84} color={colors.accent} style={styles.illustration} />
          <Text style={styles.name} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{exercise.name}</Text>
          <Text style={styles.category} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{exercise.category.toUpperCase()}</Text>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {exercise.sets && (
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{exercise.sets}</Text>
              <Text style={styles.statLabel}>SETS</Text>
            </View>
          )}
          {exercise.reps && (
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{exercise.reps}</Text>
              <Text style={styles.statLabel}>REPS</Text>
            </View>
          )}
          {exercise.duration_seconds && (
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{exercise.duration_seconds}s</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
          )}
          {exercise.distance && (
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{exercise.distance}</Text>
              <Text style={styles.statLabel}>DIST</Text>
            </View>
          )}
          {exercise.rest_seconds > 0 && (
            <View style={[styles.statPill, styles.restPill]}>
              <Text style={[styles.statValue, styles.restValue]}>{exercise.rest_seconds}s</Text>
              <Text style={styles.statLabel}>REST</Text>
            </View>
          )}
          <View style={styles.statPill}>
            <Text style={[styles.statValue, { color: colors.accentGold }]}>{exercise.xp_value}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>

        {/* Description */}
        <Card title="Description">
          <Text style={styles.description}>{exercise.description}</Text>
        </Card>

        {/* Step-by-Step */}
        {exercise.steps && exercise.steps.length > 0 && (
          <Card title="How To Perform">
            {exercise.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Form Tips */}
        {exercise.form_tips.length > 0 && (
          <Card title="Form Tips">
            {exercise.form_tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Muscle Groups */}
        {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
          <Card title="Muscle Groups">
            <View style={styles.pillRow}>
              {exercise.muscle_groups.map((group, i) => (
                <View key={i} style={styles.musclePill}>
                  <Text style={styles.musclePillText}>{group}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <Card title="Equipment Needed">
            {exercise.equipment.map((eq, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="barbell-outline" size={18} color={colors.accent} />
                <Text style={styles.tipText}>{eq}</Text>
              </View>
            ))}
            <Text style={styles.equipmentAccess}>
              Access level: {exercise.equipment_access.toUpperCase()}
            </Text>
          </Card>
        )}

        {/* Progression */}
        {exercise.progression_rules && (
          <Card title="Progression">
            <Text style={styles.description}>
              Increase by{' '}
              {exercise.progression_rules.increment_reps
                ? `${exercise.progression_rules.increment_reps} reps`
                : exercise.progression_rules.increment_duration
                ? `${exercise.progression_rules.increment_duration} seconds`
                : `${exercise.progression_rules.increment_sets} sets`}
              {' '}every {exercise.progression_rules.frequency}.
            </Text>
          </Card>
        )}

        {/* Log Button */}
        <TouchableOpacity style={styles.logBtn} onPress={() => { hapticMedium(); setShowLogModal(true); }}>
          <Text style={styles.logBtnText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>LOG THIS EXERCISE</Text>
        </TouchableOpacity>
      </ScrollView>

      {showLogModal && (
        <RepLogModal
          visible={showLogModal}
          exercise={exercise}
          onSave={handleLog}
          onClose={() => setShowLogModal(false)}
        />
      )}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
  errorButton: {
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.md,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  illustration: {
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statPill: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  restPill: {
    borderColor: colors.accent,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  restValue: {
    color: colors.accent,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.background,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  musclePill: {
    backgroundColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  musclePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  equipmentAccess: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  logBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1.5,
  },
});
