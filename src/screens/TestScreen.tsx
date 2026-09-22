import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TabHeader } from '../components/TabHeader';
import { branchDefaultTest, getTestReadiness, getTestsForBranch, type TestEventDefinition } from '../data/militaryTests';
import { useTabChromeInset } from '../navigation/TabBar';
import { useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import type { FitnessTestType, ServiceBranch } from '../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SectionTitle } from '../ui/Layout';
import { Bar, Ring } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { Segmented } from '../ui/Segmented';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { openExternalUrl } from '../utils/externalLinks';
import { color, font, motion, radius, space } from '../ui/tokens';

/** Opening a URL can fail (no browser, malformed link); say so instead of doing nothing. */
async function openSource(url: string) {
  const opened = await openExternalUrl(url);
  if (!opened) toast('Could not open that link', { tone: 'error', icon: 'alert' });
}

export const BRANCH_LABEL: Record<ServiceBranch, string> = {
  army: 'U.S. Army',
  marines: 'U.S. Marine Corps',
  navy: 'U.S. Navy',
  air_force: 'U.S. Air Force',
  space_force: 'U.S. Space Force',
  coast_guard: 'U.S. Coast Guard',
  general: 'General readiness',
};

export function formatEventValue(value: number, unit: string) {
  if (!value) return '–';
  if (unit !== 'seconds') return `${value}`;
  const m = Math.floor(value / 60);
  const s = Math.round(value % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const unitLabel = (u: TestEventDefinition['unit']) => (u === 'seconds' ? 'min:sec' : u === 'pounds' ? 'lb' : u);

/**
 * Whole calendar days until the test. Measuring elapsed milliseconds against noon
 * on the day read "1 day to go" all morning of the test itself, then flipped to 0
 * after midday — so counting days, not hours.
 */
function daysUntil(date?: string | null) {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((target - today) / 86400000));
}

function parseValue(text: string, unit: string) {
  if (unit === 'seconds' && text.includes(':')) {
    const [m, s] = text.split(':').map((n) => Number(n) || 0);
    return m * 60 + s;
  }
  return Number(text.replace(/[^0-9.]/g, '')) || 0;
}

export default function TestScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottom = useTabChromeInset();
  const ref = React.useRef<ScrollView>(null);
  useScrollToTop(ref);
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const testScores = useReadinessStore((s) => s.testScores);
  const targetScores = useReadinessStore((s) => s.targetScores);
  const [logging, setLogging] = useState(false);

  const branch = profile?.service_branch ?? 'general';
  const tests = getTestsForBranch(branch);
  const test = tests.find((t) => t.id === profile?.fitness_test_type) ?? tests.find((t) => t.id === branchDefaultTest[branch]) ?? tests[0] ?? getTestsForBranch('general')[0];
  const key = (id: string) => `${test.id}:${id}`;
  const scoped = Object.fromEntries(test.events.map((e) => [e.id, testScores[key(e.id)] ?? 0]));
  const readiness = getTestReadiness(test, scoped);
  const countdown = daysUntil(profile?.fitness_test_date);
  const ranked = test.events.map((e) => ({ e, score: getTestReadiness({ ...test, events: [e] }, scoped).score })).sort((a, b) => a.score - b.score);
  const anyLogged = Object.values(scoped).some((v) => v > 0);

  return (
    <ScrollView ref={ref} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
      <TabHeader />

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="overline" tone="secondary">
              {BRANCH_LABEL[branch]}
            </Text>
            <Text variant="title" style={{ fontSize: 26, marginTop: 4 }}>
              {test.name}
            </Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: 4 }}>
              {countdown == null ? 'No test date set' : countdown === 0 ? 'Test day' : `${countdown} days to test`}
            </Text>
          </View>
          <Ring progress={readiness.score / 100} size={104} stroke={8} trackColor={color.surfaceHigh}>
            <Text style={styles.pct} tabular>
              {readiness.score}
              <Text style={styles.pctSign}>%</Text>
            </Text>
          </Ring>
        </View>
        {readiness.entered > 0 && readiness.entered < readiness.total ? (
          <Text variant="footnote" tone="tertiary" style={{ marginTop: space.xs }}>
            Based on {readiness.entered} of {readiness.total} events. Log the rest for a full picture.
          </Text>
        ) : null}

        {tests.length > 1 ? (
          <Segmented
            style={{ marginTop: space.lg }}
            value={test.id}
            onChange={(id: FitnessTestType) => profile && setProfile({ ...profile, fitness_test_type: id })}
            options={tests.map((t) => ({ value: t.id, label: t.id === 'marine_pft' ? 'PFT' : t.id === 'marine_cft' ? 'CFT' : t.name }))}
          />
        ) : null}

        {anyLogged ? (
          <View style={styles.priority}>
            <View style={{ flex: 1 }}>
              <Text variant="footnote" tone="tertiary">
                Priority
              </Text>
              <Text variant="headline" style={{ marginTop: 2 }}>
                {ranked[0]?.e.shortName}
              </Text>
            </View>
            <View style={styles.vr} />
            <View style={{ flex: 1, paddingLeft: space.md }}>
              <Text variant="footnote" tone="tertiary">
                Strongest
              </Text>
              <Text variant="headline" style={{ marginTop: 2 }}>
                {ranked.at(-1)?.e.shortName}
              </Text>
            </View>
          </View>
        ) : null}

        <Button title={anyLogged ? 'Log scores' : 'Log your first scores'} onPress={() => setLogging(true)} style={{ marginTop: space.lg }} />
      </View>

      <SectionTitle title="Event Board" action="Branch" onAction={() => navigation.navigate('ServiceProfile')} style={styles.section} />
      <View style={{ gap: space.sm, paddingHorizontal: space.md }}>
        {test.events.map((e, i) => {
          const current = testScores[key(e.id)] ?? 0;
          const target = targetScores[key(e.id)] ?? e.target;
          const pct = getTestReadiness({ ...test, events: [e] }, { [e.id]: current }).score;
          return (
            <Animated.View key={e.id} entering={FadeInDown.delay(i * motion.stagger).duration(320)} style={styles.event}>
              <View style={styles.eventHead}>
                <View style={styles.eventIndex}>
                  <Text variant="headline" tabular>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="headline" style={{ fontSize: 18 }} numberOfLines={2}>
                    {e.name}
                  </Text>
                  <Text variant="subhead" tone="secondary" style={{ marginTop: 3 }}>
                    {e.direction === 'higher' ? 'Higher is better' : 'Lower is better'} · {unitLabel(e.unit)}
                  </Text>
                </View>
                <Text variant="headline" tone={pct >= 100 ? 'accent' : 'primary'} tabular>
                  {pct}%
                </Text>
              </View>
              <View style={styles.eventValues}>
                {current ? (
                  <Text style={styles.eventCurrent} tabular>
                    {formatEventValue(current, e.unit)}
                  </Text>
                ) : (
                  <Text variant="headline" tone="tertiary">
                    Not logged
                  </Text>
                )}
                <Text variant="subhead" tone="tertiary" tabular>
                  Target {formatEventValue(target, e.unit)}
                </Text>
              </View>
              <Bar progress={pct / 100} height={5} trackColor={color.surfaceHigh} />
              {e.alternatives ? (
                <Text variant="footnote" tone="tertiary" style={{ marginTop: 10 }}>
                  Alternatives: {e.alternatives.join(' · ')}
                </Text>
              ) : null}
            </Animated.View>
          );
        })}
      </View>

      <Tap feedback="highlight" baseColor={color.bg} pressedColor={color.bgRaised} style={styles.source} onPress={() => void openSource(test.sourceUrl)} accessibilityRole="link">
        <Icon name="info" size={20} color={color.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text variant="subhead">{test.sourceLabel}</Text>
          <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
            Estimates are for preparation. Verify official standards before testing. {test.effectiveLabel}.
          </Text>
        </View>
        <Icon name="external" size={16} color={color.textTertiary} />
      </Tap>

      <LogScoresSheet visible={logging} onClose={() => setLogging(false)} testId={test.id} events={test.events} />
    </ScrollView>
  );
}

