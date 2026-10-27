import React, { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { getProgramById } from '../data/programs';
import { claimedDates } from '../features/plan';
import { useTabChromeInset } from '../navigation/TabBar';
import { healthPlatformName } from '../services/healthSync';
import { changeProfilePhoto, loadProfilePhotoLocation, removeProfilePhoto, type PhotoSource } from '../services/profilePhoto';
import { syncTeamAvatar } from '../services/teams';
import { useChromePrefs } from '../store/useUiStore';
import { useSignedIn } from '../hooks/useSignedIn';
import type { Rank } from '../types';
import { useHealthStore } from '../store/useHealthStore';
import { useProgramStore } from '../store/useProgramStore';
import { useReadinessStore } from '../store/useReadinessStore';
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
import { isBackupAvailable } from '../config/backup';
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
  const displayName = useUserStore((s) => s.profile?.display_name || 'Athlete');
  const progress = useUserStore((s) => s.progress);
  const teamName = useReadinessStore((s) => (s.teamCount > 1 ? `${s.teamCount} teams` : s.teamName));
  const teamCount = useReadinessStore((s) => s.teamCount);
  const military = useUserStore((s) => !!s.profile?.goals.includes('Military Prep'));
  const program = useProgramStore((s) => s.selectedProgram);
  const healthConnected = useHealthStore((s) => s.connected);
  // Teams exist only for people who chose an account; everyone else never sees them.
  const signedIn = useSignedIn();
  const [editing, setEditing] = useState(false);
  const programInfo = program ? getProgramById(program) : undefined;

  return (
    <ScrollView ref={ref} style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <IconButton icon="pencil" label="Edit profile" onPress={() => setEditing(true)} />
        <IconButton icon="gear" label="Settings" size={26} onPress={() => navigation.navigate('Settings')} />
      </View>

      <View style={styles.identity}>
        <Avatar initial={displayName.charAt(0).toUpperCase()} rank={progress.current_rank} locked={progress.current_xp === 0} />
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

      <WeeklyChart claimed={progress.claimed_missions} />

      <View style={styles.tiles}>
        <Tile icon="flame" label="Streak" onPress={() => navigation.navigate('Streak')} />
        <Tile icon="trophy" label="Trophies" onPress={() => navigation.navigate('Achievements')} />
        <Tile icon="calendar" label={programInfo?.name ?? 'Program'} onPress={() => navigation.navigate('ProgramSelect')} />
        <Tile icon="chart" label="Stats" onPress={() => navigation.navigate('Stats')} />
      </View>

      <Group style={styles.group}>
        <MembershipRow />
        <Row icon="flag" title="Service & test profile" onPress={() => navigation.navigate('ServiceProfile')} />
        {signedIn || (__DEV__ && teamCount > 0) ? (
          <Row icon="people" title="Teams" subtitle="Your teams, chat and communities" value={teamName || undefined} onPress={() => navigation.navigate('LeaderTools')} />
        ) : null}
        <Row icon="mapPin" title="Activity history" subtitle="Runs, rucks, hikes and share cards" onPress={() => navigation.navigate('ActivityHistory')} />
        {Platform.OS !== 'web' ? (
          <Row icon="heart" title={healthPlatformName} subtitle="Watch workouts and heart rate" value={healthConnected ? 'Connected' : undefined} onPress={() => navigation.navigate('HealthSync')} />
        ) : null}
        <Row icon="share" title="Share my streak" onPress={() => void shareStreak(progress.streak_days, rankTitle(progress.current_rank, military))} />
        {/* Optional, and deliberately here rather than in onboarding: nobody is asked
            to make an account before they have something worth keeping. Hidden
            entirely when the build has no backup keys. */}
        {isBackupAvailable() ? (
          <Row icon="restart" title="Back up progress" onPress={() => navigation.navigate('Backup')} />
        ) : null}
        {/* Separate from backup on purpose: backup is Gruntz keeping a copy for you,
            this is your history leaving or arriving in a format other apps read. */}
        <Row icon="swap" title="Import & export" onPress={() => navigation.navigate('DataTransfer')} />
      </Group>

      <EditNameSheet visible={editing} onClose={() => setEditing(false)} />
    </ScrollView>
  );
}

