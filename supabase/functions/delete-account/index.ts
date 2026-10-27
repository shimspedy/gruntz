import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Delete the calling athlete's account, permanently.
 *
 * Apple's guideline 5.1.1(v) requires that an app which can create an account can
 * also delete one from inside the app. Gruntz creates accounts (optional, for
 * progress backup), so it needs this. "Delete my backup" is not the same thing —
 * that empties the row and leaves the identity, and the email address, behind.
 *
 * Why this has to be a server function: deleting an auth user needs the service
 * role key, which bypasses row-level security entirely and must never be shipped in
 * a client. The key stays here.
 *
 * THE SECURITY PROPERTY: the user id comes from the caller's own verified JWT and
 * from nowhere else. It is never read from the request body or a query parameter —
 * if it were, anyone holding any valid token could delete any other athlete's
 * account by naming their id. Do not add a body parameter to this function.
 *
 * Deleting the auth user cascades to `public.backups` via the foreign key
 * (`references auth.users(id) on delete cascade`), so the training snapshot goes
 * with the identity rather than being orphaned.
 *
 * Finish team handovers and remove the caller's private avatar first. Older app
 * builds may not leave every team, and after leaving, client storage policies no
 * longer permit avatar cleanup. These calls span services: another device joining
 * a team concurrently is not transactionally blocked by this handler.
 */

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method-not-allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'not-signed-in' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'misconfigured' }, 500);

  // Identify the caller by validating their token — the only trusted source here.
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const identity = await caller.auth.getUser().catch(() => null);
  const userId = identity?.data.user?.id;
  if (identity?.error || !userId) return json({ error: 'not-signed-in' }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: memberships, error: membershipError } = await caller
      .from('team_members').select('team_id').eq('user_id', userId);
    if (membershipError || !Array.isArray(memberships)
      || memberships.some((membership) => typeof membership?.team_id !== 'string' || !membership.team_id)) {
      return json({ error: 'team-handover-failed' }, 500);
    }
    for (const teamId of new Set(memberships.map((membership) => membership.team_id))) {
      // The caller client retains the verified JWT, so auth.uid() inside the RPC
      // identifies this athlete; a service-role RPC would not provide that identity.
      const { error: leaveError } = await caller.rpc('leave_team', { p_team_id: teamId });
      if (leaveError) return json({ error: 'team-handover-failed' }, 500);
    }

    const { error: avatarError } = await admin.storage
      .from('team-avatars').remove([`${userId}.jpg`]);
    if (avatarError) return json({ error: 'avatar-delete-failed' }, 500);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('[delete-account] failed', deleteError.message);
      return json({ error: 'delete-failed' }, 500);
    }
  } catch (error) {
    console.error('[delete-account] cleanup failed', error instanceof Error ? error.message : 'Unexpected failure');
    return json({ error: 'delete-failed' }, 500);
  }

  return json({ ok: true }, 200);
});
