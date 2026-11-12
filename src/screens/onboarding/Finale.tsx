import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProgramRecommendation } from '../../services/adaptiveCoach';
import type { TrainingProgram } from '../../types';
import { HeroArt } from '../../ui/ExerciseArt';
import { Text } from '../../ui/Text';
import { color, motion, radius, space } from '../../ui/tokens';
import { getExerciseById } from '../../data/exercises';
import { useContentSize } from '../../ui/useContentSize';

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
