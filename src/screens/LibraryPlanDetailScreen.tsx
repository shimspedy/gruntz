import React from 'react';
import { Alert, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { getWorkoutPlan, type PlanDay } from '../data/workoutPlans';
import { displayTitle, EQUIPMENT_LABEL, planDayHero, planHero, planMeta, planMinutes } from '../features/planDisplay';
import { nextPlanDay, planProgress, usePlanLibraryStore } from '../store/usePlanLibraryStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { ExerciseThumb, HeroArt } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, NavHeader, Stat } from '../ui/Layout';
import { Bar } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { plural } from '../features/plan';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';

export default function LibraryPlanDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { params } = useRoute<RouteProp<RootStackParamList, 'LibraryPlanDetail'>>();
  const plan = getWorkoutPlan(params.planId);
  const activeId = usePlanLibraryStore((s) => s.activePlanId);
  const completed = usePlanLibraryStore((s) => s.completedDayIds);
  const cycle = usePlanLibraryStore((s) => s.cycle);

  if (!plan) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Plan not found" body="It may have been removed from the library." />
      </View>
    );
  }

  const following = activeId === plan.id;
  const next = following ? nextPlanDay(plan, completed) : null;
  const progress = planProgress(plan, completed);
  const minutes = planMinutes(plan);
  const s = plan.summary;

  const follow = () => {
    const doFollow = () => {
      haptic.success();
      usePlanLibraryStore.getState().follow(plan.id);
      // Following used to be a bare toast with nothing to do next. Say what it
      // changed and offer the obvious next step.
      const day = nextPlanDay(plan, usePlanLibraryStore.getState().completedDayIds);
      toast(`Following ${plan.title} · shows on Train`, {
        tone: 'success',
        icon: 'check',
        action: { label: 'Start', onPress: () => navigation.navigate('LibraryPlanDay', { planId: plan.id, dayId: day.id }) },
      });
    };
    if (activeId && activeId !== plan.id) {
      const current = getWorkoutPlan(activeId);
      Alert.alert(
        'Switch plans?',
        `${current?.title ?? 'Your current plan'} keeps its progress and waits for you. You'll start ${plan.title} where you left off.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch', onPress: doFollow },
        ],
      );
    } else doFollow();
  };

  const stop = () =>
    Alert.alert(`Stop following ${plan.title}?`, `Your ${progress.done} of ${progress.total} days are saved, so you can pick this plan back up later.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop following',
        style: 'destructive',
        onPress: () => {
          haptic.warning();
          usePlanLibraryStore.getState().unfollow();
        },
      },
    ]);

  const openDay = (day: PlanDay) => navigation.navigate('LibraryPlanDay', { planId: plan.id, dayId: day.id });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <HeroArt exercise={planHero(plan)} style={{ width, height: Math.round(width * 1.05) }}>
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,1)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroCopy}>
            {following ? (
              <View style={styles.pill}>
                <Text variant="subhead" style={{ color: '#FFF' }}>
                  Following
                </Text>
              </View>
            ) : null}
            <Text variant="display">{displayTitle(plan.title)}</Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: 6 }}>
              {planMeta(plan)}
            </Text>
          </View>
        </HeroArt>

        {plan.description ? (
          <Text variant="body" tone="secondary" style={styles.description}>
            {plan.description}
          </Text>
        ) : null}

        <View style={styles.stats}>
          {plan.kind === 'program' && s.days_per_week ? <Stat label="Days / week" value={String(s.days_per_week)} style={styles.stat} /> : null}
          {plan.kind === 'program' && s.duration_weeks ? <Stat label="Weeks" value={String(s.duration_weeks)} style={styles.stat} /> : null}
          {minutes ? <Stat label="Minutes" value={`~${minutes}`} style={styles.stat} /> : null}
        </View>

        {following ? (
          <View style={styles.progress}>
            <View style={styles.progressRow}>
              <Text variant="subhead" tone="secondary">
                {progress.done} of {progress.total} days done{cycle > 0 ? ` · Round ${cycle + 1}` : ''}
              </Text>
              <Text variant="subhead" tone="secondary" tabular>
                {Math.round(progress.fraction * 100)}%
              </Text>
            </View>
            <Bar progress={progress.fraction} height={6} />
          </View>
        ) : null}

        <View style={styles.facts}>
          <Fact icon="dumbbell" text={EQUIPMENT_LABEL[plan.match.equipment_access]} />
          {plan.match.goals.length ? <Fact icon="flag" text={plan.match.goals.join(' · ')} /> : null}
          {s.target_gender && s.target_gender !== 'Male & Female' ? <Fact icon="person" text={`Written for ${s.target_gender.toLowerCase()} lifters`} /> : null}
        </View>

        {next ? (
          <Tap onPress={() => openDay(next)} scaleTo={0.98} style={styles.next} accessibilityLabel={`Next up, ${next.label}, ${next.title}`}>
            <ExerciseThumb exercise={planDayHero(next)} size={56} />
            <View style={{ flex: 1 }}>
              <Text variant="overline" tone="accent">
                Next up
              </Text>
              <Text variant="headline" style={{ marginTop: 2 }}>
                {next.label} · {next.title}
              </Text>
            </View>
            <Icon name="play" size={20} color={color.text} />
          </Tap>
        ) : null}

        <Text variant="section" style={styles.sectionTitle}>
          {plan.days.length === 1 ? 'Workout' : `${plan.days.length} workouts`}
        </Text>
        {plan.days.map((day, i) => {
          const weekLabel = day.week != null && day.week !== plan.days[i - 1]?.week ? `Week ${day.week}` : null;
          const done = following && completed.includes(day.id);
          return (
            <Animated.View key={day.id}>
              {weekLabel ? (
                <Text variant="overline" tone="tertiary" style={styles.weekLabel}>
                  {weekLabel}
                </Text>
              ) : null}
              <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} onPress={() => openDay(day)} style={styles.day} accessibilityLabel={`${day.label}, ${day.title}${done ? ', done' : ''}`}>
                <ExerciseThumb exercise={planDayHero(day)} size={56} />
                <View style={[styles.dayBody, i < plan.days.length - 1 && styles.divider]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="footnote" tone="tertiary">
                      {day.label}
                    </Text>
                    <Text variant="headline" style={{ fontSize: 18, marginTop: 2 }}>
                      {day.title}
                    </Text>
                    <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
                      {plural(day.exercises.length, 'exercise')} · ~{day.estimated_minutes} min
                    </Text>
                  </View>
                  {done ? <Icon name="check" size={18} color={color.success} weight="bold" /> : <Icon name="arrowRight" size={18} color={color.textSecondary} />}
                </View>
              </Tap>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.header} pointerEvents="box-none">
        <NavHeader transparent />
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <LinearGradient colors={['rgba(0,0,0,0)', color.bg]} style={styles.footerFade} pointerEvents="none" />
        {following ? (
          <Button title="Stop following" variant="secondary" onPress={stop} />
        ) : (
          <Button title="Follow this plan" onPress={follow} />
        )}
      </View>
    </View>
  );
}

function Fact({ icon, text }: { icon: 'dumbbell' | 'flag' | 'person'; text: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} size={16} color={color.textSecondary} />
      <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  heroCopy: { position: 'absolute', left: space.gutter, right: space.gutter, bottom: space.xl },
  pill: {
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: color.accent,
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  description: { paddingHorizontal: space.gutter, marginTop: space.md },
  stats: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.gutter, marginTop: space.lg },
  stat: { flex: 1 },
  progress: { paddingHorizontal: space.gutter, marginTop: space.lg, gap: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  facts: { paddingHorizontal: space.gutter, marginTop: space.lg, gap: space.xs },
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.gutter,
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  sectionTitle: { paddingHorizontal: space.gutter, marginTop: space.xxl, marginBottom: space.sm },
  weekLabel: { paddingHorizontal: space.gutter, marginTop: space.lg, marginBottom: space.xs },
  day: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.gutter },
  dayBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: space.md, paddingRight: space.gutter, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.gutter },
  footerFade: { position: 'absolute', left: 0, right: 0, top: -40, bottom: 0 },
});
