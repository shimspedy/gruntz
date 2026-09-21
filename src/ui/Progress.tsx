import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { color, motion, radius } from './tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  progress: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  tint?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Circular progress. Animates from its previous value, never from zero after mount. */
export function Ring({ progress, size = 56, stroke = 4, trackColor = color.line, tint = color.accent, children, style }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, progress)), { duration: 700, easing: motion.easeOut }));
  }, [progress, p]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.get()) }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tint}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

interface BarProps {
  progress: number;
  height?: number;
  tint?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}

/** Linear progress. Animates a transform so it never triggers layout. */
export function Bar({ progress, height = 6, tint = color.accent, trackColor = color.line, style, duration = 520 }: BarProps) {
  const p = useSharedValue(0);
  const [w, setW] = React.useState(0);

  useEffect(() => {
    p.set(withTiming(Math.max(0, Math.min(1, progress)), { duration, easing: motion.easeOut }));
  }, [progress, p, duration]);

  // Slide a full-width, fully rounded fill in from the left: the leading edge keeps its radius.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -w * (1 - p.get()) }],
  }));

  return (
    <View
      style={[{ height, borderRadius: radius.pill, backgroundColor: trackColor, overflow: 'hidden' }, style]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View style={[{ width: w, height, backgroundColor: tint, borderRadius: radius.pill }, fillStyle]} />
    </View>
  );
}
