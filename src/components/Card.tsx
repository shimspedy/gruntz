import React, { useMemo } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useColors, spacing } from '../theme';
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
      {/* Thin top accent strip */}
      <View style={[styles.topAccent, { backgroundColor: resolvedAccent }]} />
      {/* Corner cuts — both sides */}
      <View style={styles.cornerCutRight} />
      <View style={styles.cornerCutLeft} />
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const CORNER_SIZE = 14;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  cornerCutRight: {
    position: 'absolute',
    top: -CORNER_SIZE / 2,
    right: -CORNER_SIZE / 2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    backgroundColor: colors.background,
    transform: [{ rotate: '45deg' }],
  },
  cornerCutLeft: {
    position: 'absolute',
    bottom: -CORNER_SIZE / 2,
    left: -CORNER_SIZE / 2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    backgroundColor: colors.background,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
});
