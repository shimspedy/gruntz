import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, type ViewToken } from 'react-native';
import { useFocusEffect, useNavigation, useScrollToTop } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostCard } from '../components/feed/PostCard';
import { applyPostChange, usePostActions, withReaction } from '../hooks/usePostActions';
import { useSignedIn } from '../hooks/useSignedIn';
import { useTabChromeInset } from '../navigation/TabBar';
import { FEED_FAILURE, PAGE_SIZE, feedChangeStamp, fetchFeed, hasDemoFeed, markSeen, setReaction, type FeedPost, type ReactionKey } from '../services/feed';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';
import { useContentSize } from '../ui/useContentSize';

/** Posts older than this on screen are reloaded when the tab comes back into view. */
const STALE_MS = 3 * 60 * 1000;

/** The feed tab: what other athletes trained and said, ranked for this athlete. */
export default function FeedScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const bottom = useTabChromeInset();
  const { width } = useContentSize();
  // Dev builds can show sample posts without an account, for layout checks and screenshots.
  const session = useSignedIn();
  const signedIn = hasDemoFeed() ? true : session;
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [more, setMore] = useState<'idle' | 'loading' | 'done'>('idle');
  const list = useRef<FlatList<FeedPost>>(null);
  useScrollToTop(list);
  const alive = useRef(true);
  const ticket = useRef(0);
  const loadedAt = useRef(0);
  const stamp = useRef(-1);
  const seen = useRef(new Set<string>());

  const flushSeen = useCallback(() => {
    if (!seen.current.size) return;
    markSeen([...seen.current]);
    seen.current.clear();
  }, []);

  const load = useCallback(async () => {
    const mine = ++ticket.current;
    const result = await fetchFeed(0);
    // Only the newest request may write.
    if (!alive.current || mine !== ticket.current) return;
    loadedAt.current = Date.now();
    stamp.current = feedChangeStamp();
    if (result.ok) { setPosts(result.value); setFailed(false); setMore(result.value.length < PAGE_SIZE ? 'done' : 'idle'); }
    else { setFailed(true); }
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    if (signedIn !== true) return undefined;
    // Back from posting, deleting or blocking, or after a while away: show what is true now.
    if (stamp.current !== feedChangeStamp() || Date.now() - loadedAt.current > STALE_MS) void load();
    return flushSeen;
  }, [signedIn, load, flushSeen]));

  useEffect(() => {
    // Another account's feed must never stay on screen.
    if (signedIn !== true) { setPosts(null); loadedAt.current = 0; stamp.current = -1; seen.current.clear(); }
  }, [signedIn]);

  const loadMore = async () => {
    if (more !== 'idle' || !posts?.length) return;
    setMore('loading');
    const mine = ticket.current;
    const result = await fetchFeed(posts.length);
    if (!alive.current || mine !== ticket.current) return;
    if (!result.ok) { setMore('idle'); return; }
    const known = new Set(posts.map((item) => item.id));
    const fresh = result.value.filter((item) => !known.has(item.id));
    setPosts((current) => [...(current ?? []), ...fresh]);
    setMore(result.value.length < PAGE_SIZE || !fresh.length ? 'done' : 'idle');
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

  const options = usePostActions((change) => setPosts((current) => applyPostChange(current ?? [], change)));
  const author = useCallback((post: FeedPost) => navigation.navigate('AthletePosts', { userId: post.userId, name: post.displayName }), [navigation]);
  const open = useCallback((post: FeedPost) => navigation.navigate('PostDetail', { postId: post.id }), [navigation]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    for (const token of viewableItems) if (token.isViewable && token.item) seen.current.add((token.item as FeedPost).id);
    if (seen.current.size >= 12) flushSeen();
  }).current;

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
      <Text variant="title" style={{ flex: 1 }}>Feed</Text>
      {signedIn ? (
        <>
          <IconButton icon="search" onPress={() => navigation.navigate('Athletes')} label="Find athletes" />
          <Button title="Post" size="sm" variant="accent" onPress={() => navigation.navigate('ComposePost')} />
        </>
      ) : null}
    </View>
  );

  if (signedIn !== true) {
    return (
      <View style={styles.screen}>
        {header}
        {signedIn === false ? (
          <View style={styles.gate}>
            <View style={styles.gateIcon}><Icon name="people" size={26} color={color.text} /></View>
            <Text variant="title" align="center">Train with other athletes</Text>
            <Text variant="callout" tone="secondary" align="center" style={styles.gateBody}>
              See what others finished today, post your own workouts, comment and react. The feed is for signed-in athletes, and your training still works without an account.
            </Text>
            <Button title="Sign in or create an account" onPress={() => navigation.navigate('Backup')} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : null}
      </View>
    );
  }

  const cardWidth = width - space.md * 4;
  return (
    <View style={styles.screen}>
      {header}
      <FlatList
        ref={list}
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} width={cardWidth} onReact={react} onOpen={open} onOptions={options} onAuthor={author} />}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: bottom }}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.6}
        onEndReached={() => { void loadMore(); }}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 800 }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); flushSeen(); void load().finally(() => alive.current && setRefreshing(false)); }} />}
        ListEmptyComponent={failed ? (
          <View style={styles.empty}>
            <Icon name="alert" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t load the feed</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>Check your connection, then try again.</Text>
            <Button title="Try again" variant="secondary" size="md" onPress={() => { void load(); }} style={{ marginTop: space.md }} />
          </View>
        ) : posts === null ? (
          <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxl }}>Loading…</Text>
        ) : (
          <View style={styles.empty}>
            <Icon name="dumbbell" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>Nothing posted yet</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>Be the first. Finish a workout and share it, or say what you’re training today.</Text>
            <Button title="Write a post" variant="accent" size="md" onPress={() => navigation.navigate('ComposePost')} style={{ marginTop: space.md }} />
          </View>
        )}
        ListFooterComponent={posts?.length && more === 'done' ? (
          <Text variant="footnote" tone="tertiary" align="center" style={{ marginVertical: space.md }}>You’re all caught up</Text>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, gap: space.sm },
  gateIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  gateBody: { marginBottom: space.md, lineHeight: 22 },
  empty: { alignItems: 'center', padding: space.lg, marginTop: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
});
