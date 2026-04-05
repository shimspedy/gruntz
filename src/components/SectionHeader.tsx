import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.accentLine} />
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  accentLine: {
    width: 3,
    height: 20,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
    borderRadius: 1,
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
