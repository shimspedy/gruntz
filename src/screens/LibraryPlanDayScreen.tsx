import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getPlanExercise, getSlotLibraryItem, getWorkoutPlan } from '../data/workoutPlans';
import { dayMinutesLabel, restLabel, slotPrescription } from '../features/planDisplay';
import { planSessionId, usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useSessionStore } from '../store/useSessionStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, motion, space } from '../ui/tokens';
import { getLocalDateKey } from '../utils/dateKey';

export default function LibraryPlanDayScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'LibraryPlanDay'>>();
  const plan = getWorkoutPlan(params.planId);
  const day = plan?.days.find((d) => d.id === params.dayId);
  const session = useSessionStore();
  const following = usePlanLibraryStore((s) => s.activePlanId === params.planId);
  const done = usePlanLibraryStore((s) => s.completedDayIds.includes(params.dayId));
  // How many exercises share each superset letter. Every row used to re-scan the
  // whole day to answer that, which is O(n squared) on a 25-exercise day.
  const groupSizes = React.useMemo(() => {
    const sizes = new Map<string, number>();
    for (const slot of day?.exercises ?? []) {
      if (slot.superset_group) sizes.set(slot.superset_group, (sizes.get(slot.superset_group) ?? 0) + 1);
    }
    return sizes;
  }, [day]);

  if (!plan || !day) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Workout not found" body="It may have been removed from the library." />
      </View>
    );
  }

  const running = session.active && session.workoutDayId === planSessionId(plan.id, day.id);

  const start = () => {
    if (running) return session.expand();
    if (session.active) {
      Alert.alert('Another workout is running', `Finish ${session.title || 'it'} first, or discard it and start this one.`, [
        { text: 'Open it', onPress: () => session.expand() },
        { text: 'Discard and start', style: 'destructive', onPress: () => { session.discard(); haptic.medium(); session.startPlanDay(plan, day, getLocalDateKey()); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    haptic.medium();
    session.startPlanDay(plan, day, getLocalDateKey());
  };

  return (
    <View style={styles.screen}>
      <NavHeader title={plan.title} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text variant="footnote" tone="tertiary">
            {day.label}
          </Text>
          <Text variant="title" style={{ marginTop: 2 }}>
            {day.title}
          </Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6, fontSize: 17 }}>
            {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}, {dayMinutesLabel(day.estimated_minutes)} · Day {day.index} of {plan.days.length}
          </Text>
          {following && done ? (
            <View style={styles.done}>
              <Icon name="check" size={15} color={color.success} weight="bold" />
              <Text variant="subhead" tone="success">
                Done this cycle
              </Text>
            </View>
          ) : null}
        </View>

        {day.exercises.map((slot, i) => {
          // Counted once per day, not re-scanned for every row it is drawn in.
          const info = getPlanExercise(slot);
          const nextSlot = day.exercises[i + 1];
          const pairedWithNext = !!slot.superset_group && nextSlot?.superset_group === slot.superset_group;
          return (
            <Animated.View key={`${slot.order}-${slot.exercise_id}`} entering={FadeInDown.delay(Math.min(i, 8) * motion.stagger).duration(300)}>
              <Tap
                feedback="highlight"
                baseColor={color.bg}
                pressedColor={color.bgRaised}
                onPress={() => slot.video_key && navigation.navigate('ExerciseDetail', { mediaKey: slot.video_key })}
                style={styles.row}
                accessibilityLabel={`${slot.name}, ${slotPrescription(slot)}`}
              >
                <ExerciseThumb mediaKey={slot.video_key ?? undefined} size={64} />
                <View style={[styles.rowBody, !pairedWithNext && i < day.exercises.length - 1 && styles.divider]}>
                  <View style={{ flex: 1 }}>
                    {slot.superset_group ? (
                      <Text variant="caption" tone="accent" style={{ marginBottom: 2 }}>
                        {(groupSizes.get(slot.superset_group) ?? 0) > 2 ? 'CIRCUIT' : 'SUPERSET'} {slot.superset_group}
                      </Text>
                    ) : null}
                    <Text variant="headline" numberOfLines={2}>
                      {slot.name}
                    </Text>
                    <Text variant="callout" tone="secondary" style={{ marginTop: 2 }}>
                      {slotPrescription(slot)} · {restLabel(slot.rest_seconds)}
                    </Text>
                    {slot.notes ? (
                      <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={2}>
                        {slot.notes}
                      </Text>
                    ) : null}
                    {info && info.video_match !== 'exact' && info.video_key ? (
                      <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
                        {info.video_match === 'similar' ? 'Closest video' : 'Video'}: {getSlotLibraryItem(slot)?.name}
                      </Text>
                    ) : null}
                  </View>
                  <Icon name="chevronRight" size={16} color={color.textTertiary} />
                </View>
              </Tap>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <LinearGradient colors={['rgba(0,0,0,0)', color.bg]} style={styles.footerFade} pointerEvents="none" />
        <Button title={running ? 'Resume workout' : 'Start workout'} icon="play" onPress={start} />
        {following ? (
          <Tap
            feedback="opacity"
            hitSlop={10}
            onPress={() => {
              haptic.light();
              const store = usePlanLibraryStore.getState();
              if (done) store.unmarkDay(day.id);
              else store.markDayDone(day.id);
            }}
            style={styles.markRow}
            accessibilityRole="button"
            accessibilityLabel={done ? 'Mark this day as not done' : 'Mark this day done without logging it'}
          >
            <Text variant="callout" tone="secondary">
              {done ? 'Undo “done”' : 'Mark done without logging'}
            </Text>
          </Tap>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  head: { paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.lg },
  done: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.gutter },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: space.md, paddingRight: space.gutter, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.gutter },
  markRow: { alignSelf: 'center', paddingVertical: space.sm, marginTop: 2 },
  footerFade: { position: 'absolute', left: 0, right: 0, top: -40, bottom: 0 },
});
