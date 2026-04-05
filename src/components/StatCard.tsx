import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
}

const CORNER = 10;

export function StatCard({ icon, value, label, color, style }: StatCardProps) {
  const colors = useColors();
  const resolvedColor = color ?? colors.accent;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.card, style]}>
      {/* Top-left accent notch */}
      <View style={[styles.topAccent, { backgroundColor: resolvedColor }]} />
      {/* Top-right corner cut */}
      <View style={styles.cornerCut} />
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: resolvedColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    width: '60%',
  },
  cornerCut: {
    position: 'absolute',
    top: -CORNER / 2,
    right: -CORNER / 2,
    width: CORNER,
    height: CORNER,
    backgroundColor: colors.background,
    transform: [{ rotate: '45deg' }],
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
