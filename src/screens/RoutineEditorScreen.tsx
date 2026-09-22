import React from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { getLibraryItem } from '../data/exerciseLibrary';
import { routineMinutes, useRoutineStore, type RoutineItem } from '../store/useRoutineStore';
import { Button } from '../ui/Button';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { KeyboardLift } from '../ui/KeyboardAware';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, motion, radius, space } from '../ui/tokens';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Build or edit a workout. A modal task: its own Cancel / Save, and unsaved changes are confirmed. */
export default function RoutineEditorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const draft = useRoutineStore((s) => s.draft);
  const updateDraft = useRoutineStore((s) => s.updateDraft);
  const saveDraft = useRoutineStore((s) => s.saveDraft);
  const discardDraft = useRoutineStore((s) => s.discardDraft);
  const [dirty, setDirty] = React.useState(false);
  // Set once saved: disarms the unsaved-changes guard, then closes on the next render.
  const [closing, setClosing] = React.useState(false);

  React.useEffect(() => {
    if (closing) navigation.goBack();
  }, [closing, navigation]);

  React.useEffect(() => {
    const unsub = useRoutineStore.subscribe((s, prev) => {
      if (s.draft !== prev.draft && prev.draft) setDirty(true);
    });
    return unsub;
  }, []);

  usePreventRemove(dirty && !closing, ({ data }) => {
    Alert.alert('Discard changes?', 'Your edits to this workout won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          discardDraft();
          navigation.dispatch(data.action);
        },
      },
    ]);
  });

  if (!draft) return <View style={styles.screen} />;

  const save = () => {
    const isNew = draft.isNew;
    const r = saveDraft();
    if (!r) return;
    haptic.success();
    setClosing(true);
    toast(isNew ? `${r.name} saved` : 'Workout updated', { icon: 'check' });
  };

  const toggleDay = (d: number) => {
    haptic.selection();
    updateDraft({ days: draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d] });
  };

  return (
    <View style={[styles.screen, { paddingTop: space.sm }]}>
      <View style={styles.header}>
        <Tap feedback="opacity" hitSlop={10} onPress={() => navigation.goBack()} accessibilityLabel="Cancel">
          <Icon name="close" size={24} color={color.text} />
        </Tap>
        <Text variant="headline" style={{ fontSize: 19 }}>
          {draft.isNew ? 'New workout' : 'Edit workout'}
        </Text>
        <Tap feedback="opacity" hitSlop={10} onPress={save} disabled={!draft.items.length} accessibilityLabel="Save">
          <Text variant="headline" tone={draft.items.length ? 'accent' : 'tertiary'}>
            Save
          </Text>
        </Tap>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
        <TextInput
          value={draft.name}
          onChangeText={(name) => updateDraft({ name })}
          placeholder="Workout name"
          placeholderTextColor={color.textQuaternary}
          style={styles.name}
          selectionColor={color.accent}
          maxLength={40}
          returnKeyType="done"
        />
        <Text variant="callout" tone="secondary" style={styles.meta}>
          {draft.items.length
            ? `${draft.items.length} ${draft.items.length === 1 ? 'exercise' : 'exercises'} · about ${routineMinutes(draft)} min`
            : 'Add movements from the video library'}
        </Text>

        <Text variant="overline" tone="secondary" style={styles.label}>
          Repeat on
        </Text>
        <View style={styles.days}>
          {DAY_ORDER.map((d) => {
            const on = draft.days.includes(d);
            return (
              <Tap key={d} scaleTo={0.9} onPress={() => toggleDay(d)} style={[styles.day, on && styles.dayOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]}>
                <Text variant="headline" style={{ color: on ? '#000' : color.text, fontSize: 15 }}>
                  {DAYS[d]}
                </Text>
              </Tap>
            );
          })}
        </View>

        <Text variant="overline" tone="secondary" style={styles.label}>
          Exercises
        </Text>
        {draft.items.length ? (
          draft.items.map((it, i) => <ItemRow key={it.uid} item={it} index={i} last={i === draft.items.length - 1} />)
        ) : (
          <Animated.View entering={FadeIn.duration(260)} style={{ paddingHorizontal: space.md, gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.skeleton, { opacity: 1 - i * 0.28 }]}>
                <View style={styles.skelThumb} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={[styles.skelLine, { width: '62%' }]} />
                  <View style={[styles.skelLine, { width: '38%', height: 10 }]} />
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <KeyboardLift>
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
          <Button title="Add exercises" icon="plus" variant={draft.items.length ? 'secondary' : 'primary'} onPress={() => navigation.navigate('ExerciseLibrary', { pick: true })} />
        </View>
      </KeyboardLift>
    </View>
  );
}

function ItemRow({ item, index, last }: { item: RoutineItem; index: number; last: boolean }) {
  const updateItem = useRoutineStore((s) => s.updateItem);
  const removeItem = useRoutineStore((s) => s.removeItem);
  const moveItem = useRoutineStore((s) => s.moveItem);
  const lib = getLibraryItem(item.key);
  const cardio = lib?.group === 'cardio' || lib?.group === 'swim';
  const isLast = last;
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * motion.stagger).duration(280)}
      exiting={FadeOut.duration(160)}
      layout={LinearTransition.duration(240).easing(motion.easeOut)}
      style={[styles.item, !last && styles.divider]}
    >
      <View style={styles.itemHead}>
        <ExerciseThumb mediaKey={item.key} size={56} />
        <View style={{ flex: 1, marginLeft: space.md }}>
          <Text variant="headline" numberOfLines={1}>
            {lib?.name ?? item.key}
          </Text>
          <Text variant="subhead" tone="tertiary" style={{ marginTop: 2 }}>
            {item.sets} {item.sets === 1 ? 'set' : 'sets'}
            {cardio ? '' : ` x ${item.reps} reps`} · {item.rest}s rest
          </Text>
        </View>
        <Tap feedback="opacity" hitSlop={10} onPress={() => moveItem(item.uid, -1)} disabled={index === 0} style={styles.iconBtn} accessibilityLabel="Move up">
          <Icon name="chevronUp" size={17} color={index === 0 ? color.textQuaternary : color.textSecondary} />
        </Tap>
        <Tap feedback="opacity" hitSlop={10} onPress={() => moveItem(item.uid, 1)} disabled={isLast} style={styles.iconBtn} accessibilityLabel="Move down">
          <Icon name="chevronDown" size={17} color={isLast ? color.textQuaternary : color.textSecondary} />
        </Tap>
        <Tap
          feedback="opacity"
          hitSlop={10}
          onPress={() => {
            // Removing used to be instant and unrecoverable; put it back on one tap.
            const removed = { ...item };
            const at = index;
            haptic.light();
            removeItem(item.uid);
            toast(`${lib?.name ?? 'Exercise'} removed`, {
              tone: 'info',
              icon: 'trash',
              action: { label: 'Undo', onPress: () => useRoutineStore.getState().insertItem(removed, at) },
            });
          }}
          style={styles.iconBtn}
          accessibilityLabel="Remove"
        >
          <Icon name="trash" size={17} color={color.danger} />
        </Tap>
      </View>
      <View style={styles.steppers}>
        <Stepper label="Sets" value={item.sets} min={1} max={10} onChange={(sets) => updateItem(item.uid, { sets })} />
        {!cardio ? <Stepper label="Reps" value={item.reps} min={1} max={50} onChange={(reps) => updateItem(item.uid, { reps })} /> : null}
        <Stepper label="Rest" value={item.rest} min={0} max={300} step={15} suffix="s" onChange={(rest) => updateItem(item.uid, { rest })} />
      </View>
    </Animated.View>
  );
}

