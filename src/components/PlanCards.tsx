import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { WorkoutPlan } from '../data/workoutPlans';
import { displayTitle, planHero, planMeta, planMinutes } from '../features/planDisplay';
import { HeroArt } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';

/** Portrait cover card for carousels ("Matched to you", onboarding). */
function PlanCardBase({
  plan,
  width,
  tag,
  selected,
  onPress,
}: {
  plan: WorkoutPlan;
  width: number;
  tag?: string | null;
  selected?: boolean;
  onPress: () => void;
}) {
  const minutes = planMinutes(plan);
  return (
    <Tap
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.card, { width, height: Math.round(width * 1.18) }, selected && styles.cardSelected]}
      accessibilityLabel={`${plan.title}${tag ? `, ${tag}` : ''}`}
      accessibilityState={{ selected: !!selected }}
    >
      <HeroArt exercise={planHero(plan)} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,7,9,0.96)']} locations={[0.3, 0.9]} style={StyleSheet.absoluteFill} />
      {tag ? (
        <View style={styles.tag}>
          <Text variant="subhead" style={{ color: '#FFF' }}>
            {tag}
          </Text>
        </View>
      ) : null}
      {selected ? (
        <View style={styles.check}>
          <Icon name="check" size={16} color="#000" weight="bold" />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text variant="hero" numberOfLines={2}>
          {displayTitle(plan.title)}
        </Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 6 }} numberOfLines={1}>
          {planMeta(plan)}
        </Text>
        {minutes ? (
          <Text variant="footnote" tone="tertiary" style={{ marginTop: 4 }}>
            ~{minutes} min per session
          </Text>
        ) : null}
      </View>
    </Tap>
  );
}

/** Compact list row for browsing. */
function PlanRowBase({ plan, last, badge, onOpen }: { plan: WorkoutPlan; last?: boolean; badge?: string | null; onOpen: (plan: WorkoutPlan) => void }) {
  return (
    <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} onPress={() => onOpen(plan)} style={styles.row} accessibilityLabel={plan.title}>
      <HeroArt exercise={planHero(plan)} style={styles.thumb} />
      <View style={[styles.rowBody, !last && styles.divider]}>
        <View style={{ flex: 1 }}>
          {badge ? (
            <Text variant="caption" tone="accent" style={{ marginBottom: 3 }}>
              {badge.toUpperCase()}
            </Text>
          ) : null}
          <Text variant="headline" style={{ fontSize: 18 }} numberOfLines={2}>
            {plan.title}
          </Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 4 }} numberOfLines={1}>
            {planMeta(plan)}
          </Text>
        </View>
        <Icon name="arrowRight" size={18} color={color.textSecondary} />
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: color.surface },
  cardSelected: { borderWidth: 2, borderColor: color.accent },
  tag: {
    position: 'absolute',
    top: space.lg,
    left: space.lg,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: color.accent,
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: space.lg,
    right: space.lg,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.gutter },
  thumb: { width: 96, height: 96, borderRadius: radius.md, borderCurve: 'continuous' },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: space.md, paddingRight: space.gutter, minHeight: 128, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
});

// Memoised: the browse list is 528 plans, and every keystroke in its search box
// re-rendered each mounted row (each of which derives its cover art from the plan).
// Plans are immutable bundled data, so identity comparison is enough.
export const PlanCard = React.memo(PlanCardBase);
export const PlanRow = React.memo(PlanRowBase);
