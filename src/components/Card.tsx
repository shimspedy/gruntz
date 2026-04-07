import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
  accentColor?: string;
}

export function Card({ children, style, title, accentColor }: CardProps) {
  const colors = useColors();
  const resolvedAccent = accentColor ?? colors.accent;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.topAccent, { backgroundColor: resolvedAccent }]} />
      {title && <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{title}</Text>}
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    overflow: 'hidden',
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  topAccent: {
    position: 'absolute',
    top: 14,
    left: spacing.lg,
    width: 64,
    height: 2,
    borderRadius: 999,
    opacity: 0.92,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    paddingTop: 8,
  },
});
