import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProgramRecommendation } from '../../services/adaptiveCoach';
import type { TrainingProgram } from '../../types';
import { HeroArt } from '../../ui/ExerciseArt';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Bar } from '../../ui/Progress';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, motion, radius, space } from '../../ui/tokens';
import { getExerciseById } from '../../data/exercises';
import { useContentSize } from '../../ui/useContentSize';

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
      {/* The wait is theatre, not work — anyone who does not want it can leave. */}
      <Tap
        feedback="opacity"
        hitSlop={12}
        style={{ marginTop: space.lg }}
        accessibilityLabel="Skip"
        onPress={() => {
          if (done.current) return;
          done.current = true;
          onDone();
        }}
      >
        <Text variant="subhead" tone="secondary">Skip</Text>
      </Tap>
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
  const { width } = useContentSize();
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

      <Animated.View entering={FadeInDown.delay(120).duration(420)} style={[styles.planCard, { height: Math.min(width * 0.62, 300) }]}>
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
});
