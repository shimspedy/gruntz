import { useMemo, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNow } from '../../hooks/useNow';
import { getLocalDateKey } from '../../utils/dateKey';
import { clearWorkoutProgress } from '../../services/notifications';
import { isExerciseDone, useSessionStore } from '../../store/useSessionStore';
import { useUserStore } from '../../store/useUserStore';
import { Button } from '../../ui/Button';
import { Hairline, NavHeader, Stat } from '../../ui/Layout';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, space } from '../../ui/tokens';
import { calculateMissionXP, calculateStreakBonus, isStreakAlive } from '../../utils/xp';
import { commitSession, presentCommit } from '../../services/sessionCommit';

/** "Workout completed!" — review, then commit the mission or discard it. */
export function SessionSummary({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  // Only the fields this screen and `buildMission` read, so unrelated session writes
  // (rest timer, current index) don't re-render it.
  const exercises = useSessionStore((st) => st.exercises);
  const startedAt = useSessionStore((st) => st.startedAt);
  const title = useSessionStore((st) => st.title);
  const active = useSessionStore((st) => st.active);
  const workoutDayId = useSessionStore((st) => st.workoutDayId);
  const missionDate = useSessionStore((st) => st.missionDate);
  const estimatedMinutes = useSessionStore((st) => st.estimatedMinutes);
  const rewardXp = useSessionStore((st) => st.rewardXp);
  const saving = useRef(false);
  const progress = useUserStore((u) => u.progress);
  // Rebuilt at save time rather than reused: this memo only re-runs when the session
  // changes, so `duration_minutes` froze at whatever Date.now() was when it
  // last ran. Sitting on the completion screen for ten minutes showed "35 min" and
  // logged 25 — and which you got depended on an unrelated store write.
  const mission = useMemo(
    () => useSessionStore.getState().buildMission(),
    [exercises, startedAt, active, workoutDayId, missionDate, estimatedMinutes, rewardXp],
  );
  const doneExercises = exercises.filter(isExerciseDone);
  const setsDone = exercises.reduce((sum, e) => sum + e.sets.filter((st) => st.done && !st.warmup).length, 0);
  const reps = exercises.reduce((sum, e) => sum + (e.kind === 'reps' ? e.sets.filter((st) => st.done && !st.warmup).reduce((a, st) => a + (st.reps ?? 0), 0) : 0), 0);
  // Ticks while the summary is open; it used to freeze at whatever it read on mount.
  const now = useNow(true, 1000);
  const minutes = startedAt ? Math.max(1, Math.round((now - startedAt) / 60000)) : 0;
  const daysPerWeek = useUserStore((u) => u.profile?.workout_days_per_week);
  // Mirrors completeMission's own rule. Assuming +1 whenever the streak was alive
  // meant a second workout on the same day rendered a "7-day streak milestone +70"
  // row and a Total the award path never paid — the Celebration screen one tap later
  // then showed the smaller, real number.
  const alreadyTrainedToday = progress.last_workout_date === getLocalDateKey();
  const streakNext = alreadyTrainedToday
    ? Math.max(1, progress.streak_days)
    : progress.last_workout_date && isStreakAlive(progress.last_workout_date, daysPerWeek)
      ? progress.streak_days + 1
      : 1;
  const streakBonus = calculateStreakBonus(streakNext, progress.streak_days);
  const xp = mission ? calculateMissionXP(mission, streakBonus) : 0;
  const canSave = setsDone > 0;
  const date = new Date();

  const save = () => {
    if (saving.current || !canSave) return;
    const outcome = commitSession();
    if (!outcome) return;
    saving.current = true;
    onDone();
    presentCommit(outcome);
  };

  const discard = () => {
    Alert.alert('Discard workout?', 'Logged sets from this session will be lost.', [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          haptic.warning();
          void clearWorkoutProgress();
          useSessionStore.getState().discard();
          onDone();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <NavHeader title="Workout completed!" onBack={onBack} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.body, { paddingBottom: space.lg }]} showsVerticalScrollIndicator={false}>
        <Field label="Workout name" value={title} />
        <Hairline />
        <View style={styles.stats}>
          <Stat label="Duration" value={`${minutes} min`} accent style={{ flex: 1 }} />
          <Stat label="Reps" value={reps.toLocaleString()} style={{ flex: 1 }} />
          <Stat label="Sets" value={String(setsDone)} style={{ flex: 1 }} />
        </View>
        <Hairline />
        <Field
          label="Completion date"
          value={date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        />
        <Hairline />
        <View style={styles.block}>
          <Text variant="callout" tone="secondary">
            Rewards
          </Text>
          <XpRow label={`Exercises · ${doneExercises.length} of ${exercises.length}`} value={mission?.total_xp ?? 0} />
          <XpRow label={mission?.is_perfect ? 'Perfect workout bonus' : 'Completion bonus'} value={mission?.completion_bonus ?? 0} />
          {mission?.has_personal_record ? (
            <XpRow
              label={`Personal record · ${mission.exercises.filter((e) => e.is_personal_record).length}`}
              value={mission.pr_bonus}
            />
          ) : null}
          {streakBonus > 0 ? <XpRow label={`${streakNext}-workout streak milestone`} value={streakBonus} /> : null}
          <View style={styles.total}>
            <Text variant="headline">Total</Text>
            <Text variant="headline" tone="accent" tabular>
              +{xp} XP
            </Text>
          </View>
        </View>
        {!canSave ? (
          <Text variant="footnote" tone="tertiary" style={{ marginTop: space.md }}>
            Log at least one set to save this mission.
          </Text>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
        <Button title="Finish workout" onPress={save} disabled={!canSave} />
        <Tap feedback="opacity" onPress={discard} style={styles.discard} accessibilityLabel="Discard workout">
          <Text variant="bodyMedium" tone="danger">
            Discard workout
          </Text>
        </Tap>
      </View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.block}>
      <Text variant="callout" tone="secondary">
        {label}
      </Text>
      <Text variant="body" style={{ marginTop: 8, fontSize: 18 }}>
        {value}
      </Text>
    </View>
  );
}

function XpRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.xpRow}>
      <Text variant="callout">{label}</Text>
      <Text variant="callout" tone="secondary" tabular>
        +{value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.gutter + 4 },
  block: { paddingVertical: space.lg },
  stats: { flexDirection: 'row', paddingVertical: space.lg },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  footer: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    backgroundColor: color.bg,
  },
  discard: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 24 },
});
