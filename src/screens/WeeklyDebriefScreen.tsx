import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StackActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mondayOfWeek, nextTrainingDay, summarizeTrainingWeek, trainingDateKeys } from '../features/retention';
import { getTrainingFocus } from '../features/trainingFocus';
import { useUserStore } from '../store/useUserStore';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { getLocalDateKey } from '../utils/dateKey';
import { trackRetentionEvent } from '../services/retentionAnalytics';
import { promptTrainingReminder } from '../services/retentionReminders';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';

/** A calendar week of recorded training, never a lifetime total under a weekly heading. */
export default function WeeklyDebriefScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'WeeklyDebrief'>>();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const logs = useExerciseLogStore((s) => s.logs);
  const activities = useReadinessStore((s) => s.trackedSessions);
  const scores = useReadinessStore((s) => s.testScores);
  const targets = useReadinessStore((s) => s.targetScores);
  const [reminding, setReminding] = useState(false);
  const dates = useMemo(() => trainingDateKeys(logs, activities), [logs, activities]);
  const requested = params?.weekStart ? new Date(`${params.weekStart}T12:00:00`) : null;
  const currentMonday = mondayOfWeek();
  const anchor = requested && Number.isFinite(requested.getTime()) && getLocalDateKey(requested) === params?.weekStart && requested <= currentMonday ? requested : currentMonday;
  const week = summarizeTrainingWeek(dates, profile?.workout_days_per_week, anchor);
  const next = nextTrainingDay(profile?.workout_days_per_week, dates);
  const focus = getTrainingFocus(profile, scores, targets);
  const lastDay = new Date(week.end);
  lastDay.setDate(lastDay.getDate() - 1);
  const range = `${week.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${lastDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const delta = week.trainingDays - week.previousTrainingDays;
  const complete = getLocalDateKey(week.end) <= getLocalDateKey();
  const winTitle = week.trainingDays === 0 ? 'There is room to restart' : delta > 0 ? `${delta} more training ${delta === 1 ? 'day' : 'days'}` : `${week.trainingDays} ${week.trainingDays === 1 ? 'day' : 'days'} of work recorded`;
  const winDetail = week.trainingDays === 0
    ? 'No training was recorded for this week. Your earlier progress is still here. Choose a manageable next session.'
    : delta > 0
      ? `You trained on ${week.trainingDays} different days${complete ? '' : ' so far'}, compared with ${week.previousTrainingDays} across the previous full week.`
      : 'Those sessions are part of your history. Consistency includes making room for recovery and getting back to the next session.';

  useEffect(() => {
    trackRetentionEvent('weekly_debrief_viewed', { count: week.trainingDays, source: params?.weekStart ? 'linked_week' : 'current_week' });
  }, [week.startKey]);

  const remind = async () => {
    setReminding(true);
    trackRetentionEvent('reminder_requested', { source: 'weekly_debrief' });
    try { await promptTrainingReminder(); }
    catch { toast('Could not set reminders. Try again in Settings.', { tone: 'info', icon: 'bell' }); }
    finally { setReminding(false); }
  };
  const changeWeek = (offset: number) => {
    const nextWeek = new Date(week.start);
    nextWeek.setDate(nextWeek.getDate() + offset * 7);
    navigation.navigate('WeeklyDebrief', { weekStart: getLocalDateKey(nextWeek) });
  };

  return (
    <View style={styles.screen}>
      <NavHeader title="Weekly debrief" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.body, { paddingBottom: space.xl }]} showsVerticalScrollIndicator={false}>
        <Text variant="overline" tone="accent">{range} · {complete ? 'Week complete' : 'Week so far'}</Text>
        <View style={styles.weekPicker}>
          <Button title="Previous week" variant="outline" size="sm" onPress={() => changeWeek(-1)} />
          {week.startKey < getLocalDateKey(currentMonday) ? <Button title="Next week" variant="outline" size="sm" onPress={() => changeWeek(1)} /> : null}
        </View>
        <Text variant="display" style={{ marginTop: space.sm }}>{week.trainingDays} training {week.trainingDays === 1 ? 'day' : 'days'}</Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: space.sm }}>Every day you logged a workout, run or ruck counts once.</Text>

        <View style={styles.card}>
          <View style={styles.days}>
            {Array.from({ length: 7 }, (_, index) => {
              const day = new Date(week.start);
              day.setDate(day.getDate() + index);
              const done = dates.has(getLocalDateKey(day));
              return (
                <View key={index} style={styles.day} accessible accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${done ? 'training recorded' : 'no training recorded'}`}>
                  <Text variant="caption" tone="secondary">{day.toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>
                  <View style={[styles.dayMark, done && styles.dayDone]}>
                    {done ? <Icon name="check" size={16} color={color.accent} /> : <Text variant="caption" tone="tertiary">{day.getDate()}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.comparison}>
            <View style={{ flex: 1 }}><Text variant="title" tabular>{week.trainingDays}</Text><Text variant="footnote" tone="secondary">{complete ? 'This week' : 'So far this week'}</Text></View>
            <View style={{ flex: 1 }}><Text variant="title" tone="secondary" tabular>{week.previousTrainingDays}</Text><Text variant="footnote" tone="secondary">Previous full week</Text></View>
          </View>
          <Text variant="footnote" tone="secondary" style={{ marginTop: space.md }}>Your current goal: {week.currentTarget} training days per week.</Text>
        </View>

        <View style={styles.card}>
          <Text variant="overline" tone="accent">{week.trainingDays ? 'One win to carry forward' : 'Your next step'}</Text>
          <Text variant="question" style={{ marginTop: space.sm }}>{winTitle}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.sm }}>{winDetail}</Text>
        </View>

        <View style={styles.card}>
          <Text variant="overline" tone="accent">Next focus</Text>
          <Text variant="headline" style={{ marginTop: space.sm }}>{focus?.title ?? (week.trainingDays < week.currentTarget ? 'Make the next session fit your week' : 'Keep the rhythm that works')}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.sm }}>{focus?.reason ?? 'Keep a realistic number of training days and enough time to recover. You can change your schedule whenever life changes.'}</Text>
          {focus ? <Button title="Review test progress" variant="outline" size="md" onPress={() => navigation.dispatch(StackActions.popTo('Tabs', { screen: 'Test' }))} style={{ marginTop: space.md }} /> : null}
          <Tap feedback="opacity" onPress={() => { trackRetentionEvent('schedule_adjustment_opened', { source: 'weekly_debrief' }); navigation.navigate('TrainingPreferences'); }} style={styles.link} accessibilityLabel="Adjust training days and session length">
            <Text variant="bodyMedium" tone="accent">Adjust training days and time</Text><Icon name="arrowRight" size={16} color={color.accent} />
          </Tap>
        </View>

        <View style={styles.card}>
          <Text variant="overline" tone="accent">Next training day · {next.label}</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.sm }}>Open Train for your next mission. Keep your history, build from where you are.</Text>
          {!profile?.settings.notifications_enabled && week.trainingDays > 0 ? <Button title="Remind me on training days" icon="bell" variant="outline" size="md" loading={reminding} onPress={remind} style={{ marginTop: space.md }} /> : null}
        </View>
        <Text variant="footnote" tone="tertiary" style={{ marginTop: space.lg }}>Based on saved training history on this device, including imported workouts.</Text>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
        <Button title="See next mission" onPress={() => { trackRetentionEvent('weekly_next_mission', { source: 'weekly_debrief' }); navigation.dispatch(StackActions.popTo('Tabs', { screen: 'Train' })); }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { paddingHorizontal: space.gutter, paddingTop: space.md },
  weekPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md, marginBottom: space.sm },
  card: { marginTop: space.lg, padding: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  days: { flexDirection: 'row', gap: space.xxs },
  day: { flex: 1, alignItems: 'center', gap: space.xs },
  dayMark: { width: '100%', aspectRatio: 1, maxWidth: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHigh },
  dayDone: { backgroundColor: color.accentSoft },
  comparison: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  link: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.xs, paddingVertical: space.sm, marginTop: space.sm },
  footer: { paddingTop: space.md, paddingHorizontal: space.md },
});
