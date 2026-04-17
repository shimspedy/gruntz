import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticSuccess, hapticSelection, hapticLight } from '../utils/haptics';
import { useFadeInDown } from '../utils/animations';
import type { Exercise, SetLog } from '../types';
import { GameIcon } from './GameIcon';

interface RepLogModalProps {
  visible: boolean;
  exercise: Exercise;
  existingSets?: SetLog[];
  onSave: (set: SetLog) => void;
  onRemoveLast?: () => void;
  onClose: () => void;
}

type DraftSet = {
  reps_completed?: number;
  weight_used?: number;
  duration_seconds?: number;
  distance?: string;
};

export function RepLogModal({
  visible,
  exercise,
  existingSets = [],
  onSave,
  onRemoveLast,
  onClose,
}: RepLogModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fadeIn = useFadeInDown(300);

  const targetSets = exercise.sets || 1;
  const currentSetNumber = Math.min(existingSets.length + 1, targetSets);
  const isFinalSet = currentSetNumber >= targetSets;
  const hasLoggedSets = existingSets.length > 0;
  const [draftSet, setDraftSet] = useState<DraftSet>({
    reps_completed: exercise.reps || undefined,
    duration_seconds: exercise.duration_seconds || undefined,
    distance: exercise.distance || undefined,
  });
  const [rpe, setRpe] = useState(7);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setDraftSet({
      reps_completed: exercise.reps || undefined,
      duration_seconds: exercise.duration_seconds || undefined,
      distance: exercise.distance || undefined,
    });
    setRpe(existingSets.at(-1)?.rpe ?? 7);
    setValidationError(null);
  }, [exercise.id, existingSets.length, visible, exercise.reps, exercise.duration_seconds, exercise.distance]);

  const updateDraft = (field: keyof DraftSet, value: string) => {
    setValidationError(null);
    setDraftSet((prev) => {
      if (field === 'distance') {
        return { ...prev, distance: value };
      }

      if (value.trim() === '') {
        return { ...prev, [field]: undefined };
      }

      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        return { ...prev, [field]: numValue };
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (exercise.reps !== undefined && (!draftSet.reps_completed || draftSet.reps_completed <= 0)) {
      setValidationError('Enter reps for this set.');
      return;
    }
    if (isTimeExercise && (!draftSet.duration_seconds || draftSet.duration_seconds <= 0)) {
      setValidationError('Enter seconds for this set.');
      return;
    }
    if (isDistanceExercise && !draftSet.distance?.trim()) {
      setValidationError('Enter a distance for this set.');
      return;
    }

    setValidationError(null);
    hapticSuccess();
    onSave({
      set_number: currentSetNumber,
      ...draftSet,
      rpe,
    });
  };

  const isTimeExercise = !!exercise.duration_seconds && !exercise.reps;
  const isDistanceExercise = !!exercise.distance && !exercise.reps && !exercise.duration_seconds;
  const saveLabel = exercise.rest_seconds > 0 && !isFinalSet ? 'LOG SET & START REST' : isFinalSet ? 'LOG FINAL SET' : `LOG SET ${currentSetNumber}`;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <BlurView intensity={40} tint="dark" style={styles.overlay}>
        <Animated.View style={[styles.modal, { opacity: fadeIn.opacity, transform: fadeIn.transform }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <GameIcon name={exercise.illustration || exercise.category} size={44} color={colors.accent} style={styles.illustration} />
              <View>
                <Text style={styles.title}>{exercise.name}</Text>
                <Text style={styles.category}>{exercise.category.toUpperCase()}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close set logger"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Target info */}
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>TARGET:</Text>
            <Text style={styles.targetValue}>
              {exercise.reps ? `${exercise.sets || 1} × ${exercise.reps} reps` : ''}
              {exercise.duration_seconds ? `${exercise.duration_seconds}s` : ''}
              {exercise.distance ? ` ${exercise.distance}` : ''}
            </Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                SET {currentSetNumber}/{targetSets}
              </Text>
            </View>
            {exercise.rest_seconds > 0 && (
              <View style={styles.restWrap}>
                <GameIcon name="time" size={16} color={colors.accent} variant="minimal" />
                <Text style={styles.restLabel}>{exercise.rest_seconds}s rest</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.setsList} showsVerticalScrollIndicator={false}>
            {hasLoggedSets ? (
              <View style={styles.loggedBlock}>
                <View style={styles.loggedHeader}>
                  <Text style={styles.loggedTitle}>LOGGED SETS</Text>
                  {onRemoveLast ? (
                    <TouchableOpacity
                      style={styles.removeLastBtn}
                      onPress={() => {
                        hapticLight();
                        onRemoveLast();
                      }}
                    >
                      <Ionicons name="arrow-undo" size={14} color={colors.textMuted} />
                      <Text style={styles.removeLastText}>REMOVE LAST</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {existingSets.map((set) => (
                  <View key={set.set_number} style={styles.loggedSetRow}>
                    <View style={styles.loggedSetBadge}>
                      <Text style={styles.loggedSetBadgeText}>#{set.set_number}</Text>
                    </View>
                    <Text style={styles.loggedSetText}>
                      {exercise.reps !== undefined ? `${set.reps_completed ?? exercise.reps} reps` : ''}
                      {isTimeExercise ? `${set.duration_seconds ?? exercise.duration_seconds}s` : ''}
                      {isDistanceExercise ? set.distance || exercise.distance || 'Distance logged' : ''}
                      {set.weight_used ? ` • ${set.weight_used} lb` : ''}
                      {set.rpe ? ` • RPE ${set.rpe}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.currentSetCard}>
              <Text style={styles.currentSetLabel}>CURRENT SET</Text>
              <View style={styles.setRow}>
                <View style={styles.setNumber}>
                  <Text style={styles.setNumberText}>{currentSetNumber}</Text>
                </View>
                {exercise.reps !== undefined && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>REPS</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={draftSet.reps_completed ? String(draftSet.reps_completed) : ''}
                      onChangeText={(v) => updateDraft('reps_completed', v)}
                      placeholder={String(exercise.reps)}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )}
                {isTimeExercise && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SECONDS</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={draftSet.duration_seconds ? String(draftSet.duration_seconds) : ''}
                      onChangeText={(v) => updateDraft('duration_seconds', v)}
                      placeholder={String(exercise.duration_seconds)}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )}
                {isDistanceExercise && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>DISTANCE</Text>
                    <TextInput
                      style={styles.input}
                      value={draftSet.distance || ''}
                      onChangeText={(v) => updateDraft('distance', v)}
                      placeholder={exercise.distance}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                )}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WEIGHT</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={draftSet.weight_used ? String(draftSet.weight_used) : ''}
                    onChangeText={(v) => updateDraft('weight_used', v)}
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* RPE Selector — scrollable so the save button below stays pinned */}
            <View style={styles.rpeSection}>
              <Text style={styles.rpeLabel}>EFFORT (RPE)</Text>
              <View style={styles.rpeRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.rpeDot, rpe === val && styles.rpeDotActive]}
                    onPress={() => { setRpe(val); hapticSelection(); }}
                    hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: rpe === val }}
                    accessibilityLabel={`RPE ${val}`}
                  >
                    <Text style={[styles.rpeDotText, rpe === val && styles.rpeDotTextActive]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.rpeDesc}>
                {rpe <= 3 ? 'Easy' : rpe <= 5 ? 'Moderate' : rpe <= 7 ? 'Hard' : rpe <= 9 ? 'Very Hard' : 'Max Effort'}
              </Text>
            </View>
          </ScrollView>

          {validationError ? <Text style={styles.validationError}>{validationError}</Text> : null}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {saveLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  illustration: {
    marginRight: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.sm,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.accentGold,
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 999,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  restLabel: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  restWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setsList: {
    maxHeight: 280,
  },
  loggedBlock: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  loggedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  loggedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.4,
  },
  removeLastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeLastText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  loggedSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  loggedSetBadge: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.cardBorder,
  },
  loggedSetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loggedSetText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  currentSetCard: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  currentSetLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.4,
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontVariant: ['tabular-nums'],
  },
  rpeSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rpeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  rpeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  rpeDot: {
    width: 30,
    height: 30,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeDotActive: {
    backgroundColor: colors.accent,
  },
  rpeDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rpeDotTextActive: {
    color: colors.background,
  },
  rpeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  validationError: {
    marginBottom: spacing.md,
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentRed,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1.5,
  },
});