/** One sheet for the three ways a photo can change. */
export function photoOptions() {
  haptic.light();
  const hasPhoto = !!useChromePrefs.getState().profilePhotoFile;
  const change = async (source: PhotoSource) => {
    const outcome = await changeProfilePhoto(source);
    if (outcome === 'saved') { haptic.success(); toast('Profile photo updated'); void syncTeamAvatar(); return; }
    if (outcome === 'cancelled') return;
    if (outcome === 'denied') {
      Alert.alert(
        source === 'camera' ? 'Camera access is off' : 'Photo access is off',
        `Allow it in Settings to ${source === 'camera' ? 'take' : 'choose'} a profile photo.`,
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => { void Linking.openSettings().catch(() => undefined); } }],
      );
      return;
    }
    toast(outcome === 'unavailable' ? 'Photos aren’t available on this device' : 'Couldn’t save that photo. Try another.', { tone: 'error', icon: 'alert' });
  };
  const remove = async () => { await removeProfilePhoto(); haptic.selection(); toast('Profile photo removed'); void syncTeamAvatar(); };
  const actions: { label: string; run: () => void; destructive?: boolean }[] = [
    { label: 'Take photo', run: () => void change('camera') },
    { label: 'Choose from library', run: () => void change('library') },
    ...(hasPhoto ? [{ label: 'Remove photo', run: () => void remove(), destructive: true }] : []),
  ];
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...actions.map((a) => a.label), 'Cancel'],
        destructiveButtonIndex: hasPhoto ? actions.length - 1 : undefined,
        cancelButtonIndex: actions.length,
        userInterfaceStyle: 'dark',
      },
      (i) => actions[i]?.run(),
    );
    return;
  }
  Alert.alert('Profile photo', undefined, [
    ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
    { text: 'Cancel', style: 'cancel' },
  ]);
}

function Avatar({ initial, rank, locked }: { initial: string; rank: Rank; locked: boolean }) {
  const file = useChromePrefs((s) => s.profilePhotoFile);
  const [uri, setUri] = useState<string | null>(null);
  // Resolved on every change: the folder path is only known once the file module has loaded.
  useEffect(() => {
    let current = true;
    void loadProfilePhotoLocation().then((next) => { if (current) setUri(next); });
    return () => { current = false; };
  }, [file]);
  return (
    <Tap onPress={photoOptions} scaleTo={0.96} style={styles.avatar} accessibilityRole="button" accessibilityLabel={uri ? 'Change profile photo' : 'Add profile photo'}>
      {uri ? <Image source={{ uri }} style={styles.photo} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
        : <Text style={styles.initial}>{initial}</Text>}
      <View style={styles.cameraBadge}>
        <Icon name="camera" size={14} color={color.text} weight="semibold" />
      </View>
      <View style={styles.avatarBadge}>
        <RankBadge rank={rank} size={38} locked={locked} />
      </View>
    </Tap>
  );
}

