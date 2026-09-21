import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { getExerciseMedia } from '../../data/exerciseMedia';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { LogoMark } from '../../ui/Logo';
import { Bar, Ring } from '../../ui/Progress';
import { RANK_ORDER, RankBadge } from '../../ui/RankBadge';
import { Text } from '../../ui/Text';
import { color, font, motion, radius, space } from '../../ui/tokens';

const SLIDES = [
  { title: 'Log every set', body: 'Reps, load and rest for every movement in your mission.' },
  { title: 'Climb the ranks', body: 'Every mission earns XP. Recruit to Apex, one day at a time.' },
  { title: 'Pass your test', body: 'Track each event against your branch standard.' },
];

export function Welcome({ onStart }: { onStart: () => void }) {
  const { width } = useWindowDimensions();
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
              <View style={styles.stage}>{i === 0 ? <SetMock active={page === 0} /> : i === 1 ? <RankMock active={page === 1} /> : <TestMock active={page === 2} />}</View>
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

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.phone}>
      <View style={styles.island} />
      {children}
    </View>
  );
}

function SetMock({ active }: { active: boolean }) {
  const media = getExerciseMedia('barbell-bench-press');
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!active) return;
    setDone(0);
    const id = setInterval(() => setDone((d) => (d >= 3 ? 0 : d + 1)), 900);
    return () => clearInterval(id);
  }, [active]);
  return (
    <View style={{ alignItems: 'center' }}>
      <Phone>
        <View style={styles.mockBubbles}>
          {['barbell-bench-press', 'pull-ups', 'barbell-squat'].map((k, i) => (
            <View key={k} style={[styles.mockBubble, i === 0 && { borderColor: '#FFFFFF', borderWidth: 2 }]}>
              <Image source={getExerciseMedia(k)?.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
          ))}
        </View>
        {media ? <Image source={media.poster} style={{ width: '100%', height: 190, marginTop: 6 }} contentFit="contain" /> : null}
      </Phone>
      <View style={styles.setCard}>
        <View style={styles.setHead}>
          {['SET', 'PREVIOUS', 'LB', 'REPS'].map((h) => (
            <Text key={h} variant="caption" tone="secondary" style={styles.setCell}>
              {h}
            </Text>
          ))}
          <View style={{ width: 30 }} />
        </View>
        {[1, 2, 3].map((n) => {
          const on = n <= done;
          return (
            <Animated.View key={n} style={[styles.setRow, on && { backgroundColor: color.accentDeep }]}>
              {[String(n), '135 x 8', '135', '8'].map((c, i) => (
                <Text key={i} variant="subhead" tone={i === 1 ? 'tertiary' : 'primary'} style={styles.setCell} tabular>
                  {c}
                </Text>
              ))}
              <View style={[styles.setCheck, on && { backgroundColor: color.accent }]}>
                <Icon name="check" size={13} color="#FFFFFF" weight="bold" />
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function RankMock({ active }: { active: boolean }) {
  const [lit, setLit] = useState(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!active) return;
    setLit(0);
    const id = setInterval(() => {
      setLit((l) => (l >= RANK_ORDER.length - 1 ? 0 : l + 1));
      pop.set(withSequence(withTiming(0.85, { duration: 90 }), withSpring(1, motion.bouncy)));
    }, 700);
    return () => clearInterval(id);
  }, [active, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const rank = RANK_ORDER[lit];
  return (
    <Phone>
      <View style={{ alignItems: 'center', paddingTop: 52 }}>
        <Animated.View style={style}>
          <RankBadge rank={rank} size={120} />
        </Animated.View>
        <Text style={styles.mockRank}>{rank}</Text>
        <Text variant="footnote" tone="secondary">
          Level {[1, 5, 10, 20, 30, 40, 50][lit]}
        </Text>
        <View style={styles.pips}>
          {RANK_ORDER.map((r, i) => (
            <RankBadge key={r} rank={r} size={i === lit ? 26 : 20} variant="pip" active={i === lit} locked={i > lit} />
          ))}
        </View>
      </View>
    </Phone>
  );
}

function TestMock({ active }: { active: boolean }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) return;
    setP(0);
    const id = setTimeout(() => setP(0.78), 200);
    return () => clearTimeout(id);
  }, [active]);
  const events = [
    { name: 'Deadlift', v: 0.9 },
    { name: 'HR Push-Ups', v: 0.72 },
    { name: 'Sprint-Drag-Carry', v: 0.64 },
    { name: 'Plank', v: 0.95 },
    { name: '2-Mile Run', v: 0.58 },
  ];
  return (
    <Phone>
      <View style={{ alignItems: 'center', paddingTop: 44 }}>
        <Ring progress={p} size={112} stroke={8} trackColor={color.surfaceHigh}>
          <Text style={styles.mockPct} tabular>
            {Math.round(p * 100)}%
          </Text>
        </Ring>
        <Text variant="footnote" tone="secondary" style={{ marginTop: 8 }}>
          Army Fitness Test
        </Text>
      </View>
      <View style={{ paddingHorizontal: 18, marginTop: 18, gap: 12 }}>
        {events.map((e, i) => (
          <View key={e.name}>
            <Text variant="caption" tone="secondary" style={{ marginBottom: 5 }}>
              {e.name}
            </Text>
            <Bar progress={active ? e.v : 0} height={5} duration={700 + i * 120} trackColor={color.surfaceHigh} />
          </View>
        ))}
      </View>
    </Phone>
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
    width: 232,
    height: 400,
    borderRadius: 44,
    borderCurve: 'continuous',
    borderWidth: 4,
    borderColor: '#2A2C30',
    backgroundColor: '#050505',
    overflow: 'hidden',
  },
  island: { position: 'absolute', top: 10, alignSelf: 'center', width: 72, height: 20, borderRadius: 10, backgroundColor: '#000', zIndex: 2 },
  mockBubbles: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 44 },
  mockBubble: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#3A3A3C', overflow: 'hidden', backgroundColor: '#000' },
  setCard: {
    marginTop: -120,
    width: 300,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#141416',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 6,
    boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
  },
  setHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 36 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44 },
  setCell: { flex: 1, textAlign: 'center' },
  setCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  mockRank: { fontFamily: font.bold, fontSize: 28, color: color.text, marginTop: 12 },
  mockPct: { fontFamily: font.bold, fontSize: 26, color: color.text },
  pips: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 24 },
});
