const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function until(predicate) {
  for (let attempt = 0; attempt < 100; attempt++) { if (predicate()) return; await tick(); }
  assert.fail('expected mocked SDK request did not start');
}

let authFixtureId = 0;
async function installedAuth({ initialUser = null, deferLogout = false } = {}) {
  const { createClient } = require('@supabase/supabase-js');
  const storageKey = `gruntz-auth-qa-${++authFixtureId}`;
  const session = (id) => ({
    access_token: `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.mock-signature`,
    refresh_token: `mock-refresh-${id}`, token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id, aud: 'authenticated', email: `${id}@example.com`, app_metadata: {}, user_metadata: {}, created_at: '2026-10-27T12:00:00Z' },
  });
  const disk = new Map(initialUser ? [[storageKey, JSON.stringify(session(initialUser))]] : []);
  const requests = [], events = [];
  const json = (value) => new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
  const client = createClient('https://example.supabase.co', 'mock-publishable-key', {
    auth: {
      storageKey, autoRefreshToken: false, detectSessionInUrl: false, persistSession: true,
      storage: { getItem: async (key) => disk.get(key) ?? null, setItem: async (key, value) => { disk.set(key, value); }, removeItem: async (key) => { disk.delete(key); } },
    },
    global: { fetch: async (url, options = {}) => {
      const pathname = new URL(String(url)).pathname;
      const request = { pathname, body: options.body ? JSON.parse(options.body) : null };
      requests.push(request);
      if (pathname === '/auth/v1/verify') return new Promise((resolve) => { request.respond = (id) => resolve(json(session(id))); });
      if (pathname === '/auth/v1/logout') {
        if (deferLogout) return new Promise((resolve) => { request.respond = () => resolve(new Response(null, { status: 204 })); });
        return new Response(null, { status: 204 });
      }
      if (pathname === '/rest/v1/team_members') return json([]);
      if (pathname === '/functions/v1/delete-account') return new Promise((resolve) => { request.respond = () => resolve(json({ ok: true })); });
      throw Error(`unexpected mocked request ${pathname}`);
    } },
  });
  await client.auth.getSession();
  const { data: { subscription } } = client.auth.onAuthStateChange((event, value) => { events.push({ event, userId: value?.user.id ?? null }); });
  const service = createLoader({
    '@react-native-async-storage/async-storage': {},
    'react-native': { Platform: { OS: 'ios' }, AppState: {} },
    '../config/backup': { BACKUP_SCHEMA_VERSION: 2, BACKUP_DEBOUNCE_MS: 1000, isBackupAvailable: () => true },
    './backupSnapshot': {}, './supabaseClient': { getSupabase: () => client }, './profilePhotoCloud': { restoreProfilePhoto: async () => 'none', syncProfilePhoto: async () => {} },
  })('src/services/backup.ts');
  return { client, service, requests, events, disk, storageKey, close: () => subscription.unsubscribe() };
}

function account({ memberships = ['one', 'two'], leaveError = false, signOutError = false } = {}) {
  const state = { userId: 'athlete', memberships: [...memberships], removedWithAccount: [], deletes: 0, otp: [] };
  const api = {
    auth: {
      getSession: async () => ({ data: { session: state.userId ? { user: { id: state.userId }, access_token: `mock-token-${state.userId}` } : null } }),
      signOut: async () => { if (signOutError) throw Error('local signout failed'); state.userId = null; return { error: null }; },
      verifyOtp: async (input) => { state.otp.push(input); return { error: input.type === 'email' ? { message: 'Token has expired or is invalid' } : null }; },
    },
    from: (table) => {
      assert.equal(table, 'team_members');
      return { select: () => ({ eq: (column, id) => ({ setHeader: async (name, value) => { assert.equal(name, 'Authorization'); assert.equal(value, 'Bearer mock-token-athlete'); assert.equal(column, 'user_id'); assert.equal(id, 'athlete'); return { data: state.memberships.map((team_id) => ({ team_id })), error: null }; } }) }) };
    },
    rpc: (_name, args) => ({ setHeader: async (name, value) => {
      assert.equal(name, 'Authorization'); assert.equal(value, 'Bearer mock-token-athlete');
      if (leaveError) return { error: { message: 'Temporary failure' } };
      const leaving = args?.p_team_id ?? state.memberships[0];
      state.memberships = state.memberships.filter((id) => id !== leaving);
      return { error: null };
    } }),
    functions: { invoke: async (_name, options) => { assert.equal(options.headers.Authorization, 'Bearer mock-token-athlete'); state.deletes++; state.removedWithAccount = [...state.memberships]; return { data: { ok: true }, error: null }; } },
  };
  const service = createLoader({
    '@react-native-async-storage/async-storage': {},
    'react-native': { Platform: { OS: 'ios' }, AppState: {} },
    '../config/backup': { BACKUP_SCHEMA_VERSION: 2, BACKUP_DEBOUNCE_MS: 1000, isBackupAvailable: () => true },
    './backupSnapshot': {}, './supabaseClient': { getSupabase: () => api }, './profilePhotoCloud': { restoreProfilePhoto: async () => 'none', syncProfilePhoto: async () => {} },
  })('src/services/backup.ts');
  return { state, api, service };
}

