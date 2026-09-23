import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ExerciseCharts, ExerciseHistory, ExerciseRecords, useExerciseSessions } from '../components/ExerciseProgress';
import { ExerciseVideo } from '../components/ExerciseVideo';
import { MuscleBodyMap } from '../components/MuscleBodyMap';
import { exercises, getExerciseById, libraryExerciseId } from '../data/exercises';
import { appMuscles, getLibraryItem } from '../data/exerciseLibrary';
import { muscleLabel } from '../features/plan';
import { useRoutineStore } from '../store/useRoutineStore';
import { useExerciseNotesStore } from '../store/useExerciseNotesStore';
import { useUserStore } from '../store/useUserStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Tap } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { EmptyState, Hairline, NavHeader, Stat } from '../ui/Layout';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';
import { GROUP_LABEL } from './ExerciseLibraryScreen';

const BACK = new Set(['back', 'hamstrings', 'glutes', 'triceps', 'lats', 'calves', 'lower_back', 'traps']);
const FRONT = new Set(['chest', 'quads', 'core', 'biceps', 'shoulders', 'adductors']);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Tab = 'about' | 'history' | 'charts' | 'records';
const TABS: { value: Tab; label: string }[] = [
  { value: 'about', label: 'About' },
  { value: 'history', label: 'History' },
  { value: 'charts', label: 'Charts' },
  { value: 'records', label: 'Records' },
];

