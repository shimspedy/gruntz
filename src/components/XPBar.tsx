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
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LVL {level}</Text>
        </View>
        <Text style={styles.xpText}>{current} / {required} XP</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        {/* Tick marks */}
        <View style={[styles.tick, { left: '25%' }]} />
        <View style={[styles.tick, { left: '50%' }]} />
        <View style={[styles.tick, { left: '75%' }]} />
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
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  levelBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.xpBar,
    borderRadius: 1,
  },
  tick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%',
    backgroundColor: colors.background,
    opacity: 0.3,
  },
});
