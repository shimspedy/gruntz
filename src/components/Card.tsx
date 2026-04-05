import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
  accentColor?: string;
}

export function Card({ children, style, title, accentColor = colors.accent }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      {/* Top-right corner cut */}
      <View style={styles.cornerCut} />
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const CORNER_SIZE = 14;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 0,
    padding: spacing.lg,
    paddingLeft: spacing.lg + 3,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  cornerCut: {
    position: 'absolute',
    top: -CORNER_SIZE / 2,
    right: -CORNER_SIZE / 2,
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
