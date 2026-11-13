import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabaseClient';

/**
 * The feed: posts from other athletes, ranked on the server. Signed-in athletes only.
 *
 * Everything goes through server functions that take identity from the session; this
 * file never says who is posting, and only ever names a post or a comment.
 */
export const REACTIONS = [
  { key: 'strong', emoji: '💪', label: 'Strong' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Respect' },
  { key: 'salute', emoji: '🫡', label: 'Salute' },
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'laugh', emoji: '😂', label: 'Funny' },
] as const;
export type ReactionKey = (typeof REACTIONS)[number]['key'];
const REACTION_KEYS = new Set<string>(REACTIONS.map((r) => r.key));
export const reactionEmoji = (key: string | null | undefined): string => REACTIONS.find((r) => r.key === key)?.emoji ?? '';

export type PostKind = 'text' | 'workout' | 'photo';
export type Audience = 'everyone' | 'followers';
export type WorkoutSummary = { title: string; minutes: number; sets: number; records: number };

export type FeedPost = {
  id: string;
  userId: string;
  displayName: string;
  level: number;
  rank: string;
  avatarUrl: string | null;
  kind: PostKind;
  body: string;
  audience: Audience;
  workout: WorkoutSummary | null;
  photoUrl: string | null;
  createdAt: string;
  reactions: Partial<Record<ReactionKey, number>>;
  myReaction: ReactionKey | null;
  commentCount: number;
  isMine: boolean;
  isFollowing: boolean;
};

export type FeedComment = {
  id: string;
  parentId: string | null;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  createdAt: string;
  isMine: boolean;
};

export type FeedFailure = 'signed-out' | 'unavailable' | 'not-found' | 'too-many' | 'rate-limited' | 'no-profile' | 'error';
export type FeedResult<T> = { ok: true; value: T } | { ok: false; reason: FeedFailure };

const fail = (reason: FeedFailure): { ok: false; reason: FeedFailure } => ({ ok: false, reason });
function failureFor(message: string): FeedFailure {
  if (message.includes('NOT_SIGNED_IN')) return 'signed-out';
  if (message.includes('NOT_FOUND')) return 'not-found';
  if (message.includes('TOO_MANY')) return 'too-many';
  if (message.includes('RATE_LIMITED')) return 'rate-limited';
  if (message.includes('NO_PROFILE')) return 'no-profile';
  return 'error';
}

export const FEED_FAILURE: Record<FeedFailure, string> = {
  'signed-out': 'Sign in to use the feed.',
  unavailable: 'The feed is not available in this build.',
  'not-found': 'That post is no longer available.',
  'too-many': 'This post has as many comments as it can hold.',
  'rate-limited': 'That’s a lot in a row. Wait a while, then try again.',
  'no-profile': 'Couldn’t set up your athlete card. Check your connection and try again.',
  error: 'Couldn’t reach Gruntz. Check your connection and try again.',
};

const AVATAR_BUCKET = 'team-avatars';
const PHOTO_BUCKET = 'feed-photos';
const LINK_SECONDS = 60 * 60;
export const PAGE_SIZE = 20;

/** Bumped whenever this phone changes the feed (a new post, a delete, a block), so screens know to reload. */
let changeStamp = 0;
export const feedChangeStamp = (): number => changeStamp;
export const noteFeedChanged = (): void => { changeStamp += 1; };

/** Posts already fetched, so opening one does not need another round trip. */
const cache = new Map<string, FeedPost>();
export const cachedPost = (id: string): FeedPost | undefined => cache.get(id);
export function cachePosts(posts: FeedPost[]): void {
  for (const post of posts) cache.set(post.id, post);
  // Bounded: the oldest entries go first.
  while (cache.size > 200) { const first = cache.keys().next().value; if (first === undefined) break; cache.delete(first); }
}

