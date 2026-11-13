import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { blockAthlete, followAthlete, unfollowAthlete } from '../services/athletes';
import { deletePost, FEED_FAILURE, noteFeedChanged, reportPost, type FeedPost } from '../services/feed';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';

type Change = { kind: 'removed'; post: FeedPost } | { kind: 'author-removed'; userId: string } | { kind: 'following'; userId: string; on: boolean };

/**
 * The three-dot menu on a post. Your own post can be deleted; someone else's can be
 * followed or unfollowed, reported, or its author blocked. Nothing destructive is one tap
 * from the feed.
 */
export function usePostActions(onChange: (change: Change) => void) {
  return (post: FeedPost) => {
    haptic.light();
    const failed = (reason: keyof typeof FEED_FAILURE | string) => { haptic.warning(); toast(FEED_FAILURE[reason as keyof typeof FEED_FAILURE] ?? FEED_FAILURE.error, { tone: 'error', icon: 'alert' }); };
    const remove = () => Alert.alert('Delete this post?', 'Its comments and reactions go with it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deletePost(post.id).then((r) => { if (r.ok) { toast('Post deleted'); onChange({ kind: 'removed', post }); } else failed(r.reason); }); } },
    ]);
    const report = () => Alert.alert('Report this post?', 'The post goes to Gruntz for review. You can also block the athlete.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => { void reportPost(post.id, 'Reported from the feed').then((r) => { if (r.ok) { toast('Reported. Thank you.'); onChange({ kind: 'removed', post }); } else failed(r.reason); }); } },
    ]);
    const block = () => Alert.alert(`Block ${post.displayName}?`, 'Neither of you will see the other’s posts or comments, and any follow between you is removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => { void blockAthlete(post.userId).then((r) => { if (r.ok) { noteFeedChanged(); toast(`${post.displayName} blocked`); onChange({ kind: 'author-removed', userId: post.userId }); } else failed('error'); }); } },
    ]);
    const follow = () => { void followAthlete(post.userId).then((r) => { if (r.ok) { haptic.success(); toast(`Following ${post.displayName}`); onChange({ kind: 'following', userId: post.userId, on: true }); } else failed(r.reason === 'not-found' ? 'error' : r.reason); }); };
    const unfollow = () => { void unfollowAthlete(post.userId).then((r) => { if (r.ok) { toast(`Unfollowed ${post.displayName}`); onChange({ kind: 'following', userId: post.userId, on: false }); } else failed('error'); }); };

    const actions: { label: string; run: () => void; destructive?: boolean }[] = post.isMine
      ? [{ label: 'Delete post', run: remove, destructive: true }]
      : [post.isFollowing ? { label: 'Unfollow', run: unfollow } : { label: `Follow ${post.displayName}`, run: follow }, { label: 'Report', run: report }, { label: 'Block', run: block, destructive: true }];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...actions.map((a) => a.label), 'Cancel'], destructiveButtonIndex: actions.length - 1, cancelButtonIndex: actions.length, userInterfaceStyle: 'dark' },
        (i) => actions[i]?.run(),
      );
      return;
    }
    Alert.alert(post.displayName, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.run, ...(a.destructive ? { style: 'destructive' as const } : {}) })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
}

/** Applies a menu outcome to a list of posts already on screen. */
export function applyPostChange(posts: FeedPost[], change: Change): FeedPost[] {
  if (change.kind === 'removed') return posts.filter((item) => item.id !== change.post.id);
  if (change.kind === 'author-removed') return posts.filter((item) => item.userId !== change.userId);
  return posts.map((item) => (item.userId === change.userId ? { ...item, isFollowing: change.on } : item));
}

/** A reaction shown at once; the caller sends it and puts the old one back if that fails. */
export function withReaction(post: FeedPost, next: FeedPost['myReaction']): FeedPost {
  const reactions = { ...post.reactions };
  if (post.myReaction) reactions[post.myReaction] = Math.max(0, (reactions[post.myReaction] ?? 1) - 1);
  if (next) reactions[next] = (reactions[next] ?? 0) + 1;
  return { ...post, reactions, myReaction: next };
}
