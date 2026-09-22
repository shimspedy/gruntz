import React, { useEffect, useRef, useState } from 'react';
import { InputAccessoryView, Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
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

const MAX_WEIGHT = 2000;
const MAX_REPS = 999;
const MAX_SECONDS = 4 * 60 * 60;

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

const KG_PER_LB = 0.45359237;

function prevLabel(p: PreviousSet | undefined, ex: SessionExercise, unit: 'lb' | 'kg') {
  if (!p) return '–';
  if (ex.kind === 'time') return p.seconds ? `${formatSeconds(p.seconds)}${p.seconds < 60 ? 's' : ''}` : '–';
  if (ex.kind === 'distance') return p.distance ?? '–';
  if (p.weight && p.reps) {
    // Older rows remember the unit they were lifted in, so switching lb/kg converts instead of relabelling.
    const from = p.unit ?? unit;
    const w = from === unit ? p.weight : from === 'lb' ? p.weight * KG_PER_LB : p.weight / KG_PER_LB;
    return `${Math.round(w * 10) / 10} ${unit} x ${p.reps}`;
  }
  return p.reps ? `${p.reps} reps` : '–';
}

/** Index into last session's sets: warm-up rows have no history and must not shift the column. */
function workingIndex(exercise: SessionExercise, rowIndex: number) {
  return exercise.sets.slice(0, rowIndex).filter((st) => !st.warmup).length;
}

/** SET · PREVIOUS · [LB] · REPS|TIME|DIST · ✓ — completed rows flood navy. */
/**
 * Number pads have no return key, so with the keyboard up there was no way to
 * dismiss it — and it covered the ✓ column, which is the whole point of the row.
 * iOS gets a Done bar above the pad; Android's back gesture already closes it.
 */
export const SET_INPUT_ACCESSORY = 'gruntz.setInput';

/**
 * Distance is typed freehand ("1.5 mi", "400m", "2 k"), and whatever came out was
 * stored verbatim and later joined into one string on the mission record. Keep the
 * athlete's own wording, but normalise the shape so the same distance does not end
 * up recorded three different ways.
 */
export function normalizeDistance(input: string): string | undefined {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text) return undefined;
  const match = /^(\d+(?:[.,]\d+)?)\s*([a-z]*)$/i.exec(text);
  if (!match) return text.slice(0, 24);
  const value = match[1].replace(',', '.');
  const raw = match[2].toLowerCase();
  const unit =
    raw === '' ? '' :
    ['m', 'meter', 'meters', 'metre', 'metres'].includes(raw) ? 'm' :
    ['km', 'k', 'kilometer', 'kilometers', 'kilometre', 'kilometres'].includes(raw) ? 'km' :
    ['mi', 'mile', 'miles'].includes(raw) ? 'mi' :
    ['yd', 'yard', 'yards'].includes(raw) ? 'yd' :
    ['ft', 'foot', 'feet'].includes(raw) ? 'ft' :
    raw;
  return unit ? `${value} ${unit}` : value;
}

