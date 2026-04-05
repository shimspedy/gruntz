import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface XPBarProps {
  current: number;
  required: number;
  level: number;
}

export function XPBar({ current, required, level }: XPBarProps) {
  const progress = required > 0 ? Math.min(current / required, 1) : 1;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.levelText}>LVL {level}</Text>
        <Text style={styles.xpText}>{current} / {required} XP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  track: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.xpBar,
    borderRadius: 4,
  },
});
