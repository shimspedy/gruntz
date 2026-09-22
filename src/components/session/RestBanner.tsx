import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { formatClock, useNow } from '../../hooks/useNow';
import { useSessionStore } from '../../store/useSessionStore';
import { Ring } from '../../ui/Progress';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, radius, space } from '../../ui/tokens';

/** Floating rest countdown. Non-blocking: the set table stays usable underneath. */
export function RestBanner({ bottom }: { bottom: number }) {
  const restEndsAt = useSessionStore((s) => s.restEndsAt);
  const restTotal = useSessionStore((s) => s.restTotal);
  const adjust = useSessionStore((s) => s.adjustRest);
  const end = useSessionStore((s) => s.endRest);
  const now = useNow(!!restEndsAt, 250);
  const fired = useRef(false);
  // Rest used to just vanish at zero with only a buzz. Hold a visible "rest over"
  // state for a beat so someone looking at their phone sees it end.
  const [over, setOver] = useState(false);
  // The banner is absolutely positioned, so the keyboard sat on top of Skip/−15/+15.
  const [keyboard, setKeyboard] = useState(0);

  const remaining = restEndsAt ? restEndsAt - now : 0;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboard(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!restEndsAt) {
      fired.current = false;
      return;
    }
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      haptic.warning();
      setOver(true);
      end();
    }
  }, [remaining, restEndsAt, end]);

  useEffect(() => {
    if (!over) return undefined;
    const t = setTimeout(() => setOver(false), 2200);
    return () => clearTimeout(t);
  }, [over]);

  // A fresh rest cancels the lingering "rest over" card.
  useEffect(() => {
    if (restEndsAt) setOver(false);
  }, [restEndsAt]);

  if (over) {
    return (
      <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(180)} style={[styles.wrap, { bottom: bottom + keyboard }]}>
        <View style={styles.overDot}>
          <Text variant="headline" tone="inverse">✓</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="footnote" tone="secondary">Rest</Text>
          <Text variant="headline" style={{ fontSize: 22 }}>Time — next set</Text>
        </View>
        <Tap onPress={() => { haptic.selection(); setOver(false); }} style={styles.skip} accessibilityLabel="Dismiss rest timer">
          <Text variant="headline" tone="inverse">Got it</Text>
        </Tap>
      </Animated.View>
    );
  }

  if (!restEndsAt || remaining <= 0) return null;
  const ratio = restTotal > 0 ? remaining / (restTotal * 1000) : 0;

  return (
    <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOutDown.duration(180)} style={[styles.wrap, { bottom: bottom + keyboard }]}>
      <Ring progress={ratio} size={44} stroke={3.5} trackColor="#2B3038">
        <View />
      </Ring>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text variant="footnote" tone="secondary">
          Rest
        </Text>
        <Text variant="headline" tabular style={{ fontSize: 22 }}>
          {formatClock(remaining + 999)}
        </Text>
      </View>
      <Tap onPress={() => { haptic.selection(); adjust(-15); }} style={styles.adj} accessibilityLabel="Subtract 15 seconds">
        <Text variant="headline">−15</Text>
      </Tap>
      <Tap onPress={() => { haptic.selection(); adjust(15); }} style={styles.adj} accessibilityLabel="Add 15 seconds">
        <Text variant="headline">+15</Text>
      </Tap>
      <Tap onPress={() => { haptic.light(); end(); }} style={styles.skip} accessibilityLabel="Skip rest">
        <Text variant="headline" tone="inverse">
          Skip
        </Text>
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    height: 72,
    borderRadius: 36,
    borderCurve: 'continuous',
    backgroundColor: '#15181E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    gap: 8,
    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
  },
  overDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  adj: { height: 44, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  skip: { height: 44, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
});
