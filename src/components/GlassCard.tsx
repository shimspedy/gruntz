import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable, Animated } from 'react-native';
import { useColors, spacing, borderRadius } from '../theme';
import type { ThemeColors } from '../theme';
import { usePressScale } from '../utils/animations';
import { hapticLight } from '../utils/haptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'accent';
  noPadding?: boolean;
  onPress?: () => void;
}

/**
 * Restrained matte surface used throughout the app.
 * Pass `onPress` to turn it into an interactive card with press scale + haptic.
 */
export function GlassCard({ children, style, variant = 'default', noPadding, onPress }: GlassCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const { onPressIn, onPressOut, style: scaleStyle } = usePressScale();

  const card = <View style={styles.outerWrap}><View style={noPadding ? undefined : styles.contentPadding}>{children}</View></View>;

  if (onPress) {
    return (
      <Animated.View style={[scaleStyle, style]}>
        <Pressable
          onPress={() => {
            hapticLight();
            onPress();
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
        >
          {card}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={style}>{card}</View>;
}

const createStyles = (colors: ThemeColors, variant: 'default' | 'elevated' | 'accent') => {
  return StyleSheet.create({
    outerWrap: {
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: variant === 'elevated' ? colors.backgroundSecondary : colors.card,
    },
    contentPadding: {
      padding: spacing.md,
    },
  });
};
