import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MyWorkouts } from '../components/MyWorkouts';
import { PlanCarousel } from '../components/PlanCarousel';
import { PlanCompleteCard } from '../components/PlanCompleteCard';
import { TabHeader } from '../components/TabHeader';
import { getExerciseById } from '../data/exercises';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { getAllMovementCards, getAllSwimCards } from '../data/movementCards';
import { getProgramById } from '../data/programs';
import { getPlanWeek, pickHero } from '../features/plan';
import { useTabChromeInset } from '../navigation/TabBar';
import { PLAN_COUNT, type WorkoutPlan } from '../data/workoutPlans';
import { displayTitle, planDayHero } from '../features/planDisplay';
import { nextPlanDay, useActivePlan, usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useUiStore } from '../store/useUiStore';
import { useUserStore } from '../store/useUserStore';
import type { Exercise, MovementCard } from '../types';
import { Button } from '../ui/Button';
import { HeroArt } from '../ui/ExerciseArt';
import { Icon, type IconName } from '../ui/Icon';
import { Chip, SectionTitle } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';

const CATEGORIES: { id: MovementCard['category']; label: string }[] = [
  { id: 'total_body', label: 'Total body' },
  { id: 'core', label: 'Core' },
  { id: 'ruck', label: 'Ruck' },
  { id: 'swim', label: 'Swim' },
];

export function cardHero(card: MovementCard) {
  return pickHero(card.sections.flatMap((s) => s.exercises.map((ce) => getExerciseById(ce.exercise_id)).filter((e): e is Exercise => !!e)));
}

export default function TrainScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottom = useTabChromeInset();
  const scrollRef = React.useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const program = useProgramStore((s) => s.selectedProgram);
  const week = useProgramStore((s) => s.currentWeek);
  const profile = useUserStore((s) => s.profile);
  const claimed = useUserStore((s) => s.progress.claimed_missions);
  const checkIns = useReadinessStore((s) => s.checkIns);
  const [category, setCategory] = useState<MovementCard['category']>('total_body');

  const days = useMemo(() => (program ? getPlanWeek(program, week, profile, claimed) : []), [program, week, profile, claimed]);
  const cards = useMemo(() => [...getAllMovementCards(), ...getAllSwimCards()], []);
  const quick = cards.filter((c) => c.category === category).slice(0, 3);
  const today = getTodaysCheckIn(checkIns);
  const readiness = calculateDailyReadiness(today);
  const programInfo = program ? getProgramById(program) : undefined;
  const activePlan = useActivePlan();
  const justCompleted = usePlanLibraryStore((s) => s.justCompleted);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      <TabHeader />

      <SectionTitle
        title="Your Plan"
        action={activePlan ? 'See plan' : program ? 'See More' : 'Browse'}
        onAction={() =>
          activePlan
            ? navigation.navigate('LibraryPlanDetail', { planId: activePlan.id })
            : program
              ? navigation.navigate('Plan')
              : navigation.navigate('PlanBrowse')
        }
        style={styles.section}
      />
      {justCompleted ? (
        <PlanCompleteCard />
      ) : activePlan ? (
        <ActivePlanCard plan={activePlan} onOpen={(dayId) => navigation.navigate('LibraryPlanDay', { planId: activePlan.id, dayId })} />
      ) : program ? (
        days.some((d) => d.workout) ? (
          <PlanCarousel days={days} onOpen={(d) => navigation.navigate('WorkoutDetail', { workoutId: d.workout!.id, dateKey: d.dateKey })} />
        ) : (
          <EmptyPlan title="Recovery week" body="No missions are scheduled this week. Rest, then come back ready." />
        )
      ) : (
        <ChooseProgram onPress={() => navigation.navigate('PlanBrowse')} />
      )}
      {!activePlan && programInfo ? (
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
          {programInfo.name} · Week {week} of {programInfo.duration_weeks}
        </Text>
      ) : null}

      <MyWorkouts />

      <SectionTitle
        title="Quick Workouts"
        action="See all"
        onAction={() => navigation.navigate('CardLibrary', { category })}
        style={[styles.section, { marginTop: space.xxl }]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} active={c.id === category} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>
      <Animated.View key={category} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} layout={LinearTransition.duration(220)}>
        {quick.map((card, i) => (
          <QuickRow key={card.id} card={card} last={i === quick.length - 1} onPress={() => navigation.navigate('CardDetail', { cardId: card.id })} />
        ))}
      </Animated.View>

      <SectionTitle title="Field Tools" style={[styles.section, { marginTop: space.xxl }]} />
      <View style={{ gap: space.md, paddingHorizontal: space.gutter }}>
        <ToolRow icon="run" title="Run or ruck" subtitle="GPS distance, pace and elevation" onPress={() => navigation.navigate('RunTracker')} />
        <ToolRow
          icon="pulse"
          title="Readiness check-in"
          subtitle={today ? `${readiness} · ${readiness >= 75 ? 'Train as planned' : readiness >= 50 ? 'Control volume' : 'Recovery priority'}` : 'Sleep, energy and soreness'}
          onPress={() => useUiStore.getState().setReadiness(true)}
        />
        <ToolRow icon="list" title="Exercise library" subtitle={`${EXERCISE_LIBRARY.length} movements with video`} onPress={() => navigation.navigate('ExerciseLibrary')} />
        <ToolRow icon="book" title="Workout plans" subtitle={`${PLAN_COUNT} plans with video`} onPress={() => navigation.navigate('PlanBrowse')} />
        {program && !activePlan ? <ToolRow icon="calendar" title="Weekly plan" subtitle="Seven days at a glance" onPress={() => navigation.navigate('Plan')} /> : null}
      </View>
    </ScrollView>
  );
}