function LogScoresSheet({ visible, onClose, testId, events }: { visible: boolean; onClose: () => void; testId: string; events: TestEventDefinition[] }) {
  const testScores = useReadinessStore((s) => s.testScores);
  const targetScores = useReadinessStore((s) => s.targetScores);
  const setScore = useReadinessStore((s) => s.setTestScore);
  const setTarget = useReadinessStore((s) => s.setTargetScore);
  const [draft, setDraft] = useState<Record<string, { current: string; target: string }>>({});

  React.useEffect(() => {
    if (!visible) return;
    const next: Record<string, { current: string; target: string }> = {};
    events.forEach((e) => {
      const c = testScores[`${testId}:${e.id}`] ?? 0;
      const t = targetScores[`${testId}:${e.id}`] ?? e.target;
      next[e.id] = { current: c ? (e.unit === 'seconds' ? formatEventValue(c, e.unit) : String(c)) : '', target: e.unit === 'seconds' ? formatEventValue(t, e.unit) : String(t) };
    });
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, testId]);

  const save = () => {
    events.forEach((e) => {
      const d = draft[e.id];
      if (!d) return;
      setScore(`${testId}:${e.id}`, parseValue(d.current, e.unit));
      setTarget(`${testId}:${e.id}`, parseValue(d.target, e.unit) || e.target);
    });
    haptic.success();
    onClose();
    toast('Scores saved', { icon: 'check' });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Log scores" avoidKeyboard>
      <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: space.sm }} keyboardShouldPersistTaps="handled">
        <View style={styles.logHead}>
          <Text variant="footnote" tone="tertiary" style={{ flex: 1 }}>
            Event
          </Text>
          <Text variant="footnote" tone="tertiary" style={styles.logCol}>
            Current
          </Text>
          <Text variant="footnote" tone="tertiary" style={styles.logCol}>
            Target
          </Text>
        </View>
        {events.map((e) => (
          <View key={e.id} style={styles.logRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text variant="subhead" numberOfLines={1}>
                {e.shortName}
              </Text>
              <Text variant="caption" tone="tertiary">
                {unitLabel(e.unit)}
              </Text>
            </View>
            {(['current', 'target'] as const).map((field) => (
              <TextInput
                key={field}
                value={draft[e.id]?.[field] ?? ''}
                onChangeText={(t) => setDraft((d) => ({ ...d, [e.id]: { ...(d[e.id] ?? { current: '', target: '' }), [field]: t } }))}
                placeholder={e.unit === 'seconds' ? '0:00' : '0'}
                placeholderTextColor={color.textTertiary}
                keyboardType={e.unit === 'seconds' ? 'numbers-and-punctuation' : 'decimal-pad'}
                style={[styles.logInput, styles.logCol]}
                selectionColor={color.accent}
                accessibilityLabel={`${e.shortName} ${field}`}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: space.gutter, paddingTop: space.md }}>
        <Button title="Save scores" onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  card: {
    marginHorizontal: space.md,
    marginTop: space.sm,
    padding: space.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    backgroundColor: color.bgRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  pct: { fontFamily: font.bold, fontSize: 28, color: color.text },
  pctSign: { fontFamily: font.semibold, fontSize: 16, color: color.textSecondary },
  priority: { flexDirection: 'row', marginTop: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line },
  vr: { width: StyleSheet.hairlineWidth, backgroundColor: color.line },
  section: { paddingHorizontal: space.gutter, marginTop: space.xxl, marginBottom: space.md },
  event: {
    padding: space.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  eventHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  eventIndex: { width: 44, height: 44, borderRadius: 12, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  eventValues: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.md, marginBottom: 10 },
  eventCurrent: { fontFamily: font.bold, fontSize: 30, color: color.text },
  source: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: space.md, marginTop: space.xl, padding: space.md, borderRadius: radius.md },
  logHead: { flexDirection: 'row', marginBottom: 6 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  logCol: { width: 88, marginLeft: 8, textAlign: 'center' },
  logInput: {
    height: 48,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 18,
  },
});
