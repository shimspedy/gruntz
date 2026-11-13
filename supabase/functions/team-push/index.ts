import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Sends the push notifications behind team chat, nudges and new followers.
 *
 * The app cannot do this itself: delivering to someone else's phone needs their push
 * token, and no app role can read the token table. This function reads it with the
 * service role, after it has established who is asking and that they are allowed to
 * cause this particular notification.
 *
 * THE SECURITY PROPERTY: the caller only ever names a thing they already did (a
 * message they posted, a nudge, a follow). Who they are comes from their verified
 * token. Who gets notified, and what the notification says, is read from the database
 * and never taken from the request. A request can therefore not push arbitrary text,
 * and cannot reach anyone the caller is not already connected to.
 *
 * Each event notifies once: messages and follows are claimed by stamping
 * `notified_at`, a follow is announced once per pair however often it is repeated,
 * and a nudge is new only once per teammate per day.
 */

type Push = { to: string; title: string; body: string; data: Record<string, string>; sound: 'default'; channelId: string };

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MESSAGE_PUSH_WINDOW_MS = 5 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'not-signed-in' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'misconfigured' }, 500);

  // Everything read as the caller goes through row-level security with their own token.
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const identity = await caller.auth.getUser().catch(() => null);
  const userId = identity?.data.user?.id;
  if (identity?.error || !userId) return json({ error: 'not-signed-in' }, 401);

  let input: { kind?: unknown; messageId?: unknown; teamId?: unknown; userId?: unknown };
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'bad-request' }, 400);
    input = parsed;
  } catch {
    return json({ error: 'bad-request' }, 400);
  }
  const id = (value: unknown) => (typeof value === 'string' && UUID.test(value) ? value : null);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let recipients: string[] = [];
  let title = '';
  let body = '';
  let data: Record<string, string> = {};

  if (input.kind === 'message') {
    const messageId = id(input.messageId);
    if (!messageId) return json({ error: 'bad-request' }, 400);
    // Read as the caller: only a member can see the row, and only the author may announce it.
    const { data: message } = await caller.from('team_messages').select('id, team_id, user_id, display_name, body, created_at').eq('id', messageId).maybeSingle();
    if (!message || message.user_id !== userId) return json({ error: 'not-found' }, 404);
    // Only a line that was just posted is announced: not a backlog, and not something
    // written before the team's settings changed.
    if (Date.now() - new Date(message.created_at).getTime() > MESSAGE_PUSH_WINDOW_MS) return json({ sent: 0 }, 200);
    const { data: team } = await caller.from('teams').select('id, name, is_public').eq('id', message.team_id).maybeSingle();
    // Public communities stay quiet: fifty strangers should not buzz each other's phones.
    if (!team || team.is_public) return json({ sent: 0 }, 200);
    const { data: claimed } = await admin.from('team_messages').update({ notified_at: new Date().toISOString() }).eq('id', messageId).is('notified_at', null).select('id');
    if (!claimed?.length) return json({ sent: 0 }, 200);
    const { data: members } = await admin.from('team_members').select('user_id').eq('team_id', team.id).neq('user_id', userId);
    recipients = (members ?? []).map((m) => m.user_id);
    title = clip(team.name, 60);
    body = clip(`${message.display_name}: ${message.body}`, 160);
    data = { url: `gruntz://team/${team.id}`, type: 'team-message' };
  } else if (input.kind === 'nudge') {
    const teamId = id(input.teamId);
    const targetId = id(input.userId);
    if (!teamId || !targetId) return json({ error: 'bad-request' }, 400);
    // The function checks both are in this private team and returns true once per day.
    const { data: fresh, error } = await caller.rpc('send_team_nudge', { p_team_id: teamId, p_user_id: targetId });
    if (error) return json({ error: error.message.includes('RATE_LIMITED') ? 'rate-limited' : 'not-found' }, error.message.includes('RATE_LIMITED') ? 429 : 404);
    if (fresh !== true) return json({ sent: 0 }, 200);
    const [{ data: team }, { data: me }] = await Promise.all([
      admin.from('teams').select('id, name').eq('id', teamId).maybeSingle(),
      admin.from('team_members').select('display_name').eq('team_id', teamId).eq('user_id', userId).maybeSingle(),
    ]);
    if (!team || !me) return json({ sent: 0 }, 200);
    recipients = [targetId];
    title = clip(team.name, 60);
    body = clip(`${me.display_name} is checking in. Your team is waiting on today's session.`, 160);
    data = { url: `gruntz://team/${team.id}`, type: 'team-nudge' };
  } else if (input.kind === 'follow') {
    const targetId = id(input.userId);
    if (!targetId) return json({ error: 'bad-request' }, 400);
    // Only a follow that exists, from this caller, and has not been announced yet.
    const { data: claimed } = await admin.from('athlete_follows').update({ notified_at: new Date().toISOString() })
      .eq('follower_id', userId).eq('followee_id', targetId).is('notified_at', null).select('followee_id');
    if (!claimed?.length) return json({ sent: 0 }, 200);
    // One push per pair, ever: unfollowing and following again must not buzz them again.
    const { data: first } = await admin.from('athlete_follow_notices')
      .upsert({ follower_id: userId, followee_id: targetId }, { onConflict: 'follower_id,followee_id', ignoreDuplicates: true }).select('followee_id');
    if (!first?.length) return json({ sent: 0 }, 200);
    const { data: me } = await admin.from('athlete_profiles').select('display_name').eq('user_id', userId).maybeSingle();
    if (!me) return json({ sent: 0 }, 200);
    recipients = [targetId];
    title = 'New follower';
    body = clip(`${me.display_name} started following you.`, 160);
    data = { url: 'gruntz://athletes', type: 'athlete-follow' };
  } else {
    return json({ error: 'bad-request' }, 400);
  }

  if (!recipients.length) return json({ sent: 0 }, 200);
  const { data: tokens } = await admin.from('push_tokens').select('token').in('user_id', recipients).limit(500);
  const messages: Push[] = (tokens ?? []).map((row) => ({ to: row.token, title, body, data, sound: 'default', channelId: 'team' }));
  if (!messages.length) return json({ sent: 0 }, 200);

  let sent = 0;
  const dead: string[] = [];
  // Expo accepts up to 100 notifications per request.
  for (let start = 0; start < messages.length; start += 100) {
    const batch = messages.slice(start, start + 100);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      const result = await response.json().catch(() => null) as { data?: { status?: string; details?: { error?: string } }[] } | null;
      (result?.data ?? []).forEach((ticket, index) => {
        if (ticket.status === 'ok') sent += 1;
        // The app was removed from that phone; stop sending to it.
        else if (ticket.details?.error === 'DeviceNotRegistered') dead.push(batch[index].to);
      });
    } catch {
      // Delivery is best effort; the chat line or follow itself is already saved.
    }
  }
  if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
  return json({ sent }, 200);
});