type PostRow = {
  id: string; user_id: string; display_name: string; level: number; rank: string; avatar_version: number;
  kind: string; body: string; audience: string; workout_title: string | null; workout_minutes: number | null;
  workout_sets: number | null; workout_records: number | null; photo_path: string | null; created_at: string;
  reactions: unknown; my_reaction: string | null; comment_count: number; is_mine: boolean; is_following: boolean;
};

/** Links that expire, for private photos. A failure only costs the pictures. */
async function signedLinks(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  const supabase = getSupabase();
  const wanted = [...new Set(paths)];
  if (!supabase || !wanted.length) return links;
  try {
    const signed = await supabase.storage.from(bucket).createSignedUrls(wanted, LINK_SECONDS);
    for (const item of signed.data ?? []) if (item.signedUrl && item.path) links.set(item.path, item.signedUrl);
  } catch {
    // Posts still read without their pictures.
  }
  return links;
}

function cleanReactions(value: unknown): Partial<Record<ReactionKey, number>> {
  const out: Partial<Record<ReactionKey, number>> = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, n] of Object.entries(value)) {
      if (REACTION_KEYS.has(key) && typeof n === 'number' && Number.isFinite(n) && n > 0) out[key as ReactionKey] = Math.round(n);
    }
  }
  return out;
}

async function toPosts(rows: PostRow[]): Promise<FeedPost[]> {
  const [avatars, photos] = await Promise.all([
    signedLinks(AVATAR_BUCKET, rows.filter((row) => row.avatar_version > 0).map((row) => `${row.user_id}.jpg`)),
    signedLinks(PHOTO_BUCKET, rows.flatMap((row) => (row.photo_path ? [row.photo_path] : []))),
  ]);
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    level: row.level,
    rank: row.rank,
    avatarUrl: avatars.get(`${row.user_id}.jpg`) ?? null,
    kind: row.kind === 'workout' || row.kind === 'photo' ? row.kind : 'text',
    body: row.body ?? '',
    audience: row.audience === 'followers' ? 'followers' : 'everyone',
    workout: row.kind === 'workout' && row.workout_title
      ? { title: row.workout_title, minutes: row.workout_minutes ?? 0, sets: row.workout_sets ?? 0, records: row.workout_records ?? 0 }
      : null,
    photoUrl: row.photo_path ? photos.get(row.photo_path) ?? null : null,
    createdAt: row.created_at,
    reactions: cleanReactions(row.reactions),
    myReaction: row.my_reaction && REACTION_KEYS.has(row.my_reaction) ? (row.my_reaction as ReactionKey) : null,
    commentCount: Math.max(0, Number(row.comment_count) || 0),
    isMine: row.is_mine === true,
    isFollowing: row.is_following === true,
  }));
}

async function call(fn: string, args: Record<string, unknown>): Promise<FeedResult<unknown>> {
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return fail('signed-out');
    const { data, error } = await supabase.rpc(fn, args);
    return error ? fail(failureFor(error.message)) : { ok: true, value: data };
  } catch {
    return fail('error');
  }
}

/** Dev only: sample posts for screenshots and layout checks, shown without a session. */
let demoFeed: { posts: FeedPost[]; comments: Record<string, FeedComment[]> } | null = null;
export function setDemoFeed(demo: typeof demoFeed): void {
  demoFeed = demo;
  if (demo) cachePosts(demo.posts);
  noteFeedChanged();
}
export const hasDemoFeed = (): boolean => __DEV__ && !!demoFeed;

/** One page of the ranked feed. `offset` is how many posts are already on screen. */
export async function fetchFeed(offset: number): Promise<FeedResult<FeedPost[]>> {
  if (__DEV__ && demoFeed) return { ok: true, value: offset === 0 ? demoFeed.posts : [] };
  const result = await call('feed_page', { p_offset: Math.max(0, Math.round(offset)), p_limit: PAGE_SIZE });
  if (!result.ok) return result;
  const posts = await toPosts((result.value ?? []) as PostRow[]);
  cachePosts(posts);
  return { ok: true, value: posts };
}

