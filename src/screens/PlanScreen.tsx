import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getWorkoutPlan } from '../data/workoutPlans';
import { Button } from '../ui/Button';
import { getProgramById } from '../data/programs';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { formatMinutes, getPlanWeek, heroExercise, plural, workoutExercises } from '../features/plan';
import { useProgramStore } from '../store/useProgramStore';
import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { routineMinutes, useRoutineStore } from '../store/useRoutineStore';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, Group, NavHeader, Row } from '../ui/Layout';
import { Bar } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, motion, radius, space } from '../ui/tokens';

/** The week at a glance: seven rows, today marked, rest days quiet. */
export default function PlanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const program = useProgramStore((s) => s.selectedProgram);
  const week = useProgramStore((s) => s.currentWeek);
  const profile = useUserStore((s) => s.profile);
  const claimed = useUserStore((s) => s.progress.claimed_missions);
  const checkIns = useReadinessStore((s) => s.checkIns);
  const info = program ? getProgramById(program) : undefined;
  const days = useMemo(() => (program ? getPlanWeek(program, week, profile, claimed) : []), [program, week, profile, claimed]);
  const trainingDays = days.filter((d) => d.workout);
  const done = trainingDays.filter((d) => d.completed).length;
  const readiness = calculateDailyReadiness(getTodaysCheckIn(checkIns));
  const phase = info?.phases.find((p) => week >= p.weeks[0] && week <= p.weeks[1]);
  const routines = useRoutineStore((s) => s.routines);
  // This screen only ever knew about built-in programs. Someone following a plan
  // from the library saw "Your plan · Week 1 of – · 0 of 0 missions".
  const libraryPlanId = usePlanLibraryStore((s) => s.activePlanId);
  const libraryPlan = libraryPlanId ? getWorkoutPlan(libraryPlanId) : undefined;

  return (
    <View style={styles.screen}>
      <NavHeader title="This week" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false}>
        {!program ? (
          libraryPlan ? (
            <EmptyState
              icon="list"
              title={libraryPlan.title}
              body="You're following this plan from the library. Your days live on its own screen."
            >
              <Button title="Open plan" onPress={() => navigation.navigate('LibraryPlanDetail', { planId: libraryPlan.id })} />
            </EmptyState>
          ) : (
            <EmptyState icon="calendar" title="No plan yet" body="Pick a program or follow a plan from the library and your week shows up here.">
              <Button title="Browse plans" onPress={() => navigation.navigate('PlanBrowse')} />
              <Button title="Choose a program" variant="secondary" onPress={() => navigation.navigate('ProgramSelect')} />
            </EmptyState>
          )
        ) : (
        <>
        <View style={styles.head}>
          <Text variant="title">{info?.name ?? 'Your plan'}</Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 4, fontSize: 17 }}>
            Week {week} of {info?.duration_weeks ?? '–'}
            {phase ? ` · ${phase.name}` : ''}
          </Text>
          <View style={styles.progressRow}>
            <Text variant="subhead" tone="secondary" tabular>
              {done} of {trainingDays.length} workouts
            </Text>
            <Text variant="subhead" tone={readiness < 50 ? 'danger' : 'secondary'}>
              {readiness < 50 ? 'Recovery bias today' : phase?.focus ?? ''}
            </Text>
          </View>
          <Bar progress={trainingDays.length ? done / trainingDays.length : 0} height={6} style={{ marginTop: 8 }} />
        </View>

        <View style={{ marginTop: space.lg }}>
          {days.map((d, i) => {
            const w = d.workout;
            const count = workoutExercises(w).length;
            return (
              <Animated.View key={d.dateKey} entering={FadeInDown.delay(i * motion.stagger).duration(320)}>
                <Tap
                  feedback="highlight"
                  baseColor={color.bg}
                  pressedColor={color.bgRaised}
                  disabled={!w}
                  onPress={() => w && navigation.navigate('WorkoutDetail', { workoutId: w.id, dateKey: d.dateKey })}
                  style={styles.row}
                  accessibilityLabel={`${d.weekday}${w ? `, ${w.title}` : ', rest day'}`}
                >
                  <View style={styles.dateCol}>
                    <Text variant="caption" tone={d.isToday ? 'accent' : 'tertiary'} style={{ letterSpacing: 0.8 }}>
                      {d.weekday.slice(0, 3).toUpperCase()}
                    </Text>
                    <Text variant="headline" tabular style={{ fontSize: 20, color: d.isToday ? color.accent : d.isPast ? color.textTertiary : color.text }}>
                      {d.date.getDate()}
                    </Text>
                  </View>
                  {w ? (
                    <>
                      <ExerciseThumb exercise={heroExercise(w)} size={60} />
                      <View style={{ flex: 1, marginLeft: space.md }}>
                        <Text variant="headline" numberOfLines={1} style={{ color: d.isPast && !d.completed ? color.textSecondary : color.text }}>
                          {w.title}
                        </Text>
                        <Text variant="subhead" tone="secondary" style={{ marginTop: 2 }}>
                          {formatMinutes(w.estimated_duration)} · {plural(count, 'exercise')}
                        </Text>
                      </View>
                      {d.completed ? (
                        <View style={styles.done}>
                          <Icon name="check" size={13} color="#FFFFFF" weight="bold" />
                        </View>
                      ) : (
                        <Icon name="chevronRight" size={15} color={color.textTertiary} weight="semibold" />
                      )}
                    </>
                  ) : (
                    <View style={styles.rest}>
                      <Icon name="moon" size={18} color={color.textTertiary} />
                      <Text variant="callout" tone="tertiary">
                        Rest and recover
                      </Text>
                    </View>
                  )}
                </Tap>
                {routines
                  .filter((r) => r.days.includes(d.date.getDay()))
                  .map((r) => (
                    <Tap
                      key={r.id}
                      feedback="highlight"
                      baseColor={color.bg}
                      pressedColor={color.bgRaised}
                      onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })}
                      style={styles.routineRow}
                      accessibilityLabel={`${r.name}, your workout`}
                    >
                      <View style={styles.routineDot} />
                      <Text variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text variant="footnote" tone="tertiary">
                        Your workout · {routineMinutes(r)} min
                      </Text>
                    </Tap>
                  ))}
              </Animated.View>
            );
          })}
        </View>

        <Group label="Program" style={{ marginHorizontal: space.md, marginTop: space.xl }}>
          <Row icon="calendar" title="Change program" value={info?.name} onPress={() => navigation.navigate('ProgramSelect')} />
          <Row icon="grid" title="Training cards" onPress={() => navigation.navigate('CardLibrary')} />
          <Row icon="list" title="Exercise library" onPress={() => navigation.navigate('ExerciseLibrary')} />
          <Row
            icon="pencil"
            title="Plan a workout"
            onPress={() => {
              useRoutineStore.getState().newDraft();
              navigation.navigate('RoutineEditor');
            }}
          />
        </Group>
        </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  head: { paddingHorizontal: space.gutter + 4, paddingTop: space.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 12, minHeight: 84 },
  dateCol: { width: 48, alignItems: 'flex-start' },
  rest: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 60, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: color.bgRaised },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: space.gutter + 48, marginRight: space.gutter, marginBottom: 8, paddingHorizontal: 14, height: 44, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: color.lineStrong },
  routineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
  done: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
});
