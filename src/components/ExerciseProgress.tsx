import React, { useMemo, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { estimated1RM, recordProgression, summarize, toUnit, useExerciseLogStore, type LoggedSet, type SessionSummary } from '../store/useExerciseLogStore';
import { Icon } from '../ui/Icon';
import { Chip } from '../ui/Layout';
import { Text } from '../ui/Text';
import { color, radius, space } from '../ui/tokens';

type Unit = 'lb' | 'kg';
type Kind = 'weighted' | 'reps' | 'time';

const EMPTY: never[] = [];
const fmtDate = (d: Date, withYear = false) =>
  d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const round = (n: number) => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10);
const fmtSecs = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : `${Math.round(s)}s`);

/** All logged sessions for one exercise, oldest first, weights in the display unit. */
export function useExerciseSessions(logKey: string | undefined, unit: Unit): SessionSummary[] {
  const entries = useExerciseLogStore((s) => (logKey ? s.logs[logKey] : undefined)) ?? EMPTY;
  return useMemo(() => entries.map((e) => summarize(e, unit)), [entries, unit]);
}

function kindOf(sessions: SessionSummary[]): Kind {
  if (sessions.some((s) => s.bestWeight > 0)) return 'weighted';
  if (sessions.some((s) => s.totalSeconds > 0 && s.totalReps === 0)) return 'time';
  return 'reps';
}

export function setLabel(st: LoggedSet, from: Unit, unit: Unit): string {
  const parts: string[] = [];
  if (st.weight) parts.push(`${round(toUnit(st.weight, from, unit))} ${unit}`);
  if (st.reps) parts.push(parts.length ? `× ${st.reps}` : `${st.reps} reps`);
  if (st.seconds) parts.push(fmtSecs(st.seconds));
  if (st.distance) parts.push(st.distance);
  return parts.join(' ') || 'Done';
}

function Empty({ icon, title, body }: { icon: 'chart' | 'trophy' | 'calendar'; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={24} color={color.textSecondary} />
      </View>
      <Text variant="headline" align="center">
        {title}
      </Text>
      <Text variant="callout" tone="secondary" align="center" style={{ marginTop: 6, maxWidth: 280 }}>
        {body}
      </Text>
    </View>
  );
}

// ─── History ──────────────────────────────────────────────────────────────

