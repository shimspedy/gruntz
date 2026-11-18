import { getSupabase } from './supabaseClient';
import { REACTIONS, type PostKind, type ReactionKey } from './feed';

/**
 * Activity: new followers, reactions on your posts, comments on them and replies to
 * your comments, newest first. Signed-in athletes only; the server decides what each
 * athlete may see and skips anyone either side has blocked.
 */
export type ActivityKind = 'follow' | 'reaction' | 'comment' | 'reply';

export type ActivityItem = {
  /** Stable for lists: the server has no single id across the four kinds. */
  key: string;
  kind: ActivityKind;
  actorId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  postId: string | null;
  commentId: string | null;
  reaction: ReactionKey | null;
  body: string;
  /** The workout title or the first words of the post the item is about. */
  postPreview: string;
  postKind: PostKind | null;
  isFollowing: boolean;
  actorFollowable: boolean;
  unread: boolean;
};

export type ActivityResult<T> = { ok: true; value: T } | { ok: false; reason: 'signed-out' | 'unavailable' | 'error' };

type Row = {
  kind: string; actor_id: string; display_name: string; avatar_version: number; created_at: string;
  post_id: string | null; comment_id: string | null; emoji: string | null; body: string | null;
  post_preview: string | null; post_kind: string | null; is_following: boolean; actor_followable: boolean; unread: boolean;
};

const KINDS = new Set<string>(['follow', 'reaction', 'comment', 'reply']);
const REACTION_KEYS = new Set<string>(REACTIONS.map((r) => r.key));
const AVATAR_BUCKET = 'team-avatars';
export const ACTIVITY_PAGE_SIZE = 30;

/** Dev only: sample items for screenshots, shown without a session. */
let demo: ActivityItem[] | null = null;
export function setDemoActivity(items: ActivityItem[] | null): void { demo = items; }

/** Pure row mapping, kept apart so it can be tested without a network. */
export function toActivityItems(rows: Row[], avatars: Map<string, string>): ActivityItem[] {
  return rows.filter((row) => KINDS.has(row.kind) && typeof row.actor_id === 'string').map((row) => ({
    key: `${row.kind}:${row.actor_id}:${row.comment_id ?? row.post_id ?? ''}:${row.created_at}`,
    kind: row.kind as ActivityKind,
    actorId: row.actor_id,
    displayName: row.display_name || 'Athlete',
    avatarUrl: row.avatar_version > 0 ? avatars.get(`${row.actor_id}.jpg`) ?? null : null,
    createdAt: row.created_at,
    postId: row.post_id,
    commentId: row.comment_id,
    reaction: row.emoji && REACTION_KEYS.has(row.emoji) ? (row.emoji as ReactionKey) : null,
    body: (row.body ?? '').trim(),
    postPreview: (row.post_preview ?? '').trim(),
    postKind: row.post_kind === 'workout' || row.post_kind === 'photo' || row.post_kind === 'text' ? row.post_kind : null,
    isFollowing: row.is_following === true,
    actorFollowable: row.actor_followable === true,
    unread: row.unread === true,
  }));
}

/** One page of activity; pass what is already on screen for the next one. */
export async function fetchActivity(onScreen: ActivityItem[] = []): Promise<ActivityResult<ActivityItem[]>> {
  if (__DEV__ && demo) return { ok: true, value: onScreen.length ? [] : demo };
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'unavailable' };
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return { ok: false, reason: 'signed-out' };
    const before = onScreen.length ? onScreen[onScreen.length - 1].createdAt : null;
    const { data, error } = await supabase.rpc('my_activity', { p_before: before });
    if (error) return { ok: false, reason: 'error' };
    const rows = (data ?? []) as Row[];
    const avatars = new Map<string, string>();
    const wanted = [...new Set(rows.filter((row) => row.avatar_version > 0).map((row) => `${row.actor_id}.jpg`))];
    if (wanted.length) {
      // A failure here only costs the pictures.
      const signed = await supabase.storage.from(AVATAR_BUCKET).createSignedUrls(wanted, 60 * 60).catch(() => null);
      for (const item of signed?.data ?? []) if (item.signedUrl && item.path) avatars.set(item.path, item.signedUrl);
    }
    return { ok: true, value: toActivityItems(rows, avatars) };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/** How many items arrived since Activity was last opened; 0 on any failure. */
export async function unreadActivityCount(): Promise<number> {
  if (__DEV__ && demo) return demo.filter((item) => item.unread).length;
  const supabase = getSupabase();
  if (!supabase) return 0;
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return 0;
    const { data, error } = await supabase.rpc('activity_unread_count');
    return error || typeof data !== 'number' ? 0 : Math.max(0, Math.min(99, Math.round(data)));
  } catch {
    return 0;
  }
}

/** Clears the badge. Best effort: if it fails the badge simply shows again next time. */
export function markActivitySeen(): void {
  if (__DEV__ && demo) { demo = demo.map((item) => ({ ...item, unread: false })); return; }
  const supabase = getSupabase();
  if (!supabase) return;
  void Promise.resolve(supabase.rpc('mark_activity_seen')).catch(() => undefined);
}
