import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { Button } from '../../ui/Button';
import { LogoMark } from '../../ui/Logo';
import { Text } from '../../ui/Text';
import { color, motion, space } from '../../ui/tokens';

const SLIDES = [
  { title: 'Log every set', body: 'Reps, load and rest for every movement in your mission.' },
  { title: 'Climb the ranks', body: 'Every mission earns XP. Recruit to Apex, one day at a time.' },
  { title: 'Reach your goal', body: 'Plans matched to your goals, days and gear, with military test prep when you need it.' },
];

export function Welcome({ onStart }: { onStart: () => void }) {
  const { width, height } = useWindowDimensions();
  // The phone takes the space between the copy and the footer, capped so it never crowds small screens.
  const phoneHeight = Math.min(500, Math.round(height * 0.5));
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const x = useSharedValue(0);
  const intro = useSharedValue(0);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    // Splash → welcome: the mark holds, dims and lifts away as the carousel resolves.
    intro.set(withDelay(500, withTiming(1, { duration: 700, easing: motion.easeOut })));
  }, [intro]);

  // Gentle auto-advance until the user touches the carousel.
  const touched = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      if (touched.current) return;
      setPage((p) => {
        const next = (p + 1) % SLIDES.length;
        scroll.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4200);
    return () => clearInterval(id);
  }, [width]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.get(), [0, 0.7], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(intro.get(), [0, 1], [1, 0.82]) }, { translateY: interpolate(intro.get(), [0, 1], [0, -40]) }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.get(), [0.35, 1], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(intro.get(), [0.35, 1], [16, 0], 'clamp') }],
  }));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    x.set(e.nativeEvent.contentOffset.x);
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, logoStyle]}>
        <LogoMark size={96} />
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onScrollBeginDrag={() => (touched.current = true)}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s, i) => (
            <View key={s.title} style={{ width, flex: 1 }}>
              <Text variant="question" align="center" style={{ marginTop: space.xl }}>
                {s.title}
              </Text>
              <Text variant="callout" tone="secondary" align="center" style={styles.body}>
                {s.body}
              </Text>
              <View style={styles.stage}>
                <ScreenPhone source={SCREENS[i]} active={page === i} height={phoneHeight} />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} x={x} width={width} />
          ))}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
          <Button title="Get started" caps onPress={onStart} />
          <Text variant="caption" tone="tertiary" align="center" style={styles.disclaimer}>
            Talk to a healthcare provider before starting a new exercise program. For ages 13 and up.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Dot({ index, x, width }: { index: number; x: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(x.get() / width - index);
    return {
      width: interpolate(d, [0, 1], [26, 8], 'clamp'),
      opacity: interpolate(d, [0, 1], [1, 0.35], 'clamp'),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const SCREENS = [require('../../../assets/onboarding/log.jpg'), require('../../../assets/onboarding/ranks.jpg'), require('../../../assets/onboarding/test.jpg')];
const SCREEN_RATIO = 1434 / 660;

/** A real capture of the app inside a phone frame; it settles in when its slide becomes active. */
function ScreenPhone({ source, active, height }: { source: number; active: boolean; height: number }) {
  const t = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    t.set(withTiming(active ? 1 : 0.92, { duration: 420, easing: motion.easeOut }));
  }, [active, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.get(), [0.92, 1], [0.96, 1], 'clamp') }],
    opacity: interpolate(t.get(), [0.92, 1], [0.6, 1], 'clamp'),
  }));
  const width = Math.round(height / SCREEN_RATIO);
  return (
    <Animated.View style={[styles.phone, { width: width + 8, height: height + 8, borderRadius: width * 0.17 }, style]}>
      <Image source={source} style={{ width, height, borderRadius: width * 0.15 }} contentFit="cover" transition={150} />
      <View style={[styles.island, { top: height * 0.018, width: width * 0.3, height: height * 0.032 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: 8, paddingHorizontal: space.xxl },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: space.lg },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  footer: { paddingHorizontal: space.md },
  disclaimer: { marginTop: 14, paddingHorizontal: space.lg, lineHeight: 15 },
  phone: {
    padding: 4,
    borderCurve: 'continuous',
    backgroundColor: '#050505',
    borderWidth: 1.5,
    borderColor: '#2A2C30',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
  },
  island: { position: 'absolute', alignSelf: 'center', borderRadius: 999, backgroundColor: '#000' },
});
