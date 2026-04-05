import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { generateCustomPlan, GeneratedPlan, PlanDay, PlanExercise } from '../services/aiEngine';
import { hapticLight, hapticSuccess } from '../utils/haptics';

const DAYS_OPTIONS = [3, 4, 5, 6];

const GOAL_EXAMPLES = [
  'Get better at push-ups and pull-ups',
  'Run a faster 2-mile',
  'Build overall strength and endurance',
  'Prepare for a ruck march',
  'Lean out and improve body composition',
];

export default function PlanGeneratorScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useUserStore((s) => s.progress);

  const [goal, setGoal] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!goal.trim() || isGenerating) return;
    hapticLight();
    setIsGenerating(true);
    setPlan(null);

    try {
      const result = await generateCustomPlan(goal.trim(), progress, daysPerWeek);
      hapticSuccess();
      setPlan(result);
    } catch {
      setPlan(null);
    } finally {
      setIsGenerating(false);
    }
  }, [goal, daysPerWeek, progress, isGenerating]);

  const handleExampleTap = (example: string) => {
    hapticLight();
    setGoal(example);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Input section */}
        {!plan && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DESCRIBE YOUR GOAL</Text>
              <TextInput
                style={styles.goalInput}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g., I want to max my push-ups in 6 weeks"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TRAINING DAYS PER WEEK</Text>
              <View style={styles.daysRow}>
                {DAYS_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, d === daysPerWeek && styles.dayChipActive]}
                    onPress={() => { hapticLight(); setDaysPerWeek(d); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayChipText, d === daysPerWeek && styles.dayChipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.generateButton, (!goal.trim() || isGenerating) && styles.generateDisabled]}
              onPress={handleGenerate}
              disabled={!goal.trim() || isGenerating}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={colors.background} />
                  <Text style={styles.generateText}>GENERATE PLAN</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Examples */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TRY THESE</Text>
              {GOAL_EXAMPLES.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={styles.exampleChip}
                  onPress={() => handleExampleTap(ex)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exampleText}>{ex}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Plan output */}
        {plan && (
          <>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.planMeta}>
                <View style={styles.badge}><Text style={styles.badgeText}>{plan.difficulty.toUpperCase()}</Text></View>
                <View style={styles.badge}><Text style={styles.badgeText}>{plan.estimatedDuration}</Text></View>
              </View>
              <Text style={styles.planDesc}>{plan.description}</Text>
            </View>

            {plan.weeklySchedule.map((day: PlanDay, i: number) => (
              <View key={i} style={styles.dayCard}>
                <Text style={styles.dayTitle}>DAY {day.day} — {day.title.toUpperCase()}</Text>
                <Text style={styles.dayFocus}>{day.focus}</Text>
                {day.exercises.map((ex: PlanExercise, j: number) => (
                  <View key={j} style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseDetails}>
                        {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ''}
                        {ex.duration ? `${ex.duration}` : ''}
                        {ex.rest ? ` · ${ex.rest} rest` : ''}
                      </Text>
                    </View>
                    {ex.notes && <Text style={styles.exerciseNotes}>{ex.notes}</Text>}
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => { setPlan(null); setGoal(''); }}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={colors.accent} />
              <Text style={styles.resetText}>Generate Another Plan</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 120 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  goalInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayChip: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dayChipText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayChipTextActive: {
    color: colors.background,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  generateDisabled: { opacity: 0.4 },
  generateText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exampleText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  // Plan output
  planHeader: { marginBottom: spacing.lg },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  planDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  planMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.accent + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
  dayCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: 2,
  },
  dayFocus: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  exerciseRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  exerciseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    marginTop: spacing.md,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
