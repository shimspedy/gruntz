import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { getExerciseById } from '../../data/exercises';
import { formatClock, useNow } from '../../hooks/useNow';
import { isExerciseDone, useSessionStore } from '../../store/useSessionStore';
import { Bar } from '../../ui/Progress';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, layout, space } from '../../ui/tokens';

/** The collapsed workout: tap to bring the session back up. */
export function SessionMiniBar() {
  const exercises = useSessionStore((s) => s.exercises);
  const index = useSessionStore((s) => s.index);
  const startedAt = useSessionStore((s) => s.startedAt);
  const expand = useSessionStore((s) => s.expand);
  const restEndsAt = useSessionStore((s) => s.restEndsAt);
  const endRest = useSessionStore((s) => s.endRest);
  const now = useNow(true);

  const current = exercises[index];
  const ex = current ? getExerciseById(current.exerciseId) : undefined;
  const done = exercises.filter(isExerciseDone).length;
  // Working sets only, like the rest of the app.
  const workingSets = current ? current.sets.filter((st) => !st.warmup) : [];
  const setsDone = workingSets.filter((st) => st.done).length;
  const resting = !!restEndsAt && restEndsAt > now;

  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(160)}>
      <Tap
        feedback="highlight"
        baseColor={color.bgRaised}
        pressedColor={color.surface}
        style={styles.bar}
        onPress={() => {
          haptic.light();
          expand();
        }}
        accessibilityLabel="Return to workout"
      >
        <Bar progress={exercises.length ? done / exercises.length : 0} height={2} trackColor="transparent" tint={color.text} style={styles.progress} />
        <View style={styles.meta}>
          <Text variant="caption" tone="tertiary">
            Training
          </Text>
          <Text variant="caption" tone="tertiary" tabular>
            {/* Completed, not the page you happen to be looking at — and nothing at
                all rather than "0/0" when the workout has no exercises left. */}
            {exercises.length ? `${done}/${exercises.length} done | ` : ''}
            {startedAt ? formatClock(now - startedAt) : '0:00'}
          </Text>
        </View>
        <View style={styles.line}>
          <Text variant="bodyMedium" align="center" numberOfLines={1} style={{ flex: 1 }}>
            {resting
              ? `Resting · ${formatClock(restEndsAt - now)}`
              : ex
                ? `${ex.name} · Set ${Math.min(setsDone + 1, workingSets.length)} of ${workingSets.length}`
                : 'Workout in progress'}
          </Text>
          {/* Skipping rest used to mean reopening the whole session first. */}
          {resting ? (
            <Tap
              feedback="opacity"
              hitSlop={10}
              onPress={() => {
                haptic.light();
                endRest();
              }}
              accessibilityLabel="Skip rest"
            >
              <Text variant="caption" tone="accent">Skip</Text>
            </Tap>
          ) : null}
        </View>
      </Tap>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: layout.miniBar,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  progress: { position: 'absolute', top: 0, left: 0, right: 0 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
});
