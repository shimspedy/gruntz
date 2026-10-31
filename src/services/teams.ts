import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useTeamInboxStore } from '../store/useTeamInboxStore';
import { useUserStore } from '../store/useUserStore';
import { getSupabase } from './supabaseClient';
import { useChromePrefs } from '../store/useUiStore';
import { loadProfilePhotoLocation } from './profilePhoto';

/**
 * Teams ("Leader tools"): a leader creates a team, athletes join with its invite code,
 * and the roster shows session count, streak and a readiness colour for each of them.
 *
 * Nothing else is ever sent. The three numbers are computed here from local state, so
 * there is one place to audit what leaves the phone.
 */
export type TeamStatus = 'green' | 'amber' | 'red' | 'unknown';

export type TeamMember = {
  userId: string;
  displayName: string;
  role: 'leader' | 'member';
  sessions: number;
  streak: number;
  status: TeamStatus;
  updatedAt: string;
  isMe: boolean;
  /** A short-lived link to the member's photo; null when they have none. Your own row uses the local photo. */
  avatarUrl: string | null;
};

export type Team = {
  id: string;
  name: string;
  inviteCode: string;
  isLeader: boolean;
  /** Listed for anyone to find and join; otherwise invite code only. */
  isPublic: boolean;
  description: string;
  members: TeamMember[];
};

/** A public team as a stranger sees it: no code, no roster. */
export type PublicTeam = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isMember: boolean;
};

export type TeamFailure = 'signed-out' | 'unavailable' | 'not-found' | 'full' | 'already-in-team' | 'too-many-teams' | 'rate-limited' | 'error';
/** How many teams one athlete may belong to; matches the database rule. */
export const MAX_TEAMS = 10;
export type TeamResult<T> = { ok: true; value: T } | { ok: false; reason: TeamFailure };

const fail = (reason: TeamFailure): { ok: false; reason: TeamFailure } => ({ ok: false, reason });

/** The readiness colour a team sees. No check-in today is "unknown", never a guessed green. */
export function teamStatusFromReadiness(readiness: number | null): TeamStatus {
  if (readiness === null) return 'unknown';
  return readiness >= 75 ? 'green' : readiness >= 50 ? 'amber' : 'red';
}

/** Exactly what is shared, built from local state. */
export function localTeamStatus(): { sessions: number; streak: number; status: TeamStatus; displayName: string } {
  const { progress, profile } = useUserStore.getState();
  const today = getTodaysCheckIn(useReadinessStore.getState().checkIns);
  return {
    sessions: progress.workouts_completed,
    streak: progress.streak_days,
    status: teamStatusFromReadiness(today ? calculateDailyReadiness(today) : null),
    displayName: profile?.display_name?.trim() || 'Athlete',
  };
}

function failureFor(message: string | undefined): TeamFailure {
  if (!message) return 'error';
  if (message.includes('TEAM_NOT_FOUND')) return 'not-found';
  if (message.includes('TEAM_FULL')) return 'full';
  if (message.includes('ALREADY_IN_TEAM')) return 'already-in-team';
  if (message.includes('TOO_MANY_TEAMS')) return 'too-many-teams';
  if (message.includes('NOT_SIGNED_IN')) return 'signed-out';
  if (message.includes('RATE_LIMITED')) return 'rate-limited';
  return 'error';
}

async function signedInUserId(): Promise<TeamResult<string>> {
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    return userId ? { ok: true, value: userId } : fail('signed-out');
  } catch {
    return fail('error');
  }
}

let demoTeams: Team[] | null = null;
/** Dev-only: rosters to show without an account, for App Store screenshots. */
export function setDemoTeams(teams: Team[] | null) {
  demoTeams = teams;
  useReadinessStore.getState().setTeam(teams?.[0]?.name ?? '', teams?.[0]?.inviteCode ?? '', teams?.length ?? 0);
  useTeamInboxStore.getState().setTeamIds(teams?.map((team) => team.id) ?? []);
}

