import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface ExerciseRowProps {
  name: string;
  detail: string;
  completed: boolean;
  onToggle: () => void;
  restSeconds?: number;
  illustration?: string;
  onInfo?: () => void;
}

export function ExerciseRow({ name, detail, completed, onToggle, restSeconds, illustration, onInfo }: ExerciseRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed && <Ionicons name="checkmark" size={16} color="#000" />}
      </View>
      {illustration && <Text style={styles.illustration}>{illustration}</Text>}
      <View style={styles.info}>
        <Text style={[styles.name, completed && styles.nameCompleted]}>{name}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detail}>{detail}</Text>
          {restSeconds && restSeconds > 0 ? (
            <Text style={styles.restLabel}>⏱ {restSeconds}s</Text>
          ) : null}
        </View>
      </View>
      {completed && <Text style={styles.xpBadge}>+XP</Text>}
      {onInfo && (
        <TouchableOpacity onPress={onInfo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      )}
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
    marginRight: spacing.sm,
  },
  checkboxCompleted: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  illustration: {
    fontSize: 20,
    marginRight: spacing.sm,
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  detail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  restLabel: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  xpBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGold,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
});
