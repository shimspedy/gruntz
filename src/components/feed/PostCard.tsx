import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { REACTIONS, reactionEmoji, type FeedPost, type ReactionKey } from '../../services/feed';
import { relativeTime } from '../../utils/relativeTime';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, font, radius, space } from '../../ui/tokens';

export function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.avatar, round]}>
      {url
        ? <Image source={{ uri: url }} style={round} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
        : <Text style={[styles.initial, { fontSize: Math.round(size * 0.42) }]}>{name.trim().charAt(0).toUpperCase() || '?'}</Text>}
    </View>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The finished workout a post is about: the gym part of the feed, so it gets the weight. */
function WorkoutBlock({ post }: { post: FeedPost }) {
  const w = post.workout;
  if (!w) return null;
  return (
    <View style={styles.workout} accessible accessibilityLabel={`Workout: ${w.title}, ${w.minutes} minutes, ${plural(w.sets, 'set', 'sets')}${w.records ? `, ${plural(w.records, 'record', 'records')}` : ''}`}>
      <View style={styles.workoutIcon}><Icon name="dumbbellFill" size={18} color={color.text} /></View>
      <View style={{ flex: 1 }}>
        <Text variant="headline" numberOfLines={2}>{w.title}</Text>
        <View style={styles.facts}>
          {w.minutes > 0 ? <Text variant="footnote" tone="secondary" tabular>{w.minutes} min</Text> : null}
          {w.sets > 0 ? <Text variant="footnote" tone="secondary" tabular>{plural(w.sets, 'set', 'sets')}</Text> : null}
          {w.records > 0 ? <Text variant="footnote" tabular style={{ color: color.accent, fontFamily: font.semibold }}>{plural(w.records, 'record', 'records')}</Text> : null}
        </View>
      </View>
    </View>
  );
}

type Props = {
  post: FeedPost;
  /** Width of the card's content, for the photo. */
  width: number;
  onReact: (post: FeedPost, reaction: ReactionKey | null) => void;
  onOpen?: (post: FeedPost) => void;
  onOptions: (post: FeedPost) => void;
  /** Tapping the name or photo opens that athlete's posts. */
  onAuthor?: (post: FeedPost) => void;
  /** On the post's own screen the whole body is shown and tapping it does nothing. */
  expanded?: boolean;
};

