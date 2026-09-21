import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Tap } from './Pressable';
import { Text } from './Text';
import { haptic } from './haptics';
import { color, motion, radius } from './tokens';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
}

/** Pill track with a white thumb that springs between segments. */
export function Segmented<T extends string>({ options, value, onChange, style, size = 'md' }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useSharedValue(0);
  const pad = 4;
  const segW = width > 0 ? (width - pad * 2) / options.length : 0;

  React.useEffect(() => {
    if (segW > 0) x.set(withSpring(index * segW, motion.settle));
  }, [index, segW, x]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (width === 0) x.set(index * ((w - pad * 2) / options.length));
    setWidth(w);
  };

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const h = size === 'lg' ? 64 : 48;

  return (
    <View style={[styles.track, { height: h }, style]} onLayout={onLayout} accessibilityRole="tablist">
      {segW > 0 ? (
        <Animated.View style={[styles.thumb, { width: segW, top: pad, bottom: pad, left: pad }, thumbStyle]} />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Tap
            key={o.value}
            feedback="opacity"
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                haptic.selection();
                onChange(o.value);
              }
            }}
          >
            <Text variant="subhead" style={[styles.label, size === 'lg' && styles.labelLg, { color: active ? color.onCta : color.text }]}>
              {o.label}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    padding: 4,
  },
  thumb: { position: 'absolute', backgroundColor: '#F5F5F7', borderRadius: radius.pill },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15 },
  labelLg: { fontSize: 17 },
});