/** The caller's team and roster, or `null` when they are not in one. */
export async function fetchMyTeams(): Promise<TeamResult<Team[]>> {
  if (__DEV__ && demoTeams) return { ok: true, value: demoTeams };
  const user = await signedInUserId();
  if (!user.ok) return user;
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    // Row-level security returns only the caller's own teams, so no filter is needed
    // and none could widen the result.
    const { data: teams, error: teamError } = await supabase.from('teams').select('id, name, invite_code, is_public, description').order('name', { ascending: true });
    if (teamError) return fail('error');
    if (!teams?.length) {
      useReadinessStore.getState().setTeam('', '', 0);
      useTeamInboxStore.getState().setTeamIds([]);
      return { ok: true, value: [] };
    }
    const { data: rows, error: rosterError } = await supabase
      .from('team_members')
      .select('team_id, user_id, display_name, role, sessions, streak, status, updated_at, avatar_version')
      .order('role', { ascending: true })
      .order('display_name', { ascending: true });
    if (rosterError) return fail('error');
    // Photos are read through links that expire; a failure here only costs the pictures.
    const withPhotos = [...new Set((rows ?? []).filter((row) => row.user_id !== user.value && (row.avatar_version ?? 0) > 0).map((row) => row.user_id))];
    const links = new Map<string, string>();
    if (withPhotos.length) {
      const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrls(withPhotos.map(avatarPath), AVATAR_LINK_SECONDS);
      for (const item of data ?? []) if (item.signedUrl && item.path) links.set(item.path, item.signedUrl);
    }
    const value: Team[] = teams.map((team) => {
      const members: TeamMember[] = (rows ?? []).filter((row) => row.team_id === team.id).map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        role: row.role === 'leader' ? 'leader' : 'member',
        sessions: row.sessions ?? 0,
        streak: row.streak ?? 0,
        status: (['green', 'amber', 'red'] as const).includes(row.status) ? row.status : 'unknown',
        updatedAt: row.updated_at,
        isMe: row.user_id === user.value,
        avatarUrl: links.get(avatarPath(row.user_id)) ?? null,
      }));
      return { id: team.id, name: team.name, inviteCode: team.invite_code, isLeader: members.some((m) => m.isMe && m.role === 'leader'), isPublic: team.is_public === true, description: team.description ?? '', members };
    });
    // Cached so a finished workout knows whether there is a team to update without asking the network.
    useReadinessStore.getState().setTeam(value[0].name, value[0].inviteCode, value.length);
    useTeamInboxStore.getState().setTeamIds(value.map((team) => team.id));
    return { ok: true, value };
  } catch {
    return fail('error');
  }
}

async function call(fn: string, args?: Record<string, unknown>): Promise<TeamResult<null>> {
  const user = await signedInUserId();
  if (!user.ok) return user;
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { error } = await supabase.rpc(fn, args);
    return error ? fail(failureFor(error.message)) : { ok: true, value: null };
  } catch {
    return fail('error');
  }
}

export const createTeam = (name: string) => call('create_team', { p_name: name.trim(), p_display_name: localTeamStatus().displayName });
/** A wrong code comes back as no team rather than an error, so the server can count the miss. */
export async function joinTeam(code: string): Promise<TeamResult<null>> {
  const user = await signedInUserId();
  if (!user.ok) return user;
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data, error } = await supabase.rpc('join_team', { p_code: code.trim().toUpperCase(), p_display_name: localTeamStatus().displayName });
    if (error) return fail(failureFor(error.message));
    return data ? { ok: true, value: null } : fail('not-found');
  } catch {
    return fail('error');
  }
}

/** Leader only: replaces the invite code, so the old one stops working. */
export const rotateInviteCode = (teamId: string) => call('rotate_team_invite_code', { p_team_id: teamId });
export const removeTeamMember = (teamId: string, userId: string) => call('remove_team_member', { p_team_id: teamId, p_user_id: userId });
export const joinPublicTeam = (teamId: string) => call('join_public_team', { p_team_id: teamId, p_display_name: localTeamStatus().displayName });
export const setTeamVisibility = (teamId: string, isPublic: boolean, description: string) => call('set_team_visibility', { p_team_id: teamId, p_public: isPublic, p_description: description.trim().slice(0, 200) });

