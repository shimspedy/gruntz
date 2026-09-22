import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProgramRecommendation } from '../../services/adaptiveCoach';
import type { TrainingProgram } from '../../types';
import { HeroArt } from '../../ui/ExerciseArt';
import { Icon } from '../../ui/Icon';
import { LogoMark } from '../../ui/Logo';
import { Bar } from '../../ui/Progress';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, motion, radius, space } from '../../ui/tokens';
import { getExerciseById } from '../../data/exercises';

const STEPS = ['Reading your answers…', 'Matching plans to your goals…', 'Building week one…'];
const MILITARY_STEPS = ['Reading your answers…', 'Matching your branch standard…', 'Building week one…'];

/** Big counter, blue bar, three checklist lines that light up in turn. */
export function Generating({ onDone, military }: { onDone: () => void; military?: boolean }) {
  const steps = military ? MILITARY_STEPS : STEPS;
  const [pct, setPct] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const start = Date.now();
    const total = 3400;
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / total);
      // Hesitates in the middle like real work, then settles.
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2.4) / 2;
      setPct(Math.round(eased * 100));
      if (t >= 1 && !done.current) {
        done.current = true;
        clearInterval(id);
        haptic.success();
        setTimeout(onDone, 450);
      }
    }, 30);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <View style={styles.center}>
      <Text style={styles.pct} tabular>
        {pct}%
      </Text>
      <Text variant="question" align="center" style={{ marginTop: 6 }}>
        Building your plan…
      </Text>
      <Bar progress={pct / 100} height={6} duration={120} style={styles.genBar} />
      <View style={{ marginTop: space.xl, gap: 10, alignSelf: 'center', alignItems: 'flex-start' }}>
        {steps.map((s, i) => {
          const lit = pct >= (i + 1) * 30;
          return (
            <View key={s} style={styles.genRow}>
              <Icon name="check" size={14} color={lit ? color.accent : color.textQuaternary} weight="bold" />
              <Text variant="callout" style={{ color: lit ? color.text : color.textTertiary }}>
                {s}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** The recommendation, with its phases laid out as the road ahead. */
export function PlanReady({
  program,
  recommendation,
  daysPerWeek,
}: {
  program?: TrainingProgram;
  recommendation: ProgramRecommendation;
  daysPerWeek: number;
}) {
  const { width } = useWindowDimensions();
  const finish = new Date();
  finish.setDate(finish.getDate() + (program?.duration_weeks ?? 8) * 7);
  const hero = getExerciseById(program?.id === 'recon' ? 'pullups' : program?.id === 'raider' ? 'deadlift' : 'goblet_squat');

  return (
    <View style={{ flex: 1, paddingHorizontal: space.gutter }}>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text variant="question" align="center">
          Your plan is ready
        </Text>
        <Text variant="callout" tone="secondary" align="center" style={{ marginTop: 6 }}>
          Finish your first block by
        </Text>
        <View style={styles.datePill}>
          <Text variant="subhead">{finish.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(420)} style={[styles.planCard, { height: width * 0.62 }]}>
        <HeroArt exercise={hero} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,7,9,0.95)']} locations={[0.25, 0.9]} style={StyleSheet.absoluteFill} />
        <View style={styles.planCopy}>
          <Text variant="hero">{(program?.name ?? recommendation.title).toUpperCase()}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 4 }}>
            {program?.duration_weeks ?? 8} weeks · {daysPerWeek} days a week
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(420)} style={{ marginTop: space.lg }}>
        <Text variant="callout" tone="secondary">
          {recommendation.reason}
        </Text>
      </Animated.View>

      <View style={{ marginTop: space.lg }}>
        {(program?.phases ?? []).slice(0, 4).map((p, i, arr) => (
          <Animated.View key={p.phase_number} entering={FadeInDown.delay(300 + i * motion.stagger).duration(360)} style={styles.phase}>
            <View style={styles.phaseRail}>
              <View style={[styles.phaseDot, i === 0 && { backgroundColor: color.accent, borderColor: color.accent }]} />
              {i < arr.length - 1 ? <View style={styles.phaseLine} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: space.md }}>
              <Text variant="headline">{p.name}</Text>
              <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
                Weeks {p.weeks[0]}–{p.weeks[1]} · {p.focus}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/** "Make a promise with yourself": lines resolve one by one, then press and hold to sign. */
export function Commit({ days, onSigned }: { days: number; onSigned: () => void }) {
  const { width, height } = useWindowDimensions();
  const hold = useSharedValue(0);
  const flood = useSharedValue(0);
  const [signed, setSigned] = useState(false);

  const finish = () => {
    setSigned(true);
    haptic.success();
    flood.set(withTiming(1, { duration: 650, easing: Easing.bezier(0.65, 0, 0.35, 1) }, (ok) => ok && scheduleOnRN(onSigned)));
  };

  // The fill itself is the timer: reaching 100% signs; letting go early drains it.
  const signedRef = useRef(false);
  const lastTap = useRef(0);
  const pressIn = () => {
    if (signedRef.current) return;
    haptic.soft();
    hold.set(
      withTiming(1, { duration: 1400, easing: Easing.linear }, (done) => {
        if (done) scheduleOnRN(complete);
      }),
    );
  };
  const pressOut = () => {
    if (signedRef.current) return;
    cancelAnimation(hold);
    hold.set(withTiming(0, { duration: 250 }));
  };
  const complete = () => {
    if (signedRef.current) return;
    signedRef.current = true;
    finish();
  };

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + hold.get() * 0.35 }],
    opacity: 0.25 + hold.get() * 0.75,
  }));
  const print = useAnimatedStyle(() => ({ opacity: 0.55 + hold.get() * 0.45 }));
  const floodStyle = useAnimatedStyle(() => {
    const d = Math.hypot(width, height) * 2.2;
    return {
      width: d,
      height: d,
      borderRadius: d / 2,
      transform: [{ scale: interpolate(flood.get(), [0, 1], [0.04, 1]) }],
      opacity: flood.get() > 0 ? 1 : 0,
    };
  });

  // "No excuses, no quitting" blames the athlete for a lapse before they have had
  // one. The commitment is to showing up, and to coming back when a week goes wrong.
  const lines = ['I\u2019m training with Gruntz', `${days} times a week`, 'And I show up again after a miss'];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.commitCopy}>
        <Animated.View entering={FadeIn.delay(200).duration(700)}>
          <Text variant="question" align="center" style={{ fontSize: 21 }}>
            {lines[0]}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(1100).duration(700)}>
          <Text variant="question" align="center" style={{ fontSize: 21, fontFamily: font.bold }}>
            {lines[1]}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(2000).duration(700)}>
          <Text variant="body" tone="secondary" align="center" style={{ marginTop: space.xl }}>
            {lines[2]}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(2800).duration(600)} style={styles.signWrap}>
        <Pressable
          onPressIn={pressIn}
          onPressOut={pressOut}
          onLongPress={() => {}}
          delayLongPress={5000}
          // A sustained hold is hard with a tremor or one hand: a double tap does it too.
          onPress={() => {
            const now = Date.now();
            if (now - lastTap.current < 400) complete();
            lastTap.current = now;
          }}
          style={styles.signTarget}
          accessibilityRole="button"
          accessibilityLabel="Press and hold to commit"
          accessibilityHint="Hold for about a second, or double tap"
          onAccessibilityTap={complete}
        >
          <Animated.View style={[styles.signRing, ring]} />
          <Animated.View style={print}>
            <Fingerprint />
          </Animated.View>
        </Pressable>
        <Text variant="caption" tone="tertiary" style={{ marginTop: 14 }}>
          {signed ? 'Signed' : 'Hold to sign'}
        </Text>
      </Animated.View>

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
        <Animated.View style={[{ backgroundColor: color.storySky }, floodStyle]} />
      </View>
    </View>
  );
}

