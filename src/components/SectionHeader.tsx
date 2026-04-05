import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
