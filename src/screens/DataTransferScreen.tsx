import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  applyImport,
  estimateCapPressure,
  exportWorkouts,
  pickImportFile,
  type ImportPlan,
  type ImportPlanRow,
  type ImportResult,
  type Unit,
} from '../services/workoutTransfer';
import {
  MAX_ENTRIES_PER_EXERCISE,
  MAX_TRACKED_EXERCISES,
  useExerciseLogStore,
} from '../store/useExerciseLogStore';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { Chip, Group, NavHeader, Row } from '../ui/Layout';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';

/**
 * Import and export training history as a Strong CSV.
 *
 * The screen's job is to make an import *legible before it happens*. Someone moving
 * years of training between apps deserves to see exactly what lands and what does
 * not, by name, and to be able to back out — not a spinner followed by a number.
 * So nothing is written until the plan has been read and accepted.
 */

function monthYear(strongDate: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(strongDate.trim());
  if (!match) return strongDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(match[2]) - 1] ?? ''} ${match[1]}`;
}

function span(plan: ImportPlan): string {
  if (!plan.firstDate || !plan.lastDate) return '';
  const from = monthYear(plan.firstDate);
  const to = monthYear(plan.lastDate);
  return from === to ? from : `${from} – ${to}`;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function PlanRow({ row }: { row: ImportPlanRow }) {
  const matched = !!row.match;
  return (
    <View style={styles.planRow}>
      <Icon
        name={matched ? 'check' : 'minus'}
        size={18}
        color={matched ? color.success : color.textTertiary}
        style={styles.planIcon}
      />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" tone={matched ? 'primary' : 'secondary'}>
          {row.foreignName}
        </Text>
        <Text variant="footnote" tone="tertiary">
          {matched && row.match!.name !== row.foreignName
            ? `Saved as ${row.match!.name}`
            : matched
              ? 'Already in your library'
              : 'No exact match in Gruntz'}
        </Text>
      </View>
      <Text variant="footnote" tone="tertiary" tabular>
        {plural(row.sets, 'set')}
      </Text>
    </View>
  );
}

export default function DataTransferScreen() {
  const metric = useUserStore((s) => s.profile?.settings.units === 'metric');
  const loggedExercises = useExerciseLogStore((s) => Object.keys(s.logs).length);

  const [includeNotes, setIncludeNotes] = useState(true);
  const [unit, setUnit] = useState<Unit>(metric ? 'kg' : 'lb');
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const matched = useMemo(() => plan?.rows.filter((r) => r.match) ?? [], [plan]);
  const unmatched = useMemo(() => plan?.rows.filter((r) => !r.match) ?? [], [plan]);
  const incomingSets = useMemo(() => matched.reduce((sum, r) => sum + r.sets, 0), [matched]);
  // Read once per plan: a snapshot of the log as it stands before anything is written.
  const capPressure = useMemo(() => (plan ? estimateCapPressure(plan) : null), [plan]);

  const doExport = async () => {
    setBusy(true);
    const outcome = await exportWorkouts({ includeNotes, unit });
    setBusy(false);
    if (outcome.status === 'shared') {
      haptic.success();
      toast(`Exported ${plural(outcome.sets, 'set')}`, { icon: 'check' });
      return;
    }
    const message = outcome.status === 'empty'
      ? 'There’s nothing logged yet. Finish a workout and your history will be here to export.'
      : outcome.status === 'unavailable'
        ? 'This device can’t share files.'
        : 'Something went wrong writing the file. Nothing on this device has changed.';
    Alert.alert('Nothing exported', message);
  };

  const doPick = async () => {
    setBusy(true);
    const picked = await pickImportFile();
    setBusy(false);
    if (picked.status === 'ready') {
      haptic.success();
      setResult(null);
      setPlan(picked.plan);
      return;
    }
    if (picked.status === 'canceled') return;
    const message = picked.status === 'not-strong'
      ? 'That file doesn’t look like a Strong export. In Strong, go to Settings → Export Workout Data and pick the CSV it makes.'
      : picked.status === 'empty'
        ? 'That file has no workouts in it.'
        : 'We couldn’t read that file. Nothing has been imported.';
    Alert.alert('Couldn’t read that file', message);
  };

  const doImport = () => {
    if (!plan) return;
    setBusy(true);
    // Synchronous and fast — a progress bar here would be decoration, not information.
    const outcome = applyImport(plan, unit);
    setBusy(false);
    haptic.success();
    setResult(outcome);
    setPlan(null);
  };

  // ─── The plan, before anything is written ────────────────────────────────
  if (plan) {
    return (
      <View style={styles.screen}>
        <NavHeader title="Review import" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text variant="section">{plan.fileName}</Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: space.xs }}>
              {plural(plan.workouts, 'workout')}
              {span(plan) ? ` · ${span(plan)}` : ''}
            </Text>
          </View>

          <Group label="Weights in this file are">
            <View style={styles.chips}>
              <Chip label="Pounds (lb)" active={unit === 'lb'} onPress={() => setUnit('lb')} />
              <Chip label="Kilograms (kg)" active={unit === 'kg'} onPress={() => setUnit('kg')} />
            </View>
          </Group>
          <Text variant="footnote" tone="tertiary" style={styles.note}>
            A Strong export doesn’t record which unit it used, so pick the one you were
            lifting in. Get this wrong and every weight comes in wrong.
          </Text>

          {matched.length ? (
            <Group label={`Coming in · ${plural(matched.length, 'exercise')}`}>
              {matched.map((row) => <PlanRow key={row.foreignName} row={row} />)}
            </Group>
          ) : null}

          {unmatched.length ? (
            <>
              <Group label={`Staying behind · ${plural(unmatched.length, 'exercise')}`}>
                {unmatched.map((row) => <PlanRow key={row.foreignName} row={row} />)}
              </Group>
              <Text variant="footnote" tone="tertiary" style={styles.note}>
                We couldn’t find these exactly. The near misses are real exercises but not
                the same ones — a dumbbell calf raise isn’t the machine version — and filing
                your sets under the wrong lift would quietly wreck the numbers you came here
                to keep. Your file still has them: hold on to it.
              </Text>
            </>
          ) : null}

          {capPressure && (capPressure.crowdedExercises || capPressure.exceedsExerciseCeiling) ? (
            <Text variant="footnote" tone="tertiary" style={styles.note}>
              Heads up: Gruntz keeps your {MAX_ENTRIES_PER_EXERCISE} most recent sessions per
              exercise
              {capPressure.exceedsExerciseCeiling
                ? ` and your ${MAX_TRACKED_EXERCISES} most recently trained exercises`
                : ''}
              . This file goes past that
              {capPressure.crowdedExercises
                ? ` on ${plural(capPressure.crowdedExercises, 'exercise')}`
                : ''}
              , so the oldest sessions — from the file or already on this phone — will be
              dropped to make room.
            </Text>
          ) : null}

          {plan.skippedLines ? (
            <Text variant="footnote" tone="tertiary" style={styles.standalone}>
              {plural(plan.skippedLines, 'line')} in the file couldn’t be read and will be ignored.
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={matched.length ? `Import ${plural(incomingSets, 'set')}` : 'Nothing to import'}
              onPress={doImport}
              disabled={!matched.length}
              loading={busy}
            />
            <Button title="Cancel" variant="outline" onPress={() => setPlan(null)} style={{ marginTop: space.sm }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Landing ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <NavHeader title="Import & export" />
      <ScrollView contentContainerStyle={styles.content}>
        {result ? (
          <View style={styles.done}>
            <Icon name="check" size={28} color={color.success} />
            <Text variant="section" style={{ marginTop: space.sm }}>
              {plural(result.sets, 'set')} imported
            </Text>
            <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xs }}>
              Across {plural(result.exercises, 'exercise')}.
              {result.skippedExercises
                ? ` ${plural(result.skippedExercises, 'exercise')} had no match and stayed behind.`
                : ''}
              {'\n'}Open any exercise to see its history.
            </Text>

            {/* Gruntz keeps a bounded history per exercise. An import large enough to
                hit that ceiling loses its oldest sessions, and can push out training
                already logged here — saying so is the whole point of this block. */}
            {result.droppedSets || result.evictedEntries ? (
              <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
                Gruntz keeps your {MAX_ENTRIES_PER_EXERCISE} most recent sessions per exercise.
                {result.droppedSets
                  ? ` ${plural(result.droppedSets, 'older set')} from the file didn’t fit.`
                  : ''}
                {result.evictedEntries
                  ? ` ${plural(result.evictedEntries, 'older session')} already on this phone made way for it.`
                  : ''}
              </Text>
            ) : null}
          </View>
        ) : null}

        <Group label="Bring your training in">
          <Row
            icon="doc"
            title="Import from Strong"
            subtitle="Pick the CSV Strong exports. You’ll see exactly what lands before anything is saved."
            onPress={busy ? undefined : doPick}
          />
        </Group>

        <Group label="Take your training out">
          <Row
            icon="share"
            title="Export my workouts"
            subtitle={
              loggedExercises
                ? `${plural(loggedExercises, 'exercise')} with logged history, as a Strong-compatible CSV.`
                : 'Nothing logged yet — finish a workout first.'
            }
            onPress={busy || !loggedExercises ? undefined : doExport}
          />
          <Row
            title="Include my exercise notes"
            subtitle="Your saved cues and machine settings."
            toggle={includeNotes}
            onToggle={setIncludeNotes}
            chevron={false}
          />
          <View style={styles.planRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">Write weights in</Text>
            </View>
            <View style={styles.inlineChips}>
              <Chip label="lb" active={unit === 'lb'} onPress={() => setUnit('lb')} />
              <Chip label="kg" active={unit === 'kg'} onPress={() => setUnit('kg')} />
            </View>
          </View>
        </Group>

        <Text variant="footnote" tone="tertiary" style={styles.standalone}>
          The file is a plain CSV — one row per set — that opens in any spreadsheet and
          imports into most lifting apps. Gruntz doesn’t record how long a session took or
          your rest between sets, so those columns come out empty rather than guessed.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: space.xxl },
  hero: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm },
  chips: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  // Already inside a padded row — the padded variant would push these off the edge.
  inlineChips: { flexDirection: 'row', gap: space.xs },
  note: { paddingHorizontal: space.lg, paddingBottom: space.md, paddingTop: space.xs },
  standalone: { paddingHorizontal: space.lg, paddingTop: space.md },
  planRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
  planIcon: { marginRight: space.xs },
  actions: { paddingHorizontal: space.lg, paddingTop: space.lg },
  done: {
    alignItems: 'center',
    marginHorizontal: space.lg,
    marginTop: space.md,
    marginBottom: space.sm,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: color.bgRaised,
  },
});
