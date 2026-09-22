import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { getProgramById } from '../data/programs';
import { claimedDates } from '../features/plan';
import { useTabChromeInset } from '../navigation/TabBar';
import { useProgramStore } from '../store/useProgramStore';
import { getAccessState, getTrialDaysRemaining, useSubscriptionStore } from '../store/useSubscriptionStore';
import { rankTitle } from '../data/ranks';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { Group, IconButton, Row } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { RankBadge } from '../ui/RankBadge';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, motion, radius, space } from '../ui/tokens';
import { getLocalDateKey } from '../utils/dateKey';
import { shareStreak } from '../utils/socialActions';

const WEEKS = 8;

function weeklyMissions(dates: Set<string>) {
  const monday = new Date();
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: WEEKS }, (_, w) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() - (WEEKS - 1 - w) * 7);
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      if (dates.has(getLocalDateKey(day))) count++;
    }
    return { start, count };
  });
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottom = useTabChromeInset();
  const ref = React.useRef<ScrollView>(null);
  useScrollToTop(ref);
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const progress = useUserStore((s) => s.progress);
  const military = useUserStore((s) => !!s.profile?.goals.includes('Military Prep'));
  const program = useProgramStore((s) => s.selectedProgram);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const openCustomerCenter = useSubscriptionStore((s) => s.openCustomerCenter);
  const openSubscriptionManagement = useSubscriptionStore((s) => s.openSubscriptionManagement);
  const access = getAccessState({ trialStartedAt, entitlementActive });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name ?? '');

  const weeks = useMemo(() => weeklyMissions(claimedDates(progress.claimed_missions)), [progress.claimed_missions]);
  const thisWeek = weeks[WEEKS - 1].count;
  const lastWeek = weeks[WEEKS - 2].count;
  // Percentages off one or two workouts swing wildly ('+100%'), so compare counts instead.
  const delta = thisWeek - lastWeek;
  const max = Math.max(3, ...weeks.map((w) => w.count));
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const rangeEnd = new Date(weeks[WEEKS - 1].start);
  rangeEnd.setDate(rangeEnd.getDate() + 6);
  const programInfo = program ? getProgramById(program) : undefined;
  const displayName = profile?.display_name || 'Athlete';

  const membership = async () => {
    if (access === 'subscriber') {
      const r = await openCustomerCenter();
      if (r === 'unavailable' || r === 'error') await openSubscriptionManagement();
      return;
    }
    navigation.navigate('Paywall');
  };

  return (
    <ScrollView ref={ref} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <IconButton icon="pencil" label="Edit profile" onPress={() => { setName(profile?.display_name ?? ''); setEditing(true); }} />
        <IconButton icon="gear" label="Settings" size={26} onPress={() => navigation.navigate('Settings')} />
      </View>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{displayName.charAt(0).toUpperCase()}</Text>
          <View style={styles.avatarBadge}>
            <RankBadge rank={progress.current_rank} size={38} locked={progress.current_xp === 0} />
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: space.lg }}>
          <Text variant="headline" style={{ fontSize: 21 }} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.stats}>
            <MiniStat label="Workouts" value={progress.workouts_completed} />
            <MiniStat label="Streak" value={progress.streak_days} />
            <MiniStat label="Level" value={progress.current_level} />
          </View>
        </View>
      </View>

      <View style={styles.chartHead}>
        <View>
          <Text variant="callout" tone="secondary">
            Workouts
          </Text>
          <View style={styles.valueRow}>
            <Text style={styles.value} tabular>
              {thisWeek} this week
            </Text>
            <View style={styles.delta}>
              <Text variant="subhead" tabular style={{ color: delta >= 0 ? color.text : color.textSecondary }}>
                {delta > 0 ? '+' : ''}
                {delta} vs last week
              </Text>
            </View>
          </View>
          <Text variant="footnote" tone="tertiary">
            {fmt(weeks[0].start)} – {fmt(rangeEnd)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="callout" tone="secondary">
            Period
          </Text>
          <Text variant="bodyMedium" style={{ marginTop: 4 }}>
            {WEEKS} weeks
          </Text>
        </View>
      </View>
      <View style={styles.chart} accessibilityLabel={`Workouts per week, last ${WEEKS} weeks`}>
        {weeks.map((w, i) => (
          <View key={i} style={styles.col}>
            <ChartBar ratio={w.count / max} index={i} highlight={i === WEEKS - 1} />
            <Text variant="caption" tone="tertiary" style={{ marginTop: 8 }}>
              {i === WEEKS - 1 ? 'NOW' : `${WEEKS - 1 - i}W`}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.tiles}>
        <Tile icon="flame" label="Streak" onPress={() => navigation.navigate('Streak')} />
        <Tile icon="trophy" label="Trophies" onPress={() => navigation.navigate('Achievements')} />
        <Tile icon="calendar" label={programInfo?.name ?? 'Program'} onPress={() => navigation.navigate('ProgramSelect')} />
        <Tile icon="chart" label="Stats" onPress={() => navigation.navigate('Stats')} />
      </View>

      <Group style={styles.group}>
        <Row
          icon="starFill"
          title={access === 'subscriber' ? 'Manage Gruntz Pro' : access === 'trial' ? 'Gruntz Pro' : 'Upgrade to Pro'}
          value={access === 'trial' ? `${getTrialDaysRemaining(trialStartedAt)} days left` : access === 'subscriber' ? 'Active' : undefined}
          onPress={membership}
        />
        <Row icon="flag" title="Service & test profile" onPress={() => navigation.navigate('ServiceProfile')} />
        <Row icon="people" title="Leader tools" value="Coming soon" onPress={() => navigation.navigate('LeaderTools')} />
        <Row icon="share" title="Share my streak" onPress={() => void shareStreak(progress.streak_days, rankTitle(progress.current_rank, military))} />
      </Group>

      {/* Closing used to discard whatever had been typed without a word. A name that
          is actually different is confirmed first. */}
      <Sheet
        visible={editing}
        onClose={() => {
          const typed = name.trim();
          if (typed && typed !== (profile?.display_name ?? '')) {
            Alert.alert('Discard changes?', 'Your new name has not been saved.', [
              { text: 'Keep editing', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => setEditing(false) },
            ]);
            return;
          }
          setEditing(false);
        }}
        title="Edit profile"
        avoidKeyboard
      >
        <View style={{ paddingHorizontal: space.gutter, paddingTop: space.md }}>
          <Text variant="subhead" tone="secondary" style={{ marginBottom: 8 }}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={color.textTertiary}
            maxLength={40}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            style={styles.input}
            selectionColor={color.accent}
          />
          <Button
            title="Save"
            style={{ marginTop: space.lg }}
            onPress={() => {
              const next = name.trim() || 'Athlete';
              const changed = next !== (profile?.display_name ?? '');
              if (profile && changed) setProfile({ ...profile, display_name: next });
              haptic.success();
              setEditing(false);
              // Saying "updated" when nothing changed teaches people the toast is noise.
              if (changed) toast('Profile updated');
            }}
          />
        </View>
      </Sheet>
    </ScrollView>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="callout" tone="secondary">
        {label}
      </Text>
      <Text variant="headline" tabular style={{ marginTop: 4, fontSize: 19 }}>
        {value}
      </Text>
    </View>
  );
}

function ChartBar({ ratio, index, highlight }: { ratio: number; index: number; highlight: boolean }) {
  const h = useSharedValue(0);
  React.useEffect(() => {
    h.set(withDelay(index * 40, withTiming(ratio, { duration: 600, easing: motion.easeOut })));
  }, [ratio, index, h]);
  const style = useAnimatedStyle(() => ({ height: 4 + h.get() * 176 }));
  return <Animated.View style={[styles.bar, { backgroundColor: highlight ? color.accent : '#1F5FAF' }, style]} />;
}

function Tile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} scaleTo={0.97} style={styles.tile} accessibilityLabel={label}>
      <Icon name={icon} size={26} color={color.text} weight="light" />
      <Text variant="headline" style={{ fontSize: 16, flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: space.md, height: 52, alignItems: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter + 4, marginTop: space.xs },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: font.bold, fontSize: 48, color: '#000' },
  avatarBadge: { position: 'absolute', right: -6, bottom: -4 },
  stats: { flexDirection: 'row', marginTop: space.md },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.gutter + 4, marginTop: space.xxl },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 4 },
  value: { fontFamily: font.bold, fontSize: 22, color: color.text },
  delta: { paddingHorizontal: 8, height: 28, borderRadius: 7, backgroundColor: color.surface, justifyContent: 'center' },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 230,
    marginHorizontal: space.gutter,
    marginTop: space.md,
    paddingHorizontal: space.sm,
    paddingBottom: space.sm,
    borderRadius: radius.md,
    backgroundColor: color.bgRaised,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 22, borderRadius: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: space.md, marginTop: space.xl },
  tile: {
    flexBasis: '46%', flexGrow: 1,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
  },
  group: { marginHorizontal: space.md, marginTop: space.xl },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    paddingHorizontal: space.md,
    color: color.text,
    fontFamily: font.medium,
    fontSize: 18,
  },
});
