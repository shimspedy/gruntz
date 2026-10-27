const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../supabase/functions/delete-account/index.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Execute the actual Edge handler. Every Supabase boundary is local and no real
// credentials, network, Auth users, memberships, or storage objects are touched.
function environment(options = {}) {
  const faults = { ...options };
  const state = {
    memberships: [...(options.memberships ?? [])], accountExists: true, avatarExists: true,
    events: [], clients: [], callerToken: null,
  };
  let handler;
  const caller = {
    auth: { getUser: async () => {
      state.events.push(['verify']);
      if (faults.authThrow) throw new Error('Auth unavailable');
      if (faults.authError || state.callerToken !== 'Bearer verified-caller' || !state.accountExists) {
        return { data: { user: null }, error: { message: 'Invalid user' } };
      }
      return { data: { user: { id: userId } }, error: null };
    } },
    from(table) {
      assert.equal(table, 'team_members');
      return { select(columns) {
        assert.equal(columns, 'team_id');
        return { eq: async (column, id) => {
          assert.equal(column, 'user_id'); assert.equal(id, userId);
          state.events.push(['memberships', id]);
          if (faults.queryThrow) throw new Error('Query unavailable');
          if (faults.queryError) return { data: null, error: { message: 'Query failed' } };
          return { data: faults.invalidMemberships ?? state.memberships.map(team_id => ({ team_id })), error: null };
        } };
      } };
    },
    rpc: async (name, args) => {
      assert.equal(name, 'leave_team');
      assert.deepEqual(Object.keys(args), ['p_team_id']);
      state.events.push(['leave', args.p_team_id]);
      if (faults.leaveThrow === args.p_team_id) throw new Error('Handover unavailable');
      if (faults.leaveError === args.p_team_id) return { error: { message: 'Handover failed' } };
      state.memberships = state.memberships.filter(id => id !== args.p_team_id);
      return { error: null };
    },
  };
  const admin = {
    storage: { from(bucket) {
      assert.equal(bucket, 'team-avatars');
      return { remove: async paths => {
        assert.deepEqual(paths, [`${userId}.jpg`], 'Only the verified caller avatar may be removed');
        state.events.push(['avatar', bucket, paths]);
        if (faults.storageThrow) throw new Error('Storage unavailable');
        if (faults.storageError) return { error: { message: 'Storage failed' } };
        const existed = state.avatarExists;
        state.avatarExists = false;
        if (faults.storageLostResponse) return { error: { message: 'Response lost after removal' } };
        return { data: existed ? [{ name: paths[0] }] : [], error: null };
      } };
    } },
    auth: { admin: { deleteUser: async id => {
      assert.equal(id, userId);
      assert.deepEqual(state.memberships, [], 'Every remaining membership must be handed over before deleting Auth');
      assert.equal(state.avatarExists, false);
      state.events.push(['delete', id]);
      if (faults.deleteError) return { error: { message: 'Auth deletion failed' } };
      state.accountExists = false;
      return { error: null };
    } } },
  };
  const supabase = { createClient: (url, key, config) => {
    assert.equal(url, 'https://example.supabase.co');
    assert.deepEqual(config.auth, { persistSession: false, autoRefreshToken: false });
    state.clients.push(key);
    if (key === 'anon-key') {
      state.callerToken = config.global.headers.Authorization;
      return caller;
    }
    assert.equal(key, 'service-key');
    return admin;
  } };
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'service-key' };
  if (faults.misconfigured) delete env.SUPABASE_SERVICE_ROLE_KEY;
  const deno = { env: { get: key => env[key] }, serve: callback => { handler = callback; } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'Deno', 'console', source)(
    name => { assert.equal(name, 'jsr:@supabase/supabase-js@2'); return supabase; },
    module, module.exports, deno, { error() {} },
  );
  const invoke = async ({ method = 'POST', token = 'Bearer verified-caller', body = '{}', query = '' } = {}) => {
    const request = new Request(`https://example.supabase.co/functions/v1/delete-account${query}`, {
      method, headers: token ? { Authorization: token } : {}, ...(method === 'POST' ? { body } : {}),
    });
    const response = await handler(request);
    return { status: response.status, body: await response.json() };
  };
  return { state, faults, invoke };
}

