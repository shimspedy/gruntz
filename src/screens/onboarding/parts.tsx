import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, motion, radius, space } from '../../ui/tokens';

/** Onboarding choice row: dark surface; selected flips to white with black ink. */
export function OptionRow({
  label,
  meta,
  icon,
  selected,
  onPress,
  index = 0,
  multi,
}: {
  label: string;
  meta?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  index?: number;
  multi?: boolean;
}) {
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.set(withTiming(selected ? 1 : 0, { duration: 180, easing: motion.easeOut }));
  }, [selected, t]);
  const box = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.get(), [0, 1], [color.surface, '#F5F5F7']) }));
  const ink = selected ? '#000000' : color.text;
  return (
    <Animated.View entering={FadeInDown.delay(80 + index * motion.stagger).duration(360).easing(motion.easeOut)}>
      <Tap
        onPress={() => {
          haptic.selection();
          onPress();
        }}
        scaleTo={0.98}
        accessibilityRole={multi ? 'checkbox' : 'radio'}
        accessibilityState={multi ? { checked: selected } : { selected }}
        accessibilityLabel={meta ? `${label}, ${meta}` : label}
      >
        <Animated.View style={[styles.row, box]}>
          {multi ? (
            <View style={[styles.box, selected && styles.boxOn]}>{selected ? <Icon name="check" size={13} color="#FFFFFF" weight="bold" /> : null}</View>
          ) : icon ? (
            <Icon name={icon} size={22} color={selected ? '#000000' : color.text} />
          ) : null}
          <Text variant="bodyMedium" style={{ flex: 1, color: ink, fontSize: 17 }}>
            {label}
          </Text>
          {meta ? (
            <Text variant="callout" style={{ color: selected ? '#3A3A3C' : color.textTertiary }}>
              {meta}
            </Text>
          ) : null}
        </Animated.View>
      </Tap>
    </Animated.View>
  );
}

/** Square tile for 2-up grids (equipment, guardrails). */
export function GridTile({
  label,
  icon,
  selected,
  onPress,
  index = 0,
}: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  index?: number;
}) {
  const t = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    t.set(withTiming(selected ? 1 : 0, { duration: 180, easing: motion.easeOut }));
  }, [selected, t]);
  const box = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.get(), [0, 1], [color.surface, '#F5F5F7']) }));
  return (
    <Animated.View style={{ flexBasis: '46%', flexGrow: 1 }} entering={FadeInDown.delay(80 + index * motion.stagger).duration(360)}>
      <Tap
        onPress={() => {
          haptic.selection();
          onPress();
        }}
        scaleTo={0.97}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.tile, box]}>
          <Text variant="headline" style={{ color: selected ? '#000' : color.text, fontSize: 16 }}>
            {label}
          </Text>
          <View style={styles.tileIcon}>
            <Icon name={icon} size={56} color={selected ? color.accent : color.textSecondary} weight="light" />
          </View>
        </Animated.View>
      </Tap>
    </Animated.View>
  );
}

/**
 * Horizontal ruler: ticks scroll under a fixed white needle; the value snaps to whole units
 * with a selection tick as each unit passes.
 */
export function Ruler({
  min,
  max,
  value,
  onChange,
  majorEvery = 4,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  majorEvery?: number;
}) {
  const { width } = useWindowDimensions();
  const step = 18;
  const ref = useRef<ScrollView>(null);
  const last = useRef(value);
  const count = max - min + 1;

  useEffect(() => {
    const id = setTimeout(() => ref.current?.scrollTo({ x: (value - min) * step, animated: false }), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const v = Math.max(min, Math.min(max, Math.round(e.nativeEvent.contentOffset.x / step) + min));
    if (v !== last.current) {
      last.current = v;
      haptic.selection();
      onChange(v);
    }
  };

  return (
    <View
      style={{ height: 120 }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Weeks until your test"
      accessibilityValue={{ min, max, now: value, text: `${value} ${value === 1 ? 'week' : 'weeks'}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const next = event.nativeEvent.actionName === 'increment'
          ? Math.min(max, value + 1)
          : Math.max(min, value - 1);
        if (next === value) return;
        last.current = next;
        haptic.selection();
        onChange(next);
        ref.current?.scrollTo({ x: (next - min) * step, animated: true });
      }}
    >
      <ScrollView
        ref={ref}
        importantForAccessibility="no-hide-descendants"
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: width / 2 - 1, alignItems: 'flex-end', height: 120 }}
      >
        {Array.from({ length: count }, (_, i) => {
          const major = (i + min) % majorEvery === 0;
          return (
            <View key={i} style={{ width: step, alignItems: 'flex-start', justifyContent: 'flex-end', height: 120 }}>
              {major ? (
                <Text variant="caption" tone="tertiary" style={styles.tickLabel} tabular>
                  {i + min}
                </Text>
              ) : null}
              <View style={[styles.tick, { height: major ? 46 : 26, backgroundColor: major ? '#6E6E73' : '#3A3A3C' }]} />
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={[styles.needle, { left: width / 2 - 1.5 }]} />
    </View>
  );
}

export function Question({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.question}>
      <Text variant="question" align="center" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text variant="callout" tone="secondary" align="center" style={{ marginTop: 8 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export const onboardingStyles = StyleSheet.create({
  list: { gap: 10, paddingHorizontal: space.gutter, paddingBottom: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: space.gutter, justifyContent: 'space-between' },
});

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#6E6E73', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: color.accent, borderColor: color.accent },
  tile: { height: 150, borderRadius: radius.md, borderCurve: 'continuous', padding: space.md },
  tileIcon: { position: 'absolute', right: 14, bottom: 14 },
  tick: { width: 2, borderRadius: 1 },
  tickLabel: { position: 'absolute', top: 30, left: -6, fontFamily: font.medium },
  needle: { position: 'absolute', bottom: 0, width: 3, height: 84, borderRadius: 2, backgroundColor: '#FFFFFF' },
  question: { paddingHorizontal: space.xl, marginTop: space.lg, marginBottom: space.xl },
});
