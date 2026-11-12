import { AppState } from 'react-native';
import { countUnread, INBOX_WINDOW_MS, type InboxMessage } from '../features/teamInbox';
import { useTeamInboxStore } from '../store/useTeamInboxStore';
import { getSupabase } from './supabaseClient';
import { getDemoMessages } from './teamChat';

const REFRESH_MS = 60_000;
const REALTIME_DEBOUNCE_MS = 1500;
const PAGE = 300;
/** Newest lines read per team. The badge stops at "99+", so more would never be shown. */
const PER_TEAM = 100;
/** Past this many teams, one shared query is cheaper than a request each. */
const MAX_TEAM_QUERIES = 20;

type Row = { id: string; team_id: string; user_id: string; created_at: string };

/**
 * Recount unread team chat from the server, one bounded read per team.
 *
 * It used to be a single query for the newest 300 lines across every team. A busy
 * community filled all 300, so a quieter team's unread lines were never counted and its
 * badge stayed empty; and with no team in the filter the query could not use the
 * `(team_id, created_at)` index. Row-level security still decides what is visible.
 */
export async function refreshInbox(shouldContinue: () => boolean = () => true): Promise<void> {
  if (!shouldContinue()) return;
  const store = useTeamInboxStore.getState();
  const demo = getDemoMessages();
  if (demo) {
    store.setCounts(countUnread(demo.map((m) => ({ id: m.id, teamId: m.teamId, userId: m.isMe ? 'me' : m.userId, createdAt: m.createdAt })), store.lastReadAt, 'me'));
    return;
  }
  const supabase = getSupabase();
  if (!supabase) return;
  let userId: string | null = null;
  let accessToken: string | null = null;
  try {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user.id ?? null;
    accessToken = data.session?.access_token ?? null;
  } catch {
    return;
  }
  if (!shouldContinue()) return;
  if (!userId) { store.clear(); return; }
  if (!accessToken) return;
  // Nothing older than the window can be unread anywhere.
  const floor = new Date(Date.now() - INBOX_WINDOW_MS).toISOString();
  try {
    const newest = (limit: number) => supabase
      .from('team_messages')
      .select('id, team_id, user_id, created_at')
      .gt('created_at', floor)
      .order('created_at', { ascending: false })
      .limit(limit)
      .setHeader('Authorization', `Bearer ${accessToken}`);
    const teamIds = store.teamIds ?? [];
    let data: Row[];
    if (teamIds.length > 0 && teamIds.length <= MAX_TEAM_QUERIES) {
      const pages = await Promise.all(teamIds.map((teamId) => newest(PER_TEAM).eq('team_id', teamId)));
      // One failed team must not publish a count that silently leaves it out.
      if (pages.some((page) => page.error || !page.data)) return;
      data = pages.flatMap((page) => page.data as Row[]);
    } else {
      // The roster is not known yet (or is very long): the shared read, as before.
      const page = await newest(PAGE);
      if (page.error || !page.data) return;
      data = page.data as Row[];
    }
    if (!shouldContinue()) return;
    const { data: current } = await supabase.auth.getSession();
    if (!shouldContinue() || current.session?.user.id !== userId) return;
    const stubs: InboxMessage[] = data.map((row) => ({ id: row.id, teamId: row.team_id, userId: row.user_id, createdAt: row.created_at }));
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
  const refresh = () => { void refreshInbox(() => !stopped); };
  // A busy chat delivers a line at a time; one recount covers the burst.
  let burst: ReturnType<typeof setTimeout> | null = null;
  const refreshSoon = () => {
    if (burst || stopped) return;
    burst = setTimeout(() => { burst = null; refresh(); }, REALTIME_DEBOUNCE_MS);
  };
  refresh();
  const timer = setInterval(refresh, REFRESH_MS);
  const appState = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });

  const supabase = getSupabase();
  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  if (supabase && !getDemoMessages()) {
    void (async () => {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      const { data: current } = await supabase.auth.getSession();
      if (stopped || current.session?.user.id !== data.session.user.id) return;
      // A fresh topic each time: the client hands back a channel that is still leaving
      // when the same topic is asked for again, and subscribing to that one is a no-op.
      channel = supabase
        .channel(`team-inbox-${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages' }, refreshSoon)
        .subscribe();
    })().catch(() => undefined); // Polling still works when the socket is unavailable.
  }
  return () => {
    stopped = true;
    if (burst) clearTimeout(burst);
    clearInterval(timer);
    appState.remove();
    if (channel && supabase) void supabase.removeChannel(channel).catch(() => undefined);
  };
}
