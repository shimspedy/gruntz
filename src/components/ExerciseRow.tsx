import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface ExerciseRowProps {
  name: string;
  detail: string;
  completed: boolean;
  onToggle: () => void;
}

export function ExerciseRow({ name, detail, completed, onToggle }: ExerciseRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed && <Ionicons name="checkmark" size={16} color="#000" />}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, completed && styles.nameCompleted]}>{name}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {completed && <Text style={styles.xpBadge}>+XP</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  detail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  xpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGold,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
