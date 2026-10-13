import { AppState } from 'react-native';
import { countUnread, INBOX_WINDOW_MS, type InboxMessage } from '../features/teamInbox';
import { useTeamInboxStore } from '../store/useTeamInboxStore';
import { getSupabase } from './supabaseClient';
import { getDemoMessages } from './teamChat';

const REFRESH_MS = 60_000;
const PAGE = 300;

/**
 * Recount unread team chat from the server. Row-level security already limits the
 * rows to this phone's teams, so one query covers them all; a chat with nothing new
 * since its last read costs nothing extra.
 */
export async function refreshInbox(): Promise<void> {
  const store = useTeamInboxStore.getState();
  const demo = getDemoMessages();
  if (demo) {
    store.setCounts(countUnread(demo.map((m) => ({ id: m.id, teamId: m.teamId, userId: m.isMe ? 'me' : m.userId, createdAt: m.createdAt })), store.lastReadAt, 'me'));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user.id ?? null;
  } catch {
    return;
  }
  if (!userId) { store.clear(); return; }
  // Nothing older than the window can be unread anywhere.
  const floor = new Date(Date.now() - INBOX_WINDOW_MS).toISOString();
  try {
    const { data, error } = await supabase
      .from('team_messages')
      .select('id, team_id, user_id, created_at')
      .gt('created_at', floor)
      .order('created_at', { ascending: false })
      .limit(PAGE);
    if (error || !data) return;
    const stubs: InboxMessage[] = (data as { id: string; team_id: string; user_id: string; created_at: string }[]).map((row) => ({ id: row.id, teamId: row.team_id, userId: row.user_id, createdAt: row.created_at }));
    useTeamInboxStore.getState().setCounts(countUnread(stubs, useTeamInboxStore.getState().lastReadAt, userId));
  } catch {
    // Keep the last counts; the next refresh will try again.
  }
}

/**
 * Keeps the badge current while the app is open: a recount now, on every return to
 * the foreground, once a minute, and the moment a line lands over the realtime socket.
 * Returns the function that stops all of it.
 */
export function startInboxLifecycle(): () => void {
  let stopped = false;
  void refreshInbox();
  const timer = setInterval(() => { void refreshInbox(); }, REFRESH_MS);
  const appState = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshInbox(); });

  const supabase = getSupabase();
  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  if (supabase && !getDemoMessages()) {
    void (async () => {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      if (stopped) return;
      channel = supabase
        .channel('team-inbox')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, () => { void refreshInbox(); })
        .subscribe();
    })();
  }
  return () => {
    stopped = true;
    clearInterval(timer);
    appState.remove();
    if (channel && supabase) void supabase.removeChannel(channel);
  };
}
