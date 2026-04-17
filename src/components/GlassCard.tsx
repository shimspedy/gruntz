import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
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
 * Premium liquid glass card with frosted blur effect,
 * animated gradient border glow, and inner highlight.
 * iOS: real frosted glass via BlurView.
 * Android: semi-transparent fallback with glow effect.
 * Pass `onPress` to turn it into an interactive card with press scale + haptic.
 */
export function GlassCard({ children, style, variant = 'default', noPadding, onPress }: GlassCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const { onPressIn, onPressOut, style: scaleStyle } = usePressScale();

  const inner = (
    <>
      <View style={styles.edgeHighlight} />
      <View style={styles.edgeShadow} />
      <View style={noPadding ? undefined : styles.contentPadding}>
        {children}
      </View>
    </>
  );

  const card =
    Platform.OS === 'ios' ? (
      <View style={styles.outerWrap}>
        <BlurView intensity={50} tint="dark" style={styles.blurFill}>
          <View style={styles.glassOverlay}>{inner}</View>
        </BlurView>
      </View>
    ) : (
      <View style={[styles.outerWrap, styles.androidFallback]}>{inner}</View>
    );

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
  const getBorderColor = () => {
    if (variant === 'accent') return colors.accent;
    return colors.glassBorder;
  };

  const getGlowColor = () => {
    if (variant === 'accent') return colors.accent;
    return colors.glassHighlight;
  };

  return StyleSheet.create({
    outerWrap: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: getBorderColor(),
      shadowColor: getGlowColor(),
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: variant === 'accent' ? 0.24 : 0.12,
      shadowRadius: 16,
      elevation: variant === 'elevated' ? 8 : 4,
    },
    blurFill: {
      // BlurView fills the container
    },
    glassOverlay: {
      backgroundColor: colors.glassBackground,
    },
    edgeHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: colors.glassHighlight,
      opacity: 0.6,
      borderRadius: 1,
    },
    edgeShadow: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.glassShadow,
      opacity: 0.25,
    },
    contentPadding: {
      padding: spacing.lg,
    },
    androidFallback: {
      backgroundColor: `${colors.card}DD`,
    },
  });
};
