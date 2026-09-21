import React, { useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { PreviousSet, SessionExercise, SessionSet } from '../../store/useSessionStore';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, motion, radius, space } from '../../ui/tokens';

interface Props {
  exercise: SessionExercise;
  previous?: PreviousSet[];
  units: 'imperial' | 'metric';
  onChange: (setId: string, patch: Partial<SessionSet>) => void;
  onToggle: (setId: string) => void;
  onAdd: () => void;
}

function formatSeconds(sec?: number) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m ? `${m}:${String(s).padStart(2, '0')}` : `${s}`;
}

function parseSeconds(text: string) {
  if (text.includes(':')) {
    const [m, s] = text.split(':').map((n) => Number(n) || 0);
    return m * 60 + s;
  }
  return Number(text.replace(/[^0-9]/g, '')) || 0;
}

function prevLabel(p: PreviousSet | undefined, ex: SessionExercise, unit: string) {
  if (!p) return '–';
  if (ex.kind === 'time') return p.seconds ? `${formatSeconds(p.seconds)}${p.seconds < 60 ? 's' : ''}` : '–';
  if (ex.kind === 'distance') return p.distance ?? '–';
  if (p.weight && p.reps) return `${p.weight} ${unit} x ${p.reps}`;
  return p.reps ? `${p.reps} reps` : '–';
}

/** SET · PREVIOUS · [LB] · REPS|TIME|DIST · ✓ — completed rows flood navy. */
export function SetTable({ exercise, previous, units, onChange, onToggle, onAdd }: Props) {
  const unit = units === 'metric' ? 'kg' : 'lb';
  const valueHeader = exercise.kind === 'time' ? 'TIME' : exercise.kind === 'distance' ? 'DIST' : 'REPS';

  return (
    <View>
      <View style={styles.headRow}>
        <Text variant="subhead" tone="secondary" style={styles.colSet}>
          SET
        </Text>
        <Text variant="subhead" tone="secondary" style={styles.colPrev}>
          PREVIOUS
        </Text>
        {exercise.weighted ? (
          <Text variant="subhead" tone="secondary" style={styles.colInput}>
            {unit.toUpperCase()}
          </Text>
        ) : null}
        <Text variant="subhead" tone="secondary" style={styles.colInput}>
          {valueHeader}
        </Text>
        <View style={styles.colCheck} />
      </View>
      {exercise.sets.map((set, i) => (
        <SetRow
          key={set.id}
          index={i}
          set={set}
          exercise={exercise}
          prev={prevLabel(previous?.[i], exercise, unit)}
          onChange={(patch) => onChange(set.id, patch)}
          onToggle={() => onToggle(set.id)}
        />
      ))}
      <Tap onPress={onAdd} hapticOnPress="light" style={styles.addSet} accessibilityLabel="Add set">
        <Icon name="plus" size={18} color={color.text} weight="semibold" />
        <Text variant="cta">Add set</Text>
      </Tap>
    </View>
  );
}

function SetRow({
  index,
  set,
  exercise,
  prev,
  onChange,
  onToggle,
}: {
  index: number;
  set: SessionSet;
  exercise: SessionExercise;
  prev: string;
  onChange: (patch: Partial<SessionSet>) => void;
  onToggle: () => void;
}) {
  const done = useSharedValue(set.done ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    done.set(withTiming(set.done ? 1 : 0, { duration: motion.base, easing: motion.easeOut }));
    if (set.done) {
      pop.set(0.82);
      pop.set(withSpring(1, motion.bouncy));
    }
  }, [set.done, done, pop]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.get(), [0, 1], ['rgba(22,50,92,0)', color.accentDeep]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.get(), [0, 1], [color.surfaceHigh, color.accent]),
    transform: [{ scale: pop.get() }],
  }));
  const inputStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.get(), [0, 1], [color.surface, 'rgba(0,0,0,0)']),
  }));

  const value =
    exercise.kind === 'time' ? formatSeconds(set.seconds) : exercise.kind === 'distance' ? set.distance ?? '' : set.reps != null ? String(set.reps) : '';

  return (
    <Animated.View entering={index > 0 ? FadeInDown.duration(220) : undefined} style={[styles.row, rowStyle]}>
      <View style={[styles.colSet, styles.setBadge]}>
        <Text variant="headline" tabular>
          {index + 1}
        </Text>
      </View>
      <Text variant="callout" tone="tertiary" numberOfLines={1} style={styles.colPrev}>
        {prev}
      </Text>
      {exercise.weighted ? (
        <Animated.View style={[styles.colInput, styles.inputBox, inputStyle]}>
          <TextInput
            value={set.weight != null ? String(set.weight) : ''}
            onChangeText={(t) => onChange({ weight: t ? Number(t.replace(/[^0-9.]/g, '')) || 0 : undefined })}
            placeholder="0"
            placeholderTextColor={color.textTertiary}
            keyboardType="decimal-pad"
            selectTextOnFocus
            style={styles.input}
            selectionColor={color.accent}
            accessibilityLabel={`Set ${index + 1} weight`}
          />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.colInput, styles.inputBox, inputStyle]}>
        <TextInput
          value={value}
          onChangeText={(t) => {
            if (exercise.kind === 'time') onChange({ seconds: parseSeconds(t) });
            else if (exercise.kind === 'distance') onChange({ distance: t });
            else onChange({ reps: t ? Number(t.replace(/[^0-9]/g, '')) || 0 : undefined });
          }}
          keyboardType={exercise.kind === 'distance' ? 'default' : exercise.kind === 'time' ? 'numbers-and-punctuation' : 'number-pad'}
          selectTextOnFocus
          style={styles.input}
          selectionColor={color.accent}
          accessibilityLabel={`Set ${index + 1} ${exercise.kind}`}
        />
      </Animated.View>
      <View style={styles.colCheck}>
        <Tap
          scaleTo={0.88}
          onPress={() => {
            if (set.done) haptic.light();
            else haptic.success();
            onToggle();
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.done }}
          accessibilityLabel={`Complete set ${index + 1}`}
        >
          <Animated.View style={[styles.check, checkStyle]}>
            <Icon name="check" size={18} color="#FFFFFF" weight="bold" />
          </Animated.View>
        </Tap>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, height: 44 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, height: 72 },
  colSet: { width: 48, marginRight: 8 },
  colPrev: { flex: 1.25, textAlign: 'center' },
  colInput: { flex: 1, marginHorizontal: 5, textAlign: 'center' },
  colCheck: { width: 48, alignItems: 'flex-end' },
  setBadge: {
    height: 48,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: { height: 48, borderRadius: radius.sm, borderCurve: 'continuous', justifyContent: 'center' },
  input: { color: color.text, fontFamily: font.medium, fontSize: 19, textAlign: 'center', height: 48, fontVariant: ['tabular-nums'] },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addSet: {
    marginHorizontal: space.gutter,
    marginTop: space.md,
    height: 56,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
