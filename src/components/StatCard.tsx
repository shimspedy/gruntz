import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { GameIcon } from './GameIcon';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
}

/**
 * Modern stat card with large icon area, bold value, and subtle gradient accent line.
 */
export function StatCard({ icon, value, label, color, style }: StatCardProps) {
  const colors = useColors();
  const resolvedColor = color ?? colors.accent;
  const styles = useMemo(() => createStyles(colors, resolvedColor), [colors, resolvedColor]);

  return (
    <View style={[styles.card, style]}>
      {/* Icon area with subtle circular background */}
      <View style={[styles.iconContainer, { backgroundColor: `${resolvedColor}15` }]}>
        <GameIcon name={icon} size={36} color={resolvedColor} />
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: resolvedColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
        {value}
      </Text>

      {/* Label */}
      <Text
        style={styles.label}
        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {label}
      </Text>

      {/* Subtle gradient accent line at bottom */}
      <View style={[styles.accentLine, { backgroundColor: resolvedColor }]} />
    </View>
  );
}

const createStyles = (colors: ThemeColors, accentColor: string) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'flex-start',
    flex: 1,
    overflow: 'hidden',
    minHeight: 120,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: '100%',
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.7,
  },
});
