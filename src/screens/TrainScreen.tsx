import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MyWorkouts } from '../components/MyWorkouts';
import { HERO_MAX_WIDTH, PlanCarousel } from '../components/PlanCarousel';
import { PlanCompleteCard } from '../components/PlanCompleteCard';
import { TabHeader } from '../components/TabHeader';
import { getExerciseById } from '../data/exercises';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { getAllMovementCards, getAllSwimCards } from '../data/movementCards';
import { getProgramById } from '../data/programs';
import { getFocusedProgramWorkout } from '../data/programWorkouts';
import { getPlanWeek, pickHero } from '../features/plan';
import { useTabChromeInset } from '../navigation/TabBar';
import { PLAN_COUNT, type WorkoutPlan } from '../data/workoutPlans';
import { displayTitle, planDayHero } from '../features/planDisplay';
import { nextPlanDay, useActivePlanDeferred, usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { isCardHidden, useChromePrefs, useUiStore } from '../store/useUiStore';
import { useUserStore } from '../store/useUserStore';
import type { Exercise, MovementCard } from '../types';
import { Button } from '../ui/Button';
import { HeroArt } from '../ui/ExerciseArt';
import { Icon, type IconName } from '../ui/Icon';
import { Chip, SectionTitle } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { SwipeDismiss } from '../ui/SwipeDismiss';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';
import { useContentSize } from '../ui/useContentSize';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useSessionStore } from '../store/useSessionStore';
import { comebackDays, nextTrainingDay, summarizeTrainingWeek, trainingDateKeys } from '../features/retention';
import { getTodaysTrainingChoice, getTrainingFocus } from '../features/trainingFocus';
import { trackRetentionEvent } from '../services/retentionAnalytics';
import { useNow } from '../hooks/useNow';
import { getLocalDateKey } from '../utils/dateKey';

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
  const testScores = useReadinessStore((s) => s.testScores);
  const targets = useReadinessStore((s) => s.targetScores);
  const activities = useReadinessStore((s) => s.trackedSessions);
  const trainingChoice = useReadinessStore((s) => s.trainingChoice);
  const logs = useExerciseLogStore((s) => s.logs);
  const sessionActive = useSessionStore((s) => s.active);
  const [category, setCategory] = useState<MovementCard['category']>('total_body');
  const now = useNow(true, 60000);
  const dateKey = getLocalDateKey(new Date(now));

  const days = useMemo(() => (program ? getPlanWeek(program, week, profile, claimed, new Date(now)) : []), [program, week, profile, claimed, dateKey]);
  const cards = useMemo(() => [...getAllMovementCards(), ...getAllSwimCards()], []);
  const quick = cards.filter((c) => c.category === category).slice(0, 3);
  const today = getTodaysCheckIn(checkIns);
  const readiness = calculateDailyReadiness(today);
  const programInfo = program ? getProgramById(program) : undefined;
  const { plan: activePlan, pending: planPending } = useActivePlanDeferred();
  const justCompleted = usePlanLibraryStore((s) => s.justCompleted);
  const dates = useMemo(() => trainingDateKeys(logs, activities), [logs, activities]);
  const weekSummary = summarizeTrainingWeek(dates, profile?.workout_days_per_week, new Date(now));
  const next = nextTrainingDay(profile?.workout_days_per_week, dates, new Date(now));
  const gap = comebackDays(dates, new Date(now));
  const showComeback = gap !== null && !sessionActive;
  const focus = useMemo(() => getTrainingFocus(profile, testScores, targets, new Date(now)), [profile, testScores, targets, dateKey]);
  const focusMission = useMemo(() => program && focus && !activePlan && !planPending ? getFocusedProgramWorkout(program, week, profile, focus) : null, [program, week, profile, focus, activePlan, planPending]);
  const todayMission = days.find((day) => day.isToday && day.workout && !day.completed);
  const nextMission = todayMission ?? days.find((day) => !day.isPast && day.workout && !day.completed);
  const purposeMission = activePlan || planPending ? null : nextMission;
  const choice = getTodaysTrainingChoice(trainingChoice, new Date(now));
  // A swiped-away card stays away for the day, or until what it says changes.
  const dismissed = useChromePrefs((s) => s.dismissedCards);
  const comebackKey = 'comeback';
  const briefKey = `brief:${choice}:${focus?.title ?? purposeMission?.workout?.id ?? ''}`;
  const hidden = (key: string) => isCardHidden(dismissed, key, dateKey);
  const hide = (key: string, untilKey = dateKey) => () => useChromePrefs.getState().dismissCard(key, untilKey, dateKey);
  // The debrief is weekly, so swiping it away hides it until next week starts.
  const weeklyKey = `weekly:${weekSummary.startKey}`;
  const weekEndKey = getLocalDateKey(new Date(weekSummary.end.getTime() - 12 * 60 * 60 * 1000));
  const dismissAction = (dismiss: () => void) => ({
    accessibilityActions: [{ name: 'dismiss', label: 'Dismiss for today' }],
    onAccessibilityAction: (e: { nativeEvent: { actionName: string } }) => { if (e.nativeEvent.actionName === 'dismiss') dismiss(); },
  });

  useEffect(() => {
    if (showComeback) trackRetentionEvent('comeback_viewed', { source: 'train' });
  }, [showComeback]);

  const shorterSession = () => {
    useReadinessStore.getState().setTrainingChoice('shorter');
    trackRetentionEvent('comeback_started', { source: 'train', mode: 'shorter' });
    const day = activePlan ? nextPlanDay(activePlan, usePlanLibraryStore.getState().completedDayIds) : undefined;
    if (activePlan && day) {
      navigation.navigate('LibraryPlanDay', { planId: activePlan.id, dayId: day.id });
    } else if (nextMission?.workout) {
      navigation.navigate('WorkoutDetail', { workoutId: nextMission.workout.id, dateKey: nextMission.dateKey });
    } else {
      navigation.navigate('PlanBrowse');
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      <TabHeader />

      {showComeback && !hidden(comebackKey) ? (
        <SwipeDismiss key={comebackKey} style={styles.brief} onDismiss={hide(comebackKey)}>{(dismiss, guard) => (<>
          <Text variant="overline" tone="accent" {...dismissAction(dismiss)}>Welcome back</Text>
          <Text variant="question" style={{ marginTop: space.sm }}>Pick up from where you are</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.sm }}>Your history and level are still here. Choose a shorter next session and leave room to build back up.</Text>
          <Button title="Choose a shorter session" variant="primary" size="md" onPress={guard(shorterSession)} disabled={planPending} style={{ marginTop: space.md }} />
          <Button title="Adjust my training week" variant="outline" size="md" onPress={guard(() => navigation.navigate('TrainingPreferences'))} style={{ marginTop: space.sm }} />
        </>)}</SwipeDismiss>
      ) : null}

      {(focus || purposeMission?.workout?.objective || choice !== 'planned') && !hidden(briefKey) ? (
        <SwipeDismiss key={briefKey} style={styles.brief} onDismiss={hide(briefKey)}>{(dismiss, guard) => (<>
          <Text variant="overline" tone="accent" {...dismissAction(dismiss)}>{choice !== 'planned' ? 'Your choice for today' : focus ? 'Your test focus' : 'Mission purpose'}</Text>
          <Text variant="headline" style={{ marginTop: space.sm }}>{choice === 'shorter' ? 'A shorter session is ready' : choice === 'recovery' ? 'A recovery session is ready' : focus?.title ?? purposeMission?.workout?.title}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.xs }}>{choice !== 'planned' ? 'Your next workout will use this choice when you start. You can change it in your readiness check-in.' : focus?.reason ?? purposeMission?.workout?.objective}</Text>
          {focus && activePlan && choice === 'planned' ? <Text variant="footnote" tone="secondary" style={{ marginTop: space.xs }}>Use this focus alongside your chosen plan; library plans keep their exercise selection.</Text> : null}
          {focusMission && choice === 'planned' ? (
            <>
              <Button title="See focus mission" variant="outline" size="md" onPress={guard(() => navigation.navigate('WorkoutDetail', { workoutId: focusMission.id, dateKey }))} style={{ marginTop: space.md }} />
              <Text variant="footnote" tone="secondary" style={{ marginTop: space.xs }}>An option from your current program week. Swap it for a session and keep your recovery days.</Text>
            </>
          ) : null}
          <Tap feedback="opacity" onPress={guard(() => choice !== 'planned' ? useUiStore.getState().setReadiness(true) : focus ? navigation.navigate('Tabs', { screen: 'Test' }) : navigation.navigate('Plan'))} style={styles.briefLink}>
            <Text variant="subhead" tone="accent">{choice !== 'planned' ? 'Review today’s choice' : focus ? 'See test progress' : 'See weekly plan'}</Text><Icon name="arrowRight" color={color.accent} size={15} />
          </Tap>
        </>)}</SwipeDismiss>
      ) : null}

      {/* One label for one action: "See plan", "See More" and "Browse" all opened
          the same kind of thing and read as three different features. */}
      <SectionTitle
        title="Your Plan"
        action="See all"
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
      ) : planPending ? (
        <PlanCardPlaceholder />
      ) : activePlan ? (
        <ActivePlanCard
          plan={activePlan}
          onOpen={(dayId) => navigation.navigate('LibraryPlanDay', { planId: activePlan.id, dayId })}
          onOpenPlan={() => navigation.navigate('LibraryPlanDetail', { planId: activePlan.id })}
        />
      ) : program ? (
        days.some((d) => d.workout) ? (
          <PlanCarousel days={days} onOpen={(d) => navigation.navigate('WorkoutDetail', { workoutId: d.workout!.id, dateKey: d.dateKey })} />
        ) : (
          <EmptyPlan title="Recovery week" body="No missions are scheduled this week. Rest, then come back ready." />
        )
      ) : (
        <ChooseProgram onPress={() => navigation.navigate('PlanBrowse')} />
      )}
      {!activePlan && !planPending && programInfo ? (
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
          {programInfo.name} · Week {week} of {programInfo.duration_weeks}
        </Text>
      ) : null}

      {hidden(weeklyKey) ? null : (
      <SwipeDismiss key={weeklyKey} style={styles.weeklySpace} onDismiss={hide(weeklyKey, weekEndKey)}>{(dismiss, guard) => (
      <Tap
        feedback="highlight"
        baseColor={color.surface}
        pressedColor={color.surfacePressed}
        style={styles.weekly}
        onPress={guard(() => navigation.navigate('WeeklyDebrief', { weekStart: weekSummary.startKey }))}
        accessibilityLabel="Open weekly debrief"
        {...dismissAction(dismiss)}
      >
        <View style={{ flex: 1 }}>
          <Text variant="headline">Weekly debrief</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.xxs }}>{weekSummary.trainingDays} / {weekSummary.currentTarget} training days this week · Next: {next.label}</Text>
          <Text variant="footnote" tone="tertiary" style={{ marginTop: space.xxs }}>Review your week and choose your next focus.</Text>
        </View>
        <Icon name="arrowRight" size={18} color={color.textSecondary} />
      </Tap>
      )}</SwipeDismiss>
      )}

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
        {program && !activePlan && !planPending ? <ToolRow icon="calendar" title="Weekly plan" subtitle="Seven days at a glance" onPress={() => navigation.navigate('Plan')} /> : null}
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

