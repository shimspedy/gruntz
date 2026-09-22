import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getExerciseById } from '../data/exercises';
import { useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, NavHeader } from '../ui/Layout';
import { Bar } from '../ui/Progress';
import { Text } from '../ui/Text';
import { color, font, radius, space } from '../ui/tokens';

function duration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '–';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const p = useUserStore((s) => s.progress);
  const units = useUserStore((s) => s.profile?.settings.units ?? 'imperial');
  const sessions = useReadinessStore((s) => s.trackedSessions);
  const km = units === 'metric';
  const dist = (mi: number) => (km ? `${(mi * 1.609).toFixed(1)} km` : `${mi.toFixed(1)} mi`);

  const tiles = [
    { label: 'Workouts', value: p.workouts_completed.toLocaleString() },
    { label: 'Total reps', value: p.total_reps.toLocaleString() },
    { label: 'Distance', value: dist(p.total_distance_miles) },
    { label: 'Total XP', value: p.current_xp.toLocaleString() },
    { label: 'Challenges', value: p.challenges_completed.toLocaleString() },
    { label: 'Challenge streak', value: p.challenge_streak_days === 1 ? '1 day' : `${p.challenge_streak_days} days` },
  ];
  const isNew = p.workouts_completed === 0 && p.challenges_completed === 0 && p.current_xp === 0;
  const records = [
    ...Object.entries(p.best_run_times).map(([k, v]) => ({ label: `Run · ${k}`, v })),
    ...Object.entries(p.best_ruck_times).map(([k, v]) => ({ label: `Ruck · ${k}`, v })),
    ...Object.entries(p.best_swim_times).map(([k, v]) => ({ label: `Swim · ${k}`, v })),
  ];
  const top = Object.entries(p.exercises_completed)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topMax = top[0]?.[1] ?? 1;

  return (
    <View style={styles.screen}>
      <NavHeader title="Stats" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false}>
        {isNew ? (
          <Text variant="callout" tone="secondary" style={styles.intro}>
            Nothing here yet. Finish your first workout and your totals, records and field sessions start filling in.
          </Text>
        ) : null}
        <View style={styles.grid}>
          {tiles.map((t) => (
            <View key={t.label} style={styles.tile}>
              <Text variant="subhead" tone="secondary">
                {t.label}
              </Text>
              <Text style={styles.tileValue} tabular numberOfLines={1}>
                {t.value}
              </Text>
            </View>
          ))}
        </View>

        <Text variant="section" style={styles.h}>
          Field sessions
        </Text>
        {sessions.length ? (
          <View style={styles.card}>
            {sessions.slice(0, 8).map((s, i) => (
              <View key={s.id} style={[styles.line, i > 0 && styles.divider]}>
                <View style={styles.lineIcon}>
                  <Icon name={s.type === 'ruck' ? 'ruck' : 'run'} size={20} color={color.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headline">
                    {s.type === 'ruck' ? 'Ruck' : 'Run'} · {dist(s.distanceMiles)}
                  </Text>
                  <Text variant="subhead" tone="tertiary" style={{ marginTop: 2 }}>
                    {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {s.packWeightPounds ? ` · ${s.packWeightPounds} lb` : ''}
                    {s.terrain ? ` · ${s.terrain}` : ''}
                  </Text>
                </View>
                <Text variant="headline" tabular>
                  {duration(s.durationSeconds)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon="run" title="No runs or rucks yet" body="Track one from the + menu and it lands here with pace and elevation." />
        )}

        <Text variant="section" style={styles.h}>
          Records
        </Text>
        {records.length ? (
          <View style={styles.card}>
            {records.map((r, i) => (
              <View key={r.label} style={[styles.line, i > 0 && styles.divider]}>
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {r.label}
                </Text>
                <Text variant="headline" tabular>
                  {duration(r.v)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState icon="trophy" title="No records logged" body="Timed missions and tracked sessions set your personal bests." />
        )}

        <Text variant="section" style={styles.h}>
          Top movements
        </Text>
        {top.length ? (
          <View style={styles.card}>
            {top.map(([id, n], i) => {
              const ex = getExerciseById(id);
              return (
                <View key={id} style={[styles.line, i > 0 && styles.divider]}>
                  <ExerciseThumb exercise={ex} size={44} />
                  <View style={{ flex: 1, marginLeft: 4 }}>
                    <Text variant="headline" numberOfLines={1}>
                      {ex?.name ?? id.replace(/_/g, ' ')}
                    </Text>
                    <Bar progress={n / topMax} height={4} style={{ marginTop: 8 }} trackColor={color.surfaceHigh} />
                  </View>
                  <Text variant="headline" tabular style={{ marginLeft: 12 }}>
                    {n.toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState icon="dumbbell" title="Nothing logged yet" body="Your most repeated exercises show up after your first mission." />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  intro: { paddingHorizontal: space.gutter, paddingBottom: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: space.md, paddingTop: space.md },
  tile: {
    flexBasis: '46%', flexGrow: 1,
    padding: space.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  tileValue: { fontFamily: font.bold, fontSize: 26, color: color.text, marginTop: 6 },
  h: { paddingHorizontal: space.gutter + 4, marginTop: space.xxl, marginBottom: space.md },
  card: { marginHorizontal: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, overflow: 'hidden' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md, paddingVertical: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  lineIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
});