export default function ExerciseDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'ExerciseDetail'>>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const focused = useIsFocused();

  const fromLibrary = !params.exerciseId && !!params.mediaKey;
  const ex = params.exerciseId
    ? getExerciseById(params.exerciseId)
    : params.mediaKey
      ? getExerciseById(libraryExerciseId(params.mediaKey))
      : undefined;
  const lib = ex?.media_key ? getLibraryItem(ex.media_key) : undefined;
  const [tab, setTab] = useState<Tab>('about');
  const unit = useUserStore((u) => (u.profile?.settings.units === 'metric' ? 'kg' : 'lb'));
  // Same key the workout log uses: the clip, so an app exercise and its library clip share history.
  const sessions = useExerciseSessions(ex ? (ex.media_key ?? ex.id) : undefined, unit);
  const note = useExerciseNotesStore((n) => (ex ? n.notes[ex.media_key ?? ex.id] : undefined));
  const [picker, setPicker] = useState(false);
  const routines = useRoutineStore((st) => st.routines);

  if (!ex) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Exercise unavailable" body="This movement couldn’t be loaded. Go back and open it again." />
      </View>
    );
  }

  const muscles = ex.muscle_groups?.length ? ex.muscle_groups : lib ? appMuscles(lib) : [];
  const primaryApp = new Set(lib ? appMuscles({ ...lib, secondary: [] }) : muscles.slice(0, 2));
  const heat = Object.fromEntries(muscles.map((m) => [m, primaryApp.has(m) ? 3 : 1]));
  const side = muscles.some((m) => BACK.has(m)) && !muscles.some((m) => FRONT.has(m) && primaryApp.has(m)) ? 'back' : 'front';
  const usedIn = fromLibrary && lib ? exercises.filter((e) => e.media_key === lib.key) : [];

  const stats =
    fromLibrary && lib
      ? [
          { label: 'Level', value: cap(lib.difficulty) },
          { label: 'Equipment', value: lib.equipment[0] ?? 'None' },
          { label: 'Pattern', value: lib.pattern[0] ?? '–' },
        ]
      : [
          ex.sets ? { label: 'Sets', value: String(ex.sets) } : null,
          ex.reps ? { label: 'Reps', value: String(ex.reps) } : null,
          ex.duration_seconds
            ? { label: 'Time', value: ex.duration_seconds >= 60 ? `${Math.round(ex.duration_seconds / 60)} min` : `${ex.duration_seconds}s` }
            : null,
          ex.distance ? { label: 'Distance', value: ex.distance } : null,
          ex.rest_seconds > 0 ? { label: 'Rest', value: `${ex.rest_seconds}s` } : null,
          { label: 'XP', value: `${ex.xp_value}` },
        ]
          .filter((s): s is { label: string; value: string } => !!s)
          .slice(0, 4);

  const steps = ex.steps?.length ? ex.steps : lib?.instructions ?? [];
  const mistakes = lib?.mistakes ?? [];
  const newWorkoutWith = () => {
    if (!lib) return;
    useRoutineStore.getState().newDraft([lib.key]);
    navigation.navigate('RoutineEditor');
  };

  // An Alert can only show a handful of buttons, so this used to offer the first
  // five workouts and silently hide the rest. A sheet scrolls.
  const addToWorkout = () => {
    if (!lib) return;
    if (!useRoutineStore.getState().routines.length) return newWorkoutWith();
    setPicker(true);
  };

  return (
    <View style={styles.screen}>
      <NavHeader title={lib && fromLibrary ? GROUP_LABEL[lib.group] : cap(ex.category)} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (fromLibrary ? 120 : space.xxl) }} showsVerticalScrollIndicator={false}>
        <ExerciseVideo exercise={ex} active={focused} style={{ width, height: width * 0.62 }} />
        <View style={styles.body}>
          <Text variant="title">{ex.name}</Text>
          {ex.description ? (
            <Text variant="body" tone="secondary" style={{ marginTop: space.sm }}>
              {ex.description}
            </Text>
          ) : null}

          {note ? (
            <View style={styles.noteCard}>
              <Icon name="pencil" size={14} color={color.textSecondary} style={{ marginTop: 3 }} />
              <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
                {note}
              </Text>
            </View>
          ) : null}

          <Segmented options={TABS} value={tab} onChange={setTab} style={{ marginTop: space.lg }} />
          {tab === 'about' ? (
            <>
            <View style={styles.stats}>
              {stats.map((s, i) => (
                <Stat key={s.label} label={s.label} value={s.value} accent={i === 0} style={{ flex: 1 }} />
              ))}
            </View>
            <Hairline />

            {muscles.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  Muscles
                </Text>
                <View style={styles.muscleRow}>
                  <View style={styles.bodyTile}>
                    <MuscleBodyMap muscles={heat} scale={0.42} side={side} variant="soft" />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    {lib ? (
                      <>
                        <Text variant="footnote" tone="tertiary">
                          Primary
                        </Text>
                        <Text variant="headline">{lib.primary.join(', ')}</Text>
                        {lib.secondary.length ? (
                          <>
                            <Text variant="footnote" tone="tertiary" style={{ marginTop: 6 }}>
                              Secondary
                            </Text>
                            <Text variant="callout" tone="secondary">
                              {lib.secondary.join(', ')}
                            </Text>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <View style={styles.chips}>
                        {muscles.map((m) => (
                          <View key={m} style={styles.chip}>
                            <Text variant="subhead">{muscleLabel(m)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </>
            ) : null}

            {steps.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  How to
                </Text>
                {steps.map((step, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(i * 50).duration(300)} style={styles.step}>
                    <View style={styles.num}>
                      <Text variant="subhead" tabular>
                        {i + 1}
                      </Text>
                    </View>
                    <Text variant="body" style={{ flex: 1 }}>
                      {step}
                    </Text>
                  </Animated.View>
                ))}
              </>
            ) : null}

            {mistakes.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  Common mistakes
                </Text>
                {mistakes.map((m, i) => (
                  <View key={i} style={styles.tip}>
                    <Icon name="alert" size={17} color={color.flame} style={{ marginTop: 2 }} />
                    <Text variant="body" tone="secondary" style={{ flex: 1 }}>
                      {m}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {!lib?.mistakes.length && ex.form_tips.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  Form cues
                </Text>
                {ex.form_tips.map((tip, i) => (
                  <View key={i} style={styles.tip}>
                    <View style={styles.dot} />
                    <Text variant="body" tone="secondary" style={{ flex: 1 }}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {fromLibrary && lib?.benefits.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  Why it works
                </Text>
                {lib.benefits.map((b, i) => (
                  <View key={i} style={styles.tip}>
                    <Icon name="check" size={16} color={color.accent} weight="bold" style={{ marginTop: 3 }} />
                    <Text variant="body" tone="secondary" style={{ flex: 1 }}>
                      {b}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}

            {!fromLibrary && ex.equipment.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  Equipment
                </Text>
                <View style={styles.chips}>
                  {ex.equipment.map((e) => (
                    <View key={e} style={styles.chip}>
                      <Text variant="subhead">{cap(e)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {usedIn.length ? (
              <>
                <Text variant="section" style={styles.h}>
                  In your programs
                </Text>
                {usedIn.map((e) => (
                  <Text key={e.id} variant="body" tone="secondary" style={{ marginBottom: 6 }}>
                    {e.name}
                  </Text>
                ))}
              </>
            ) : null}
            </>
          ) : (
            <View style={{ marginTop: space.lg }}>
              {tab === 'history' ? <ExerciseHistory sessions={sessions} unit={unit} /> : null}
              {tab === 'charts' ? <ExerciseCharts sessions={sessions} unit={unit} /> : null}
              {tab === 'records' ? <ExerciseRecords sessions={sessions} unit={unit} /> : null}
            </View>
          )}
        </View>
      </ScrollView>

      {fromLibrary ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
          <Button title="Add to a workout" icon="plus" onPress={addToWorkout} />
        </View>
      ) : null}

      <Sheet visible={picker} onClose={() => setPicker(false)} title="Add to a workout">
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {routines.map((r) => (
            <Tap
              key={r.id}
              feedback="highlight"
              baseColor={color.bgRaised}
              pressedColor={color.surface}
              style={styles.pickRow}
              accessibilityLabel={r.name}
              onPress={() => {
                if (!lib) return;
                useRoutineStore.getState().addToRoutine(r.id, lib.key);
                haptic.success();
                setPicker(false);
                toast(`Added to ${r.name}`, { icon: 'check' });
              }}
            >
              <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                {r.name}
              </Text>
              <Text variant="footnote" tone="tertiary">
                {r.items.length} {r.items.length === 1 ? 'exercise' : 'exercises'}
              </Text>
            </Tap>
          ))}
          <Tap
            feedback="highlight"
            baseColor={color.bgRaised}
            pressedColor={color.surface}
            style={styles.pickRow}
            accessibilityLabel="New workout"
            onPress={() => {
              setPicker(false);
              newWorkoutWith();
            }}
          >
            <Icon name="plus" size={18} color={color.accent} />
            <Text variant="bodyMedium" tone="accent" style={{ flex: 1, marginLeft: 10 }}>
              New workout
            </Text>
          </Tap>
        </ScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  pickRow: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter },
  body: { paddingHorizontal: space.gutter + 4, paddingTop: space.lg },
  stats: { flexDirection: 'row', gap: space.md, paddingVertical: space.lg, marginTop: space.sm },
  h: { marginTop: space.xl, marginBottom: space.md },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  bodyTile: {
    width: 110,
    height: 150,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  step: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.accent, marginTop: 9 },
  noteCard: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.surface, justifyContent: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
});
