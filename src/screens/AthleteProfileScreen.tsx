import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, PostCard } from '../components/feed/PostCard';
import { applyPostChange, usePostActions, withReaction } from '../hooks/usePostActions';
import { useSignedIn } from '../hooks/useSignedIn';
import {
  BIO_MAX, blockAthlete, fetchAthleteProfile, followAthlete, reportAthlete, setAthleteBio, unfollowAthlete,
  type AthleteFailure, type AthleteProfile,
} from '../services/athletes';
import {
  ATHLETE_PAGE_SIZE, FEED_FAILURE, feedChangeStamp, fetchAthletePosts, hasDemoFeed, noteFeedChanged, setReaction,
  type FeedPost, type ReactionKey,
} from '../services/feed';
import type { RootStackParamList } from '../types/navigation';
import { getLocalDateKey } from '../utils/dateKey';
import { relativeTime } from '../utils/relativeTime';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { IconButton, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';
import { useContentSize } from '../ui/useContentSize';

const FAILURE: Record<AthleteFailure, string> = {
  'signed-out': 'Sign in to see athlete profiles.',
  unavailable: 'Profiles are not available in this build.',
  'not-found': 'This profile isn’t available.',
  'too-many': 'You are following as many athletes as the app allows.',
  'rate-limited': 'Too many in a row. Wait a while, then try again.',
  error: 'Couldn’t reach Gruntz. Check your connection and try again.',
};

const compact = (n: number): string => (n >= 10000 ? `${Math.floor(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));

/**
 * An athlete's page: who they are, what they've put in, and everything they've posted that
 * the viewer may see. With no `userId` it is the signed-in athlete's own page.
 */
export default function AthleteProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useContentSize();
  const params = useRoute<RouteProp<RootStackParamList, 'AthleteProfile'>>().params;
  const requested = params?.userId ?? null;
  const signedIn = useSignedIn() === true || hasDemoFeed();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [failed, setFailed] = useState<AthleteFailure | null>(null);
  const [more, setMore] = useState<'idle' | 'loading' | 'done'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const alive = useRef(true);
  const ticket = useRef(0);
  const stamp = useRef(-1);

  const load = useCallback(async () => {
    const mine = ++ticket.current;
    const card = await fetchAthleteProfile(requested);
    if (!alive.current || mine !== ticket.current) return;
    if (!card.ok) { setFailed(card.reason); setPosts([]); return; }
    setProfile(card.value);
    setFailed(null);
    const list = await fetchAthletePosts(card.value.userId);
    if (!alive.current || mine !== ticket.current) return;
    stamp.current = feedChangeStamp();
    if (list.ok) { setPosts(list.value); setMore(list.value.length < ATHLETE_PAGE_SIZE ? 'done' : 'idle'); } else { setPosts([]); setMore('done'); }
  }, [requested]);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  // Another account's page must never stay on screen.
  useEffect(() => { if (!signedIn) { setProfile(null); setPosts([]); } }, [signedIn]);

  // First open, and back from posting or deleting.
  useFocusEffect(useCallback(() => {
    if (signedIn && stamp.current !== feedChangeStamp()) void load();
  }, [signedIn, load]));

  const loadMore = async () => {
    if (more !== 'idle' || !profile || !posts?.length) return;
    setMore('loading');
    const mine = ticket.current;
    const result = await fetchAthletePosts(profile.userId, posts);
    if (!alive.current || mine !== ticket.current) return;
    if (!result.ok) { setMore('idle'); return; }
    const known = new Set(posts.map((item) => item.id));
    const fresh = result.value.filter((item) => !known.has(item.id));
    setPosts((current) => [...(current ?? []), ...fresh]);
    setMore(result.value.length < ATHLETE_PAGE_SIZE || !fresh.length ? 'done' : 'idle');
  };

  const react = useCallback((post: FeedPost, next: ReactionKey | null) => {
    setPosts((current) => (current ?? []).map((item) => (item.id === post.id ? withReaction(item, next) : item)));
    void setReaction(post.id, next).then((result) => {
      if (result.ok || !alive.current) return;
      haptic.warning();
      toast(FEED_FAILURE[result.reason], { tone: 'error', icon: 'alert' });
      setPosts((current) => (current ?? []).map((item) => (item.id === post.id ? withReaction(item, post.myReaction) : item)));
    });
  }, []);

  const postOptions = usePostActions((change) => {
    if (change.kind === 'author-removed') { navigation.goBack(); return; }
    if (change.kind === 'following') setProfile((p) => (p ? { ...p, isFollowing: change.on, followerCount: p.followerCount === null ? null : Math.max(0, p.followerCount + (change.on ? 1 : -1)) } : p));
    setPosts((current) => applyPostChange(current ?? [], change));
  });

  const setFollowing = (on: boolean) => {
    setProfile((p) => (p ? { ...p, isFollowing: on, followerCount: p.followerCount === null ? null : Math.max(0, p.followerCount + (on ? 1 : -1)) } : p));
    setPosts((current) => (current ?? []).map((post) => ({ ...post, isFollowing: on })));
  };

  const follow = async () => {
    if (!profile || busy) return;
    setBusy(true);
    const result = await followAthlete(profile.userId);
    if (!alive.current) return;
    setBusy(false);
    if (!result.ok) { haptic.warning(); toast(FAILURE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    haptic.success();
    setFollowing(true);
    noteFeedChanged();
  };

  const unfollow = async () => {
    if (!profile) return;
    const result = await unfollowAthlete(profile.userId);
    if (!alive.current) return;
    if (!result.ok) { haptic.warning(); toast(FAILURE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    setFollowing(false);
    noteFeedChanged();
    // Follower-only posts are no longer theirs to show.
    void load();
  };

  /** One sheet of choices, the platform's own. The last destructive entry goes red. */
  const menu = (title: string, actions: { label: string; run: () => void; destructive?: boolean }[]) => {
    haptic.light();
    if (Platform.OS === 'ios') {
      const red = actions.findIndex((a) => a.destructive);
      ActionSheetIOS.showActionSheetWithOptions(
        { title, options: [...actions.map((a) => a.label), 'Cancel'], ...(red >= 0 ? { destructiveButtonIndex: red } : {}), cancelButtonIndex: actions.length, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.run(),
      );
      return;
    }
    Alert.alert(title, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  /** Report and block live behind the three dots, never one tap from the page. */
  const options = () => {
    if (!profile || profile.isMe) return;
    const name = profile.displayName;
    menu(name, [
      ...(profile.isFollowing ? [{ label: 'Unfollow', run: () => void unfollow() }] : []),
      {
        label: 'Report',
        run: () => Alert.alert(`Report ${name}?`, 'Their name, photo and bio go to Gruntz for review. You can also block them.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Report', style: 'destructive', onPress: () => { void reportAthlete(profile.userId, 'Reported from their profile').then((r) => { if (r.ok) toast('Reported. Thank you.'); else toast(FAILURE[r.reason], { tone: 'error', icon: 'alert' }); }); } },
        ]),
      },
      {
        label: 'Block',
        destructive: true,
        run: () => Alert.alert(`Block ${name}?`, 'Neither of you will see the other’s profile, posts or comments, and any follow between you is removed.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => { void blockAthlete(profile.userId).then((r) => { if (r.ok) { noteFeedChanged(); toast(`${name} blocked`); navigation.goBack(); } else toast(FAILURE[r.reason], { tone: 'error', icon: 'alert' }); }); } },
        ]),
      },
    ]);
  };

  const saveBio = async () => {
    if (editing === null || busy) return;
    setBusy(true);
    const result = await setAthleteBio(editing);
    if (!alive.current) return;
    setBusy(false);
    if (!result.ok) { haptic.warning(); toast(FAILURE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    haptic.success();
    setProfile((p) => (p ? { ...p, bio: result.value } : p));
    setEditing(null);
  };

  const open = (post: FeedPost) => navigation.navigate('PostDetail', { postId: post.id });

  if (failed && !profile) {
    return (
      <View style={styles.screen}>
        <NavHeader title={params?.name?.trim() || 'Athlete'} />
        <View style={styles.missing}>
          <Icon name={failed === 'not-found' ? 'person' : 'alert'} size={24} color={color.textSecondary} />
          <Text variant="headline" align="center" style={{ marginTop: space.sm }}>{FAILURE[failed]}</Text>
          {failed !== 'not-found' ? <Button title="Try again" variant="secondary" size="md" onPress={() => { void load(); }} style={{ marginTop: space.md }} /> : null}
        </View>
      </View>
    );
  }

  const header = profile ? (
    <ProfileHeader
      profile={profile}
      busy={busy}
      onFollow={() => { void follow(); }}
      onFollowing={() => menu(profile.displayName, [{ label: 'Unfollow', run: () => void unfollow() }])}
      onEditBio={() => setEditing(profile.bio)}
      onFind={() => navigation.navigate('Athletes')}
      onList={(tab) => navigation.navigate('Athletes', { tab })}
      onCompose={() => navigation.navigate('ComposePost')}
      hasPosts={!!posts?.length}
    />
  ) : null;

  const empty = posts === null || !profile ? (
    <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxl }}>Loading…</Text>
  ) : (
    <View style={styles.empty}>
      <Icon name="dumbbell" size={22} color={color.textSecondary} />
      <Text variant="headline" style={{ marginTop: space.sm }}>{profile.isMe ? 'Your posts show up here' : 'No posts to show'}</Text>
      <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>
        {profile.isMe ? 'Share a finished workout or a photo from the gym.' : profile.followable && !profile.isFollowing ? 'Follow them to see posts they share with followers.' : 'They haven’t posted anything you can see yet.'}
      </Text>
      {profile.isMe ? <Button title="Write a post" variant="accent" size="md" onPress={() => navigation.navigate('ComposePost')} style={{ marginTop: space.md }} /> : null}
    </View>
  );

  const common = {
    contentContainerStyle: { paddingHorizontal: space.md, paddingBottom: insets.bottom + space.xxl },
    showsVerticalScrollIndicator: false,
    ListHeaderComponent: header,
    ListEmptyComponent: empty,
    onEndReachedThreshold: 0.6,
    onEndReached: () => { void loadMore(); },
    refreshControl: <RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load().finally(() => alive.current && setRefreshing(false)); }} />,
  };

  return (
    <View style={styles.screen}>
      <NavHeader
        title={profile?.displayName ?? params?.name?.trim() ?? (requested ? 'Athlete' : 'Your profile')}
        right={profile && !profile.isMe ? <IconButton icon="more" onPress={options} label={`Options for ${profile.displayName}`} size={22} /> : null}
      />
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} width={width - space.md * 4} onReact={react} onOpen={open} onOptions={postOptions} />}
        {...common}
      />

      <Sheet visible={editing !== null} onClose={() => setEditing(null)} title="Bio" avoidKeyboard>
        <View style={styles.sheetBody}>
          <Text variant="subhead" tone="secondary">A line or two about how you train. Anyone who can open your profile sees it.</Text>
          <TextInput
            maxFontSizeMultiplier={1.6}
            value={editing ?? ''}
            onChangeText={(text) => setEditing(text.slice(0, BIO_MAX))}
            placeholder="Early lifts, weekend rucks, chasing a 300 PFT"
            placeholderTextColor={color.textTertiary}
            style={styles.input}
            multiline
            maxLength={BIO_MAX}
            autoFocus
            selectionColor={color.accent}
            accessibilityLabel="Bio"
          />
          <Text variant="footnote" tone="tertiary" align="right" tabular style={{ marginTop: space.xxs }}>{(editing ?? '').length}/{BIO_MAX}</Text>
          <Button title="Save" loading={busy} onPress={() => { void saveBio(); }} style={{ marginTop: space.md }} />
        </View>
      </Sheet>
    </View>
  );
}

type HeaderProps = {
  profile: AthleteProfile;
  busy: boolean;
  onFollow: () => void;
  onFollowing: () => void;
  onEditBio: () => void;
  onFind: () => void;
  onList: (tab: 'following' | 'followers') => void;
  onCompose: () => void;
  hasPosts: boolean;
};

function Count({ value, label, onPress }: { value: number | null; label: string; onPress?: () => void }) {
  const body = (
    <>
      <Text style={styles.countValue} tabular>{value === null ? '–' : compact(value)}</Text>
      <Text variant="footnote" tone="secondary">{label}</Text>
    </>
  );
  return onPress ? (
    <Tap feedback="opacity" onPress={onPress} style={styles.count} accessibilityRole="button" accessibilityLabel={`${value ?? 0} ${label}`}>{body}</Tap>
  ) : (
    <View style={styles.count} accessible accessibilityLabel={value === null ? `${label} hidden` : `${value} ${label}`}>{body}</View>
  );
}

function ProfileHeader({ profile: p, busy, onFollow, onFollowing, onEditBio, onFind, onList, onCompose, hasPosts }: HeaderProps) {
  const trainedToday = !!p.lastTrainedAt && getLocalDateKey(new Date(p.lastTrainedAt)) === getLocalDateKey();
  const showRecord = p.sessions !== null;
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <Avatar url={p.avatarUrl} name={p.displayName} size={84} />
        <View style={styles.counts}>
          <Count value={p.postCount} label={p.postCount === 1 ? 'post' : 'posts'} />
          <Count value={p.followerCount} label={p.followerCount === 1 ? 'follower' : 'followers'} onPress={p.isMe ? () => onList('followers') : undefined} />
          <Count value={p.followingCount} label="following" onPress={p.isMe ? () => onList('following') : undefined} />
        </View>
      </View>

      <Text variant="headline" style={{ marginTop: space.sm }}>{p.displayName}</Text>
      <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
        Level {p.level} · {p.rank}{p.followsMe && !p.isMe ? ' · Follows you' : ''}
      </Text>
      {p.bio ? <Text variant="callout" style={{ marginTop: space.xs }}>{p.bio}</Text> : null}

      <View style={styles.actions}>
        {p.isMe ? (
          <>
            <Button title={p.bio ? 'Edit bio' : 'Add a bio'} variant="secondary" size="sm" onPress={onEditBio} style={{ flex: 1 }} />
            <Button title="Find athletes" variant="secondary" size="sm" onPress={onFind} style={{ flex: 1 }} />
          </>
        ) : p.isFollowing ? (
          <Button title="Following" variant="secondary" size="sm" icon="chevronDown" onPress={onFollowing} style={{ flex: 1 }} />
        ) : p.followable ? (
          <Button title={p.followsMe ? 'Follow back' : 'Follow'} variant="accent" size="sm" loading={busy} onPress={onFollow} style={{ flex: 1 }} />
        ) : (
          <View style={styles.privateNote}>
            <Icon name="lock" size={14} color={color.textTertiary} />
            <Text variant="footnote" tone="tertiary" style={{ flex: 1 }}>Not findable. You can see their public posts.</Text>
          </View>
        )}
      </View>

      {p.isMe && !p.discoverable ? (
        <Text variant="footnote" tone="tertiary" style={{ marginTop: space.xs }}>
          Only people you follow, and anyone who sees your posts, can open this page. Turn on “Let athletes find me” under Find athletes so others can follow you.
        </Text>
      ) : null}

      {showRecord ? (
        <View style={styles.record} accessible accessibilityLabel={`${p.streak ?? 0} day streak, ${p.sessions ?? 0} sessions, ${p.weekSessions ?? 0} this week${trainedToday ? ', trained today' : ''}`}>
          <RecordCell icon="flame" value={p.streak ?? 0} label="day streak" />
          <View style={styles.recordRule} />
          <RecordCell icon="dumbbell" value={p.sessions ?? 0} label="sessions" />
          <View style={styles.recordRule} />
          <RecordCell icon="calendar" value={p.weekSessions ?? 0} label="this week" />
        </View>
      ) : null}
      {showRecord ? (
        <Text variant="footnote" tone={trainedToday ? 'success' : 'tertiary'} style={{ marginTop: space.xs }}>
          {trainedToday ? 'Trained today' : p.lastTrainedAt ? `Last trained ${relativeTime(p.lastTrainedAt)}` : 'No sessions logged yet'}
        </Text>
      ) : null}

      {hasPosts ? (
        <View style={styles.modeRow}>
          <Text variant="headline" style={{ flex: 1 }}>Posts</Text>
          {p.isMe ? <IconButton icon="plus" onPress={onCompose} label="Write a post" style={styles.compose} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function RecordCell({ icon, value, label }: { icon: 'flame' | 'dumbbell' | 'calendar'; value: number; label: string }) {
  return (
    <View style={styles.recordCell}>
      <Icon name={icon} size={16} color={icon === 'flame' && value > 0 ? color.accent : color.textSecondary} />
      <Text style={styles.recordValue} tabular>{compact(value)}</Text>
      <Text variant="caption" tone="tertiary">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { paddingBottom: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  counts: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  count: { alignItems: 'center', minWidth: 64, paddingVertical: space.xxs },
  countValue: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, color: color.text },
  actions: { flexDirection: 'row', gap: space.xs, marginTop: space.md },
  privateNote: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs, height: 38, paddingHorizontal: space.sm, borderRadius: radius.sm, borderCurve: 'continuous', backgroundColor: color.surface },
  record: { flexDirection: 'row', alignItems: 'center', marginTop: space.md, paddingVertical: space.sm, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: color.surface },
  recordCell: { flex: 1, alignItems: 'center', gap: 2 },
  recordRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: color.line },
  recordValue: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26, color: color.text },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.md },
  compose: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: space.lg, marginTop: space.xs, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  sheetBody: { paddingHorizontal: space.md, paddingBottom: space.lg },
  input: { marginTop: space.md, minHeight: 96, padding: space.sm, borderRadius: radius.sm, borderCurve: 'continuous', backgroundColor: color.surfaceHigh, color: color.text, fontFamily: font.regular, fontSize: 16, lineHeight: 22, textAlignVertical: 'top' },
});
