import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  accentColor?: string;
  /** Remove default padding */
  noPadding?: boolean;
}

/**
 * Liquid Glass–inspired card component.
 * Uses BlurView on iOS for real frosted-glass effect,
 * falls back to a semi-transparent dark surface on Android.
 */
export function GlassCard({ children, style, intensity = 30, accentColor, noPadding }: GlassCardProps) {
  const colors = useColors();
  const resolvedAccent = accentColor ?? colors.accent;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const inner = (
    <>
      {/* Top lensing edge highlight */}
      <View style={[styles.edgeHighlight, { backgroundColor: resolvedAccent }]} />
      {/* Bottom subtle shadow edge */}
      <View style={styles.edgeShadow} />
      <View style={noPadding ? undefined : styles.contentPadding}>
        {children}
      </View>
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.outerWrap, style]}>
        <BlurView intensity={intensity} tint="dark" style={styles.blurFill}>
          <View style={styles.glassOverlay}>
            {inner}
          </View>
        </BlurView>
      </View>
    );
  }

  // Android fallback — semi-transparent card
  return (
    <View style={[styles.outerWrap, styles.androidFallback, style]}>
      {inner}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  outerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.accent}18`,
  },
  blurFill: {
    flex: 1,
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: `${colors.card}66`, // 40% opacity overlay for depth
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    opacity: 0.35,
    borderRadius: 1,
  },
  edgeShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  contentPadding: {
    padding: spacing.lg,
  },
  androidFallback: {
    backgroundColor: `${colors.card}CC`, // 80% opacity
  },
});