/** Holds the plan card's exact footprint for the frame before the plan is read, so nothing below it jumps. */
function PlanCardPlaceholder() {
  const { width } = useContentSize();
  const w = Math.round(Math.min(width * 0.8, HERO_MAX_WIDTH));
  return <View style={[styles.emptyCard, { width: w, height: Math.round(w * 1.1) }]} accessibilityLabel="Loading your plan" />;
}

function ChooseProgram({ onPress }: { onPress: () => void }) {
  const { width } = useContentSize();
  const w = Math.round(Math.min(width * 0.8, HERO_MAX_WIDTH));
  return (
    <View style={[styles.emptyCard, { width: w, height: Math.round(w * 1.1) }]}>
      <HeroArt exercise={getExerciseById('deadlift')} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(8,9,11,0.97)']} locations={[0.3, 0.85]} style={StyleSheet.absoluteFill} />
      <View style={styles.emptyBottom}>
        <Text variant="hero">PICK YOUR PLAN</Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 8, marginBottom: space.lg }}>
          Choose a starting point for your goals, time and gear. Your next session will be waiting here.
        </Text>
        <Button title="Browse plans" onPress={onPress} size="md" />
      </View>
    </View>
  );
}

/** The followed library plan: its next day as a hero card. */
function ActivePlanCard({ plan, onOpen, onOpenPlan }: { plan: WorkoutPlan; onOpen: (dayId: string) => void; onOpenPlan: () => void }) {
  const { width } = useContentSize();
  const completed = usePlanLibraryStore((s) => s.completedDayIds);
  const cycle = usePlanLibraryStore((s) => s.cycle);
  const day = nextPlanDay(plan, completed);
  if (!day) return null;
  const doneCount = plan.days.filter((d) => completed.includes(d.id)).length;
  const w = Math.round(Math.min(width * 0.8, HERO_MAX_WIDTH));
  return (
    // The card and the Start button did the same thing and were announced as two
    // separate controls. The card stays tappable; only the button is announced.
    <Tap onPress={() => onOpen(day.id)} scaleTo={0.98} style={[styles.emptyCard, { width: w, height: Math.round(w * 1.1) }]} accessible={false}>
      <HeroArt exercise={planDayHero(day)} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(8,9,11,0.97)']} locations={[0.3, 0.85]} style={StyleSheet.absoluteFill} />
      <View style={styles.emptyBottom}>
        <Text variant="overline" tone="accent">
          {plan.days.length > 1
            ? `${doneCount} of ${plan.days.length} done${cycle ? ` · Round ${cycle + 1}` : ''}`
            : 'Up next'}
        </Text>
        <Text variant="hero" style={{ marginTop: 6 }} numberOfLines={2}>
          {displayTitle(day.title)}
        </Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 6 }} numberOfLines={2}>
          {plan.title} · ~{day.estimated_minutes} min
        </Text>
        <Button
          title={`Start ${day.label}`}
          icon="play"
          onPress={() => onOpen(day.id)}
          size="md"
          style={{ marginTop: space.lg }}
        />
        {/* Tapping the card only ever opened the next day; this is the way to any other. */}
        <Tap feedback="opacity" hitSlop={8} onPress={onOpenPlan} style={{ marginTop: space.sm, alignSelf: 'center' }} accessibilityLabel="Pick another day">
          <Text variant="subhead" tone="secondary">Pick another day</Text>
        </Tap>
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
  brief: { marginHorizontal: space.gutter, marginBottom: space.lg, padding: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  briefLink: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs, paddingVertical: space.sm, marginTop: space.xs },
  // Margins sit on the swipe wrapper so the space closes with the card.
  weeklySpace: { marginHorizontal: space.gutter, marginTop: space.lg },
  weekly: { padding: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, flexDirection: 'row', alignItems: 'center', gap: space.md },
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
