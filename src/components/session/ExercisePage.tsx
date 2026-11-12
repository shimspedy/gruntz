import React from 'react';
import { ActionSheetIOS, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { getExerciseById } from '../../data/exercises';
import { useSessionStore, type SessionExercise } from '../../store/useSessionStore';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { toast } from '../../ui/Toast';
import { color, font, space } from '../../ui/tokens';
import { ExerciseVideo } from '../ExerciseVideo';
import { ExerciseInsights } from './ExerciseInsights';
import { SetTable } from './SetTable';

export const ExercisePage = React.memo(function ExercisePage({
  exercise,
  active,
  width,
  height,
  units,
  bottomPad,
  onRest,
  onToggle,
}: {
  exercise: SessionExercise;
  active: boolean;
  width: number;
  height: number;
  units: 'imperial' | 'metric';
  bottomPad: number;
  onRest: (exercise: SessionExercise) => void;
  onToggle: (exercise: SessionExercise, setId: string) => void;
}) {
  const ex = getExerciseById(exercise.exerciseId);
  // The other exercises in this superset, named so the pairing can be followed. Selected as a
  // string so logging a set elsewhere in the workout doesn't re-render this page.
  const supersetPartners = useSessionStore((st) =>
    exercise.supersetGroup
      ? st.exercises
        .filter((e) => e.key !== exercise.key && e.supersetGroup === exercise.supersetGroup)
        .map((e) => e.prescribedName ?? getExerciseById(e.exerciseId)?.name)
        .filter((name): name is string => !!name)
        .join(' and ')
      : '',
  );
  const previous = useSessionStore((st) => st.previous[exercise.exerciseId]);
  const rest = useSessionStore((st) => st.restOverrides[exercise.exerciseId] ?? st.restPrescribed[exercise.key] ?? ex?.rest_seconds ?? 0);
  const updateSet = useSessionStore((st) => st.updateSet);
  const addSet = useSessionStore((st) => st.addSet);
  const removeSet = useSessionStore((st) => st.removeSet);
  const removeExercise = useSessionStore((st) => st.removeExercise);
  const replaceExercise = useSessionStore((st) => st.replaceExercise);
  const alternative = ex?.gym_alternative_id ? getExerciseById(ex.gym_alternative_id) : undefined;
  // Sized so the set table starts above the fold: logging is the job, the video is the reference.
  // Height-capped too: on a wide window 60% of the width pushed the table off screen.
  const videoH = Math.round(Math.min(width * 0.6, height * 0.38));

  const replace = () => {
    if (!alternative) return;
    haptic.light();
    if (!replaceExercise(exercise.key, alternative.id)) {
      toast('Uncheck logged sets before swapping, or add another exercise.', { tone: 'info', icon: 'info' });
      return;
    }
    toast(`Swapped to ${alternative.name}`, { tone: 'info', icon: 'replace' });
  };
  const remove = () => {
    haptic.warning();
    removeExercise(exercise.key);
  };

  // Rare, destructive actions live behind the overflow button, never beside the sets.
  const openMore = () => {
    haptic.light();
    const name = ex?.name ?? 'This exercise';
    const message = `Removing ${name} means it won’t count toward today’s mission.`;
    const canWarmup = !exercise.sets.some((st) => st.warmup);
    const warmupLabel = 'Add warm-up sets';
    const options = [
      ...(canWarmup ? [warmupLabel] : []),
      ...(alternative ? [`Replace with ${alternative.name}`] : []),
      'Remove exercise',
      'Cancel',
    ];
    const addWarmup = () => {
      haptic.light();
      useSessionStore.getState().addWarmupSets(exercise.key);
    };
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: name, message, options, destructiveButtonIndex: options.length - 2, cancelButtonIndex: options.length - 1, userInterfaceStyle: 'dark' },
        (i) => {
          const chosen = options[i];
          if (chosen === warmupLabel) addWarmup();
          else if (alternative && chosen?.startsWith('Replace with')) replace();
          else if (chosen === 'Remove exercise') remove();
        },
      );
      return;
    }
    Alert.alert(name, message, [
      ...(canWarmup ? [{ text: warmupLabel, onPress: addWarmup }] : []),
      ...(alternative ? [{ text: `Replace with ${alternative.name}`, onPress: replace }] : []),
      { text: 'Remove exercise', style: 'destructive' as const, onPress: remove },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <ExerciseVideo exercise={ex} active={active} style={{ width, height: videoH }} />

      {exercise.supersetGroup ? (
        <View style={styles.supersetBlock}>
          <Text variant="caption" tone="accent" style={styles.supersetTag}>
            {`SUPERSET ${exercise.supersetGroup}`}
          </Text>
          {supersetPartners ? (
            <Text variant="subhead" tone="secondary" style={styles.supersetHint}>
              {`Alternate sets with ${supersetPartners}, then rest.`}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.nameRow}>
        <Text variant="title" style={styles.name} numberOfLines={2}>
          {exercise.prescribedName ?? ex?.name ?? 'Exercise'}
        </Text>
        <Tap
          feedback="opacity"
          hitSlop={8}
          onPress={() => onRest(exercise)}
          style={styles.restIcon}
          accessibilityLabel={rest > 0 ? `Rest timer, ${rest} seconds` : 'Rest timer, off'}
        >
          <Icon name="timer" size={24} color={color.accent} />
          <Text variant="caption" tone="accent" tabular style={{ fontFamily: font.semibold, marginTop: 1 }}>
            {rest > 0 ? `${rest}s` : 'Off'}
          </Text>
        </Tap>
        <Tap feedback="opacity" hitSlop={8} onPress={openMore} style={styles.moreIcon} accessibilityLabel="Exercise options">
          <Icon name="more" size={22} color={color.textSecondary} weight="semibold" />
        </Tap>
      </View>
      {exercise.prescribedName && ex?.name ? (
        <Text variant="subhead" tone="tertiary" style={styles.desc}>
          {`Demonstrated with ${ex.name}`}
        </Text>
      ) : null}
      {ex?.description ? (
        <Text variant="body" tone="secondary" style={styles.desc}>
          {ex.description}
        </Text>
      ) : null}
      <Text variant="footnote" tone="tertiary" style={styles.sectionTag}>
        {exercise.section} · {exercise.requiredSets} {exercise.requiredSets === 1 ? 'set' : 'sets'} to complete
      </Text>

      <SetTable
        exercise={exercise}
        previous={previous}
        units={units}
        onChange={(setId, patch) => updateSet(exercise.key, setId, patch)}
        onToggle={(setId) => onToggle(exercise, setId)}
        onAdd={() => addSet(exercise.key)}
        onRemove={(setId) => removeSet(exercise.key, setId)}
      />

      <ExerciseInsights exercise={ex} exerciseKey={exercise.key} unit={units === 'metric' ? 'kg' : 'lb'} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  supersetBlock: { paddingHorizontal: space.gutter, marginBottom: 4 },
  supersetTag: { letterSpacing: 0.8 },
  supersetHint: { marginTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, marginTop: space.md },
  name: { flex: 1, fontSize: 25, lineHeight: 30 },
  restIcon: { alignItems: 'center', marginLeft: space.md },
  moreIcon: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: space.xs },
  desc: { paddingHorizontal: space.gutter, marginTop: space.sm },
  sectionTag: { paddingHorizontal: space.gutter, marginTop: space.md, marginBottom: space.sm },
});
