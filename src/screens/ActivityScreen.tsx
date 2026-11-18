import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/feed/PostCard';
import { useSignedIn } from '../hooks/useSignedIn';
import { ACTIVITY_PAGE_SIZE, fetchActivity, markActivitySeen, type ActivityItem } from '../services/activity';
import { followAthlete } from '../services/athletes';
import { FEED_FAILURE, hasDemoFeed, noteFeedChanged, reactionEmoji } from '../services/feed';
import { relativeTime } from '../utils/relativeTime';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';

/** What happened, said the way a training partner would. */
function describe(item: ActivityItem): string {
  const about = item.postPreview ? (item.postKind === 'workout' ? `your workout “${item.postPreview}”` : `your post “${item.postPreview}”`) : 'your post';
  switch (item.kind) {
    case 'follow': return 'started following you';
    case 'reaction': return `reacted ${reactionEmoji(item.reaction)} to ${about}`;
    case 'comment': return `commented on ${about}: ${item.body}`;
    case 'reply': return `replied: ${item.body}`;
  }
}

/** New followers, reactions, comments and replies, newest first. Opening it clears the badge. */
export default function ActivityScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const signedIn = useSignedIn() === true || hasDemoFeed();
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [more, setMore] = useState<'idle' | 'loading' | 'done'>('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const alive = useRef(true);
  const ticket = useRef(0);

  const load = useCallback(async () => {
    const mine = ++ticket.current;
    const result = await fetchActivity();
    if (!alive.current || mine !== ticket.current) return;
    if (!result.ok) { setFailed(true); setItems((current) => current ?? []); return; }
    setFailed(false);
    setItems(result.value);
    setMore(result.value.length < ACTIVITY_PAGE_SIZE ? 'done' : 'idle');
    // What is on screen now counts as seen; the New section stays until the next visit.
    markActivitySeen();
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    if (signedIn) void load();
  }, [signedIn, load]));

  // Another account's activity must never stay on screen.
  useEffect(() => { if (!signedIn) setItems([]); }, [signedIn]);

  const loadMore = async () => {
    if (more !== 'idle' || !items?.length) return;
    setMore('loading');
    const mine = ticket.current;
    const result = await fetchActivity(items);
    if (!alive.current || mine !== ticket.current) return;
    if (!result.ok) { setMore('idle'); return; }
    const known = new Set(items.map((item) => item.key));
    const fresh = result.value.filter((item) => !known.has(item.key));
    setItems((current) => [...(current ?? []), ...fresh]);
    setMore(result.value.length < ACTIVITY_PAGE_SIZE || !fresh.length ? 'done' : 'idle');
  };

  const followBack = async (item: ActivityItem) => {
    if (busy) return;
    setBusy(item.actorId);
    const result = await followAthlete(item.actorId);
    if (!alive.current) return;
    setBusy(null);
    if (!result.ok) {
      haptic.warning();
      toast(result.reason === 'not-found' ? 'This athlete can’t be followed right now.' : FEED_FAILURE[result.reason === 'too-many' ? 'error' : result.reason === 'rate-limited' ? 'rate-limited' : 'error'], { tone: 'error', icon: 'alert' });
      return;
    }
    haptic.success();
    noteFeedChanged();
    setItems((current) => (current ?? []).map((row) => (row.actorId === item.actorId ? { ...row, isFollowing: true } : row)));
  };

  const open = (item: ActivityItem) => {
    if (item.postId && item.kind !== 'follow') navigation.navigate('PostDetail', { postId: item.postId });
    else navigation.navigate('AthleteProfile', { userId: item.actorId, name: item.displayName });
  };

  const fresh = (items ?? []).filter((item) => item.unread);
  const earlier = (items ?? []).filter((item) => !item.unread);
  const sections = [
    ...(fresh.length ? [{ title: 'New', data: fresh }] : []),
    ...(earlier.length ? [{ title: fresh.length ? 'Earlier' : 'Recent', data: earlier }] : []),
  ];

  return (
    <View style={styles.screen}>
      <NavHeader title="Activity" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: insets.bottom + space.xxl }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.6}
        onEndReached={() => { void loadMore(); }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load().finally(() => alive.current && setRefreshing(false)); }} />}
        renderSectionHeader={({ section }) => <Text variant="subhead" tone="secondary" style={styles.sectionLabel}>{section.title}</Text>}
        renderItem={({ item }) => {
          const offerFollow = item.kind === 'follow' && !item.isFollowing && item.actorFollowable;
          return (
            <View style={styles.row}>
              <Tap feedback="opacity" onPress={() => navigation.navigate('AthleteProfile', { userId: item.actorId, name: item.displayName })} accessibilityRole="button" accessibilityLabel={`${item.displayName}'s profile`}>
                <Avatar url={item.avatarUrl} name={item.displayName} size={44} />
                {item.unread ? <View style={styles.dot} /> : null}
              </Tap>
              <Tap feedback="opacity" onPress={() => open(item)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${item.displayName} ${describe(item)}, ${relativeTime(item.createdAt)}`}>
                <Text variant="callout" numberOfLines={3}>
                  <Text variant="callout" style={{ fontFamily: font.semibold }}>{item.displayName}</Text> {describe(item)}
                </Text>
                <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>{relativeTime(item.createdAt)}</Text>
              </Tap>
              {offerFollow ? (
                <Button title="Follow back" size="sm" variant="accent" loading={busy === item.actorId} onPress={() => { void followBack(item); }} />
              ) : item.kind === 'follow' && item.isFollowing ? (
                <View style={styles.following}><Text variant="footnote" style={{ color: color.accent, fontFamily: font.semibold }}>Following</Text></View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={failed ? (
          <View style={styles.empty}>
            <Icon name="alert" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t load activity</Text>
            <Button title="Try again" variant="secondary" size="md" onPress={() => { void load(); }} style={{ marginTop: space.md }} />
          </View>
        ) : items === null ? (
          <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxl }}>Loading…</Text>
        ) : (
          <View style={styles.empty}>
            <Icon name="bell" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>No activity yet</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>New followers, reactions and comments on your posts show up here.</Text>
            <Button title="Write a post" variant="accent" size="md" onPress={() => navigation.navigate('ComposePost')} style={{ marginTop: space.md }} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  sectionLabel: { marginTop: space.md, marginBottom: space.xs, marginLeft: space.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  dot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: color.accent, borderWidth: 2, borderColor: color.bg },
  following: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: color.accentSoft, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: space.lg, marginTop: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
});