test('account deletion leaves every team before deleting its owner instead of cascading the remaining teams', async () => {
  const env = account();
  assert.equal(await env.service.deleteAccount(), 'deleted');
  assert.deepEqual(env.state.removedWithAccount, []);
  assert.equal(env.state.deletes, 1);
});

test('failed team handover preserves the account for retry instead of deleting other members teams', async () => {
  const env = account({ leaveError: true });
  assert.equal(await env.service.deleteAccount(), 'error');
  assert.equal(env.state.deletes, 0);
  assert.equal(env.state.userId, 'athlete');
});

test('changing the signed-in account during deletion cannot delete the replacement account', async () => {
  const env = account();
  env.api.rpc = () => ({ setHeader: async () => { env.state.userId = 'replacement'; return { error: null }; } });
  assert.equal(await env.service.deleteAccount(), 'error');
  assert.equal(env.state.deletes, 0);
});

test('an account A to B to A switch cannot turn A membership lookup into an empty B result', async () => {
  const env = account(); let authorization = null;
  const query = {
    select() { return this; }, eq() { return this; },
    setHeader(_name, value) { authorization = value; return this; },
    then(resolve) {
      env.state.userId = 'athlete';
      resolve({ data: authorization === 'Bearer mock-token-athlete' ? env.state.memberships.map((team_id) => ({ team_id })) : [], error: null });
    },
  };
  env.api.from = () => { env.state.userId = 'replacement'; return query; };
  assert.equal(await env.service.deleteAccount(), 'deleted');
  assert.deepEqual(env.state.removedWithAccount, []);
});

test('confirmed server account deletion remains successful if later local signout fails', async () => {
  const env = account({ memberships: [], signOutError: true });
  assert.equal(await env.service.deleteAccount(), 'deleted');
  assert.equal(env.state.deletes, 1);
});

test('first signup code falls back from email to signup with normalized inputs', async () => {
  const env = account();
  assert.equal(await env.service.verifySignInCode(' Athlete@Example.com ', ' 123456 '), 'signed-in');
  assert.deepEqual(env.state.otp, [{ email: 'athlete@example.com', token: '123456', type: 'email' }, { email: 'athlete@example.com', token: '123456', type: 'signup' }]);
});

test('a code response after signout cannot start the fallback request and sign the user back in', async () => {
  const env = account(); let finishEmail, calls = 0;
  env.api.auth.verifyOtp = (input) => {
    calls++;
    if (input.type === 'email') return new Promise((resolve) => { finishEmail = () => resolve({ error: { message: 'Invalid token type' } }); });
    env.state.userId = 'athlete'; return Promise.resolve({ error: null });
  };
  const verification = env.service.verifySignInCode('a@example.com', '123456');
  while (!finishEmail) await new Promise((resolve) => setImmediate(resolve));
  const signout = env.service.signOut(); finishEmail(); await signout;
  assert.equal(await verification, 'error');
  assert.equal(env.state.userId, null); assert.equal(calls, 1);
});

test('installed SDK valid delayed OTP cannot persist a session after the later signout finishes', async (t) => {
  const env = await installedAuth(); t.after(env.close);
  const verification = env.service.verifySignInCode('old@example.com', '123456');
  await until(() => env.requests.some((request) => request.pathname === '/auth/v1/verify'));
  let signedOut = false;
  const signout = env.service.signOut().then(() => { signedOut = true; });
  await tick(); const signoutCompletedBeforeOtp = signedOut;
  env.requests.find((request) => request.pathname === '/auth/v1/verify').respond('old');
  assert.equal(await verification, 'error'); await signout;
  assert.equal((await env.client.auth.getSession()).data.session, null);
  assert.equal(env.disk.has(env.storageKey), false, 'actual SDK persistence must be cleared');
  assert.equal(signoutCompletedBeforeOtp, false, 'signout must follow the OTP SDK write');
  assert.deepEqual(env.events.filter(({ event }) => event !== 'INITIAL_SESSION').map(({ event }) => event), ['SIGNED_IN', 'SIGNED_OUT']);
});