test('spoofed body/query targets cannot change the verified account, teams or avatar selected for deletion', async () => {
  const env = environment({ memberships: ['team-one', 'team-two', 'team-one'] });
  const result = await env.invoke({ query: `?userId=${otherUserId}`, body: JSON.stringify({ userId: otherUserId, avatarPath: `${otherUserId}.jpg`, teamIds: ['foreign-team'] }) });
  assert.deepEqual(result, { status: 200, body: { ok: true } });
  assert.deepEqual(env.state.events, [
    ['verify'], ['memberships', userId], ['leave', 'team-one'], ['leave', 'team-two'],
    ['avatar', 'team-avatars', [`${userId}.jpg`]], ['delete', userId],
  ]);
  assert.equal(env.state.accountExists, false);
});

test('the handler never needs to parse a body to identify its caller', async () => {
  const env = environment();
  assert.equal((await env.invoke({ body: '{invalid JSON' })).status, 200);
  assert.equal(env.state.events.at(-1)[1], userId);
});

for (const input of [{ token: null }, { token: 'Bearer invalid' }]) {
  test(`missing or invalid authentication cannot reach privileged cleanup (${input.token ?? 'missing'})`, async () => {
    const env = environment();
    assert.equal((await env.invoke(input)).status, 401);
    assert.equal(env.state.clients.includes('service-key'), false);
    assert.ok(env.state.events.every(([kind]) => kind === 'verify'));
    assert.equal(env.state.accountExists, true);
  });
}

for (const authFailure of ['authError', 'authThrow']) {
  test(`${authFailure} fails closed before creating the admin client`, async () => {
    const env = environment({ [authFailure]: true });
    assert.equal((await env.invoke()).status, 401);
    assert.deepEqual(env.state.clients, ['anon-key']);
    assert.deepEqual(env.state.events, [['verify']]);
  });
}

test('unsupported methods and missing server configuration perform no cleanup', async () => {
  const method = environment();
  assert.equal((await method.invoke({ method: 'GET' })).status, 405);
  assert.deepEqual(method.state.events, []);
  const config = environment({ misconfigured: true });
  assert.equal((await config.invoke()).status, 500);
  assert.deepEqual(config.state.clients, []);
});

for (const invalid of [{ queryError: true }, { queryThrow: true }, { invalidMemberships: [{ team_id: null }] }]) {
  test(`an unreadable membership list cannot be treated as no teams (${Object.keys(invalid)[0]})`, async () => {
    const env = environment({ memberships: ['team-one'], ...invalid });
    assert.equal((await env.invoke()).status, 500);
    assert.deepEqual(env.state.memberships, ['team-one']);
    assert.ok(!env.state.events.some(([kind]) => ['leave', 'avatar', 'delete'].includes(kind)));
  });
}

test('partial team handover failure retains the account and safely resumes remaining teams on retry', async () => {
  const env = environment({ memberships: ['team-one', 'team-two'], leaveError: 'team-two' });
  assert.deepEqual(await env.invoke(), { status: 500, body: { error: 'team-handover-failed' } });
  assert.equal(env.state.accountExists, true);
  assert.equal(env.state.avatarExists, true);
  assert.deepEqual(env.state.memberships, ['team-two']);
  delete env.faults.leaveError;
  assert.equal((await env.invoke()).status, 200);
  assert.deepEqual(env.state.events.filter(([kind]) => kind === 'leave'), [['leave', 'team-one'], ['leave', 'team-two'], ['leave', 'team-two']]);
  assert.equal(env.state.events.filter(([kind]) => kind === 'delete').length, 1);
});

for (const storageFailure of ['storageError', 'storageThrow', 'storageLostResponse']) {
  test(`${storageFailure} retains Auth and can retry even if the avatar removal already committed`, async () => {
    const env = environment({ memberships: ['team-one'], [storageFailure]: true });
    assert.equal((await env.invoke()).status, 500);
    assert.equal(env.state.accountExists, true);
    assert.ok(!env.state.events.some(([kind]) => kind === 'delete'));
    delete env.faults[storageFailure];
    assert.equal((await env.invoke()).status, 200);
    assert.equal(env.state.events.filter(([kind]) => kind === 'leave').length, 1);
    assert.equal(env.state.events.filter(([kind]) => kind === 'delete').length, 1);
  });
}

test('a failed Auth delete retries after idempotent cleanup without selecting any other avatar', async () => {
  const env = environment({ memberships: ['team-one'], deleteError: true });
  assert.deepEqual(await env.invoke(), { status: 500, body: { error: 'delete-failed' } });
  assert.equal(env.state.accountExists, true);
  assert.equal(env.state.avatarExists, false);
  delete env.faults.deleteError;
  assert.equal((await env.invoke()).status, 200);
  assert.equal(env.state.events.filter(([kind]) => kind === 'leave').length, 1);
  assert.equal((await env.invoke()).status, 401, 'A deleted identity cannot replay privileged cleanup');
});
