import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticSuccess, hapticSelection, hapticLight } from '../utils/haptics';
import { useFadeInDown } from '../utils/animations';
import type { Exercise, SetLog } from '../types';
import { GameIcon } from './GameIcon';

interface RepLogModalProps {
  visible: boolean;
  exercise: Exercise;
  onSave: (sets: SetLog[]) => void;
  onClose: () => void;
}

export function RepLogModal({ visible, exercise, onSave, onClose }: RepLogModalProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fadeIn = useFadeInDown(300);

  const targetSets = exercise.sets || 1;
  const [sets, setSets] = useState<SetLog[]>(
    Array.from({ length: targetSets }, (_, i) => ({
      set_number: i + 1,
      reps_completed: exercise.reps || undefined,
      duration_seconds: exercise.duration_seconds || undefined,
      distance: exercise.distance || undefined,
    }))
  );
  const [rpe, setRpe] = useState(7);

  const updateSet = (index: number, field: keyof SetLog, value: string) => {
    setSets(prev => {
      const updated = [...prev];
      const numValue = parseInt(value, 10);
      if (field === 'distance') {
        updated[index] = { ...updated[index], distance: value };
      } else if (!isNaN(numValue) && numValue >= 0) {
        updated[index] = { ...updated[index], [field]: numValue };
      }
      return updated;
    });
  };

  const addSet = () => {
    hapticLight();
    setSets(prev => [...prev, {
      set_number: prev.length + 1,
      reps_completed: exercise.reps || undefined,
      duration_seconds: exercise.duration_seconds || undefined,
    }]);
  };

  const removeSet = (index: number) => {
    if (sets.length <= 1) return;
    setSets(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_number: i + 1 })));
  };

  const handleSave = () => {
    hapticSuccess();
    onSave(sets.map(s => ({ ...s, rpe })));
  };

  const isTimeExercise = !!exercise.duration_seconds && !exercise.reps;
  const isDistanceExercise = !!exercise.distance && !exercise.reps && !exercise.duration_seconds;

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
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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
            {exercise.rest_seconds > 0 && (
              <View style={styles.restWrap}>
                <GameIcon name="time" size={16} color={colors.accent} variant="minimal" />
                <Text style={styles.restLabel}>{exercise.rest_seconds}s rest</Text>
              </View>
            )}
          </View>

          <ScrollView style={styles.setsList} showsVerticalScrollIndicator={false}>
            {sets.map((set, i) => (
              <View key={i} style={styles.setRow}>
                <View style={styles.setNumber}>
                  <Text style={styles.setNumberText}>{set.set_number}</Text>
                </View>
                {exercise.reps !== undefined && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>REPS</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      value={String(set.reps_completed || '')}
                      onChangeText={v => updateSet(i, 'reps_completed', v)}
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
                      value={String(set.duration_seconds || '')}
                      onChangeText={v => updateSet(i, 'duration_seconds', v)}
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
                      value={set.distance || ''}
                      onChangeText={v => updateSet(i, 'distance', v)}
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
                    value={set.weight_used ? String(set.weight_used) : ''}
                    onChangeText={v => updateSet(i, 'weight_used', v)}
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                {sets.length > 1 && (
                  <TouchableOpacity onPress={() => removeSet(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
            <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.addSetText}>ADD SET</Text>
          </TouchableOpacity>

          {/* RPE Selector */}
          <View style={styles.rpeSection}>
            <Text style={styles.rpeLabel}>EFFORT (RPE)</Text>
            <View style={styles.rpeRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.rpeDot, rpe === val && styles.rpeDotActive]}
                  onPress={() => { setRpe(val); hapticSelection(); }}
                >
                  <Text style={[styles.rpeDotText, rpe === val && styles.rpeDotTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.rpeDesc}>
              {rpe <= 3 ? 'Easy' : rpe <= 5 ? 'Moderate' : rpe <= 7 ? 'Hard' : rpe <= 9 ? 'Very Hard' : 'Max Effort'}
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>LOG EXERCISE</Text>
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
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
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
    borderRadius: 2,
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
    maxHeight: 200,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
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
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 2,
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
