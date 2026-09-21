import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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

  const remaining = restEndsAt ? restEndsAt - now : 0;

  useEffect(() => {
    if (!restEndsAt) {
      fired.current = false;
      return;
    }
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      haptic.warning();
      end();
    }
  }, [remaining, restEndsAt, end]);

  if (!restEndsAt || remaining <= 0) return null;
  const ratio = restTotal > 0 ? remaining / (restTotal * 1000) : 0;

  return (
    <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOutDown.duration(180)} style={[styles.wrap, { bottom }]}>
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
  adj: { height: 44, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  skip: { height: 44, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
});
