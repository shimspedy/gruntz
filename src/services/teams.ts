import { calculateDailyReadiness, getTodaysCheckIn, useReadinessStore } from '../store/useReadinessStore';
import { useUserStore } from '../store/useUserStore';
import { getSupabase } from './supabaseClient';

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
};

export type Team = {
  id: string;
  name: string;
  inviteCode: string;
  isLeader: boolean;
  members: TeamMember[];
};

export type TeamFailure = 'signed-out' | 'unavailable' | 'not-found' | 'full' | 'already-in-team' | 'error';
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
  if (message.includes('NOT_SIGNED_IN')) return 'signed-out';
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

let demoTeam: Team | null = null;
/** Dev-only: a roster to show without an account, for App Store screenshots. */
export function setDemoTeam(team: Team | null) {
  if (__DEV__) demoTeam = team;
}

/** The caller's team and roster, or `null` when they are not in one. */
export async function fetchMyTeam(): Promise<TeamResult<Team | null>> {
  if (__DEV__ && demoTeam) return { ok: true, value: demoTeam };
  const user = await signedInUserId();
  if (!user.ok) return user;
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    // Row-level security returns only the caller's own team, so no filter is needed
    // and none could widen the result.
    const { data: team, error: teamError } = await supabase.from('teams').select('id, name, invite_code').maybeSingle();
    if (teamError) return fail('error');
    if (!team) {
      useReadinessStore.getState().setTeam('', '');
      return { ok: true, value: null };
    }
    const { data: rows, error: rosterError } = await supabase
      .from('team_members')
      .select('user_id, display_name, role, sessions, streak, status, updated_at')
      .order('role', { ascending: true })
      .order('display_name', { ascending: true });
    if (rosterError) return fail('error');
    const members: TeamMember[] = (rows ?? []).map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      role: row.role === 'leader' ? 'leader' : 'member',
      sessions: row.sessions ?? 0,
      streak: row.streak ?? 0,
      status: (['green', 'amber', 'red'] as const).includes(row.status) ? row.status : 'unknown',
      updatedAt: row.updated_at,
      isMe: row.user_id === user.value,
    }));
    // Cached so a finished workout knows whether there is a team to update without asking the network.
    useReadinessStore.getState().setTeam(team.name, team.invite_code);
    return {
      ok: true,
      value: {
        id: team.id,
        name: team.name,
        inviteCode: team.invite_code,
        isLeader: members.some((member) => member.isMe && member.role === 'leader'),
        members,
      },
    };
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
export const joinTeam = (code: string) => call('join_team', { p_code: code.trim().toUpperCase(), p_display_name: localTeamStatus().displayName });
export const removeTeamMember = (userId: string) => call('remove_team_member', { p_user_id: userId });

export async function leaveTeam(): Promise<TeamResult<null>> {
  const result = await call('leave_team');
  if (result.ok) useReadinessStore.getState().setTeam('', '');
  return result;
}

/** Publish the caller's three numbers. A no-op for anyone not in a team. */
export async function syncTeamStatus(): Promise<TeamResult<null>> {
  if (!useReadinessStore.getState().teamCode) return { ok: true, value: null };
  const mine = localTeamStatus();
  return call('update_team_status', { p_sessions: mine.sessions, p_streak: mine.streak, p_status: mine.status, p_display_name: mine.displayName });
}
