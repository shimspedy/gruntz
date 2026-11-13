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
};
export type AthleteFailure = 'signed-out' | 'unavailable' | 'not-found' | 'too-many' | 'rate-limited' | 'error';
export type AthleteResult<T> = { ok: true; value: T } | { ok: false; reason: AthleteFailure };

type Row = {
  user_id: string; display_name: string; level: number; rank: string; sessions: number; streak: number;
  week_sessions: number; last_trained_at: string | null; avatar_version: number; is_following: boolean; follows_me: boolean;
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

async function cards(fn: 'search_athletes' | 'list_following' | 'list_followers', args?: Record<string, unknown>): Promise<AthleteResult<Athlete[]>> {
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
export const listFollowing = () => cards('list_following');
export const listFollowers = () => cards('list_followers');

/**
 * Publishes the caller's own card. Called when findability changes and after a workout;
 * a no-op for anyone who has neither made themselves findable nor followed someone.
 */
export async function syncAthleteProfile(force = false): Promise<AthleteResult<null>> {
  const prefs = useReadinessStore.getState();
  if (!force && !prefs.discoverable && !prefs.followsAthletes) return { ok: true, value: null };
  const mine = localTeamStatus();
  const progress = useUserStore.getState().progress;
  const result = await call('upsert_athlete_profile', {
    p_display_name: mine.displayName, p_discoverable: prefs.discoverable, p_sessions: mine.sessions, p_streak: mine.streak,
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
  const result = await syncAthleteProfile(true);
  if (!result.ok) useReadinessStore.getState().setFieldPreference('discoverable', !on);
  return result;
}
