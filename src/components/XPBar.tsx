import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { useAnimatedFill } from '../utils/animations';

interface XPBarProps {
  current: number;
  required: number;
  level: number;
}

/**
 * Premium XP bar with animated gradient fill, level badge, and glow effect.
 */
export function XPBar({ current, required, level }: XPBarProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const progress = required > 0 ? Math.min(current / required, 1) : 1;
  const fillProgress = useAnimatedFill(progress);

  const animatedFillStyle = {
    width: fillProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  return (
    <View style={styles.container}>
      {/* Label row with level badge and XP text */}
      <View style={styles.labelRow}>
        <View style={[styles.levelBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.levelText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            LVL {level}
          </Text>
        </View>
        <Text style={styles.xpText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
          {current} / {required} XP
        </Text>
      </View>

      {/* XP bar track with animated fill */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            animatedFillStyle,
            {
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            },
          ]}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    levelBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    levelText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.background,
      letterSpacing: 0.8,
    },
    xpText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    track: {
      height: 8,
      backgroundColor: colors.cardBorder,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.xpBar,
      borderRadius: borderRadius.full,
      elevation: 3,
    },
  });
