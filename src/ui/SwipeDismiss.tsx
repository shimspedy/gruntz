import { useCallback, useRef, type ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { haptic } from './haptics';
import { motion } from './tokens';

const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 800;

type Props = {
  /** Called once the card has left and its space has closed. */
  onDismiss: () => void;
  /** The card's own style (margins included); the space it takes closes after a swipe. */
  style?: StyleProp<ViewStyle>;
  /** Receives `dismiss`, so a screen-reader action on the card can do what the swipe does. */
  children: (dismiss: () => void) => ReactNode;
};

/**
 * Swipe a card sideways to put it away. It follows the finger, fades, and the space
 * it took closes, so the content below moves up rather than jumping. Vertical drags
 * fall through to the scroll view. Sizes come from the card's own layout, so it
 * behaves the same at any window width.
 */
export function SwipeDismiss({ onDismiss, style, children }: Props) {
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(-1);
  const collapse = useSharedValue(1);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDismiss();
  }, [onDismiss]);

  const leave = useCallback((dir: number) => {
    haptic.light();
    x.set(withTiming(dir * Math.max(width.get(), 1), { duration: 200, easing: motion.easeOut }, (finished) => {
      if (!finished) return;
      collapse.set(withTiming(0, { duration: 220, easing: motion.easeOut }, (closed) => {
        if (closed) scheduleOnRN(finish);
      }));
    }));
  }, [collapse, finish, width, x]);

  const dismiss = useCallback(() => leave(1), [leave]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onChange((e) => {
      x.set(e.translationX);
    })
    .onEnd((e) => {
      const projected = e.translationX + e.velocityX * 0.15;
      if (Math.abs(projected) > DISMISS_DISTANCE || Math.abs(e.velocityX) > DISMISS_VELOCITY) {
        scheduleOnRN(leave, Math.sign(projected || e.velocityX) || 1);
      } else {
        x.set(withSpring(0, { ...motion.settle, velocity: e.velocityX }));
      }
    });

  // The wrapper's height includes the card's margins, so they close with it.
  const onOuterLayout = (e: LayoutChangeEvent) => {
    if (collapse.get() === 1) height.set(e.nativeEvent.layout.height);
  };
  const onCardLayout = (e: LayoutChangeEvent) => {
    width.set(e.nativeEvent.layout.width);
  };

  // Before the first layout the height is unknown, so it is left to content.
  const outer = useAnimatedStyle(() => (height.get() < 0 || collapse.get() === 1
    ? {}
    : { height: height.get() * collapse.get(), overflow: 'hidden' as const }));

  const card = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
    opacity: interpolate(Math.abs(x.get()), [0, Math.max(width.get(), 1) * 0.6], [1, 0], 'clamp'),
  }));

  return (
    <Animated.View style={outer} onLayout={onOuterLayout}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[style, card]} onLayout={onCardLayout}>
          {children(dismiss)}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