function Fingerprint() {
  return (
    <Svg width={64} height={72} viewBox="0 0 64 72" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round">
      <Path d="M12 20c5-8 13-12 20-12s15 4 20 12" />
      <Path d="M8 34c1-12 11-20 24-20s23 8 24 20" />
      <Path d="M14 58c-3-6-4-13-3-20 1-9 9-16 21-16s20 7 21 16c1 5 0 10-2 14" />
      <Path d="M22 64c-4-6-6-14-5-22 1-7 7-12 15-12s14 5 15 12c1 7-1 13-4 18" />
      <Path d="M31 68c-3-6-5-14-4-22 0-3 2-6 5-6s5 3 5 6c1 8-1 15-4 20" />
      <Path d="M40 67c2-5 3-11 2-17" />
    </Svg>
  );
}

/** Notification priming: a quiet phone with Gruntz's reminder sliding in. */
export function NotifyPrime() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(500, withTiming(1, { duration: 520, easing: motion.easeOut })));
  }, [t]);
  const banner = useAnimatedStyle(() => ({ opacity: t.get(), transform: [{ translateY: interpolate(t.get(), [0, 1], [-24, 0]) }, { scale: 0.96 + t.get() * 0.04 }] }));
  const now = new Date();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.lockPhone}>
        <Text style={styles.lockTime} tabular>
          {now.getHours() % 12 || 12}:{String(now.getMinutes()).padStart(2, '0')}
        </Text>
        <Animated.View style={[styles.notif, banner]}>
          <View style={styles.notifIcon}>
            <LogoMark size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" tone="secondary">
                Gruntz
              </Text>
              <Text variant="caption" tone="tertiary">
                now
              </Text>
            </View>
            <Text variant="subhead" style={{ marginTop: 1 }} numberOfLines={1}>
              Today’s mission is ready
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              Foundation Strength · 35 min
            </Text>
          </View>
        </Animated.View>
        <LinearGradient colors={['rgba(0,0,0,0)', color.bg]} style={styles.lockFade} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, paddingBottom: 80 },
  pct: { fontFamily: font.bold, fontSize: 56, color: color.text },
  genBar: { alignSelf: 'stretch', marginTop: space.lg },
  genRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePill: {
    alignSelf: 'center',
    marginTop: space.sm,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    justifyContent: 'center',
  },
  planCard: { marginTop: space.lg, borderRadius: radius.xl, borderCurve: 'continuous', overflow: 'hidden' },
  planCopy: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg },
  phase: { flexDirection: 'row', gap: 14 },
  phaseRail: { alignItems: 'center', width: 14 },
  phaseDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color.lineStrong, marginTop: 5 },
  phaseLine: { flex: 1, width: 2, backgroundColor: color.line, marginTop: 4 },
  commitCopy: { marginTop: '28%', paddingHorizontal: space.xl, gap: 6 },
  signWrap: { position: 'absolute', left: 0, right: 0, bottom: 60, alignItems: 'center' },
  signTarget: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  signRing: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: color.storySky },
  lockPhone: {
    width: 290,
    height: 330,
    borderRadius: 44,
    borderCurve: 'continuous',
    borderWidth: 4,
    borderColor: '#2A2C30',
    backgroundColor: '#0B0C0E',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lockTime: { fontFamily: font.bold, fontSize: 58, color: 'rgba(255,255,255,0.35)', marginTop: 46 },
  notif: {
    marginTop: 26,
    width: 262,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(44,44,48,0.92)',
  },
  notifIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  lockFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
});
