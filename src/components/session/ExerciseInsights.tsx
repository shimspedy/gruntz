import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ExerciseCharts, ExerciseHistory, ExerciseRecords, useExerciseSessions } from '../ExerciseProgress';
import { MuscleBodyMap } from '../MuscleBodyMap';
import { EXERCISE_LIBRARY, appMuscles, getLibraryItem } from '../../data/exerciseLibrary';
import { libraryExerciseId } from '../../data/exercises';
import { setLabel } from '../ExerciseProgress';
import { useExerciseNotesStore } from '../../store/useExerciseNotesStore';
import { useSessionStore } from '../../store/useSessionStore';
import type { Exercise } from '../../types';
import { ExerciseThumb } from '../../ui/ExerciseArt';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Segmented } from '../../ui/Segmented';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { toast } from '../../ui/Toast';
import { color, radius, space } from '../../ui/tokens';

const BACK = new Set(['back', 'hamstrings', 'glutes', 'triceps', 'calves', 'lower_back', 'traps']);

type Tab = 'about' | 'history' | 'charts' | 'records';
const TABS: { value: Tab; label: string }[] = [
  { value: 'about', label: 'About' },
  { value: 'history', label: 'History' },
  { value: 'charts', label: 'Charts' },
  { value: 'records', label: 'Records' },
];

/**
 * Everything under the set logger while training: what you lifted last time, how the
 * numbers are trending, how the movement is done, what it works, and what to swap to.
 */
export function ExerciseInsights({
  exercise,
  exerciseKey,
  unit,
}: {
  exercise: Exercise | undefined;
  /** The running session's key for this exercise, for swapping it out. */
  exerciseKey: string;
  unit: 'lb' | 'kg';
}) {
  const logKey = exercise?.media_key ?? exercise?.id;
  const sessions = useExerciseSessions(logKey, unit);
  const lib = exercise?.media_key ? getLibraryItem(exercise.media_key) : undefined;
  const steps = exercise?.steps?.length ? exercise.steps : (lib?.instructions ?? []);
  const muscles = exercise?.muscle_groups?.length ? exercise.muscle_groups : lib ? appMuscles(lib) : [];
  const primaryMuscles = useMemo(() => new Set(lib ? appMuscles({ ...lib, secondary: [] }) : muscles.slice(0, 2)), [lib, muscles]);
  const heat = useMemo(() => Object.fromEntries(muscles.map((m) => [m, primaryMuscles.has(m) ? 3 : 1])), [muscles, primaryMuscles]);
  // Show the side the main movers are on, not any side that appears at all.
  const side = [...primaryMuscles].some((m) => BACK.has(m)) ? 'back' : 'front';

  // Same primary muscle and movement pattern, so a swap trains the same thing.
  const alternatives = useMemo(() => {
    if (!lib) return [];
    return EXERCISE_LIBRARY.filter(
      (i) => i.key !== lib.key && i.pattern.some((p) => lib.pattern.includes(p)) && i.primary.some((m) => lib.primary.includes(m)),
    ).slice(0, 12);
  }, [lib]);

  const recent = [...sessions].reverse().slice(0, 2);

  const swap = (key: string, name: string) => {
    haptic.light();
    useSessionStore.getState().replaceExercise(exerciseKey, libraryExerciseId(key));
    toast(`Swapped to ${name}`, { tone: 'info', icon: 'replace' });
  };

  const [tab, setTab] = useState<Tab>('about');
  const savedNote = useExerciseNotesStore((n) => (logKey ? n.notes[logKey] : undefined)) ?? '';
  const [note, setNote] = useState(savedNote);

  return (
    <View style={styles.wrap}>
      <Segmented options={TABS} value={tab} onChange={setTab} />

      {tab === 'about' ? (
        <View style={styles.tabBody}>
          <Section title="Your notes">
            <TextInput
              value={note}
              onChangeText={setNote}
              onBlur={() => logKey && useExerciseNotesStore.getState().setNote(logKey, note)}
              placeholder="Setup, cues, machine settings — kept for next time"
              placeholderTextColor={color.textTertiary}
              multiline
              style={styles.note}
              selectionColor={color.accent}
              accessibilityLabel="Exercise note"
            />
          </Section>

          {recent.length ? (
            <Section title="Last time">
              <View style={styles.prevRow}>
                {recent.map((s) => (
                  <View key={s.entry.id} style={styles.prevCol}>
                    <Text variant="subhead" tone="secondary">
                      {s.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={{ marginTop: 6, gap: 4 }}>
                      {s.entry.sets.map((st, i) => (
                        <View key={i} style={styles.prevSet}>
                          <Text variant="callout" style={{ flex: 1 }} tabular>
                            {setLabel(st, s.entry.unit, unit)}
                          </Text>
                          <Icon name="check" size={13} color={color.success} weight="bold" />
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {steps.length ? (
            <Section title="How to">
              {steps.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.num}>
                    <Text variant="subhead" tabular>
                      {i + 1}
                    </Text>
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {step}
                  </Text>
                </View>
              ))}
            </Section>
          ) : null}

          {muscles.length ? (
            <Section title="Muscles worked">
              <View style={styles.muscleRow}>
                <View style={styles.bodyTile}>
                  <MuscleBodyMap muscles={heat} scale={0.34} side={side} variant="soft" />
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
                  ) : null}
                </View>
              </View>
            </Section>
          ) : null}

          {alternatives.length ? (
            <Section title="Swap this exercise">
              <Text variant="callout" tone="tertiary" style={{ marginBottom: space.sm }}>
                Same muscles, same pattern. Tap to swap it into today’s workout.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alts}>
                {alternatives.map((alt) => (
                  <Tap key={alt.key} onPress={() => swap(alt.key, alt.name)} scaleTo={0.96} style={styles.alt} accessibilityLabel={`Swap to ${alt.name}`}>
                    <ExerciseThumb mediaKey={alt.key} size={72} />
                    <Text variant="footnote" align="center" numberOfLines={2} style={{ marginTop: 6 }}>
                      {alt.name}
                    </Text>
                  </Tap>
                ))}
              </ScrollView>
            </Section>
          ) : null}
        </View>
      ) : (
        <View style={styles.tabBody}>
          {tab === 'history' ? <ExerciseHistory sessions={sessions} unit={unit} /> : null}
          {tab === 'charts' ? <ExerciseCharts sessions={sessions} unit={unit} /> : null}
          {tab === 'records' ? <ExerciseRecords sessions={sessions} unit={unit} /> : null}
        </View>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="section" style={{ marginBottom: space.md }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.gutter, paddingTop: space.xl },
  tabBody: { marginTop: space.lg },
  note: {
    minHeight: 64,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: space.md,
    color: color.text,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  section: { marginBottom: space.xxl },
  prevRow: { flexDirection: 'row', gap: space.md },
  prevCol: { flex: 1, backgroundColor: color.surface, borderRadius: radius.md, borderCurve: 'continuous', padding: space.md },
  prevSet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  bodyTile: {
    width: 100,
    height: 136,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  alts: { gap: space.md, paddingRight: space.gutter },
  alt: { width: 88, alignItems: 'center' },
});
