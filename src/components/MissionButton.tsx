import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../theme';

interface MissionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  style?: ViewStyle;
}

export function MissionButton({ title, onPress, variant = 'primary', disabled = false, style }: MissionButtonProps) {
  const bgColor = variant === 'primary'
    ? colors.accent
    : variant === 'success'
    ? colors.accentGreen
    : colors.card;

  const textColor = variant === 'secondary' ? colors.accent : '#000000';

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
