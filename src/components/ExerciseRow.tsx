import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticLight, hapticDoubleTap } from '../utils/haptics';
import { GameIcon } from './GameIcon';

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleToggle = useCallback(() => {
    if (!completed) {
      hapticDoubleTap();
    } else {
      hapticLight();
    }
    onToggle();
  }, [onToggle, completed]);

  return (
    <TouchableOpacity style={styles.row} onPress={handleToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed && <Ionicons name="checkmark" size={16} color={colors.background} />}
      </View>
      {illustration ? <GameIcon name={illustration} size={26} style={styles.illustration} /> : null}
      <View style={styles.info}>
        <Text style={[styles.name, completed && styles.nameCompleted]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{name}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detail}>{detail}</Text>
          {restSeconds && restSeconds > 0 ? (
            <View style={styles.restWrap}>
              <GameIcon name="time" size={16} color={colors.accent} variant="minimal" />
              <Text style={styles.restLabel}>{restSeconds}s</Text>
            </View>
          ) : null}
        </View>
      </View>
      {completed && (
        <View style={styles.xpBadge}>
          <GameIcon name="xp" size={16} color={colors.accentGold} variant="minimal" animated={false} />
          <Text style={styles.xpBadgeText}>+XP</Text>
        </View>
      )}
      {onInfo && (
        <TouchableOpacity onPress={onInfo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="information-circle-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    borderRadius: 3,
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
  restWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restLabel: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentGold,
  },
});
