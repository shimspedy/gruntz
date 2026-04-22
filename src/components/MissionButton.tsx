import React, { useMemo, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated, ActivityIndicator } from 'react-native';
import { useColors, spacing, borderRadius, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { GameIcon } from './GameIcon';
import { hapticMedium } from '../utils/haptics';
import { usePressScale } from '../utils/animations';

interface MissionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
}

/**
 * Premium button with glow effect and smooth press animation.
 * Supports multiple variants with appropriate styling.
 */
export function MissionButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  icon,
}: MissionButtonProps) {
  const colors = useColors();
  const isInactive = disabled || loading;
  const styles = useMemo(() => createStyles(colors, variant), [colors, variant]);
  const { onPressIn, onPressOut, style: scaleStyle } = usePressScale();

  const handlePress = useCallback(() => {
    if (isInactive) return;
    hapticMedium();
    onPress();
  }, [onPress, isInactive]);

  const getBgColor = () => {
    if (isInactive) return colors.cardBorder;
    switch (variant) {
      case 'primary':
        return colors.accent;
      case 'success':
        return colors.accentGreen;
      case 'danger':
        return colors.accentRed;
      case 'secondary':
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (isInactive) return colors.textMuted;
    if (variant === 'secondary') return colors.accent;
    return colors.background;
  };

  const getBorderColor = () => {
    if (isInactive) return colors.cardBorder;
    if (variant === 'secondary') return colors.accent;
    return 'transparent';
  };

  const getGlowColor = () => {
    if (isInactive) return 'transparent';
    switch (variant) {
      case 'primary':
        return colors.accent;
      case 'success':
        return colors.accentGreen;
      case 'danger':
        return colors.accentRed;
      case 'secondary':
      default:
        return colors.accent;
    }
  };

  const bgColor = getBgColor();
  const textColor = getTextColor();
  const borderColor = getBorderColor();
  const glowColor = getGlowColor();

  return (
    <Animated.View style={[styles.wrapper, scaleStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: bgColor,
            borderColor,
            shadowColor: glowColor,
            shadowOpacity: isInactive ? 0 : 0.12,
          },
          style,
        ]}
        onPress={handlePress}
        onPressIn={isInactive ? undefined : onPressIn}
        onPressOut={isInactive ? undefined : onPressOut}
        disabled={isInactive}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {icon && <GameIcon name={icon} size={20} color={textColor} style={styles.icon} />}
            <Text style={[styles.text, { color: textColor }]} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors, variant: 'primary' | 'secondary' | 'success' | 'danger') =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
    },
    button: {
      width: '100%',
      minHeight: 48,
      borderRadius: borderRadius.md,
      borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      overflow: 'hidden',
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 2,
    },
    icon: {
      marginRight: spacing.sm,
    },
    text: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
  });
