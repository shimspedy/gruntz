import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { color, motion } from './tokens';
import { haptic } from './haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Feedback = 'scale' | 'highlight' | 'opacity' | 'none';

export interface TapProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** scale for buttons and cards, highlight for list rows, opacity for bar buttons */
  feedback?: Feedback;
  scaleTo?: number;
  /** background colours used by `highlight` feedback */
  baseColor?: string;
  pressedColor?: string;
  hapticOnPress?: 'selection' | 'light' | 'medium' | false;
  /**
   * Allow rapid repeat presses.
   *
   * The 450 ms lock below exists to stop a double tap pushing two copies of a
   * screen. On a control designed to be tapped repeatedly — a +1 quick-add, a
   * stepper — it instead drops roughly every other tap with no feedback, so the
   * button reads as broken. Set this on counters, never on navigation or submit.
   */
  repeatable?: boolean;
}

/**
 * The single press primitive. Feedback lands on press-in and is driven on the UI thread.
 */
export function Tap({
  feedback = 'scale',
  scaleTo = 0.97,
  baseColor = color.surface,
  pressedColor = color.surfacePressed,
  hapticOnPress = false,
  repeatable = false,
  style,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: TapProps) {
  const pressed = useSharedValue(0);
  const lastPress = React.useRef(0);

  const animatedStyle = useAnimatedStyle(() => {
    const p = pressed.get();
    switch (feedback) {
      case 'scale':
        return { transform: [{ scale: 1 - (1 - scaleTo) * p }] };
      case 'highlight':
        return { backgroundColor: interpolateColor(p, [0, 1], [baseColor, pressedColor]) };
      case 'opacity':
        return { opacity: 1 - 0.45 * p };
      default:
        return {};
    }
  });

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e) => {
        pressed.set(withTiming(1, { duration: 90, easing: motion.easeOut }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, { duration: 220, easing: motion.easeOut }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        // Swallow the second of a double tap: it used to push two copies of the same screen.
        const now = Date.now();
        if (!repeatable) {
          if (now - lastPress.current < 450) return;
          lastPress.current = now;
        }
        if (hapticOnPress) haptic[hapticOnPress]();
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
