import React from 'react';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Pads a sheet's body by the live keyboard height, frame-synced on the UI thread. */
export function KeyboardAwareSheetBody({ children }: { children: React.ReactNode }) {
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const style = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboard.height.get() - insets.bottom),
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** Bottom-pinned footer (CTA bar) that rides up with the keyboard. */
export function KeyboardLift({ children, offset = 0 }: { children: React.ReactNode; offset?: number }) {
  const keyboard = useAnimatedKeyboard();
  const insets = useSafeAreaInsets();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.max(0, keyboard.height.get() - insets.bottom + offset * (keyboard.height.get() > 0 ? 1 : 0)) }],
  }));
  return (
    <Animated.View pointerEvents="box-none" style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, style]}>
      {children}
    </Animated.View>
  );
}