/** One athlete's posts, newest first. */
export async function fetchAthletePosts(userId: string): Promise<FeedResult<FeedPost[]>> {
  if (__DEV__ && demoFeed) return { ok: true, value: demoFeed.posts.filter((post) => post.userId === userId) };
  const result = await call('feed_by_athlete', { p_user_id: userId });
  if (!result.ok) return result;
  const posts = await toPosts((result.value ?? []) as PostRow[]);
  cachePosts(posts);
  return { ok: true, value: posts };
}

/** Tells the server what was on screen, so the next visit leads with something new. Best effort. */
export function markSeen(ids: string[]): void {
  if (!ids.length) return;
  void call('mark_feed_seen', { p_ids: ids.slice(0, 40) });
}

/** Asks the server to tell the other athlete. Best effort; the server decides who hears and only once. */
function announce(request: { kind: 'comment'; commentId: string } | { kind: 'reaction'; postId: string }): void {
  void import('./pushRequest').then((push) => push.requestPush(request)).catch(() => undefined);
}

export async function setReaction(postId: string, reaction: ReactionKey | null): Promise<FeedResult<null>> {
  const result = await call('set_feed_reaction', { p_post_id: postId, p_emoji: reaction });
  if (result.ok && reaction) announce({ kind: 'reaction', postId });
  return result.ok ? { ok: true, value: null } : result;
}

type CommentRow = { id: string; parent_id: string | null; user_id: string; display_name: string; avatar_version: number; body: string; created_at: string; is_mine: boolean };

export async function fetchComments(postId: string): Promise<FeedResult<FeedComment[]>> {
  if (__DEV__ && demoFeed) return { ok: true, value: demoFeed.comments[postId] ?? [] };
  const result = await call('feed_post_comments', { p_post_id: postId });
  if (!result.ok) return result;
  const rows = (result.value ?? []) as CommentRow[];
  const avatars = await signedLinks(AVATAR_BUCKET, rows.filter((row) => row.avatar_version > 0).map((row) => `${row.user_id}.jpg`));
  return {
    ok: true,
    value: rows.map((row) => ({
      id: row.id, parentId: row.parent_id, userId: row.user_id, displayName: row.display_name,
      avatarUrl: avatars.get(`${row.user_id}.jpg`) ?? null, body: row.body, createdAt: row.created_at, isMine: row.is_mine === true,
    })),
  };
}

/** Everyone who posts or comments is shown by their athlete card; make sure there is one. */
async function ensureCard(): Promise<FeedResult<null>> {
  const { syncAthleteProfile } = await import('./athletes');
  const card = await syncAthleteProfile(true);
  return card.ok ? { ok: true, value: null } : fail(card.reason === 'signed-out' ? 'signed-out' : 'no-profile');
}

export async function addComment(postId: string, parentId: string | null, body: string): Promise<FeedResult<string>> {
  const send = () => call('add_feed_comment', { p_post_id: postId, p_parent_id: parentId, p_body: body.trim().slice(0, 300) });
  let result = await send();
  if (!result.ok && result.reason === 'no-profile') {
    const card = await ensureCard();
    if (!card.ok) return card;
    result = await send();
  }
  if (result.ok) announce({ kind: 'comment', commentId: String(result.value) });
  return result.ok ? { ok: true, value: String(result.value) } : result;
}

export async function deleteComment(commentId: string): Promise<FeedResult<null>> {
  const result = await call('delete_feed_comment', { p_comment_id: commentId });
  return result.ok ? { ok: true, value: null } : result;
}

export async function reportPost(postId: string, reason: string): Promise<FeedResult<null>> {
  const result = await call('report_feed_item', { p_post_id: postId, p_comment_id: null, p_reason: reason });
  return result.ok ? { ok: true, value: null } : result;
}

