import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import { hapticLight } from '../utils/haptics';
import { useFadeInUp } from '../utils/animations';
import type { ThemeColors } from '../theme';
import { Card } from '../components/Card';
import { getMovementCard } from '../data/movementCards';
import { getExerciseById } from '../data/exercises';
import type { MissionsStackParamList } from '../types/navigation';

type CardDetailRoute = RouteProp<MissionsStackParamList, 'CardDetail'>;
type Nav = NativeStackNavigationProp<MissionsStackParamList, 'CardDetail'>;

export default function CardDetailScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const heroAnim = useFadeInUp(500);
  const route = useRoute<CardDetailRoute>();
  const navigation = useNavigation<Nav>();
  const card = getMovementCard(route.params.cardId);

  if (!card) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Card not found.</Text>
      </SafeAreaView>
    );
  }

  const navigateToExercise = (exerciseId: string) => {
    hapticLight();
    navigation.navigate('ExerciseDetail', { exerciseId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: heroAnim.opacity, transform: heroAnim.transform }]}>
          <Text style={styles.icon}>{card.icon}</Text>
          <Text style={styles.cardLabel} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            {card.category === 'swim' ? 'SWIM' : 'MOVEMENT'} CARD #{card.card_number}
          </Text>
          <Text style={styles.cardName} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{card.name}</Text>
          <Text style={styles.description}>{card.description}</Text>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{card.estimated_duration}</Text>
            <Text style={styles.statLabel}>MIN</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{card.total_rounds}</Text>
            <Text style={styles.statLabel}>ROUNDS</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{card.sections.reduce((sum, s) => sum + s.exercises.length, 0)}</Text>
            <Text style={styles.statLabel}>EXERCISES</Text>
          </View>
          <View style={[styles.statPill, styles.diffPill]}>
            <Text style={[styles.statValue, { fontSize: 12 }]}>{card.difficulty.toUpperCase()}</Text>
            <Text style={styles.statLabel}>LEVEL</Text>
          </View>
        </View>

        {/* Muscle Groups */}
        <View style={styles.muscleRow}>
          {card.target_muscle_groups.map((group, i) => (
            <View key={i} style={styles.musclePill}>
              <Text style={styles.musclePillText}>{group}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        {card.sections.map((section) => (
          <View key={section.id} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionName}>{section.name}</Text>
              <View style={styles.sectionMeta}>
                <Text style={styles.sectionRounds}>{section.rounds} round{section.rounds > 1 ? 's' : ''}</Text>
                {section.rest_between_rounds && (
                  <Text style={styles.sectionRest}>⏱ {section.rest_between_rounds}s rest</Text>
                )}
              </View>
            </View>
            {section.notes && (
              <Text style={styles.sectionNotes}>{section.notes}</Text>
            )}
            <Card>
              {section.exercises.map((cardEx, i) => {
                const exercise = getExerciseById(cardEx.exercise_id);
                if (!exercise) return null;
                const detail = cardEx.prescribed_reps
                  ? `${cardEx.prescribed_sets || 1} × ${cardEx.prescribed_reps} reps`
                  : cardEx.prescribed_duration
                  ? `${cardEx.prescribed_duration}s`
                  : exercise.distance || '';
                return (
                  <TouchableOpacity
                    key={`${cardEx.exercise_id}_${i}`}
                    style={styles.exerciseRow}
                    activeOpacity={0.7}
                    onPress={() => navigateToExercise(cardEx.exercise_id)}
                  >
                    <Text style={styles.exIcon}>{exercise.illustration || '💪'}</Text>
                    <View style={styles.exInfo}>
                      <Text style={styles.exName}>{exercise.name}</Text>
                      <View style={styles.exDetailRow}>
                        {detail ? <Text style={styles.exDetail}>{detail}</Text> : null}
                        {exercise.rest_seconds > 0 && (
                          <Text style={styles.exRest}>⏱ {exercise.rest_seconds}s rest</Text>
                        )}
                      </View>
                      {cardEx.notes && (
                        <Text style={styles.exNotes}>{cardEx.notes}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        ))}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  errorText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  cardName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    backgroundColor: colors.card,
    borderRadius: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 65,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  diffPill: {
    borderColor: colors.accentGold,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  musclePill: {
    backgroundColor: colors.cardBorder,
    borderRadius: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  musclePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  sectionContainer: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  sectionRounds: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionRest: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  sectionNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    gap: spacing.md,
  },
  exIcon: {
    fontSize: 24,
  },
  exInfo: {
    flex: 1,
  },
  exName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  exDetailRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 2,
  },
  exDetail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  exRest: {
    fontSize: 12,
    color: colors.accent,
  },
  exNotes: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
