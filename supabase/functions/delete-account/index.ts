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

  const { data, error } = await caller.auth.getUser();
  if (error || !data.user) return json({ error: 'not-signed-in' }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('[delete-account] failed', deleteError.message);
    return json({ error: 'delete-failed' }, 500);
  }

  return json({ ok: true }, 200);
});