export function ExerciseHistory({ sessions, unit }: { sessions: SessionSummary[]; unit: Unit }) {
  if (!sessions.length) {
    return <Empty icon="calendar" title="No history yet" body="Finish a workout with this exercise and every set you log shows up here." />;
  }
  const kind = kindOf(sessions);
  return (
    <View style={{ gap: space.md }}>
      {[...sessions].reverse().map((s) => (
        <View key={s.entry.id} style={styles.card}>
          <Text variant="headline">{fmtDay(s.date)}</Text>
          <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
            {s.entry.workoutTitle}
          </Text>
          <View style={styles.setHead}>
            <Text variant="overline" tone="tertiary">
              Sets performed
            </Text>
            {kind === 'weighted' && s.best1RM ? (
              <Text variant="overline" tone="tertiary">
                Est. 1RM
              </Text>
            ) : null}
          </View>
          {s.entry.sets.map((st, i) => {
            const isBest = st === s.bestSet && s.entry.sets.length > 1;
            const e1 = st.weight && st.reps && st.reps <= 12 ? estimated1RM(toUnit(st.weight, s.entry.unit, unit), st.reps) : 0;
            return (
              <View key={i} style={styles.setRow}>
                <View style={[styles.setNum, isBest && styles.setNumBest]}>
                  <Text variant="caption" style={{ color: isBest ? '#FFF' : color.textSecondary }} tabular>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ flex: 1 }} tabular>
                  {setLabel(st, s.entry.unit, unit)}
                </Text>
                {kind === 'weighted' && e1 ? (
                  <Text variant="callout" tone="secondary" tabular>
                    {round(e1)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────

type Range = '1M' | '3M' | '1Y' | 'All';
const RANGE_DAYS: Record<Range, number> = { '1M': 31, '3M': 92, '1Y': 366, All: Infinity };

interface Metric {
  id: string;
  title: string;
  pick: (s: SessionSummary) => number;
  format: (v: number) => string;
}

function metricsFor(kind: Kind, unit: Unit): Metric[] {
  const w = (v: number) => `${round(v)} ${unit}`;
  if (kind === 'weighted') {
    return [
      { id: '1rm', title: 'Best set (est. 1RM)', pick: (s) => s.best1RM, format: w },
      { id: 'weight', title: 'Heaviest weight', pick: (s) => s.bestWeight, format: w },
      { id: 'volume', title: 'Session volume', pick: (s) => s.volume, format: (v) => `${Math.round(v).toLocaleString()} ${unit}` },
      { id: 'reps', title: 'Total reps', pick: (s) => s.totalReps, format: (v) => `${Math.round(v)} reps` },
    ];
  }
  if (kind === 'time') {
    return [
      { id: 'longest', title: 'Longest set', pick: (s) => Math.max(0, ...s.entry.sets.map((st) => st.seconds ?? 0)), format: fmtSecs },
      { id: 'total', title: 'Total time', pick: (s) => s.totalSeconds, format: fmtSecs },
    ];
  }
  return [
    { id: 'max', title: 'Most reps in a set', pick: (s) => s.maxReps, format: (v) => `${Math.round(v)} reps` },
    { id: 'total', title: 'Total reps', pick: (s) => s.totalReps, format: (v) => `${Math.round(v)} reps` },
  ];
}

export function ExerciseCharts({ sessions, unit }: { sessions: SessionSummary[]; unit: Unit }) {
  // Default to the shortest range that still shows something, so nobody opens four empty cards.
  const defaultRange = useMemo<Range>(() => {
    const newest = sessions[sessions.length - 1]?.date.getTime() ?? 0;
    const age = (Date.now() - newest) / 86400000;
    return age <= 31 ? '3M' : age <= 366 ? '1Y' : 'All';
  }, [sessions]);
  const [range, setRange] = useState<Range | null>(null);
  const active = range ?? defaultRange;
  const kind = kindOf(sessions);
  const cutoff = Date.now() - RANGE_DAYS[active] * 86400000;
  const shown = sessions.filter((s) => s.date.getTime() >= cutoff);
  return (
    <View>
      <View style={styles.ranges}>
        {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
          <Chip key={r} label={r === 'All' ? 'All time' : r} active={active === r} onPress={() => setRange(r)} />
        ))}
      </View>
      <View style={{ gap: space.md }}>
        {metricsFor(kind, unit).map((m) => (
          <ChartCard key={m.id} metric={m} sessions={shown} />
        ))}
      </View>
    </View>
  );
}

const CHART_H = 150;
const PAD = { top: 12, bottom: 22, left: 4, right: 44 };
/** A flat dotted baseline behind "Not enough data" — never a fake rising trend. */
const GHOST = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

function ChartCard({ metric, sessions }: { metric: Metric; sessions: SessionSummary[] }) {
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const points = sessions.map((s) => ({ date: s.date, v: metric.pick(s) })).filter((p) => Number.isFinite(p.v) && p.v > 0);
  const enough = points.length >= 2;

  const innerW = Math.max(1, w - PAD.left - PAD.right);
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const vals = points.map((p) => p.v);
  const lo = enough ? Math.min(...vals) : 0;
  const hi = enough ? Math.max(...vals) : 1;
  const span = hi - lo || Math.max(1, hi * 0.1);
  const yMin = Math.max(0, lo - span * 0.15);
  const yMax = hi + span * 0.15;
  const t0 = points[0]?.date.getTime() ?? 0;
  const t1 = points[points.length - 1]?.date.getTime() ?? 1;
  const x = (i: number) => PAD.left + (t1 === t0 ? innerW / 2 : ((points[i].date.getTime() - t0) / (t1 - t0)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const path = enough ? points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ') : '';
  const ghost = GHOST.map((g, i) => `${i ? 'L' : 'M'}${(PAD.left + (i / (GHOST.length - 1)) * innerW).toFixed(1)},${(PAD.top + innerH - g * innerH).toFixed(1)}`).join(' ');

  const latest = points[points.length - 1];
  const first = points[0];
  const change = enough && latest && first ? latest.v - first.v : 0;
  const shownPoint = active != null ? points[active] : latest;

  const scrub = (e: GestureResponderEvent) => {
    if (!enough) return;
    const px = e.nativeEvent.locationX;
    let best = 0;
    let dist = Infinity;
    points.forEach((_, i) => {
      const d = Math.abs(x(i) - px);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setActive(best);
  };

  return (
    <View style={styles.card}>
      <View style={styles.chartHead}>
        <View style={{ flex: 1 }}>
          <Text variant="footnote" tone="tertiary">
            {metric.title}
          </Text>
          <Text variant="title" style={{ marginTop: 2 }} tabular>
            {shownPoint ? metric.format(shownPoint.v) : '–'}
          </Text>
          <Text variant="footnote" tone="secondary" style={{ marginTop: 2 }}>
            {shownPoint ? (active != null ? fmtDate(shownPoint.date, true) : `Latest · ${fmtDate(shownPoint.date)}`) : 'No sessions in this range'}
          </Text>
        </View>
        {enough && active == null && change !== 0 ? (
          <View style={styles.delta}>
            <Icon name={change > 0 ? 'chevronUp' : 'chevronDown'} size={12} color={color.textSecondary} />
            <Text variant="subhead" tone="secondary" tabular>
              {metric.format(Math.abs(change))}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={{ height: CHART_H, marginTop: space.sm }}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => enough}
        onMoveShouldSetResponder={() => enough}
        onResponderGrant={scrub}
        onResponderMove={scrub}
        onResponderRelease={() => setActive(null)}
        onResponderTerminate={() => setActive(null)}
        accessible
        accessibilityLabel={
          enough
            ? `${metric.title}: ${points.length} sessions, from ${metric.format(first!.v)} to ${metric.format(latest!.v)}`
            : `${metric.title}: not enough data yet`
        }
      >
        {w > 0 ? (
          <Svg width={w} height={CHART_H}>
            {[0, 0.5, 1].map((f) => (
              <Line key={f} x1={PAD.left} x2={PAD.left + innerW} y1={PAD.top + innerH * f} y2={PAD.top + innerH * f} stroke={color.line} strokeWidth={1} />
            ))}
            {enough ? (
              <>
                <Path d={path} stroke={color.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                {points.length <= 24
                  ? points.map((p, i) => <Circle key={i} cx={x(i)} cy={y(p.v)} r={4} fill={color.accent} stroke={color.surface} strokeWidth={2} />)
                  : null}
                {active != null ? (
                  <>
                    <Line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} stroke={color.textTertiary} strokeWidth={1} />
                    <Circle cx={x(active)} cy={y(points[active].v)} r={6} fill={color.accent} stroke={color.surface} strokeWidth={2} />
                  </>
                ) : null}
              </>
            ) : (
              <Path d={ghost} stroke={color.textQuaternary} strokeWidth={2} fill="none" strokeDasharray="4 5" strokeLinecap="round" />
            )}
          </Svg>
        ) : null}
        {enough ? (
          <>
            <Text variant="caption" tone="tertiary" style={[styles.yLabel, { top: PAD.top - 7 }]} tabular>
              {round(yMax)}
            </Text>
            <Text variant="caption" tone="tertiary" style={[styles.yLabel, { top: PAD.top + innerH - 7 }]} tabular>
              {round(yMin)}
            </Text>
            <Text variant="caption" tone="tertiary" style={[styles.xLabel, { left: PAD.left }]}>
              {fmtDate(first!.date)}
            </Text>
            <Text variant="caption" tone="tertiary" style={[styles.xLabel, { right: PAD.right }]}>
              {fmtDate(latest!.date)}
            </Text>
          </>
        ) : (
          <View style={styles.notEnough} pointerEvents="none">
            <Text variant="subhead">Not enough data yet</Text>
            <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
              Log this exercise twice to see a trend
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Records ──────────────────────────────────────────────────────────────

export function ExerciseRecords({ sessions, unit }: { sessions: SessionSummary[]; unit: Unit }) {
  if (!sessions.length) {
    return <Empty icon="trophy" title="No records yet" body="Your personal bests for this exercise appear here after your first logged workout." />;
  }
  const kind = kindOf(sessions);
  const metrics = metricsFor(kind, unit);
  const best = metrics.map((m) => {
    let top: SessionSummary | null = null;
    sessions.forEach((s) => {
      if (m.pick(s) > 0 && (!top || m.pick(s) > m.pick(top))) top = s;
    });
    return { m, top: top as SessionSummary | null };
  });

  // Heaviest weight lifted for each rep count (1–12).
  const repMax = new Map<number, { w: number; date: Date }>();
  if (kind === 'weighted') {
    sessions.forEach((s) =>
      s.entry.sets.forEach((st) => {
        if (!st.weight || !st.reps || st.reps > 12) return;
        const w = toUnit(st.weight, s.entry.unit, unit);
        const cur = repMax.get(st.reps);
        if (!cur || w > cur.w) repMax.set(st.reps, { w, date: s.date });
      }),
    );
  }

  const progression = metrics
    .flatMap((m) => recordProgression(sessions, m.pick).map((p) => ({ ...p, m })))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 20);

  return (
    <View>
      <Text variant="overline" tone="tertiary" style={styles.groupLabel}>
        Personal records
      </Text>
      <View style={styles.card}>
        {best.map(({ m, top }, i) => (
          <View key={m.id} style={[styles.recordRow, i < best.length - 1 && styles.divider]}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{m.title}</Text>
              {top ? (
                <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
                  {fmtDate(top.date, true)}
                </Text>
              ) : null}
            </View>
            <Text variant="headline" tabular>
              {top ? m.format(m.pick(top)) : '–'}
            </Text>
          </View>
        ))}
      </View>

      {repMax.size ? (
        <>
          <Text variant="overline" tone="tertiary" style={styles.groupLabel}>
            Best weight by reps
          </Text>
          <View style={styles.card}>
            {[...repMax.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([reps, r], i, arr) => (
                <View key={reps} style={[styles.recordRow, i < arr.length - 1 && styles.divider]}>
                  <Text variant="bodyMedium" style={{ flex: 1 }}>
                    {reps} {reps === 1 ? 'rep' : 'reps'}
                  </Text>
                  <Text variant="footnote" tone="tertiary" style={{ marginRight: space.md }}>
                    {fmtDate(r.date, true)}
                  </Text>
                  <Text variant="headline" tabular>
                    {round(r.w)} {unit}
                  </Text>
                </View>
              ))}
          </View>
        </>
      ) : null}

      {progression.length ? (
        <>
          <Text variant="overline" tone="tertiary" style={styles.groupLabel}>
            Record history
          </Text>
          <View style={styles.card}>
            {progression.map((p, i) => (
              <View key={`${p.m.id}-${p.date.getTime()}`} style={[styles.recordRow, i < progression.length - 1 && styles.divider]}>
                <Icon name="trophy" size={16} color={color.accent} style={{ marginRight: space.sm }} />
                <View style={{ flex: 1 }}>
                  <Text variant="callout">{p.m.title}</Text>
                  <Text variant="footnote" tone="tertiary" style={{ marginTop: 1 }}>
                    {fmtDate(p.date, true)}
                  </Text>
                </View>
                <Text variant="subhead" tabular>
                  {p.m.format(p.value)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.lg, borderCurve: 'continuous', padding: space.md },
  empty: { alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.lg },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  setHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md, marginBottom: space.xs },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  setNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  setNumBest: { backgroundColor: color.accent },
  ranges: { flexDirection: 'row', gap: 8, marginBottom: space.md, flexWrap: 'wrap' },
  chartHead: { flexDirection: 'row', alignItems: 'flex-start' },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 4 },
  yLabel: { position: 'absolute', right: 0, width: PAD.right - 6, textAlign: 'right' },
  xLabel: { position: 'absolute', bottom: 0 },
  notEnough: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { marginTop: space.lg, marginBottom: space.xs, marginLeft: 4 },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
});
