import { useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { getSupabase } from './supabaseClient';
import { requestPush } from './pushRequest';
import { localTeamStatus } from './teams';

/**
 * Following other athletes: no code and no team needed.
 *
 * A profile can be found only after its owner switches "Let athletes find me" on. What
 * a follower sees is the same handful of numbers a teammate sees, plus level and rank.
 * Every call goes through a database function that takes identity from the session.
 */
export type Athlete = {
  userId: string;
  displayName: string;
  level: number;
  rank: string;
  sessions: number;
  streak: number;
  weekSessions: number;
  lastTrainedAt: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  followsMe: boolean;
  /** Only on suggestions: why this athlete is shown. */
  reason?: SuggestionReason;
};
export type SuggestionReason = 'follows-you' | 'teammate' | 'active' | 'new';
const REASONS = new Set<string>(['follows-you', 'teammate', 'active', 'new']);
export type AthleteFailure = 'signed-out' | 'unavailable' | 'not-found' | 'too-many' | 'rate-limited' | 'error';
export type AthleteResult<T> = { ok: true; value: T } | { ok: false; reason: AthleteFailure };

type Row = {
  user_id: string; display_name: string; level: number; rank: string; sessions: number; streak: number;
  week_sessions: number; last_trained_at: string | null; avatar_version: number; is_following: boolean; follows_me: boolean;
  reason?: string;
};

const fail = (reason: AthleteFailure): { ok: false; reason: AthleteFailure } => ({ ok: false, reason });
function failureFor(message: string): AthleteFailure {
  if (message.includes('NOT_SIGNED_IN')) return 'signed-out';
  if (message.includes('NOT_FOUND')) return 'not-found';
  if (message.includes('TOO_MANY')) return 'too-many';
  if (message.includes('RATE_LIMITED')) return 'rate-limited';
  return 'error';
}

const AVATAR_BUCKET = 'team-avatars';
const AVATAR_LINK_SECONDS = 60 * 60;

async function cards(fn: 'search_athletes' | 'list_following' | 'list_followers' | 'suggested_athletes', args?: Record<string, unknown>): Promise<AthleteResult<Athlete[]>> {
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return fail('signed-out');
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return fail(failureFor(error.message));
    const rows = (data ?? []) as Row[];
    // Photos are read through links that expire; a failure here only costs the pictures.
    const links = new Map<string, string>();
    const withPhotos = rows.filter((row) => row.avatar_version > 0).map((row) => `${row.user_id}.jpg`);
    if (withPhotos.length) {
      const signed = await supabase.storage.from(AVATAR_BUCKET).createSignedUrls(withPhotos, AVATAR_LINK_SECONDS);
      for (const item of signed.data ?? []) if (item.signedUrl && item.path) links.set(item.path, item.signedUrl);
    }
    return {
      ok: true,
      value: rows.map((row) => ({
        userId: row.user_id, displayName: row.display_name, level: row.level, rank: row.rank, sessions: row.sessions, streak: row.streak,
        weekSessions: row.week_sessions, lastTrainedAt: row.last_trained_at, avatarUrl: links.get(`${row.user_id}.jpg`) ?? null,
        isFollowing: row.is_following, followsMe: row.follows_me,
        ...(row.reason && REASONS.has(row.reason) ? { reason: row.reason as SuggestionReason } : {}),
      })),
    };
  } catch {
    return fail('error');
  }
}

async function call(fn: string, args: Record<string, unknown>): Promise<AthleteResult<unknown>> {
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data, error } = await supabase.rpc(fn, args);
    return error ? fail(failureFor(error.message)) : { ok: true, value: data };
  } catch {
    return fail('error');
  }
}

export const searchAthletes = (query: string) => cards('search_athletes', { p_query: query.trim().slice(0, 40) });
/** Findable athletes worth following, with why each one is suggested. */
export const suggestedAthletes = () => cards('suggested_athletes');
export const listFollowing = () => cards('list_following');
export const listFollowers = () => cards('list_followers');

/**
 * Publishes the caller's own card. Called when findability changes and after a workout;
 * a no-op for anyone who has neither made themselves findable nor followed someone.
 *
 * Findability itself is only ever sent by the switch (`setDiscoverable`). Every other
 * sync sends null, which the server reads as "leave it as it is": a switch left on in a
 * restored backup or on another phone must not make the athlete findable again.
 */
export async function syncAthleteProfile(force = false, discoverable: boolean | null = null): Promise<AthleteResult<null>> {
  const prefs = useReadinessStore.getState();
  if (!force && !prefs.discoverable && !prefs.followsAthletes) return { ok: true, value: null };
  const mine = localTeamStatus();
  const progress = useUserStore.getState().progress;
  const result = await call('upsert_athlete_profile', {
    p_display_name: mine.displayName, p_discoverable: discoverable, p_sessions: mine.sessions, p_streak: mine.streak,
    p_level: progress.current_level, p_rank: progress.current_rank,
  });
  return result.ok ? { ok: true, value: null } : result;
}

/** Follows in one tap. The follower needs a card of their own so the other side sees a name. */
export async function followAthlete(userId: string): Promise<AthleteResult<null>> {
  useReadinessStore.getState().setFieldPreference('followsAthletes', true);
  const profile = await syncAthleteProfile(true);
  if (!profile.ok) return profile;
  const result = await call('follow_athlete', { p_user_id: userId });
  if (!result.ok) return result;
  if (result.value === true) void requestPush({ kind: 'follow', userId });
  return { ok: true, value: null };
}

export async function unfollowAthlete(userId: string): Promise<AthleteResult<null>> {
  const result = await call('unfollow_athlete', { p_user_id: userId });
  return result.ok ? { ok: true, value: null } : result;
}

