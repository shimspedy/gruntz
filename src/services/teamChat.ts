import { getSupabase } from './supabaseClient';
import { localTeamStatus, type TeamFailure, type TeamResult } from './teams';

/** One line in a team's chat. */
export interface TeamMessage {
  id: string;
  teamId: string;
  userId: string;
  displayName: string;
  body: string;
  createdAt: string;
  isMe: boolean;
}

export const MAX_MESSAGE_LENGTH = 1000;
const PAGE = 60;

const fail = (reason: TeamFailure): { ok: false; reason: TeamFailure } => ({ ok: false, reason });

/** Trimmed and bounded; null when there is nothing worth sending. */
export function cleanMessage(body: string): string | null {
  const text = body.replace(/\s+$/g, '').replace(/^\s+/g, '');
  return text.length ? text.slice(0, MAX_MESSAGE_LENGTH) : null;
}

/** Oldest first, so appending a new one keeps the order. */
export function mergeMessages(existing: TeamMessage[], incoming: TeamMessage[]): TeamMessage[] {
  const byId = new Map(existing.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

async function me(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

type Row = { id: string; team_id: string; user_id: string; display_name: string; body: string; created_at: string };
const toMessage = (row: Row, userId: string | null): TeamMessage => ({
  id: row.id, teamId: row.team_id, userId: row.user_id, displayName: row.display_name, body: row.body, createdAt: row.created_at, isMe: row.user_id === userId,
});

// Dev-only chat for the demo team, so the screen can be seen without an account.
let demoMessages: TeamMessage[] | null = null;
export function setDemoMessages(messages: TeamMessage[] | null) {
  demoMessages = messages;
}
export const getDemoMessages = (): TeamMessage[] | null => (__DEV__ ? demoMessages : null);

/** The latest page, or the page before `before` (a message's createdAt). */
export async function fetchMessages(teamId: string, before?: string): Promise<TeamResult<TeamMessage[]>> {
  if (__DEV__ && demoMessages) return { ok: true, value: demoMessages.filter((m) => m.teamId === teamId && (!before || m.createdAt < before)).slice(-PAGE) };
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  const userId = await me();
  if (!userId) return fail('signed-out');
  try {
    let query = supabase.from('team_messages').select('id, team_id, user_id, display_name, body, created_at').eq('team_id', teamId).order('created_at', { ascending: false }).limit(PAGE);
    if (before) query = query.lt('created_at', before);
    const { data, error } = await query;
    if (error) return fail('error');
    return { ok: true, value: ((data ?? []) as Row[]).map((row) => toMessage(row, userId)).reverse() };
  } catch {
    return fail('error');
  }
}

export async function sendMessage(teamId: string, body: string): Promise<TeamResult<TeamMessage>> {
  const text = cleanMessage(body);
  if (!text) return fail('error');
  const displayName = localTeamStatus().displayName;
  if (__DEV__ && demoMessages) {
    const message: TeamMessage = { id: `demo-${Date.now()}`, teamId, userId: 'me', displayName, body: text, createdAt: new Date().toISOString(), isMe: true };
    demoMessages = [...demoMessages, message];
    return { ok: true, value: message };
  }
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  const userId = await me();
  if (!userId) return fail('signed-out');
  try {
    const { data, error } = await supabase.from('team_messages').insert({ team_id: teamId, user_id: userId, display_name: displayName, body: text }).select('id, team_id, user_id, display_name, body, created_at').single();
    if (error || !data) return fail(error?.message.includes('row-level security') ? 'not-found' : 'error');
    return { ok: true, value: toMessage(data as Row, userId) };
  } catch {
    return fail('error');
  }
}

/** Allowed for the author and for the team's leader; the database enforces it. */
export async function deleteMessage(message: TeamMessage): Promise<TeamResult<null>> {
  if (__DEV__ && demoMessages) { demoMessages = demoMessages.filter((m) => m.id !== message.id); return { ok: true, value: null }; }
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  try {
    const { error, count } = await supabase.from('team_messages').delete({ count: 'exact' }).eq('id', message.id);
    if (error) return fail('error');
    return count ? { ok: true, value: null } : fail('not-found');
  } catch {
    return fail('error');
  }
}

/** Lands in a table only the app owner reads. Reporting twice is not an error. */
export async function reportMessage(message: TeamMessage, reason: string): Promise<TeamResult<null>> {
  if (__DEV__ && demoMessages) return { ok: true, value: null };
  const supabase = getSupabase();
  if (!supabase) return fail('unavailable');
  const userId = await me();
  if (!userId) return fail('signed-out');
  try {
    const { error } = await supabase.from('message_reports').insert({ message_id: message.id, reporter_id: userId, reason: reason.trim().slice(0, 200) });
    if (error && !error.message.includes('message_reports_once')) return fail('error');
    return { ok: true, value: null };
  } catch {
    return fail('error');
  }
}

/**
 * New and deleted messages as they happen, for a chat that is open. Returns the
 * function that stops listening. Row-level security applies to these events too.
 */
export function subscribeToMessages(teamId: string, onChange: (change: { kind: 'added'; message: TeamMessage } | { kind: 'removed'; id: string }) => void): () => void {
  if (__DEV__ && demoMessages) return () => undefined;
  const supabase = getSupabase();
  if (!supabase) return () => undefined;
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let stopped = false;
  void (async () => {
    // The socket must carry this user's token before the channel opens; row-level
    // security decides per event, and an anonymous socket is told nothing.
    const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const userId = data.session?.user.id ?? null;
    if (stopped || !userId) return;
    await supabase.realtime.setAuth(data.session?.access_token);
    const { data: current } = await supabase.auth.getSession();
    if (stopped || current.session?.user.id !== userId) return;
    channel = supabase
      // Suffixed so a quick close-and-reopen does not land on the channel still leaving.
      .channel(`team-chat-${teamId}-${Date.now()}`, { config: { private: false } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` }, (payload) => {
        if (stopped) return;
        onChange({ kind: 'added', message: toMessage(payload.new as Row, userId) });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'team_messages' }, (payload) => {
        if (stopped) return;
        const id = (payload.old as { id?: string }).id;
        if (id) onChange({ kind: 'removed', id });
      })
      .subscribe((status, error) => {
        if (__DEV__ && (error || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) console.warn('[chat] realtime', status, error?.message);
      });
  })().catch(() => undefined); // The screen's polling remains available offline.
  return () => {
    stopped = true;
    if (channel) void supabase.removeChannel(channel).catch(() => undefined);
  };
}
