import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { GameIcon } from './GameIcon';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ icon, value, label, color, style }: StatCardProps) {
  const colors = useColors();
  const resolvedColor = color ?? colors.accent;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <GameIcon name={icon} size={28} color={resolvedColor} style={styles.iconWrap} />
        <View style={[styles.signal, { backgroundColor: resolvedColor }]} />
      </View>
      <Text style={[styles.value, { color: resolvedColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{value}</Text>
      <Text
        style={styles.label}
        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
    flex: 1,
    overflow: 'hidden',
    minHeight: 110,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 3,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  signal: {
    width: 24,
    height: 3,
    borderRadius: 999,
    opacity: 0.9,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    width: '100%',
  },
});
