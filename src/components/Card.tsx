import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
  variant?: 'default' | 'outlined' | 'filled';
  accentColor?: string;
}

/**
 * Modern card component with clean design.
 * Supports three variants: default, outlined, and filled.
 */
export function Card({ children, style, title, variant = 'default', accentColor }: CardProps) {
  const colors = useColors();
  const resolvedAccent = accentColor ?? colors.accent;
  const styles = useMemo(() => createStyles(colors, variant, resolvedAccent), [colors, variant, resolvedAccent]);

  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{title}</Text>}
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors, variant: 'default' | 'outlined' | 'filled', accentColor: string) => StyleSheet.create({
  card: {
    backgroundColor: variant === 'filled' ? `${accentColor}0D` : colors.card,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: variant === 'outlined' ? accentColor : colors.cardBorder,
    padding: spacing.md,
    overflow: 'hidden',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
});