function QuickRow({ card, last, onPress }: { card: MovementCard; last: boolean; onPress: () => void }) {
  const difficulty = card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1);
  return (
    <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} onPress={onPress} style={styles.quick} accessibilityLabel={card.name}>
      <HeroArt exercise={cardHero(card)} style={styles.quickThumb} />
      <View style={[styles.quickBody, !last && styles.quickDivider]}>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ fontSize: 18 }} numberOfLines={1}>
            {card.name} · {difficulty}
          </Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 4 }}>
            {card.estimated_duration} mins
          </Text>
        </View>
        <Icon name="arrowRight" size={18} color={color.textSecondary} />
      </View>
    </Tap>
  );
}

function ToolRow({ icon, title, subtitle, onPress }: { icon: IconName; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} onPress={onPress} style={styles.tool} accessibilityLabel={title}>
      <View style={styles.toolIcon}>
        <Icon name={icon} size={30} color={color.text} weight="light" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="headline" style={{ fontSize: 18 }}>
          {title}
        </Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 3 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Tap>
  );
}

function ChooseProgram({ onPress }: { onPress: () => void }) {
  const { width } = useWindowDimensions();
  const w = Math.round(width * 0.8);
  return (
    <View style={[styles.emptyCard, { width: w, height: Math.round(w * 1.1) }]}>
      <HeroArt exercise={getExerciseById('deadlift')} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(8,9,11,0.97)']} locations={[0.3, 0.85]} style={StyleSheet.absoluteFill} />
      <View style={styles.emptyBottom}>
        <Text variant="hero">PICK YOUR PLAN</Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 8, marginBottom: space.lg }}>
          Hundreds of plans with video, matched to your goals, days and gear.
        </Text>
        <Button title="Browse plans" onPress={onPress} size="md" />
      </View>
    </View>
  );
}

/** The followed library plan: its next day as a hero card. */
function ActivePlanCard({ plan, onOpen }: { plan: WorkoutPlan; onOpen: (dayId: string) => void }) {
  const { width } = useWindowDimensions();
  const completed = usePlanLibraryStore((s) => s.completedDayIds);
  const cycle = usePlanLibraryStore((s) => s.cycle);
  const day = nextPlanDay(plan, completed);
  const w = Math.round(width * 0.8);
  return (
    <Tap onPress={() => onOpen(day.id)} scaleTo={0.98} style={[styles.emptyCard, { width: w, height: Math.round(w * 1.1) }]} accessibilityLabel={`Next workout, ${day.title}`}>
      <HeroArt exercise={planDayHero(day)} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(8,9,11,0.97)']} locations={[0.3, 0.85]} style={StyleSheet.absoluteFill} />
      <View style={styles.emptyBottom}>
        <Text variant="overline" tone="accent">
          {plan.days.length > 1 ? `${day.label} of ${plan.days.length}${cycle ? ` · Round ${cycle + 1}` : ''}` : 'Up next'}
        </Text>
        <Text variant="hero" style={{ marginTop: 6 }} numberOfLines={2}>
          {displayTitle(day.title)}
        </Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 6 }} numberOfLines={1}>
          {plan.title} · ~{day.estimated_minutes} min
        </Text>
        <Button title="Start workout" icon="play" onPress={() => onOpen(day.id)} size="md" style={{ marginTop: space.lg }} />
      </View>
    </Tap>
  );
}

function EmptyPlan({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.restCard]}>
      <Icon name="moon" size={30} color={color.textSecondary} />
      <Text variant="headline" style={{ marginTop: space.md }}>
        {title}
      </Text>
      <Text variant="callout" tone="secondary" align="center" style={{ marginTop: 6 }}>
        {body}
      </Text>
      {action && onAction ? <Button title={action} variant="secondary" size="md" onPress={onAction} style={{ marginTop: space.lg }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  section: { paddingHorizontal: space.gutter, marginTop: space.sm, marginBottom: space.md },
  chips: { paddingHorizontal: space.gutter, gap: 10, paddingBottom: space.md },
  quick: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.gutter },
  quickThumb: { width: 96, height: 96, borderRadius: radius.md, borderCurve: 'continuous' },
  quickBody: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: space.md, paddingRight: space.gutter, height: 128 },
  quickDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  tool: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: radius.md },
  toolIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignSelf: 'center',
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: color.surface,
  },
  emptyBottom: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xl },
  restCard: {
    marginHorizontal: space.gutter,
    paddingVertical: space.xxxl,
    paddingHorizontal: space.xl,
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
  },
});
