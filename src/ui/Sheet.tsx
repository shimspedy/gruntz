import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareSheetBody } from './KeyboardAware';
import { Tap } from './Pressable';
import { Text } from './Text';
import { color, motion, radius, space } from './tokens';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Hide the hairline under the title (for sheets whose first row is a hero). */
  plainHeader?: boolean;
  /** Fired after the exit animation finishes. */
  onDismissed?: () => void;
  avoidKeyboard?: boolean;
}

/**
 * Bottom sheet: dimmed backdrop, drag handle, springs in, follows the finger, flicks closed.
 * Short interruptions only — anything with steps is a modal route instead.
 */
export function Sheet({ visible, onClose, title, children, plainHeader, onDismissed, avoidKeyboard }: SheetProps) {
  const [mounted, setMounted] = useState(visible);
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetH = useSharedValue(screenH);
  const offset = useSharedValue(screenH);
  const progress = useSharedValue(0);

  const finishClose = useCallback(() => {
    setMounted(false);
    onDismissed?.();
  }, [onDismissed]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Re-arm the entrance on every open: the height is remembered from last time, so
      // without this the second open stayed off-screen behind a tap-swallowing backdrop.
      if (sheetH.get() > 0) {
        offset.set(sheetH.get() + 40);
        offset.set(withSpring(0, motion.sheet));
        progress.set(withTiming(1, { duration: motion.base, easing: motion.easeOut }));
      }
    } else if (mounted) {
      progress.set(withTiming(0, { duration: 200, easing: motion.easeOut }));
      offset.set(
        withTiming(sheetH.get() + 40, { duration: 230, easing: motion.easeOut }, (done) => {
          if (done) scheduleOnRN(finishClose);
        }),
      );
    }
  }, [visible, mounted, offset, progress, sheetH, finishClose]);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    const first = sheetH.get() === screenH;
    sheetH.set(h);
    if (first && visible) {
      offset.set(h + 40);
      offset.set(withSpring(0, motion.sheet));
      progress.set(withTiming(1, { duration: motion.base, easing: motion.easeOut }));
    }
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-6, 6])
    .onChange((e) => {
      const next = offset.get() + e.changeY;
      // Rubber-band when pulled above the resting point.
      offset.set(next < 0 ? next * 0.25 : next);
    })
    .onEnd((e) => {
      const projected = offset.get() + e.velocityY * 0.12;
      if (projected > sheetH.get() * 0.4 || e.velocityY > 900) {
        scheduleOnRN(onClose);
      } else {
        offset.set(withSpring(0, { ...motion.sheet, velocity: e.velocityY }));
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.get() * interpolate(offset.get(), [0, sheetH.get()], [1, 0], Extrapolation.CLAMP),
  }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Tap feedback="none" style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            onLayout={onLayout}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.md) + space.xs, maxHeight: screenH - insets.top - 24 }, sheetStyle]}
          >
            <View style={styles.handle} />
            {title ? (
              <View style={[styles.titleRow, !plainHeader && styles.titleDivider]}>
                <Text variant="headline" align="center" style={styles.title}>
                  {title}
                </Text>
              </View>
            ) : null}
            {avoidKeyboard ? <KeyboardAwareSheetBody>{children}</KeyboardAwareSheetBody> : children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: color.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.bgRaised,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderCurve: 'continuous',
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: color.lineStrong,
    marginBottom: space.sm,
  },
  titleRow: { paddingBottom: space.md, paddingTop: space.xs },
  titleDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line, marginBottom: space.xs },
  title: { fontSize: 19 },
});
