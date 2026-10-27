const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const tick = () => new Promise((resolve) => setImmediate(resolve));

function environment({ authFailure = false } = {}) {
  const state = { userId: 'athlete', counts: { unread: {}, latestAt: {} }, reads: 0, channelOpens: 0, finishQuery: null };
  const inbox = { lastReadAt: {}, setCounts: (counts) => { state.counts = counts; }, clear: () => { state.counts = { unread: {}, latestAt: {} }; } };
  const channel = { on() { return this; }, subscribe() { return this; } };
  const api = {
    auth: { getSession: async () => ({ data: { session: state.userId ? { user: { id: state.userId }, access_token: `mock-${state.userId}` } : null } }) },
    from: () => {
      let authorization = null;
      return {
        select() { return this; }, gt() { return this; }, order() { return this; }, limit() { return this; },
        setHeader(_name, value) { authorization = value; return this; },
        then(resolve) {
          const queryToken = authorization ?? `Bearer mock-${state.userId}`;
          state.reads++;
          state.finishQuery = () => resolve({ data: [{ id: 'old-message', team_id: queryToken === 'Bearer mock-athlete' ? 'old-team' : 'replacement-team', user_id: 'teammate', created_at: new Date().toISOString() }], error: null });
        },
      };
    },
    realtime: { setAuth: async () => { if (authFailure) throw Error('socket auth unavailable'); } },
    channel: () => { state.channelOpens++; return channel; }, removeChannel: async () => {},
  };
  const load = createLoader({
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    './supabaseClient': { getSupabase: () => api },
    './teams': { localTeamStatus: () => ({ displayName: 'Athlete' }) },
    '../store/useTeamInboxStore': { useTeamInboxStore: { getState: () => inbox } },
  });
  return { state, api, inbox, chat: load('src/services/teamChat.ts'), service: load('src/services/teamInbox.ts') };
}

test('inbox read begun by a previous account cannot restore private counts after signout', async () => {
  const env = environment(); const refresh = env.service.refreshInbox();
  while (!env.state.finishQuery) await tick();
  env.state.userId = null; env.inbox.clear(); env.state.finishQuery(); await refresh;
  assert.deepEqual(env.state.counts.unread, {});
});

test('inbox lifecycle cleanup invalidates an in-flight refresh', async () => {
  const env = environment(); const stop = env.service.startInboxLifecycle();
  while (!env.state.finishQuery) await tick();
  stop(); env.state.finishQuery(); await tick();
  assert.deepEqual(env.state.counts.unread, {});
});

test('an account A to B to A switch cannot persist B-authorized inbox rows for A', async () => {
  const env = environment(); const originalFrom = env.api.from;
  env.api.from = () => { env.state.userId = 'replacement'; return originalFrom(); };
  const refresh = env.service.refreshInbox();
  while (!env.state.finishQuery) await tick();
  env.state.userId = 'athlete'; env.state.finishQuery(); await refresh;
  assert.deepEqual(env.state.counts.unread, { 'old-team': 1 });
  assert.equal(env.state.counts.unread['replacement-team'], undefined);
});

test('realtime authentication failures do not escape inbox or chat setup as unhandled rejections', async () => {
  const env = environment({ authFailure: true });
  const stopInbox = env.service.startInboxLifecycle();
  const stopChat = env.chat.subscribeToMessages('team', () => {});
  await tick();
  stopInbox(); stopChat(); env.state.finishQuery?.(); await tick();
  assert.equal(env.state.channelOpens, 0);
});