let demoPublicTeams: PublicTeam[] | null = null;
export function setDemoPublicTeams(teams: PublicTeam[] | null) {
  demoPublicTeams = teams;
}

/** Public teams matching a search, biggest first. Fifty at most; the search narrows it. */
export async function fetchPublicTeams(query: string): Promise<TeamResult<PublicTeam[]>> {
  if (__DEV__ && demoPublicTeams) {
    const q = query.trim().toLowerCase();
    return { ok: true, value: demoPublicTeams.filter((t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) };
  }
  const user = await signedInUserId();
  if (!user.ok) return user;
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { data, error } = await supabase.rpc('list_public_teams', { p_query: query.trim().slice(0, 60) });
    if (error) return fail('error');
    const rows = (data ?? []) as { id: string; name: string; description: string; member_count: number | string; is_member: boolean }[];
    return { ok: true, value: rows.map((row) => ({ id: row.id, name: row.name, description: row.description ?? '', memberCount: Number(row.member_count) || 0, isMember: row.is_member === true })) };
  } catch {
    return fail('error');
  }
}

export async function leaveTeam(teamId: string): Promise<TeamResult<null>> {
  // The last team to go takes the photo with it, before the row does: afterwards the
  // storage policy no longer lets the caller delete.
  if (useReadinessStore.getState().teamCount <= 1) await removeTeamAvatar();
  const result = await call('leave_team', { p_team_id: teamId });
  if (result.ok) {
    const { teamCount } = useReadinessStore.getState();
    if (teamCount <= 1) useReadinessStore.getState().setTeam('', '', 0);
    useTeamInboxStore.getState().setTeamIds(useTeamInboxStore.getState().teamIds.filter((id) => id !== teamId));
  }
  return result;
}

/** Publish the caller's three numbers. A no-op for anyone not in a team. */
export async function syncTeamStatus(): Promise<TeamResult<null>> {
  if (!useReadinessStore.getState().teamCount) return { ok: true, value: null };
  const mine = localTeamStatus();
  const result = await call('update_team_status', { p_sessions: mine.sessions, p_streak: mine.streak, p_status: mine.status, p_display_name: mine.displayName });
  if (result.ok) await syncTeamAvatar();
  return result;
}

const AVATAR_BUCKET = 'team-avatars';
const AVATAR_LINK_SECONDS = 60 * 60;
const avatarPath = (userId: string) => `${userId}.jpg`;

/**
 * Keeps the photo teammates see in step with the one on this phone. Nothing is
 * uploaded outside a team, and a photo set before joining goes up on the first
 * status sync after joining. Removing the photo takes it down again.
 */
export async function syncTeamAvatar(): Promise<void> {
  const prefs = useChromePrefs.getState();
  if (!useReadinessStore.getState().teamCount || prefs.profilePhotoFile === prefs.teamAvatarSynced) return;
  const user = await signedInUserId();
  const supabase = getSupabase();
  if (!user.ok || !supabase) return;
  const path = avatarPath(user.value);
  try {
    if (prefs.profilePhotoFile) {
      const uri = await loadProfilePhotoLocation();
      if (!uri) return;
      const { File } = await import('expo-file-system');
      const bytes = await new File(uri).arrayBuffer();
      const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { error: rpcError } = await supabase.rpc('set_team_avatar_version', { p_version: Math.floor(Date.now() / 1000) });
      if (rpcError) throw rpcError;
      useChromePrefs.getState().setTeamAvatarSynced(prefs.profilePhotoFile);
    } else {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      const { error } = await supabase.rpc('set_team_avatar_version', { p_version: 0 });
      if (error) throw error;
      useChromePrefs.getState().setTeamAvatarSynced(null);
    }
  } catch (error) {
    // Tried again on the next status sync.
    if (__DEV__) console.warn('[teams] avatar sync failed', error);
  }
}

/** Best effort on the way out: teammates lose read access anyway once the row is gone. */
async function removeTeamAvatar(): Promise<void> {
  const user = await signedInUserId();
  const supabase = getSupabase();
  if (!user.ok || !supabase) return;
  await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(user.value)]).catch(() => undefined);
  useChromePrefs.getState().setTeamAvatarSynced(null);
}
