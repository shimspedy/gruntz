import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
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
 * Pulses glow + bumps level badge when level increments.
 */
export function XPBar({ current, required, level }: XPBarProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const progress = required > 0 ? Math.min(current / required, 1) : 1;
  const fillProgress = useAnimatedFill(progress);

  const levelPulse = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;
  const prevLevel = useRef<number | null>(null);

  useEffect(() => {
    if (prevLevel.current !== null && level > prevLevel.current) {
      Animated.sequence([
        Animated.timing(levelPulse, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(levelPulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: 1.28, damping: 6, stiffness: 240, useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
      ]).start();
    }
    prevLevel.current = level;
  }, [level, levelPulse, badgeScale]);

  const animatedFillStyle = {
    width: fillProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    }),
  };

  const glowOpacity = levelPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={styles.container}>
      {/* Label row with level badge and XP text */}
      <View style={styles.labelRow}>
        <Animated.View
          style={[
            styles.levelBadge,
            { backgroundColor: colors.accent, transform: [{ scale: badgeScale }] },
          ]}
        >
          <Text style={styles.levelText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            LVL {level}
          </Text>
        </Animated.View>
        <Text style={styles.xpText} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
          {current} / {required} XP
        </Text>
      </View>

      {/* XP bar track with animated fill + level-up glow pulse */}
      <Animated.View
        style={[
          styles.track,
          {
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 12,
            shadowOpacity: glowOpacity,
          },
        ]}
      >
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
      </Animated.View>
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
      color: colors.textSecondary,
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
