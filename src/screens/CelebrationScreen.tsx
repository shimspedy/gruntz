import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StackActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { achievements } from '../data/achievements';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Bar } from '../ui/Progress';
import { RANK_TIERS, RankBadge } from '../ui/RankBadge';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, font, motion, radius, space } from '../ui/tokens';
import { useUserStore } from '../store/useUserStore';
import { getXPToNextLevel, streakGraceDays } from '../utils/xp';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { nextTrainingDay, summarizeTrainingWeek, trainingDateKeys } from '../features/retention';
import { promptTrainingReminder } from '../services/retentionReminders';
import { trackRetentionEvent } from '../services/retentionAnalytics';
import { toast } from '../ui/Toast';
import { ShareCardSheet } from '../components/share/ShareCardSheet';
import { missionCardModel } from '../features/shareCards';

/** After a mission: what moved. Rank-ups get the big moment; everything else stays calm. */
export default function CelebrationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Celebration'>>();
  const xpNow = useUserStore((s) => s.progress.current_xp);
  const profile = useUserStore((s) => s.profile);
  const logs = useExerciseLogStore((s) => s.logs);
  const activities = useReadinessStore((s) => s.trackedSessions);
  const grace = streakGraceDays(profile?.workout_days_per_week);
  const dates = React.useMemo(() => trainingDateKeys(logs, activities), [logs, activities]);
  const week = summarizeTrainingWeek(dates, profile?.workout_days_per_week);
  const next = nextTrainingDay(profile?.workout_days_per_week, dates);
  const reducedMotion = useReducedMotion();
  const [reminding, setReminding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const rankUp = params.rankAfter !== params.rankBefore;
  const levelUp = params.levelAfter > params.levelBefore;
  const unlocked = params.achievementIds.map((id) => achievements.find((a) => a.id === id)).filter(Boolean);
  const xp = getXPToNextLevel(xpNow);

  const badge = useSharedValue(0);
  const [shownXp, setShownXp] = useState(0);
  const [barProgress, setBarProgress] = useState(levelUp ? 0 : Math.max(0, xp.progress - params.xpEarned / Math.max(1, xp.required)));

  useEffect(() => {
    trackRetentionEvent('mission_debrief_viewed', { first: !!params.debrief?.firstWorkout });
    if (reducedMotion) {
      badge.set(1);
      setShownXp(params.xpEarned);
      setBarProgress(xp.progress);
      return;
    }
    badge.set(withDelay(120, withSpring(1, rankUp ? motion.bouncy : motion.settle)));
    const t0 = setTimeout(() => (rankUp || levelUp ? haptic.heavy() : haptic.success()), 180);
    // Count the XP up over ~0.9s.
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 900);
      const eased = 1 - Math.pow(1 - p, 3);
      setShownXp(Math.round(params.xpEarned * eased));
      if (p >= 1) clearInterval(id);
    }, 16);
    const t1 = setTimeout(() => setBarProgress(xp.progress), 450);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, badge.get() * 1.6),
    transform: [{ scale: 0.6 + badge.get() * 0.4 }, { rotate: `${(1 - badge.get()) * -12}deg` }],
  }));

  const headline = rankUp ? 'New rank' : levelUp ? `Level ${params.levelAfter}` : 'Workout complete';
  const sub = rankUp ? `${params.rankAfter} · ${RANK_TIERS[params.rankAfter].name} tier` : params.title;
  const remind = async () => {
    setReminding(true);
    trackRetentionEvent('reminder_requested', { source: 'mission_debrief' });
    try {
      await promptTrainingReminder();
    } catch {
      toast('Could not set reminders. Try again in Settings.', { tone: 'info', icon: 'bell' });
    } finally { setReminding(false); }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.xl }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View style={badgeStyle}>
            <RankBadge rank={params.rankAfter} size={rankUp ? 144 : 88} />
          </Animated.View>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(260).duration(420).easing(Easing.bezier(0.23, 1, 0.32, 1))} style={{ alignItems: 'center' }}>
            <Text variant="display" align="center" style={{ marginTop: space.lg }}>
              {headline}
            </Text>
            <Text variant="body" tone="secondary" align="center" style={{ marginTop: 6 }}>
              {sub}
            </Text>
            <Text style={styles.xp} tabular>
              +{shownXp} XP
            </Text>
            <Button
              title={rankUp ? 'Share your rank' : 'Share'}
              icon="share"
              variant="outline"
              size="md"
              onPress={() => setSharing(true)}
              style={{ marginTop: space.lg, alignSelf: 'center', paddingHorizontal: space.xl }}
            />
          </Animated.View>
        </View>

        {params.debrief ? (
          <View style={styles.panel}>
            <Text variant="overline" tone="accent">Mission debrief</Text>
            <Text variant="question" style={{ marginTop: space.sm }}>{params.debrief.winTitle}</Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: space.xs }}>{params.debrief.winDetail}</Text>
            <Text variant="subhead" tone="secondary" style={{ marginTop: space.md }}>
              {params.debrief.minutes} min · {params.debrief.sets} working {params.debrief.sets === 1 ? 'set' : 'sets'}
            </Text>
          </View>
        ) : null}

        <View style={styles.panel}>
          <View style={styles.levelRow}>
            <Text variant="headline">This week</Text>
            <Text variant="headline" tone="accent" tabular>{week.trainingDays} / {week.currentTarget}</Text>
          </View>
          <Bar progress={Math.min(1, week.trainingDays / week.currentTarget)} height={6} duration={reducedMotion ? 0 : 450} style={{ marginTop: space.sm }} />
          <Text variant="footnote" tone="secondary" style={{ marginTop: space.xs }}>Training days recorded / current weekly goal. Multiple sessions in one day count once.</Text>
        </View>

        <View style={styles.panel}>
          <Text variant="overline" tone="accent">Up next · {next.label}</Text>
          <Text variant="headline" style={{ marginTop: space.sm }}>One session at a time</Text>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.xs }}>Your next mission is waiting in Train. Take your recovery time, then pick up from there.</Text>
          {!profile?.settings.notifications_enabled ? (
            <Button title="Remind me on training days" icon="bell" variant="outline" size="md" loading={reminding} onPress={remind} style={{ marginTop: space.md }} />
          ) : <Text variant="footnote" tone="secondary" style={{ marginTop: space.md }}>Training-day reminders are on.</Text>}
          {params.debrief?.firstWorkout ? (
            <Button title="Explore Gruntz Pro" variant="secondary" size="md" onPress={() => navigation.navigate('Paywall')} style={{ marginTop: space.sm }} />
          ) : null}
        </View>

        <Animated.View entering={reducedMotion ? undefined : FadeIn.delay(420).duration(360)} style={styles.panel}>
          <View style={styles.levelRow}>
            <Text variant="headline">Level {params.levelAfter}</Text>
            <Text variant="subhead" tone="secondary" tabular>
              {xp.current} / {xp.required} XP
            </Text>
          </View>
          <Bar progress={barProgress} height={8} duration={reducedMotion ? 0 : 900} style={{ marginTop: 12 }} />
        </Animated.View>

        <View style={styles.list}>
          <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(520).duration(320)} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,106,31,0.14)' }]}>
              <Icon name="flame" size={22} color={color.flame} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="headline">{params.streak > 1 ? `${params.streak}-workout streak` : 'Streak started'}</Text>
              <Text variant="subhead" tone="secondary" style={{ marginTop: 2 }}>
                {grace === 1 ? 'Rest and return on your next training day' : `${grace} days of breathing room between training days`}
              </Text>
            </View>
          </Animated.View>
          {unlocked.map((a, i) => (
            <Animated.View key={a!.id} entering={reducedMotion ? undefined : FadeInDown.delay(600 + i * motion.stagger).duration(320)} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: color.accentSoft }]}>
                <Icon name="trophy" size={22} color={color.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="headline">{a!.name}</Text>
                <Text variant="subhead" tone="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
                  {a!.description}
                </Text>
              </View>
              <Text variant="subhead" tone="accent" tabular>
                +{a!.xp_reward}
              </Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      <ShareCardSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        source="mission"
        model={sharing ? missionCardModel({ ...params, minutes: params.debrief?.minutes, sets: params.debrief?.sets }) : null}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]}>
        <Button title="Back to Train" onPress={() => navigation.dispatch(StackActions.popTo('Tabs', { screen: 'Train' }))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  hero: { alignItems: 'center', paddingHorizontal: space.xl },
  xp: { fontFamily: font.bold, fontSize: 22, color: color.accent, marginTop: space.md },
  panel: {
    marginHorizontal: space.md,
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
  },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between', alignItems: 'baseline' },
  list: { marginTop: space.md, paddingHorizontal: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
  },
  rowIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
});
