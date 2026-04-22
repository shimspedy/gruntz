import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { GameIcon } from './GameIcon';

export type StatCardDelta = {
  value: string;
  direction: 'up' | 'down' | 'flat';
};

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
  hero?: boolean;
  delta?: StatCardDelta;
}

/**
 * Modern stat card with large icon area, bold value, and subtle gradient accent line.
 * `hero=true` renders full-width with oversized value.
 * `delta` adds a small trend chip under the value (e.g. +45 this week ↑).
 */
export function StatCard({ icon, value, label, color, style, hero = false, delta }: StatCardProps) {
  const colors = useColors();
  const resolvedColor = color ?? colors.accent;
  const styles = useMemo(() => createStyles(colors, resolvedColor, hero), [colors, resolvedColor, hero]);

  const deltaColor =
    delta?.direction === 'up'
      ? colors.accentGreen
      : delta?.direction === 'down'
        ? colors.accentRed
        : colors.textMuted;
  const deltaSymbol = delta?.direction === 'up' ? '↑' : delta?.direction === 'down' ? '↓' : '→';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconContainer}>
        <GameIcon name={icon} size={hero ? 24 : 20} color={resolvedColor} />
      </View>

      <Text style={[styles.value, { color: resolvedColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
        {value}
      </Text>

      <Text
        style={styles.label}
        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {label}
      </Text>

      {delta && (
        <View style={[styles.deltaChip, { borderColor: `${deltaColor}55` }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
            {deltaSymbol} {delta.value}
          </Text>
        </View>
      )}

      <View style={[styles.accentLine, { backgroundColor: resolvedColor }]} />
    </View>
  );
}

const createStyles = (colors: ThemeColors, accentColor: string, hero: boolean) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
    paddingHorizontal: hero ? spacing.md : spacing.sm + 2,
    paddingVertical: hero ? spacing.lg : spacing.md,
    alignItems: 'flex-start',
    flex: 1,
    overflow: 'hidden',
    minHeight: hero ? 120 : 88,
  },
  iconContainer: {
    width: hero ? 36 : 28,
    height: hero ? 36 : 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: hero ? 32 : 22,
    fontWeight: '700',
    lineHeight: hero ? 38 : 28,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: '100%',
  },
  deltaChip: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    opacity: 0.4,
  },
});
