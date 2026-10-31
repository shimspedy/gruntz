import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TabHeader } from '../components/TabHeader';
import { branchDefaultTest, getTestReadiness, getTestsForBranch, type TestEventDefinition } from '../data/militaryTests';
import { useTabChromeInset } from '../navigation/TabBar';
import { useReadinessStore } from '../store/useReadinessStore';
import { isCardHidden, useChromePrefs } from '../store/useUiStore';
import { useUserStore } from '../store/useUserStore';
import type { FitnessTestType, ServiceBranch } from '../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SectionTitle } from '../ui/Layout';
import { Bar, Ring } from '../ui/Progress';
import { Tap } from '../ui/Pressable';
import { Segmented } from '../ui/Segmented';
import { Sheet } from '../ui/Sheet';
import { SwipeDismiss } from '../ui/SwipeDismiss';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { openExternalUrl } from '../utils/externalLinks';
import { color, font, motion, radius, space } from '../ui/tokens';
import { getTestTrend, getTrainingFocus, nextRetestDate } from '../features/trainingFocus';
import { getFocusedProgramWorkout } from '../data/programWorkouts';
import { useProgramStore } from '../store/useProgramStore';
import { getLocalDateKey } from '../utils/dateKey';
import { scheduleBackup } from '../services/backup';
import { trackRetentionEvent } from '../services/retentionAnalytics';
import { hasTestScoreChanges, prepareTestScoreEntry } from '../features/testScoreEntry';
import { formatEventValue, testCardModel } from '../features/shareCards';
import { ShareCardSheet } from '../components/share/ShareCardSheet';

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

export { formatEventValue };

const unitLabel = (u: TestEventDefinition['unit']) => (u === 'seconds' ? 'min:sec' : u === 'pounds' ? 'lb' : u);

const KG_PER_LB = 0.45359237;

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
  return Math.round((target - today) / 86400000);
}

/** How far out people actually schedule a test, plus a way to clear it. */
const TEST_DATE_CHOICES = [0, 2, 4, 6, 8, 12, 16, 24];