export async function reportComment(commentId: string, reason: string): Promise<FeedResult<null>> {
  const result = await call('report_feed_item', { p_post_id: null, p_comment_id: commentId, p_reason: reason });
  return result.ok ? { ok: true, value: null } : result;
}

export type NewPost = {
  body: string;
  audience: Audience;
  workout?: WorkoutSummary | null;
  /** A local JPEG, already resized. */
  photoUri?: string | null;
};

/**
 * Publishes a post. A photo post is created first, so the server chooses where the photo
 * goes; it only becomes visible once the upload is confirmed, and is removed if the
 * upload fails.
 */
export async function createPost(post: NewPost): Promise<FeedResult<string>> {
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  const card = await ensureCard();
  if (!card.ok) return card;
  const kind: PostKind = post.photoUri ? 'photo' : post.workout ? 'workout' : 'text';
  const created = await call('create_feed_post', {
    p_kind: kind,
    p_body: post.body.trim().slice(0, 500),
    p_audience: post.audience,
    p_workout_title: kind === 'workout' ? post.workout?.title ?? null : null,
    p_workout_minutes: kind === 'workout' ? Math.round(post.workout?.minutes ?? 0) : null,
    p_workout_sets: kind === 'workout' ? Math.round(post.workout?.sets ?? 0) : null,
    p_workout_records: kind === 'workout' ? Math.round(post.workout?.records ?? 0) : null,
  });
  if (!created.ok) return created;
  const id = String(created.value);
  if (kind !== 'photo' || !post.photoUri) { noteFeedChanged(); return { ok: true, value: id }; }
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) throw new Error('signed out');
    const { File } = await import('expo-file-system');
    const bytes = await new File(post.photoUri).arrayBuffer();
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(`${userId}/${id}.jpg`, bytes, { contentType: 'image/jpeg' });
    if (error) throw error;
    const confirmed = await call('confirm_feed_photo', { p_post_id: id });
    if (!confirmed.ok || confirmed.value !== true) throw new Error('not confirmed');
    noteFeedChanged();
    return { ok: true, value: id };
  } catch {
    // Never leave a photo post without its photo.
    await deletePost(id);
    return fail('error');
  }
}

export async function deletePost(postId: string): Promise<FeedResult<null>> {
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user.id;
    // The photo goes first; if the post has none this removes nothing.
    if (userId) await supabase.storage.from(PHOTO_BUCKET).remove([`${userId}/${postId}.jpg`]).catch(() => undefined);
  } catch {
    // The post itself still goes below.
  }
  const result = await call('delete_feed_post', { p_post_id: postId });
  if (result.ok) { cache.delete(postId); noteFeedChanged(); }
  return result.ok ? { ok: true, value: null } : result;
}

// ─── The last finished workout, offered in the composer ──────────────────────
const LAST_WORKOUT_KEY = '@gruntz_last_workout';
type SavedWorkout = WorkoutSummary & { at: number };

/** Remembered on this phone when a workout is saved, so it can be shared the same day. */
export async function rememberWorkout(summary: WorkoutSummary): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_WORKOUT_KEY, JSON.stringify({ ...summary, at: Date.now() } satisfies SavedWorkout));
  } catch {
    // Sharing a workout is a nicety; the workout itself is already saved.
  }
}

/** The workout finished in the last 18 hours, if any. */
export async function recentWorkout(): Promise<WorkoutSummary | null> {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(LAST_WORKOUT_KEY)) ?? 'null') as Partial<SavedWorkout> | null;
    if (!saved || typeof saved.title !== 'string' || !saved.title.trim() || typeof saved.at !== 'number') return null;
    const age = Date.now() - saved.at;
    if (age < 0 || age > 18 * 60 * 60 * 1000) return null;
    const count = (n: unknown, max: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n))) : 0);
    return { title: saved.title.trim().slice(0, 80), minutes: count(saved.minutes, 1440), sets: count(saved.sets, 1000), records: count(saved.records, 100) };
  } catch {
    return null;
  }
}
