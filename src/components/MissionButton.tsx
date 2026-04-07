import React, { useMemo, useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticMedium } from '../utils/haptics';
import { usePressScale } from '../utils/animations';

interface MissionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  style?: ViewStyle;
  label?: string;
}

export function MissionButton({ title, onPress, variant = 'primary', disabled = false, style, label }: MissionButtonProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { onPressIn, onPressOut, style: scaleStyle } = usePressScale();

  const handlePress = useCallback(() => {
    hapticMedium();
    onPress();
  }, [onPress]);

  const bgColor = variant === 'primary'
    ? colors.accent
    : variant === 'success'
    ? colors.accentGreen
    : colors.card;

  const textColor = variant === 'secondary' ? colors.accent : colors.background;
  const borderColor = variant === 'secondary' ? colors.accent : 'transparent';
  const tagLabel = label || (variant === 'primary' ? 'R-25' : variant === 'success' ? 'S-OK' : 'C-10');

  return (
    <Animated.View style={[styles.wrapper, scaleStyle]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: bgColor, borderColor, opacity: disabled ? 0.5 : 1 }, style]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={[styles.topGlow, { backgroundColor: variant === 'secondary' ? colors.accent : colors.borderGlow }]} />
        <Text style={[styles.text, { color: textColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{title}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tagLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  topGlow: {
    position: 'absolute',
    top: 12,
    left: spacing.lg,
    width: 72,
    height: 2,
    borderRadius: 999,
    opacity: 0.85,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tag: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    backgroundColor: colors.cyberYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 0.5,
  },
});