/** One post: who, what they did, and the two things you can do about it. */
export const PostCard = memo(function PostCard({ post, width, onReact, onOpen, onOptions, onAuthor, expanded }: Props) {
  const [picking, setPicking] = useState(false);
  const counts = REACTIONS.map((r) => ({ ...r, n: post.reactions[r.key] ?? 0 })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n);
  const total = counts.reduce((sum, r) => sum + r.n, 0);
  const choose = (key: ReactionKey) => {
    haptic.selection();
    setPicking(false);
    onReact(post, post.myReaction === key ? null : key);
  };
  const body = (
    <>
      {post.body ? <Text variant="body" style={styles.body} numberOfLines={expanded ? undefined : 8}>{post.body}</Text> : null}
      <WorkoutBlock post={post} />
      {post.photoUrl ? (
        <Image
          source={{ uri: post.photoUrl }}
          style={[styles.photo, { width, height: Math.round(width * 1.1) }]}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`Photo from ${post.displayName}`}
        />
      ) : null}
    </>
  );
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Tap feedback="opacity" onPress={() => onAuthor?.(post)} disabled={!onAuthor} style={styles.author} accessibilityRole="button" accessibilityLabel={`${post.displayName}, level ${post.level} ${post.rank}`} accessibilityHint={onAuthor ? 'Opens their posts' : undefined}>
          <Avatar url={post.avatarUrl} name={post.displayName} />
          <View style={{ flex: 1 }}>
            <Text variant="headline" numberOfLines={1}>{post.displayName}</Text>
            <Text variant="footnote" tone="tertiary" numberOfLines={1}>
              Level {post.level} · {post.rank} · {relativeTime(post.createdAt)}{post.audience === 'followers' ? ' · Followers' : ''}
            </Text>
          </View>
        </Tap>
        <Tap feedback="opacity" hitSlop={10} onPress={() => onOptions(post)} style={styles.more} accessibilityRole="button" accessibilityLabel={`Options for ${post.displayName}'s post`}>
          <Icon name="more" size={20} color={color.textSecondary} />
        </Tap>
      </View>

      {onOpen && !expanded ? (
        <Tap feedback="opacity" onPress={() => onOpen(post)} accessibilityRole="button" accessibilityLabel={`Open ${post.displayName}'s post`}>{body}</Tap>
      ) : body}

      {picking ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)} style={styles.picker} accessibilityRole="menu">
          {REACTIONS.map((r) => (
            <Tap key={r.key} feedback="scale" onPress={() => choose(r.key)} style={[styles.pick, post.myReaction === r.key && styles.pickOn]} accessibilityRole="menuitem" accessibilityLabel={post.myReaction === r.key ? `Take back ${r.label}` : r.label}>
              <Text style={styles.pickEmoji}>{r.emoji}</Text>
            </Tap>
          ))}
        </Animated.View>
      ) : null}

      <View style={styles.foot}>
        <Tap
          feedback="opacity"
          onPress={() => { haptic.light(); setPicking((open) => !open); }}
          style={[styles.action, post.myReaction && styles.actionOn]}
          accessibilityRole="button"
          accessibilityLabel={post.myReaction ? 'Change your reaction' : 'React'}
          accessibilityState={{ expanded: picking }}
        >
          {post.myReaction
            ? <Text style={styles.actionEmoji}>{reactionEmoji(post.myReaction)}</Text>
            : <Icon name="heart" size={18} color={color.textSecondary} />}
          <Text variant="footnote" style={{ color: post.myReaction ? color.text : color.textSecondary, fontFamily: font.semibold }}>
            {post.myReaction ? 'Reacted' : 'React'}
          </Text>
        </Tap>
        <Tap feedback="opacity" onPress={() => onOpen?.(post)} disabled={!onOpen} style={styles.action} accessibilityRole="button" accessibilityLabel={`${plural(post.commentCount, 'comment', 'comments')}. Open comments`}>
          <Icon name="chat" size={18} color={color.textSecondary} />
          <Text variant="footnote" tabular style={{ color: color.textSecondary, fontFamily: font.semibold }}>
            {post.commentCount > 0 ? post.commentCount : 'Comment'}
          </Text>
        </Tap>
        <View style={{ flex: 1 }} />
        {total > 0 ? (
          <View style={styles.tally} accessible accessibilityLabel={plural(total, 'reaction', 'reactions')}>
            <Text style={styles.tallyEmoji}>{counts.slice(0, 3).map((r) => r.emoji).join('')}</Text>
            <Text variant="footnote" tone="secondary" tabular>{total}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderCurve: 'continuous', backgroundColor: color.surface, padding: space.md, marginBottom: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  author: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: { backgroundColor: color.surfaceHigh, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontFamily: font.bold, color: color.text },
  more: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  body: { marginBottom: space.sm, lineHeight: 23 },
  workout: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, borderRadius: radius.md, borderCurve: 'continuous', backgroundColor: color.surfaceHigh, marginBottom: space.sm },
  workoutIcon: { width: 40, height: 40, borderRadius: 12, borderCurve: 'continuous', backgroundColor: color.bg, alignItems: 'center', justifyContent: 'center' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.sm, marginTop: 2 },
  photo: { borderRadius: radius.md, backgroundColor: color.surfaceHigh, marginBottom: space.sm },
  picker: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 4, borderRadius: 24, backgroundColor: color.surfaceHigh, marginBottom: space.sm },
  pick: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pickOn: { backgroundColor: color.bg },
  pickEmoji: { fontSize: 24 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: color.surfaceHigh },
  actionOn: { backgroundColor: color.accentSoft },
  actionEmoji: { fontSize: 16 },
  tally: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tallyEmoji: { fontSize: 14 },
});
