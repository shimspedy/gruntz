import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  blockAthlete, followAthlete, listFollowers, listFollowing, reportAthlete, searchAthletes, setDiscoverable, unfollowAthlete,
  type Athlete, type AthleteFailure, type AthleteResult,
} from '../services/athletes';
import { useReadinessStore } from '../store/useReadinessStore';
import { getLocalDateKey } from '../utils/dateKey';
import { relativeTime } from '../utils/relativeTime';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';

type Tab = 'following' | 'followers' | 'find';
const TABS: { value: Tab; label: string }[] = [{ value: 'following', label: 'Following' }, { value: 'followers', label: 'Followers' }, { value: 'find', label: 'Find' }];

const FAILURE: Record<AthleteFailure, string> = {
  'signed-out': 'Sign in to follow athletes.',
  unavailable: 'Following is not available in this build.',
  'not-found': 'That athlete is no longer findable.',
  'too-many': 'You are following as many athletes as the app allows.',
  'rate-limited': 'Too many in a row. Wait a while, then try again.',
  error: 'Couldn’t reach Gruntz. Check your connection and try again.',
};

/** Follow other athletes without a team or a code: find them by name, one tap to follow. */
export default function AthletesScreen() {
  const insets = useSafeAreaInsets();
  const discoverable = useReadinessStore((s) => s.discoverable);
  const [tab, setTab] = useState<Tab>('following');
  const [query, setQuery] = useState('');
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);
  const latest = useRef(0);

  const load = useCallback(async (which: Tab, q: string) => {
    const ticket = ++latest.current;
    const result = which === 'following' ? await listFollowing() : which === 'followers' ? await listFollowers()
      : q.trim().length >= 2 ? await searchAthletes(q) : ({ ok: true, value: [] } as AthleteResult<Athlete[]>);
    // Only the newest request may write: a slow answer for another tab must not land here.
    if (!alive.current || ticket !== latest.current) return;
    if (result.ok) { setAthletes(result.value); setFailed(false); } else { setFailed(true); }
  }, []);

  useEffect(() => {
    alive.current = true;
    setAthletes(null);
    const timer = setTimeout(() => { void load(tab, query); }, tab === 'find' && query ? 250 : 0);
    return () => { alive.current = false; clearTimeout(timer); };
  }, [tab, query, load]);

  const act = async (athlete: Athlete, action: () => Promise<AthleteResult<null>>, done: string, patch: (item: Athlete) => Athlete | null) => {
    if (busy) return;
    setBusy(athlete.userId);
    const result = await action();
    if (!alive.current) return;
    setBusy(null);
    if (!result.ok) { haptic.warning(); toast(FAILURE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    haptic.success();
    toast(done);
    setAthletes((current) => (current ?? []).flatMap((item) => (item.userId === athlete.userId ? (patch(item) ?? []) : item)));
  };

  const follow = (athlete: Athlete) => act(athlete, () => followAthlete(athlete.userId), `Following ${athlete.displayName}`, (item) => ({ ...item, isFollowing: true }));

  /** Unfollowing, blocking and reporting sit behind the row's menu, never one tap from the list. */
  const options = (athlete: Athlete) => {
    haptic.light();
    const block = () => Alert.alert(`Block ${athlete.displayName}?`, 'Neither of you will see or be able to follow the other. This also removes any follow between you.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => void act(athlete, () => blockAthlete(athlete.userId), `${athlete.displayName} blocked`, () => null) },
    ]);
    const report = () => Alert.alert('Report this athlete?', 'Their name and photo go to Gruntz for review. You can also block them.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => void act(athlete, () => reportAthlete(athlete.userId, 'Reported from the athlete list'), 'Reported. Thank you.', (item) => item) },
    ]);
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      ...(athlete.isFollowing ? [{ label: 'Unfollow', run: () => void act(athlete, () => unfollowAthlete(athlete.userId), `Unfollowed ${athlete.displayName}`, (item) => (tab === 'following' ? null : { ...item, isFollowing: false })) }] : []),
      { label: 'Report', run: report },
      { label: 'Block', run: block, destructive: true },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: athlete.displayName, options: [...actions.map((a) => a.label), 'Cancel'], destructiveButtonIndex: actions.length - 1, cancelButtonIndex: actions.length, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.run(),
      );
      return;
    }
    Alert.alert(athlete.displayName, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const makeFindable = async () => {
    const result = await setDiscoverable(true);
    if (!alive.current) return;
    if (result.ok) { haptic.success(); toast('Athletes can find you now'); } else { haptic.warning(); toast(FAILURE[result.reason], { tone: 'error', icon: 'alert' }); }
  };

  const today = getLocalDateKey();
  const empty = tab === 'following'
    ? { title: 'You are not following anyone yet', body: 'Open Find, search a name and follow in one tap. No code needed.' }
    : tab === 'followers'
      ? { title: 'No followers yet', body: discoverable ? 'Athletes who follow you show up here.' : 'Turn on “Let athletes find me” so others can follow you.' }
      : { title: query.trim().length >= 2 ? 'Nobody by that name' : 'Find an athlete', body: query.trim().length >= 2 ? 'Only athletes who chose to be findable appear here.' : 'Type at least two letters of their name.' };

  return (
    <View style={styles.screen}>
      <NavHeader title="Athletes" />
      <Segmented options={TABS} value={tab} onChange={setTab} style={styles.tabs} />
      {tab === 'find' ? (
        <View style={styles.search}>
          <Icon name="search" size={16} color={color.textTertiary} />
          <TextInput
            maxFontSizeMultiplier={1.6}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name"
            placeholderTextColor={color.textTertiary}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
            selectionColor={color.accent}
            accessibilityLabel="Search athletes"
          />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load(tab, query).finally(() => alive.current && setRefreshing(false)); }} />}
      >
        {!discoverable && tab !== 'following' ? (
          <View style={styles.notice}>
            <View style={{ flex: 1 }}>
              <Text variant="headline">Let athletes find me</Text>
              <Text variant="subhead" tone="secondary" style={{ marginTop: 2 }}>
                Off by default. On, anyone signed in can find you by name and see your photo, level, rank, sessions and streak.
              </Text>
            </View>
            <Button title="Turn on" size="sm" variant="accent" onPress={() => { void makeFindable(); }} />
          </View>
        ) : null}
        {failed ? (
          <View style={styles.empty}>
            <Icon name="alert" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t load athletes</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>Check your connection, then try again.</Text>
            <Button title="Try again" variant="secondary" size="md" onPress={() => { void load(tab, query); }} style={{ marginTop: space.md }} />
          </View>
        ) : athletes === null ? (
          <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxl }}>Loading…</Text>
        ) : athletes.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="people" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>{empty.title}</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>{empty.body}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {athletes.map((athlete, index) => {
              const trainedToday = !!athlete.lastTrainedAt && getLocalDateKey(new Date(athlete.lastTrainedAt)) === today;
              return (
                <View key={athlete.userId} style={[styles.row, index < athletes.length - 1 && styles.divider]}>
                  <View style={styles.photo}>
                    {athlete.avatarUrl
                      ? <Image source={{ uri: athlete.avatarUrl }} style={styles.photoImage} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
                      : <Text style={styles.initial}>{athlete.displayName.trim().charAt(0).toUpperCase() || '?'}</Text>}
                  </View>
                  <Tap
                    feedback="opacity"
                    onPress={() => options(athlete)}
                    style={{ flex: 1 }}
                    accessibilityRole="button"
                    accessibilityLabel={`${athlete.displayName}, level ${athlete.level} ${athlete.rank}, ${athlete.streak} day streak${trainedToday ? ', trained today' : ''}`}
                    accessibilityHint="Opens options"
                  >
                    <View style={styles.nameLine}>
                      <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>{athlete.displayName}</Text>
                      {trainedToday ? <Icon name="check" size={14} color={color.success} weight="bold" /> : null}
                    </View>
                    <Text variant="footnote" tone="tertiary" numberOfLines={1} style={{ marginTop: 2 }}>
                      Level {athlete.level} · {athlete.rank} · {athlete.streak} day streak
                    </Text>
                    <Text variant="footnote" tone="tertiary" numberOfLines={1} style={{ marginTop: 2 }}>
                      {trainedToday ? 'Trained today' : athlete.lastTrainedAt ? `Last trained ${relativeTime(athlete.lastTrainedAt)}` : `${athlete.sessions} sessions`}
                      {athlete.weekSessions > 0 ? ` · ${athlete.weekSessions} this week` : ''}
                    </Text>
                  </Tap>
                  {athlete.isFollowing ? (
                    <View style={styles.following}><Text variant="footnote" style={{ color: color.accent, fontFamily: font.semibold }}>Following</Text></View>
                  ) : (
                    <Button title={athlete.followsMe ? 'Follow back' : 'Follow'} size="sm" variant="accent" loading={busy === athlete.userId} onPress={() => { void follow(athlete); }} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  tabs: { marginHorizontal: space.md, marginBottom: space.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: space.md, marginBottom: space.md, paddingHorizontal: 14, height: 44, borderRadius: 22, backgroundColor: color.surface },
  searchInput: { flex: 1, color: color.text, fontFamily: font.regular, fontSize: 16, height: 44 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, marginBottom: space.md, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  list: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photo: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: 40, height: 40, borderRadius: 20 },
  initial: { fontFamily: font.bold, fontSize: 17, color: color.text },
  following: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: space.lg, marginTop: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
});