function weeksOutLabel(weeks: number) {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
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
  const testAttempts = useReadinessStore((s) => s.testAttempts);
  const program = useProgramStore((s) => s.selectedProgram);
  const week = useProgramStore((s) => s.currentWeek);
  const [logging, setLogging] = useState(false);
  const [dateSheet, setDateSheet] = useState(false);
  const [sharing, setSharing] = useState(false);
  const metric = useUserStore((s) => s.profile?.settings.units === 'metric');

  const branch = profile?.service_branch ?? 'general';
  const tests = getTestsForBranch(branch);
  const test = tests.find((t) => t.id === profile?.fitness_test_type) ?? tests.find((t) => t.id === branchDefaultTest[branch]) ?? tests[0] ?? getTestsForBranch('general')[0];
  const key = (id: string) => `${test.id}:${id}`;
  const scoped = Object.fromEntries(test.events.map((e) => [e.id, testScores[key(e.id)] ?? 0]));
  const readiness = getTestReadiness(test, scoped);
  const countdown = daysUntil(profile?.fitness_test_date);
  const ranked = test.events.filter((event) => scoped[event.id] > 0).map((e) => {
    const target = targetScores[key(e.id)] || e.target;
    return { e, score: e.direction === 'higher' ? scoped[e.id] / target : target / scoped[e.id] };
  }).sort((a, b) => a.score - b.score);
  const anyLogged = Object.values(scoped).some((v) => v > 0);
  const focus = getTrainingFocus(profile, testScores, targetScores);
  // Swiped away for the day, or until the focus itself changes.
  const purposeKey = `test-purpose:${focus?.title ?? ''}`;
  const purposeHidden = useChromePrefs((s) => isCardHidden(s.dismissedCards, purposeKey, getLocalDateKey()));
  const focusedDay = focus && program ? getFocusedProgramWorkout(program, week, profile, focus) : null;
  const attempts = testAttempts.filter((attempt) => attempt.testId === test.id).sort((a, b) => (b.recordedAt ? Date.parse(b.recordedAt) : -Infinity) - (a.recordedAt ? Date.parse(a.recordedAt) : -Infinity));
  const retest = nextRetestDate(attempts, test.id);

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
            {/* The test date could only ever be set during onboarding, leaving this
                reading "No test date set" with nothing to tap. */}
            <Tap feedback="opacity" hitSlop={8} onPress={() => setDateSheet(true)} accessibilityLabel="Set test date">
              <Text variant="callout" tone={countdown == null ? 'accent' : 'secondary'} style={{ marginTop: 4 }}>
                {countdown == null ? 'Set a test date' : countdown === 0 ? 'Test day' : countdown < 0 ? 'Set your next test date' : `${countdown} days to test`}
              </Text>
            </Tap>
          </View>
          <Ring progress={readiness.score / 100} size={104} stroke={8} trackColor={color.surfaceHigh}>
            <Text style={styles.pct} tabular>
              {readiness.score}
              <Text style={styles.pctSign}>%</Text>
            </Text>
          </Ring>
        </View>
        <Text variant="caption" tone="tertiary" style={{ marginTop: 6 }}>Preparation benchmark · your logged events</Text>
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
        {anyLogged ? (
          <Button title="Share my scores" icon="share" variant="secondary" size="md" onPress={() => setSharing(true)} style={{ marginTop: space.sm }} />
        ) : null}
      </View>

      {focus && !purposeHidden ? (
        <SwipeDismiss key={purposeKey} style={[styles.card, { marginTop: space.md }]} onDismiss={() => useChromePrefs.getState().dismissCard(purposeKey, getLocalDateKey(), getLocalDateKey())}>{(dismiss, guard) => (<>
          <Text
            variant="overline"
            tone="accent"
            accessibilityActions={[{ name: 'dismiss', label: 'Dismiss for today' }]}
            onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'dismiss') dismiss(); }}
          >Today’s purpose</Text>
          <Text variant="headline" style={{ marginTop: 8 }}>{focus.title}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 6 }}>{focus.reason}</Text>
          <Text variant="footnote" tone="tertiary" style={{ marginTop: 8 }}>
            {focusedDay ? `${focusedDay.title} includes work for this event. It moves first after your warm-up, using your existing plan targets.` : 'Keep your current plan balanced and use your next scores to check this event’s progress.'}
          </Text>
          <Button title={focusedDay ? 'View focused mission' : 'View my training'} variant="secondary" size="md" style={{ marginTop: space.md }} onPress={guard(() => {
            trackRetentionEvent('test_focus_opened');
            if (focusedDay) navigation.navigate('WorkoutDetail', { workoutId: focusedDay.id, dateKey: getLocalDateKey() });
            else navigation.navigate('Tabs', { screen: 'Train' });
          })} />
        </>)}</SwipeDismiss>
      ) : null}

      {anyLogged ? (
        <View style={[styles.card, { marginTop: space.md }]}>
          <Text variant="overline" tone="secondary">Your next progress check</Text>
          <Text variant="headline" style={{ marginTop: 8 }}>{retest ? retest.days <= 0 ? 'Ready for a retest?' : `Check back in ${retest.days} ${retest.days === 1 ? 'day' : 'days'}` : 'Save a dated baseline'}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: 6 }}>
            {retest ? 'A progress check about every two weeks helps you see what is changing. Log the same events under comparable conditions when you are ready.' : 'Your earlier scores are kept. Save your next attempt to start a dated progress record.'}
          </Text>
          <Button title="Log a progress check" size="md" variant="secondary" onPress={() => setLogging(true)} style={{ marginTop: space.md }} />
        </View>
      ) : null}

      <SectionTitle title="Event Board" action="Branch" onAction={() => navigation.navigate('ServiceProfile')} style={styles.section} />
      <View style={{ gap: space.sm, paddingHorizontal: space.md }}>
        {test.events.map((e, i) => {
          const current = testScores[key(e.id)] ?? 0;
          const target = targetScores[key(e.id)] ?? e.target;
          const pct = current > 0 ? Math.round(Math.min(100, (e.direction === 'higher' ? current / target : target / current) * 100)) : 0;
          const trend = getTestTrend(test.id, e, attempts);
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
                    {/* The official standard is set in pounds, so entry stays in lb;
                        a metric lifter gets the equivalent rather than a bare number. */}
                    {e.unit === 'pounds' && metric && target ? ` · target ${Math.round(target * KG_PER_LB)} kg` : ''}
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
              <Text variant="caption" tone="tertiary" style={{ marginTop: 5 }}>Of your target · preparation estimate</Text>
              {trend ? (
                <View style={{ marginTop: 10 }}>
                  <Text variant="subhead" tone={trend.improved ? 'accent' : 'secondary'}>
                    {trend.delta === 0 ? 'Holding your baseline' : `${formatEventValue(Math.abs(trend.delta), e.unit)} ${e.unit === 'seconds' ? (e.direction === 'lower' ? trend.improved ? 'faster' : 'slower' : trend.improved ? 'longer' : 'shorter') : `${trend.improved ? 'more' : 'less'} ${unitLabel(e.unit)}`} since baseline`}
                  </Text>
                  <Text variant="caption" tone="tertiary" style={{ marginTop: 3 }}>
                    {formatEventValue(trend.baseline.scores[e.id], e.unit)} → {formatEventValue(trend.latest.scores[e.id], e.unit)} · {trend.attemptCount} progress checks
                  </Text>
                </View>
              ) : null}
              {e.alternatives ? (
                <Text variant="footnote" tone="tertiary" style={{ marginTop: 10 }}>
                  Alternatives: {e.alternatives.join(' · ')}
                </Text>
              ) : null}
            </Animated.View>
          );
        })}
      </View>

      {attempts.length ? (
        <>
          <SectionTitle title="Progress record" style={styles.section} />
          <View style={{ gap: space.sm, paddingHorizontal: space.md }}>
            {attempts.slice(0, 6).map((attempt) => (
              <View key={attempt.id} style={styles.event}>
                <Text variant="headline">{attempt.recordedAt ? new Date(attempt.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Earlier saved scores'}</Text>
                <Text variant="footnote" tone="tertiary" style={{ marginTop: 3 }}>{attempt.recordedAt ? 'Logged progress check' : 'Date was not recorded in your earlier version'}</Text>
                <Text variant="callout" tone="secondary" style={{ marginTop: 8 }}>{test.events.filter((event) => attempt.scores[event.id] > 0).map((event) => `${event.shortName} ${formatEventValue(attempt.scores[event.id], event.unit)}`).join(' · ')}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

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

      <ShareCardSheet visible={sharing} onClose={() => setSharing(false)} source="test" model={sharing ? testCardModel(test, scoped, readiness) : null} />
      <LogScoresSheet visible={logging} onClose={() => setLogging(false)} testId={test.id} events={test.events} />

      <Sheet visible={dateSheet} onClose={() => setDateSheet(false)} title="Test date">
        <View style={{ paddingBottom: space.sm }}>
          {TEST_DATE_CHOICES.map((weeks) => (
            <Tap
              key={weeks}
              feedback="highlight"
              baseColor={color.bgRaised}
              pressedColor={color.surface}
              style={styles.dateRow}
              accessibilityLabel={weeks === 0 ? 'Clear test date' : `${weeks} weeks from today`}
              onPress={() => {
                haptic.selection();
                if (profile) {
                  const next = new Date();
                  next.setDate(next.getDate() + weeks * 7);
                  setProfile({ ...profile, fitness_test_date: weeks === 0 ? null : getLocalDateKey(next) });
                }
                setDateSheet(false);
              }}
            >
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {weeks === 0 ? 'No test date' : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} from today`}
              </Text>
              {weeks > 0 ? (
                <Text variant="footnote" tone="tertiary">
                  {weeksOutLabel(weeks)}
                </Text>
              ) : null}
            </Tap>
          ))}
        </View>
      </Sheet>
    </ScrollView>
  );
}

function LogScoresSheet({ visible, onClose, testId, events }: { visible: boolean; onClose: () => void; testId: FitnessTestType; events: TestEventDefinition[] }) {
  const targetScores = useReadinessStore((s) => s.targetScores);
  const saveAttempt = useReadinessStore((s) => s.saveTestAttempt);
  const setTarget = useReadinessStore((s) => s.setTargetScore);
  const [draft, setDraft] = useState<Record<string, { current: string; target: string }>>({});
  const [loadedScores, setLoadedScores] = useState<Record<string, number>>({});
  const entry = prepareTestScoreEntry(events, draft);
  const hasScores = hasTestScoreChanges(entry.scores, loadedScores);

  React.useEffect(() => {
    if (!visible) return;
    const next: Record<string, { current: string; target: string }> = {};
    const todaysAttempt = useReadinessStore.getState().testAttempts.find((attempt) => attempt.testId === testId && attempt.recordedAt && getLocalDateKey(new Date(attempt.recordedAt)) === getLocalDateKey());
    setLoadedScores(todaysAttempt?.scores ?? {});
    events.forEach((e) => {
      const c = todaysAttempt?.scores[e.id] ?? 0;
      const t = targetScores[`${testId}:${e.id}`] ?? e.target;
      next[e.id] = { current: c ? (e.unit === 'seconds' ? formatEventValue(c, e.unit) : String(c)) : '', target: e.unit === 'seconds' ? formatEventValue(t, e.unit) : String(t) };
    });
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, testId]);

  const save = () => {
    const prepared = prepareTestScoreEntry(events, draft);
    if (prepared.error) {
      toast(prepared.error, { icon: 'alert', tone: 'error' });
      return;
    }
    const first = !useReadinessStore.getState().testAttempts.some((attempt) => attempt.testId === testId);
    const todaysAttempt = useReadinessStore.getState().testAttempts.find((attempt) => attempt.testId === testId && attempt.recordedAt && getLocalDateKey(new Date(attempt.recordedAt)) === getLocalDateKey());
    const recordsAttempt = hasTestScoreChanges(prepared.scores, todaysAttempt?.scores);
    if (recordsAttempt && !saveAttempt(testId, prepared.scores)) {
      toast('Could not save this progress check', { icon: 'alert', tone: 'error' });
      return;
    }
    let targetsChanged = false;
    events.forEach((e) => {
      if ((targetScores[`${testId}:${e.id}`] ?? e.target) !== prepared.targets[e.id]) targetsChanged = true;
      setTarget(`${testId}:${e.id}`, prepared.targets[e.id]);
    });
    scheduleBackup();
    if (recordsAttempt) trackRetentionEvent('test_attempt_saved', { source: first ? 'baseline' : 'retest' });
    else if (targetsChanged) trackRetentionEvent('test_targets_updated');
    haptic.success();
    onClose();
    toast(recordsAttempt ? 'Progress check saved' : 'Targets saved', { icon: 'check' });
  };

  // `scrollable`: the sheet itself scrolls. A scroll view nested inside a fit-to-content
  // system sheet was laid out over the sheet's title.
  return (
    <Sheet visible={visible} onClose={onClose} title="Log progress check" scrollable>
      <View style={{ paddingHorizontal: space.gutter, paddingTop: space.sm }}>
        <Text variant="footnote" tone="secondary" style={{ marginBottom: space.md }}>Today’s scores join your progress record. Leave events you did not test blank. You can update targets without entering a score. Editing scores again today updates today’s check.</Text>
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
                maxFontSizeMultiplier={1.8}
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
      </View>
      <View style={{ paddingHorizontal: space.gutter, paddingTop: space.md }}>
        <Button title={hasScores ? 'Save progress check' : 'Save targets'} onPress={save} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  dateRow: { height: 54, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.gutter },
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