export function SetInputAccessory() {
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={SET_INPUT_ACCESSORY}>
      <View style={styles.accessory}>
        <Tap feedback="opacity" hitSlop={10} onPress={() => Keyboard.dismiss()} accessibilityLabel="Done editing">
          <Text variant="cta" tone="accent" style={{ fontSize: 17 }}>
            Done
          </Text>
        </Tap>
      </View>
    </InputAccessoryView>
  );
}

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
          label={set.warmup ? 'W' : String(exercise.sets.slice(0, i + 1).filter((st) => !st.warmup).length)}
          spokenLabel={
            set.warmup
              ? `Warm-up ${exercise.sets.slice(0, i + 1).filter((st) => st.warmup).length}`
              : `Set ${exercise.sets.slice(0, i + 1).filter((st) => !st.warmup).length}`
          }
          set={set}
          exercise={exercise}
          prev={prevLabel(set.warmup ? undefined : previous?.[workingIndex(exercise, i)], exercise, unit)}
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
  label,
  spokenLabel,
  index,
  set,
  exercise,
  prev,
  onChange,
  onToggle,
}: {
  index: number;
  /** Row label: the working-set number, or W for a warm-up. */
  label: string;
  /** What VoiceOver reads — "W" three times in a row tells the user nothing. */
  spokenLabel: string;
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

  // Inputs hold raw text while focused so "22.5" and "1:30" can be typed; the store gets the
  // parsed number on blur. Controlled-on-every-keystroke re-formatting made both impossible.
  const stored =
    exercise.kind === 'time' ? formatSeconds(set.seconds) : exercise.kind === 'distance' ? (set.distance ?? '') : set.reps != null ? String(set.reps) : '';
  const storedWeight = set.weight != null ? String(set.weight) : '';
  const [valueDraft, setValueDraft] = useState<string | null>(null);
  const [weightDraft, setWeightDraft] = useState<string | null>(null);
  const value = valueDraft ?? stored;
  const weightValue = weightDraft ?? storedWeight;

  const commitWeight = (t: string) => {
    setWeightDraft(null);
    const n = Number(t.replace(/[^0-9.]/g, '').replace(/\.(?=.*\.)/g, ''));
    onChange({ weight: t.trim() && Number.isFinite(n) && n > 0 ? Math.min(n, MAX_WEIGHT) : undefined });
  };
  const commitValue = (t: string) => {
    setValueDraft(null);
    if (exercise.kind === 'time') onChange({ seconds: Math.min(parseSeconds(t), MAX_SECONDS) || undefined });
    else if (exercise.kind === 'distance') onChange({ distance: normalizeDistance(t) });
    else {
      const n = Number(t.replace(/[^0-9]/g, ''));
      onChange({ reps: t.trim() && Number.isFinite(n) && n > 0 ? Math.min(n, MAX_REPS) : undefined });
    }
  };

  return (
    <Animated.View entering={index > 0 ? FadeInDown.duration(220) : undefined} style={[styles.row, rowStyle]}>
      <View style={[styles.colSet, styles.setBadge, set.warmup && styles.setBadgeWarmup]}>
        <Text variant="headline" tone={set.warmup ? 'secondary' : 'primary'} tabular>
          {label}
        </Text>
      </View>
      <Text variant="callout" tone="tertiary" numberOfLines={1} style={styles.colPrev}>
        {prev}
      </Text>
      {exercise.weighted ? (
        <Animated.View style={[styles.colInput, styles.inputBox, inputStyle]}>
          <TextInput
            value={weightValue}
            onChangeText={setWeightDraft}
            onBlur={() => commitWeight(weightValue)}
            onSubmitEditing={() => commitWeight(weightValue)}
            maxLength={7}
            placeholder="0"
            placeholderTextColor={color.textTertiary}
            keyboardType="decimal-pad"
            inputAccessoryViewID={SET_INPUT_ACCESSORY}
            selectTextOnFocus
            style={styles.input}
            selectionColor={color.accent}
            accessibilityLabel={`${spokenLabel} weight`}
          />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.colInput, styles.inputBox, inputStyle]}>
        <TextInput
          value={value}
          onChangeText={setValueDraft}
          onBlur={() => commitValue(value)}
          onSubmitEditing={() => commitValue(value)}
          maxLength={exercise.kind === 'distance' ? 24 : exercise.kind === 'reps' ? 4 : 7}
          keyboardType={exercise.kind === 'distance' ? 'default' : exercise.kind === 'time' ? 'numbers-and-punctuation' : 'number-pad'}
          inputAccessoryViewID={exercise.kind === 'distance' ? undefined : SET_INPUT_ACCESSORY}
          selectTextOnFocus
          style={styles.input}
          selectionColor={color.accent}
          accessibilityLabel={`${spokenLabel} ${exercise.kind}`}
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
          accessibilityLabel={`Complete ${spokenLabel.toLowerCase()}`}
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
  accessory: { alignItems: 'flex-end', paddingHorizontal: space.gutter, paddingVertical: 10, backgroundColor: color.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, height: 32 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, height: 52 },
  colSet: { width: 40, marginRight: 8 },
  colPrev: { flex: 1.25, textAlign: 'center' },
  colInput: { flex: 1, marginHorizontal: 5, textAlign: 'center' },
  colCheck: { width: 40, alignItems: 'flex-end' },
  setBadge: {
    height: 40,
    borderRadius: 10,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeWarmup: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: color.lineStrong },
  inputBox: { height: 40, borderRadius: radius.sm, borderCurve: 'continuous', justifyContent: 'center' },
  input: { color: color.text, fontFamily: font.medium, fontSize: 18, textAlign: 'center', height: 40, fontVariant: ['tabular-nums'] },
  check: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  addSet: {
    marginHorizontal: space.gutter,
    marginTop: space.sm,
    height: 48,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
