import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PostCard } from '../components/feed/PostCard';
import { applyPostChange, usePostActions, withReaction } from '../hooks/usePostActions';
import { FEED_FAILURE, fetchAthletePosts, setReaction, type FeedPost, type ReactionKey } from '../services/feed';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { NavHeader } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';
import { useContentSize } from '../ui/useContentSize';

/** Everything one athlete has posted that the viewer may see, newest first. */
export default function AthletePostsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useContentSize();
  const params = useRoute<RouteProp<RootStackParamList, 'AthletePosts'>>().params;
  const userId = params?.userId ?? '';
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const result = await fetchAthletePosts(userId);
    if (!alive.current) return;
    if (result.ok) { setPosts(result.value); setFailed(false); } else { setFailed(true); }
  }, [userId]);

  useEffect(() => {
    alive.current = true;
    if (userId) void load(); else setPosts([]);
    return () => { alive.current = false; };
  }, [userId, load]);

  const react = useCallback((post: FeedPost, next: ReactionKey | null) => {
    setPosts((current) => (current ?? []).map((item) => (item.id === post.id ? withReaction(item, next) : item)));
    void setReaction(post.id, next).then((result) => {
      if (result.ok || !alive.current) return;
      haptic.warning();
      toast(FEED_FAILURE[result.reason], { tone: 'error', icon: 'alert' });
      setPosts((current) => (current ?? []).map((item) => (item.id === post.id ? withReaction(item, post.myReaction) : item)));
    });
  }, []);

  const options = usePostActions((change) => {
    // Blocked: nothing of theirs is left to show.
    if (change.kind === 'author-removed') { navigation.goBack(); return; }
    setPosts((current) => applyPostChange(current ?? [], change));
  });

  return (
    <View style={styles.screen}>
      <NavHeader title={params?.name?.trim() || 'Athlete'} />
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} width={width - space.md * 4} onReact={react} onOpen={(post) => navigation.navigate('PostDetail', { postId: post.id })} onOptions={options} />}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: insets.bottom + space.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={color.textSecondary} onRefresh={() => { setRefreshing(true); void load().finally(() => alive.current && setRefreshing(false)); }} />}
        ListEmptyComponent={failed ? (
          <View style={styles.empty}>
            <Icon name="alert" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>Couldn’t load their posts</Text>
            <Button title="Try again" variant="secondary" size="md" onPress={() => { void load(); }} style={{ marginTop: space.md }} />
          </View>
        ) : posts === null ? (
          <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.xxl }}>Loading…</Text>
        ) : (
          <View style={styles.empty}>
            <Icon name="people" size={22} color={color.textSecondary} />
            <Text variant="headline" style={{ marginTop: space.sm }}>No posts to show</Text>
            <Text variant="subhead" tone="secondary" align="center" style={{ marginTop: 4 }}>They haven’t posted yet, or their posts are for followers only.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  empty: { alignItems: 'center', padding: space.lg, marginTop: space.lg, borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface },
});
