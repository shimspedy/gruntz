import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getExerciseById } from '../../data/exercises';
import { getProgramById } from '../../data/programs';
import { planHero, planMeta } from '../../features/planDisplay';
import type { PlanRecommendation } from '../../features/planRecommend';
import type { ProgramRecommendation } from '../../services/adaptiveCoach';
import { HeroArt } from '../../ui/ExerciseArt';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { color, motion, radius, space } from '../../ui/tokens';

/** Selection key: a library plan id, or `builtin:<programId>` for a Gruntz program. */
export const builtinKey = (programId: string) => `builtin:${programId}`;

const BUILTIN_ART: Record<string, string> = { basecamp: 'goblet_squat', raider: 'deadlift', recon: 'pullups' };

interface Option {
  key: string;
  title: string;
  meta: string;
  reasons: string[];
  weeks: number;
  hero: ReturnType<typeof getExerciseById>;
}

/** Onboarding result: the best-matched plan up top, other good fits underneath to switch to. */
export function PlanMatches({
  matches,
  builtIn,
  selected,
  onSelect,
}: {
  matches: PlanRecommendation[];
  /** Offered for Military Prep answers: the Gruntz program for their branch test. */
  builtIn?: ProgramRecommendation | null;
  selected: string;
  onSelect: (key: string) => void;
}) {
  const { width } = useWindowDimensions();
  const options: Option[] = matches.map((m) => ({
    key: m.plan.id,
    title: m.plan.title,
    meta: planMeta(m.plan),
    reasons: m.reasons,
    weeks: m.plan.summary.duration_weeks ?? 8,
    hero: planHero(m.plan),
  }));
  const program = builtIn ? getProgramById(builtIn.programId) : undefined;
  if (builtIn && program) {
    options.push({
      key: builtinKey(builtIn.programId),
      title: program.name,
      meta: `${program.duration_weeks} weeks · ${program.days_per_week} days a week · Gruntz program`,
      reasons: [builtIn.reason],
      weeks: program.duration_weeks,
      hero: getExerciseById(BUILTIN_ART[builtIn.programId]),
    });
  }
  const current = options.find((o) => o.key === selected) ?? options[0];
  if (!current) return null;
  const finish = new Date();
  finish.setDate(finish.getDate() + current.weeks * 7);

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

      <Animated.View key={current.key} entering={FadeIn.duration(260)} style={[styles.planCard, { height: width * 0.62 }]}>
        <HeroArt exercise={current.hero} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,7,9,0.95)']} locations={[0.25, 0.9]} style={StyleSheet.absoluteFill} />
        {current.key === options[0].key ? (
          <View style={styles.tag}>
            <Text variant="subhead" style={{ color: '#FFF' }}>
              Best match
            </Text>
          </View>
        ) : null}
        <View style={styles.planCopy}>
          <Text variant="hero" numberOfLines={2}>
            {current.title.toUpperCase()}
          </Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 4 }} numberOfLines={1}>
            {current.meta}
          </Text>
        </View>
      </Animated.View>

      {current.reasons.length ? (
        <View style={{ marginTop: space.lg, gap: 8 }}>
          {current.reasons.slice(0, 4).map((r) => (
            <View key={r} style={styles.reason}>
              <Icon name="check" size={14} color={color.accent} weight="bold" />
              <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {options.length > 1 ? (
        <>
          <Text variant="overline" tone="tertiary" style={{ marginTop: space.xl, marginBottom: space.xs }}>
            Choose your plan
          </Text>
          {options.map((o, i) => {
            const active = o.key === current.key;
            return (
              <Animated.View key={o.key} entering={FadeInDown.delay(200 + i * motion.stagger).duration(360)}>
                <Tap
                  feedback="highlight"
                  baseColor={color.bg}
                  pressedColor={color.bgRaised}
                  onPress={() => onSelect(o.key)}
                  style={[styles.option, active && styles.optionActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={o.title}
                >
                  <HeroArt exercise={o.hero} style={styles.optionThumb} />
                  <View style={{ flex: 1 }}>
                    <Text variant="headline" numberOfLines={1}>
                      {o.title}
                    </Text>
                    <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
                      {o.meta}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioOn]}>{active ? <Icon name="check" size={12} color="#000" weight="bold" /> : null}</View>
                </Tap>
              </Animated.View>
            );
          })}
          <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
            You can browse every plan from the Train tab anytime.
          </Text>
        </>
      ) : null}
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
  tag: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: color.accent,
    justifyContent: 'center',
  },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: radius.md, borderCurve: 'continuous', marginBottom: space.xs },
  optionActive: { backgroundColor: color.surface },
  optionThumb: { width: 56, height: 56, borderRadius: radius.sm, borderCurve: 'continuous' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: '#F5F5F7', borderColor: '#F5F5F7' },
});
