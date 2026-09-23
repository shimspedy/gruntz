import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNow } from '../../hooks/useNow';
import { getLocalDateKey } from '../../utils/dateKey';
import { navigationRef } from '../../navigation/ref';
import { clearWorkoutProgress } from '../../services/notifications';
import { useMissionStore } from '../../store/useMissionStore';
import { isExerciseDone, useSessionStore } from '../../store/useSessionStore';
import { useUserStore } from '../../store/useUserStore';
import { useProgramStore } from '../../store/useProgramStore';
import { Button } from '../../ui/Button';
import { Hairline, NavHeader, Stat } from '../../ui/Layout';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { toast } from '../../ui/Toast';
import { haptic } from '../../ui/haptics';
import { color, space } from '../../ui/tokens';
import { calculateMissionXP, calculateStreakBonus, isStreakAlive } from '../../utils/xp';
import { maybeRequestReview } from '../../utils/socialActions';

/** "Workout completed!" — review, then commit the mission or discard it. */
export function SessionSummary({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const s = useSessionStore();
  const progress = useUserStore((u) => u.progress);
  // Rebuilt at save time rather than reused: this memo only re-runs when the store
  // object changes, so `duration_minutes` froze at whatever Date.now() was when it
  // last ran. Sitting on the completion screen for ten minutes showed "35 min" and
  // logged 25 — and which you got depended on an unrelated store write.
  const mission = useMemo(() => s.buildMission(), [s]);
  const doneExercises = s.exercises.filter(isExerciseDone);
  const setsDone = s.exercises.reduce((sum, e) => sum + e.sets.filter((st) => st.done && !st.warmup).length, 0);
  const reps = s.exercises.reduce((sum, e) => sum + (e.kind === 'reps' ? e.sets.filter((st) => st.done && !st.warmup).reduce((a, st) => a + (st.reps ?? 0), 0) : 0), 0);
  // Ticks while the summary is open; it used to freeze at whatever it read on mount.
  const now = useNow(true, 1000);
  const minutes = s.startedAt ? Math.max(1, Math.round((now - s.startedAt) / 60000)) : 0;
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
    if (!mission || !canSave) return;
    const fresh = useSessionStore.getState().buildMission() ?? mission;
    const before = useUserStore.getState().progress;
    // completeMission dedupes on mission_date + workout_day_id and returns state
    // unchanged, but save() used to carry on regardless: it wiped the session and
    // pushed a celebration reading "+0 XP" with no explanation. The sets still reach
    // the exercise log either way, so say that plainly instead of celebrating nothing.
    const repeatOfToday = before.claimed_missions?.has(`${fresh.mission_date}:${fresh.workout_day_id}`) ?? false;
    const levelBefore = before.current_level;
    const rankBefore = before.current_rank;
    const xpBefore = before.current_xp;
    useUserStore.getState().completeMission(fresh);
    useMissionStore.getState().finishMission();
    void clearWorkoutProgress();
    // If that was the last workout of the program week, move to the next one.
    useProgramStore.getState().advanceWeekIfComplete();
    // The celebration screen presents XP and unlocks; no system banners while the app is open.
    const ids = useUserStore.getState().checkAchievements();
    // Snapshotted AFTER checkAchievements, because achievement rewards are XP this
    // workout earned. Reading it first meant the celebration showed "+150 XP · Level 5"
    // over an XP bar already displaying level 6's numbers, and a level-up caused by an
    // achievement got no celebration at all.
    const after = useUserStore.getState().progress;
    haptic.success();
    const title = s.title;
    useSessionStore.getState().finish();
    onDone();
    if (repeatOfToday) {
      toast('Saved to your history · already counted today', { tone: 'info', icon: 'check' });
      return;
    }
    if (navigationRef.isReady()) {
      navigationRef.navigate('Celebration', {
        xpEarned: after.current_xp - xpBefore,
        levelBefore,
        levelAfter: after.current_level,
        rankBefore,
        rankAfter: after.current_rank,
        streak: after.streak_days,
        achievementIds: ids,
        title,
      });
    }
    void maybeRequestReview('mission_complete');
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
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 180 }]} showsVerticalScrollIndicator={false}>
        <Field label="Workout name" value={s.title} />
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
          <XpRow label={`Exercises · ${doneExercises.length} of ${s.exercises.length}`} value={mission?.total_xp ?? 0} />
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    backgroundColor: color.bg,
  },
  discard: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 24 },
});