function Stepper({ label, value, min, max, step = 1, suffix = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void }) {
  const bump = (d: number) => {
    const next = Math.max(min, Math.min(max, value + d * step));
    if (next !== value) {
      haptic.selection();
      onChange(next);
    }
  };
  return (
    <View style={styles.stepper}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
      <View style={styles.stepRow}>
        <Tap feedback="opacity" hitSlop={6} onPress={() => bump(-1)} style={styles.stepBtn} accessibilityLabel={`Decrease ${label}`}>
          <Icon name="minus" size={14} color={color.text} weight="semibold" />
        </Tap>
        <Text variant="headline" tabular style={{ minWidth: 38, textAlign: 'center' }}>
          {value}
          {suffix}
        </Text>
        <Tap feedback="opacity" hitSlop={6} onPress={() => bump(1)} style={styles.stepBtn} accessibilityLabel={`Increase ${label}`}>
          <Icon name="plus" size={14} color={color.text} weight="semibold" />
        </Tap>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bgRaised },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter },
  name: { fontFamily: font.bold, fontSize: 30, color: color.text, paddingHorizontal: space.gutter, marginTop: space.md },
  meta: { paddingHorizontal: space.gutter, marginTop: 4 },
  label: { paddingHorizontal: space.gutter, marginTop: space.xl, marginBottom: 12 },
  days: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.gutter },
  day: { width: 42, height: 42, borderRadius: 21, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: '#F5F5F7' },
  item: { paddingHorizontal: space.gutter, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  itemHead: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  steppers: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stepper: { flex: 1, padding: 10, borderRadius: radius.sm, backgroundColor: color.surface, gap: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  skeleton: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: color.surface },
  skelThumb: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.surfaceHigh },
  skelLine: { height: 14, borderRadius: 7, backgroundColor: color.surfaceHigh },
  footer: { paddingHorizontal: space.md, paddingTop: space.sm, backgroundColor: color.bgRaised },
});
