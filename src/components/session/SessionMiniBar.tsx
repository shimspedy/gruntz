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
  const now = useNow(true);

  const current = exercises[index];
  const ex = current ? getExerciseById(current.exerciseId) : undefined;
  const done = exercises.filter(isExerciseDone).length;
  const setsDone = current ? current.sets.filter((s) => s.done).length : 0;
  const resting = restEndsAt && restEndsAt > now;

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
            Exercise {Math.min(index + 1, exercises.length)}/{exercises.length} | {startedAt ? formatClock(now - startedAt) : '0:00'}
          </Text>
        </View>
        <Text variant="bodyMedium" align="center" numberOfLines={1} style={{ marginTop: 2 }}>
          {resting ? `Resting · ${formatClock(restEndsAt! - now)}` : ex ? `${ex.name} · Set ${Math.min(setsDone + 1, current!.sets.length)} of ${current!.sets.length}` : 'Workout in progress'}
        </Text>
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
});
