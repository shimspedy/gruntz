import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';

interface XPBarProps {
  current: number;
  required: number;
  level: number;
}

export function XPBar({ current, required, level }: XPBarProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const progress = required > 0 ? Math.min(current / required, 1) : 1;
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>LVL {level}</Text>
        </View>
        <Text style={styles.xpText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{current} / {required} XP</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedFillStyle]} />
        {/* Tick marks */}
        <View style={[styles.tick, { left: '25%' }]} />
        <View style={[styles.tick, { left: '50%' }]} />
        <View style={[styles.tick, { left: '75%' }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
