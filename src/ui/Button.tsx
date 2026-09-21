import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Tap } from './Pressable';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';
import { color, layout, motion, radius } from './tokens';

type Variant = 'primary' | 'secondary' | 'accent' | 'outline';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Onboarding CTAs are uppercase + tracked; in-app CTAs are sentence case. */
  caps?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  haptic?: boolean;
}

const fills: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: '#F5F5F7', fg: color.onCta },
  secondary: { bg: color.surface, fg: color.text },
  accent: { bg: color.accent, fg: '#FFFFFF' },
  outline: { bg: 'transparent', fg: color.text, border: color.lineStrong },
};

const heights: Record<Size, number> = { lg: layout.ctaHeight, md: 48, sm: 38 };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled = false,
  loading = false,
  caps = false,
  style,
  accessibilityLabel,
  haptic = true,
}: ButtonProps) {
  const fill = fills[variant];
  const enabled = useSharedValue(disabled ? 0 : 1);

  useEffect(() => {
    enabled.set(withTiming(disabled ? 0 : 1, { duration: motion.base, easing: motion.easeOut }));
  }, [disabled, enabled]);

  const bgStyle = useAnimatedStyle(() => {
    // Always write backgroundColor: switching variants must overwrite the previous animated value.
    if (variant !== 'primary') return { opacity: 0.45 + 0.55 * enabled.get(), backgroundColor: fill.bg };
    return { opacity: 1, backgroundColor: interpolateColor(enabled.get(), [0, 1], [color.ctaDisabled, fill.bg]) };
  });

  const isPill = size === 'sm';

  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      hapticOnPress={haptic ? 'light' : false}
      accessibilityLabel={accessibilityLabel ?? title}
      style={[{ height: heights[size], borderRadius: isPill ? radius.pill : radius.md }, style]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fill.bg,
            borderRadius: isPill ? radius.pill : radius.md,
            borderWidth: fill.border ? 1 : 0,
            borderColor: fill.border,
            paddingHorizontal: isPill ? 18 : 20,
          },
          bgStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fill.fg} />
        ) : (
          <View style={styles.row}>
            {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} color={fill.fg} weight="semibold" /> : null}
            <Text
              variant={caps ? 'ctaCaps' : 'cta'}
              style={[{ color: fill.fg }, size === 'sm' && styles.smallLabel]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallLabel: { fontSize: 15 },
});
