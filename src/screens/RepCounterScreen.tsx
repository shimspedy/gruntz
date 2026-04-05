import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { useRepCounter, getRepPreset } from '../hooks/useRepCounter';
import { useFormDetection, FormWarning } from '../hooks/useFormDetection';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const EXERCISE_OPTIONS = [
  { name: 'Push-Ups', icon: '💪', formType: 'push-up' as const },
  { name: 'Sit-Ups', icon: '🔥', formType: 'general' as const },
  { name: 'Squats', icon: '🦵', formType: 'squat' as const },
  { name: 'Pull-Ups', icon: '🏋️', formType: 'general' as const },
  { name: 'Burpees', icon: '⚡', formType: 'general' as const },
  { name: 'Lunges', icon: '🎯', formType: 'general' as const },
];

export default function RepCounterScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_OPTIONS[0]);
  const [targetReps, setTargetReps] = useState<number | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);

  const preset = getRepPreset(selectedExercise.name);
  const repCounter = useRepCounter(preset);
  const formDetection = useFormDetection({ exerciseType: selectedExercise.formType });

  const handleStart = useCallback(async () => {
    hapticMedium();
    setSessionComplete(false);
    await repCounter.start();
    await formDetection.start();
  }, [repCounter, formDetection]);

  const handleStop = useCallback(() => {
    hapticSuccess();
    repCounter.stop();
    formDetection.stop();
    setSessionComplete(true);
  }, [repCounter, formDetection]);

  const handleReset = useCallback(() => {
    hapticLight();
    repCounter.reset();
    formDetection.reset();
    setSessionComplete(false);
  }, [repCounter, formDetection]);

  const handleSelectExercise = (ex: typeof EXERCISE_OPTIONS[0]) => {
    if (repCounter.isActive) {
      Alert.alert('Stop First', 'Stop the current session before switching exercises.');
      return;
    }
    hapticLight();
    setSelectedExercise(ex);
    setSessionComplete(false);
  };

  const targetOptions = [10, 15, 20, 25, 30, 50];

  // Stability color
  const stabilityColor = formDetection.stabilityScore >= 80
    ? colors.accentGreen
    : formDetection.stabilityScore >= 50
      ? colors.accentGold
      : '#FF4444';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Exercise selector */}
        <View style={styles.exerciseRow}>
          {EXERCISE_OPTIONS.map((ex) => (
            <TouchableOpacity
              key={ex.name}
              style={[styles.exerciseChip, selectedExercise.name === ex.name && styles.exerciseChipActive]}
              onPress={() => handleSelectExercise(ex)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseIcon}>{ex.icon}</Text>
              <Text style={[
                styles.exerciseChipText,
                selectedExercise.name === ex.name && styles.exerciseChipTextActive,
              ]}>{ex.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target reps (optional) */}
        {!repCounter.isActive && !sessionComplete && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TARGET (OPTIONAL)</Text>
            <View style={styles.targetRow}>
              {targetOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.targetChip, targetReps === t && styles.targetChipActive]}
                  onPress={() => { hapticLight(); setTargetReps(targetReps === t ? null : t); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.targetText, targetReps === t && styles.targetTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Big rep counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterLabel}>{selectedExercise.name.toUpperCase()}</Text>
          <Text style={styles.counter}>{repCounter.reps}</Text>
          {targetReps && (
            <Text style={styles.targetLabel}>/ {targetReps}</Text>
          )}
        </View>

        {/* Progress bar to target */}
        {targetReps && repCounter.isActive && (
          <View style={styles.progressBarBg}>
            <View style={[
              styles.progressBarFill,
              { width: `${Math.min(100, (repCounter.reps / targetReps) * 100)}%` },
            ]} />
          </View>
        )}

        {/* Form stability meter */}
        {(repCounter.isActive || sessionComplete) && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Ionicons name="body-outline" size={18} color={colors.textMuted} />
              <Text style={styles.formTitle}>FORM QUALITY</Text>
            </View>

            <View style={styles.stabilityRow}>
              <View style={styles.stabilityMeterBg}>
                <View style={[
                  styles.stabilityMeterFill,
                  { width: `${formDetection.stabilityScore}%`, backgroundColor: stabilityColor },
                ]} />
              </View>
              <Text style={[styles.stabilityScore, { color: stabilityColor }]}>
                {formDetection.stabilityScore}
              </Text>
            </View>

            {/* Warnings */}
            {formDetection.warnings.length > 0 && (
              <View style={styles.warningsList}>
                {formDetection.warnings.slice(-3).map((w: FormWarning, i: number) => (
                  <View key={i} style={styles.warningRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.accentGold} />
                    <Text style={styles.warningText}>{w.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Session summary */}
        {sessionComplete && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>SESSION COMPLETE</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exercise</Text>
              <Text style={styles.summaryValue}>{selectedExercise.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reps Counted</Text>
              <Text style={styles.summaryValue}>{repCounter.reps}</Text>
            </View>
            {targetReps && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target</Text>
                <Text style={styles.summaryValue}>
                  {repCounter.reps >= targetReps ? '✅ Hit!' : `${targetReps - repCounter.reps} short`}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Form Score</Text>
              <Text style={[styles.summaryValue, { color: stabilityColor }]}>
                {formDetection.stabilityScore}/100
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Form Warnings</Text>
              <Text style={styles.summaryValue}>{formDetection.warningCount}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {!repCounter.isActive && !sessionComplete ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
            <Ionicons name="fitness" size={24} color={colors.background} />
            <Text style={styles.startText}>START COUNTING</Text>
          </TouchableOpacity>
        ) : repCounter.isActive ? (
          <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
            <Ionicons name="stop" size={24} color={colors.background} />
            <Text style={styles.controlText}>STOP</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.accent} />
            <Text style={styles.resetText}>New Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 140 },
  exerciseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseChipActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  exerciseIcon: { fontSize: 14 },
  exerciseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  exerciseChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  targetChip: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  targetChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  targetText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  targetTextActive: {
    color: colors.background,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
    marginBottom: 8,
  },
  counter: {
    fontSize: 96,
    fontWeight: '800',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    lineHeight: 100,
  },
  targetLabel: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textMuted,
    marginTop: -8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.card,
    borderRadius: 3,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  stabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stabilityMeterBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stabilityMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  stabilityScore: {
    fontSize: 18,
    fontWeight: '800',
    width: 36,
    textAlign: 'right',
  },
  warningsList: {
    marginTop: spacing.sm,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  warningText: {
    fontSize: 12,
    color: colors.accentGold,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    borderTopWidth: 3,
    borderTopColor: colors.accent,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    padding: spacing.md,
    paddingBottom: 100,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  startText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 14,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  controlText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
