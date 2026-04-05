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
    <Animated.View style={scaleStyle}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: bgColor, borderColor, opacity: disabled ? 0.5 : 1 }, style]}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, { color: textColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>{title}</Text>
        {/* Bottom-left corner cut */}
        <View style={[styles.cornerCut, { borderBottomColor: colors.background }]} />
        {/* Right accent border */}
        <View style={[styles.rightAccent, { backgroundColor: variant === 'secondary' ? colors.accent : colors.borderGlow }]} />
        {/* Cyberpunk tag label */}
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tagLabel}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const CUT_W = 18;
const CUT_H = 24;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  cornerCut: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderRightWidth: CUT_W,
    borderRightColor: 'transparent',
    borderBottomWidth: CUT_H,
  },
  rightAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  tag: {
    position: 'absolute',
    bottom: 2,
    right: 10,
    backgroundColor: colors.cyberYellow,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tagText: {
    fontSize: 7,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 0.5,
  },
});
