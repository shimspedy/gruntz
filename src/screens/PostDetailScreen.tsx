import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, PostCard } from '../components/feed/PostCard';
import { usePostActions, withReaction } from '../hooks/usePostActions';
import { useSignedIn } from '../hooks/useSignedIn';
import {
  FEED_FAILURE, addComment, cachePosts, cachedPost, deleteComment, fetchComments, hasDemoFeed, reportComment, setReaction,
  type FeedComment, type FeedPost, type ReactionKey,
} from '../services/feed';
import { ensureFeedRulesAccepted } from '../services/feedRules';
import type { RootStackParamList } from '../types/navigation';
import { relativeTime } from '../utils/relativeTime';
import { Icon } from '../ui/Icon';
import { EmptyState, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, font, radius, space } from '../ui/tokens';
import { useContentSize } from '../ui/useContentSize';

/** One post with its comments. Replies sit one level under the comment they answer. */
export default function PostDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useContentSize();
  const postId = useRoute<RouteProp<RootStackParamList, 'PostDetail'>>().params?.postId ?? '';
  // Nothing is drawn from the cache unless someone is signed in: the cache is emptied when
  // an account leaves, and this is the second lock on the same door.
  const signedIn = useSignedIn() === true || hasDemoFeed();
  const [post, setPost] = useState<FeedPost | undefined>(() => cachedPost(postId));
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [sending, setSending] = useState(false);
  const input = useRef<TextInput>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const result = await fetchComments(postId);
    if (!alive.current) return;
    if (result.ok) { setComments(result.value); setFailed(false); } else { setFailed(true); }
  }, [postId]);

  useEffect(() => {
    alive.current = true;
    if (postId) void load();
    return () => { alive.current = false; };
  }, [postId, load]);

  const update = (next: FeedPost) => { setPost(next); cachePosts([next]); };

  const react = (current: FeedPost, next: ReactionKey | null) => {
    update(withReaction(current, next));
    void setReaction(current.id, next).then((result) => {
      if (result.ok || !alive.current) return;
      haptic.warning();
      toast(FEED_FAILURE[result.reason], { tone: 'error', icon: 'alert' });
      update(current);
    });
  };

  const options = usePostActions((change) => {
    if (change.kind === 'following') { if (post) update({ ...post, isFollowing: change.on }); return; }
    // Deleted, reported or blocked: there is nothing left to show here.
    navigation.goBack();
  });

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || !post) return;
    if (!(await ensureFeedRulesAccepted())) return;
    if (!alive.current) return;
    setSending(true);
    const result = await addComment(post.id, replyTo ? (replyTo.parentId ?? replyTo.id) : null, body);
    if (!alive.current) return;
    setSending(false);
    if (!result.ok) { haptic.warning(); toast(FEED_FAILURE[result.reason], { tone: 'error', icon: 'alert' }); return; }
    haptic.success();
    setDraft('');
    setReplyTo(null);
    update({ ...post, commentCount: post.commentCount + 1 });
    void load();
  };

  const commentOptions = (comment: FeedComment) => {
    haptic.light();
    const remove = () => { void deleteComment(comment.id).then((r) => { if (!alive.current) return; if (r.ok) { toast('Comment deleted'); if (post) update({ ...post, commentCount: Math.max(0, post.commentCount - 1) }); void load(); } else toast(FEED_FAILURE[r.reason], { tone: 'error', icon: 'alert' }); }); };
    const report = () => Alert.alert('Report this comment?', 'The comment goes to Gruntz for review.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => { void reportComment(comment.id, 'Reported from a post').then((r) => { if (r.ok) toast('Reported. Thank you.'); else toast(FEED_FAILURE[r.reason], { tone: 'error', icon: 'alert' }); }); } },
    ]);
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [
      { label: 'Reply', run: () => { setReplyTo(comment); input.current?.focus(); } },
      ...(comment.isMine || post?.isMine ? [{ label: 'Delete comment', run: remove, destructive: true }] : []),
      ...(!comment.isMine ? [{ label: 'Report', run: report, destructive: !(comment.isMine || post?.isMine) }] : []),
    ];
    const destructive = actions.findIndex((a) => a.destructive);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map((a) => a.label), 'Cancel'], ...(destructive >= 0 ? { destructiveButtonIndex: destructive } : {}), cancelButtonIndex: actions.length, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.run(),
      );
      return;
    }
    Alert.alert(comment.displayName, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Top-level comments in order, each followed by its replies.
  const threads = useMemo(() => {
    const all = comments ?? [];
    return all.filter((c) => !c.parentId).map((top) => ({ top, replies: all.filter((c) => c.parentId === top.id) }));
  }, [comments]);

  if (!post || !signedIn) {
    return (
      <View style={styles.screen}>
        <NavHeader title="Post" />
        <EmptyState icon="alert" title="Post not available" body="It may have been deleted, or it is no longer shared with you." />
      </View>
    );
  }

  const line = (comment: FeedComment, reply: boolean) => (
    <Tap key={comment.id} feedback="opacity" onPress={() => commentOptions(comment)} style={[styles.comment, reply && styles.reply]} accessibilityRole="button" accessibilityLabel={`${comment.displayName}: ${comment.body}`} accessibilityHint="Opens options">
      <Avatar url={comment.avatarUrl} name={comment.displayName} size={reply ? 28 : 34} />
      <View style={{ flex: 1 }}>
        <View style={styles.commentHead}>
          <Text variant="subhead" style={{ fontFamily: font.semibold, flexShrink: 1 }} numberOfLines={1}>{comment.displayName}</Text>
          <Text variant="footnote" tone="tertiary">{relativeTime(comment.createdAt)}</Text>
        </View>
        <Text variant="callout" style={{ marginTop: 2, lineHeight: 21 }}>{comment.body}</Text>
      </View>
    </Tap>
  );

  return (
    <View style={styles.screen}>
      <NavHeader title="Post" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.lg }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
          <PostCard post={post} width={width - space.md * 4} onReact={react} onOptions={options} onAuthor={(item) => navigation.navigate('AthletePosts', { userId: item.userId, name: item.displayName })} expanded />
          {failed ? (
            <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.lg }}>Couldn’t load comments. Pull back and open the post again.</Text>
          ) : comments === null ? (
            <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.lg }}>Loading…</Text>
          ) : threads.length === 0 ? (
            <Text variant="callout" tone="secondary" align="center" style={{ marginTop: space.lg }}>No comments yet. Say something.</Text>
          ) : (
            <View style={styles.thread}>
              {threads.map(({ top, replies }) => (
                <View key={top.id}>
                  {line(top, false)}
                  {replies.map((reply) => line(reply, true))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
          {replyTo ? (
            <View style={styles.replying}>
              <Text variant="footnote" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>Replying to {replyTo.displayName}</Text>
              <Tap feedback="opacity" hitSlop={10} onPress={() => setReplyTo(null)} accessibilityRole="button" accessibilityLabel="Stop replying">
                <Icon name="close" size={16} color={color.textSecondary} />
              </Tap>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              ref={input}
              value={draft}
              onChangeText={setDraft}
              placeholder={replyTo ? 'Write a reply' : 'Add a comment'}
              placeholderTextColor={color.textTertiary}
              style={styles.input}
              multiline
              maxLength={300}
              maxFontSizeMultiplier={1.6}
              selectionColor={color.accent}
              accessibilityLabel={replyTo ? 'Reply' : 'Comment'}
            />
            <Tap feedback="opacity" onPress={() => { void send(); }} disabled={!draft.trim() || sending} style={[styles.send, (!draft.trim() || sending) && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel="Send comment">
              <Icon name="send" size={18} color="#000000" />
            </Tap>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  thread: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, paddingHorizontal: space.md, paddingVertical: space.xs },
  comment: { flexDirection: 'row', gap: space.sm, paddingVertical: space.sm },
  reply: { marginLeft: 34 + space.sm },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composer: { paddingHorizontal: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.line, backgroundColor: color.bg },
  replying: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: color.surface, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, color: color.text, fontFamily: font.regular, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
