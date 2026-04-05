import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  style?: ViewStyle;
}

export function StatCard({ icon, value, label, color = colors.accent, style }: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
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