test('a later login runs after the queued signout and remains the final installed SDK session', async (t) => {
  const env = await installedAuth(); t.after(env.close);
  const older = env.service.verifySignInCode('old@example.com', '111111');
  await until(() => env.requests.some((request) => request.body?.email === 'old@example.com'));
  const signout = env.service.signOut();
  const newer = env.service.verifySignInCode('new@example.com', '222222');
  await tick(); const newStartedEarly = env.requests.some((request) => request.body?.email === 'new@example.com');
  env.requests.find((request) => request.body?.email === 'old@example.com').respond('old');
  await until(() => env.requests.some((request) => request.body?.email === 'new@example.com'));
  env.requests.find((request) => request.body?.email === 'new@example.com').respond('new');
  assert.equal(await older, 'error'); await signout; assert.equal(await newer, 'signed-in');
  assert.equal(newStartedEarly, false);
  assert.equal((await env.client.auth.getSession()).data.session.user.id, 'new');
  assert.equal(JSON.parse(env.disk.get(env.storageKey)).user.id, 'new');
  assert.deepEqual(env.events.filter(({ event }) => event !== 'INITIAL_SESSION').map(({ event, userId }) => [event, userId]), [['SIGNED_IN', 'old'], ['SIGNED_OUT', null], ['SIGNED_IN', 'new']]);
});

for (const cleanupFirst of [false, true]) {
  test(`deleted-account cleanup queued ${cleanupFirst ? 'before' : 'after'} replacement verification preserves its success and saved session`, async (t) => {
    const env = await installedAuth({ initialUser: 'old', deferLogout: cleanupFirst }); t.after(env.close);
    const deletion = env.service.deleteAccount();
    await until(() => env.requests.some((request) => request.pathname === '/functions/v1/delete-account'));
    const deletionRequest = env.requests.find((request) => request.pathname === '/functions/v1/delete-account');
    if (cleanupFirst) {
      deletionRequest.respond();
      await until(() => env.requests.some((request) => request.pathname === '/auth/v1/logout'));
    }
    const replacement = env.service.verifySignInCode('new@example.com', '222222');
    if (cleanupFirst) {
      await tick(); assert.equal(env.requests.some((request) => request.body?.email === 'new@example.com'), false);
      env.requests.find((request) => request.pathname === '/auth/v1/logout').respond();
    }
    await until(() => env.requests.some((request) => request.body?.email === 'new@example.com'));
    if (!cleanupFirst) { deletionRequest.respond(); await tick(); }
    env.requests.find((request) => request.body?.email === 'new@example.com').respond('new');
    assert.equal(await replacement, 'signed-in'); assert.equal(await deletion, 'deleted');
    assert.equal((await env.client.auth.getSession()).data.session.user.id, 'new');
    assert.equal(JSON.parse(env.disk.get(env.storageKey)).user.id, 'new');
    assert.equal(env.events.filter(({ event, userId }) => event === 'SIGNED_IN' && userId === 'new').length, 1);
    assert.equal(env.events.at(-1).userId, 'new');
  });
}

test('installed Supabase lookup, RPC and function transports preserve the pinned account token', async () => {
  const { createClient } = require('@supabase/supabase-js');
  const requests = [];
  const client = createClient('https://example.supabase.co', 'mock-publishable-key', {
    accessToken: async () => 'mock-replacement-token',
    global: { fetch: async (url, options) => {
      requests.push({ url: String(url), headers: new Headers(options.headers) });
      return new Response(String(url).includes('/functions/') ? '{"ok":true}' : options.method === 'GET' ? '[]' : 'null', { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  const lookup = await client.from('team_members').select('team_id').eq('user_id', 'athlete').setHeader('Authorization', 'Bearer mock-confirmed-token');
  assert.equal(lookup.error, null);
  const result = await client.rpc('leave_team', { p_team_id: 'team' }).setHeader('Authorization', 'Bearer mock-confirmed-token');
  assert.equal(result.error, null);
  const deleted = await client.functions.invoke('delete-account', { method: 'POST', headers: { Authorization: 'Bearer mock-confirmed-token' } });
  assert.equal(deleted.error, null);
  assert.equal(requests.length, 3);
  assert.deepEqual(requests.map((request) => new URL(request.url).pathname), ['/rest/v1/team_members', '/rest/v1/rpc/leave_team', '/functions/v1/delete-account']);
  assert.ok(requests.every((request) => request.headers.get('authorization') === 'Bearer mock-confirmed-token'));
});