function WeeklyChart({ claimed }: { claimed: Parameters<typeof claimedDates>[0] }) {
  const weeks = useMemo(() => weeklyMissions(claimedDates(claimed)), [claimed]);
  const thisWeek = weeks[WEEKS - 1].count;
  const lastWeek = weeks[WEEKS - 2].count;
  // Percentages off one or two workouts swing wildly ('+100%'), so compare counts instead.
  const delta = thisWeek - lastWeek;
  const max = Math.max(3, ...weeks.map((w) => w.count));
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const rangeEnd = new Date(weeks[WEEKS - 1].start);
  rangeEnd.setDate(rangeEnd.getDate() + 6);

  return (
    <>
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
        {weeks.every((w) => w.count === 0) ? (
          <View style={styles.chartEmpty} pointerEvents="none">
            <Text variant="callout" tone="secondary" align="center">
              Finish a workout and your weeks start filling in here.
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );
}

function MembershipRow() {
  const navigation = useNavigation();
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const openCustomerCenter = useSubscriptionStore((s) => s.openCustomerCenter);
  const access = getAccessState({ trialStartedAt, entitlementActive });

  const membership = async () => {
    if (access === 'subscriber') {
      const r = await openCustomerCenter();
      if (r !== 'presented') {
        Alert.alert('Management unavailable', 'Open your subscription settings in the App Store or Google Play to manage your membership.');
      }
      return;
    }
    navigation.navigate('Paywall');
  };

  return (
    <Row
      icon="starFill"
      title={access === 'subscriber' ? 'Manage Gruntz Pro' : access === 'trial' ? 'Gruntz Pro' : 'Upgrade to Pro'}
      value={access === 'trial' ? `${getTrialDaysRemaining(trialStartedAt)} days left` : access === 'subscriber' ? 'Active' : undefined}
      onPress={membership}
    />
  );
}

function EditNameSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const saved = profile?.display_name ?? '';
  const [name, setName] = useState(saved);
  // Each open starts from the saved name, not whatever was abandoned last time. Reset
  // during render rather than in an effect so the field never shows the stale draft.
  const [wasVisible, setWasVisible] = useState(visible);
  const [sheetOpen, setSheetOpen] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setName(saved);
      setSheetOpen(true);
    }
  }

  const saveName = () => {
    const next = name.trim() || 'Athlete';
    const changed = next !== saved;
    if (profile && changed) setProfile({ ...profile, display_name: next });
    haptic.success();
    onClose();
    // Saying "updated" when nothing changed teaches people the toast is noise.
    if (changed) toast('Profile updated');
  };

  // Closing used to discard whatever had been typed without a word. A name that
  // is actually different is confirmed first.
  const dismiss = () => {
    // System drag dismissal has already removed the route. Reopening must toggle
    // the actual presentation without resetting the unsaved name.
    setSheetOpen(false);
    const typed = name.trim();
    if (typed && typed !== saved) {
      Alert.alert('Discard changes?', 'Your new name has not been saved.', [
        { text: 'Keep editing', style: 'cancel', onPress: () => setSheetOpen(true) },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ], { cancelable: false });
      return;
    }
    onClose();
  };

  return (
    <Sheet visible={visible && sheetOpen} onClose={dismiss} title="Edit profile" avoidKeyboard>
      <View style={{ paddingHorizontal: space.gutter, paddingTop: space.md }}>
        <Text variant="subhead" tone="secondary" style={{ marginBottom: 8 }}>
          Name
        </Text>
        <TextInput
          maxFontSizeMultiplier={1.8}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={color.textTertiary}
          maxLength={40}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={saveName}
          style={styles.input}
          selectionColor={color.accent}
        />
        <Button title="Change photo" variant="secondary" style={{ marginTop: space.lg }} onPress={photoOptions} />
        <Button title="Save" style={{ marginTop: space.sm }} haptic={false} onPress={saveName} />
      </View>
    </Sheet>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, paddingRight: 6 }}>
      {/* Three cells share the space beside the avatar; on a narrow window the longest label must shrink, not run into its neighbour. */}
      <Text variant="callout" tone="secondary" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {label}
      </Text>
      <Text variant="headline" tabular style={{ marginTop: 4, fontSize: 19 }}>
        {value}
      </Text>
    </View>
  );
}

const BAR_MAX = 180;

function ChartBar({ ratio, index, highlight }: { ratio: number; index: number; highlight: boolean }) {
  const h = useSharedValue(0);
  React.useEffect(() => {
    h.set(withDelay(index * 40, withTiming(ratio, { duration: 600, easing: motion.easeOut })));
  }, [ratio, index, h]);
  // A full-height bar slid up inside a clip, not an animated height: eight bars changing
  // height re-ran layout on every frame of the entrance.
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: BAR_MAX - (4 + h.get() * (BAR_MAX - 4)) }] }));
  return (
    <View style={styles.barClip}>
      <Animated.View style={[styles.bar, { backgroundColor: highlight ? color.accent : '#1F5FAF' }, style]} />
    </View>
  );
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
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: color.cta, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: font.bold, fontSize: 48, color: '#000' },
  photo: { width: 112, height: 112, borderRadius: 56 },
  avatarBadge: { position: 'absolute', right: -6, bottom: -4 },
  cameraBadge: { position: 'absolute', left: -2, bottom: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: color.surfaceHigh, borderWidth: 2, borderColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', marginTop: space.md },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.gutter + 4, marginTop: space.xxl },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 4 },
  value: { fontFamily: font.bold, fontSize: 22, color: color.text },
  delta: { paddingHorizontal: 8, height: 28, borderRadius: radius.xs, backgroundColor: color.surface, justifyContent: 'center' },
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
  chartEmpty: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl, paddingBottom: space.xl },
  barClip: { width: 22, height: BAR_MAX, borderRadius: 6, overflow: 'hidden' },
  bar: { width: 22, height: BAR_MAX, borderRadius: 6 },
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