/** Cuts both follows and hides each athlete from the other. */
export async function blockAthlete(userId: string): Promise<AthleteResult<null>> {
  const result = await call('block_athlete', { p_user_id: userId });
  return result.ok ? { ok: true, value: null } : result;
}

export async function reportAthlete(userId: string, reason: string): Promise<AthleteResult<null>> {
  const result = await call('report_athlete', { p_user_id: userId, p_reason: reason });
  return result.ok ? { ok: true, value: null } : result;
}

/** Turning findability on or off takes effect on the server at once. Off also drops existing followers. */
export async function setDiscoverable(on: boolean): Promise<AthleteResult<null>> {
  useReadinessStore.getState().setFieldPreference('discoverable', on);
  const result = await syncAthleteProfile(true, on);
  if (!result.ok) useReadinessStore.getState().setFieldPreference('discoverable', !on);
  return result;
}

/**
 * Sets this phone's two athlete switches from what the server holds. Run after sign-in:
 * sign-out resets the switches, a second phone never had them, and a restore must not
 * decide them. On any failure the switches are left alone.
 */
export async function reconcileAthleteSettings(): Promise<void> {
  const result = await call('my_athlete_settings', {});
  if (!result.ok) return;
  const row: unknown = Array.isArray(result.value) ? result.value[0] : result.value;
  if (!row || typeof row !== 'object') return;
  const { discoverable, following } = row as { discoverable?: unknown; following?: unknown };
  if (typeof discoverable !== 'boolean' || typeof following !== 'boolean') return;
  const prefs = useReadinessStore.getState();
  if (prefs.discoverable !== discoverable) prefs.setFieldPreference('discoverable', discoverable);
  if (prefs.followsAthletes !== following) prefs.setFieldPreference('followsAthletes', following);
}

// ─── Profiles ───────────────────────────────────────────────────────────────
/**
 * One athlete's profile as the server lets this viewer see it. Training numbers and
 * counts are null for an athlete who is not findable and has no follow with the viewer.
 */
export type AthleteProfile = {
  userId: string;
  displayName: string;
  level: number;
  rank: string;
  bio: string;
  avatarUrl: string | null;
  sessions: number | null;
  streak: number | null;
  weekSessions: number | null;
  lastTrainedAt: string | null;
  postCount: number;
  followerCount: number | null;
  followingCount: number | null;
  isMe: boolean;
  isFollowing: boolean;
  followsMe: boolean;
  /** Findable, so a Follow button can work. */
  followable: boolean;
  discoverable: boolean;
};

type ProfileRow = {
  user_id: string; display_name: string; level: number; rank: string; bio: string | null; avatar_version: number;
  sessions: number | null; streak: number | null; week_sessions: number | null; last_trained_at: string | null;
  post_count: number; follower_count: number | null; following_count: number | null;
  is_me: boolean; is_following: boolean; follows_me: boolean; followable: boolean; discoverable: boolean;
};

const count = (n: unknown): number | null => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : null);

/** Dev only: a stand-in profile for screenshots, set alongside the demo feed. */
let demoProfiles: Record<string, AthleteProfile> | null = null;
export function setDemoProfiles(profiles: typeof demoProfiles): void { demoProfiles = profiles; }

/** `null` is the signed-in athlete's own profile. */
export async function fetchAthleteProfile(userId: string | null): Promise<AthleteResult<AthleteProfile>> {
  if (__DEV__ && demoProfiles) {
    const demo = demoProfiles[userId ?? 'me'];
    return demo ? { ok: true, value: demo } : fail('not-found');
  }
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return fail('signed-out');
    let { data, error } = await supabase.rpc('athlete_profile', { p_user_id: userId });
    // Your own page needs a card; make one the first time and ask again.
    if (error && userId === null && error.message.includes('NOT_FOUND')) {
      const card = await syncAthleteProfile(true);
      if (!card.ok) return card;
      ({ data, error } = await supabase.rpc('athlete_profile', { p_user_id: null }));
    }
    if (error) return fail(failureFor(error.message));
    const row = (Array.isArray(data) ? data[0] : data) as ProfileRow | undefined;
    if (!row) return fail('not-found');
    let avatarUrl: string | null = null;
    if (row.avatar_version > 0) {
      const signed = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(`${row.user_id}.jpg`, AVATAR_LINK_SECONDS).catch(() => null);
      avatarUrl = signed?.data?.signedUrl ?? null;
    }
    return {
      ok: true,
      value: {
        userId: row.user_id, displayName: row.display_name, level: row.level, rank: row.rank, bio: row.bio ?? '', avatarUrl,
        sessions: count(row.sessions), streak: count(row.streak), weekSessions: count(row.week_sessions), lastTrainedAt: row.last_trained_at,
        postCount: count(row.post_count) ?? 0, followerCount: count(row.follower_count), followingCount: count(row.following_count),
        isMe: row.is_me === true, isFollowing: row.is_following === true, followsMe: row.follows_me === true,
        followable: row.followable === true, discoverable: row.discoverable === true,
      },
    };
  } catch {
    return fail('error');
  }
}

export const BIO_MAX = 150;

/** Saves the caller's bio and returns it as the server stored it. */
export async function setAthleteBio(bio: string): Promise<AthleteResult<string>> {
  const card = await syncAthleteProfile(true);
  if (!card.ok) return card;
  const result = await call('set_athlete_bio', { p_bio: bio.slice(0, BIO_MAX) });
  return result.ok ? { ok: true, value: typeof result.value === 'string' ? result.value : '' } : result;
}
