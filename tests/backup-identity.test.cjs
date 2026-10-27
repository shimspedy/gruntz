const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const SNAPSHOT = (owner) => ({ schema_version: 2, captured_at: '2026-10-27T12:00:00Z', stores: { '@gruntz_user': JSON.stringify({ state: { profile: { display_name: owner } }, version: 0 }) } });
const tick = () => new Promise((resolve) => setImmediate(resolve));

function environment({ beforeQuery, afterQuery, onCapture, onApply, onVerify, deferRead = false, deferWrite = false } = {}) {
  const state = { userId: 'A', disk: new Map(), queries: [], writes: [], deletes: [], applied: [], events: [], finishQuery: null };
  const api = {
    auth: {
      getSession: async () => ({ data: { session: state.userId ? { user: { id: state.userId }, access_token: `mock-${state.userId}` } : null } }),
      signOut: async () => { state.events.push('signed-out'); state.userId = null; return { error: null }; },
      verifyOtp: async () => { if (onVerify) await onVerify(state); else state.userId = 'B'; return { error: null }; },
    },
    from: () => {
      let authorization = null, selected = '', method = 'read', payload = null, filterId = null;
      const query = {
        select(fields) { selected = fields; return this; },
        eq(_column, id) { filterId = id; return this; },
        setHeader(_name, value) { authorization = value; return this; },
        maybeSingle() { return this; },
        upsert(value) { method = 'write'; payload = value; return this; },
        delete() { method = 'delete'; return this; },
        then(resolve) {
          beforeQuery?.(state, method);
          const owner = authorization ? authorization.replace('Bearer mock-', '') : state.userId;
          state.queries.push({ method, owner, selected, filterId });
          let data = filterId && filterId !== owner ? null : { user_id: owner, payload: SNAPSHOT(owner), updated_at: '2026-10-27T12:00:00Z', workout_count: owner === 'A' ? 4 : 99 };
          if (method === 'write') { state.writes.push({ owner, payload }); data = { updated_at: '2026-10-27T12:00:00Z' }; }
          if (method === 'delete') { state.deletes.push(owner); data = null; }
          const finish = () => { afterQuery?.(state, method); resolve({ data, error: null }); };
          if ((deferRead && method === 'read') || (deferWrite && method === 'write')) state.finishQuery = finish;
          else finish();
        },
      };
      return query;
    },
  };
  const service = createLoader({
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => state.disk.get(key) ?? null,
      setItem: async (key, value) => { state.disk.set(key, value); },
      removeItem: async (key) => { state.disk.delete(key); },
    },
    'react-native': { Platform: { OS: 'ios' }, AppState: {} },
    '../config/backup': { BACKUP_SCHEMA_VERSION: 2, BACKUP_DEBOUNCE_MS: 1000, isBackupAvailable: () => true },
    './supabaseClient': { getSupabase: () => api },
    './backupSnapshot': {
      captureSnapshot: async () => { onCapture?.(state); return SNAPSHOT('local'); }, snapshotWorkoutCount: () => 1,
      applySnapshot: async (snapshot) => { state.applied.push(snapshot); await onApply?.(state); },
    },
  })('src/services/backup.ts');
  return { service, state, api };
}

test('switching accounts during backup download cannot apply the snapshot or assign its owner', async () => {
  const env = environment({ afterQuery: (state) => { state.userId = 'B'; } });
  assert.equal(await env.service.restoreBackup(), 'error');
  assert.equal(env.state.applied.length, 0);
  assert.equal(env.state.disk.has('@gruntz_backup_owner'), false);
});

test('A to B to A backup download remains authorized as A and restores only A payload', async () => {
  const env = environment({ beforeQuery: (state) => { state.userId = 'B'; }, afterQuery: (state) => { state.userId = 'A'; } });
  assert.equal(await env.service.restoreBackup(), 'restored');
  assert.equal(JSON.parse(env.state.applied[0].stores['@gruntz_user']).state.profile.display_name, 'A');
  assert.equal(env.state.queries[0].owner, 'A');
  assert.equal(env.state.queries[0].filterId, 'A');
  assert.equal(env.state.disk.get('@gruntz_backup_owner'), 'A');
});

test('metadata cannot show another account after either an ordinary or ABA session change', async () => {
  const switched = environment({ afterQuery: (state) => { state.userId = 'B'; } });
  assert.equal(await switched.service.fetchBackupMeta(), null);
  const aba = environment({ beforeQuery: (state) => { state.userId = 'B'; }, afterQuery: (state) => { state.userId = 'A'; } });
  assert.equal((await aba.service.fetchBackupMeta()).workoutCount, 4);
  assert.equal(aba.state.queries[0].owner, 'A');
});

test('an ABA lookup cannot disguise A existing backup as missing and permit an automatic overwrite', async () => {
  const env = environment({ beforeQuery: (state) => { state.userId = 'B'; }, afterQuery: (state) => { state.userId = 'A'; } });
  assert.equal(await env.service.pushBackup(), 'needs-review');
  assert.equal(env.state.writes.length, 0);
});

test('a session change while capturing local data stops upload before any cloud write', async () => {
  const env = environment({ onCapture: (state) => { state.userId = 'B'; } });
  assert.equal(await env.service.pushBackup(undefined, { replaceExisting: true }), 'error');
  assert.equal(env.state.writes.length, 0);
  assert.equal(env.state.disk.has('@gruntz_backup_owner'), false);
});

test('an uploaded response for A cannot mark B current device as synced', async () => {
  const env = environment({ afterQuery: (state, method) => { if (method === 'write') state.userId = 'B'; } });
  assert.equal(await env.service.pushBackup(undefined, { replaceExisting: true }), 'error');
  assert.equal(env.state.writes[0].owner, 'A');
  assert.equal(env.state.disk.has('@gruntz_backup_owner'), false);
  assert.equal(env.state.disk.has('@gruntz_backup_synced_at'), false);
});

test('backup deletion keeps its original authorization across an ABA switch', async () => {
  const env = environment({ beforeQuery: (state) => { state.userId = 'B'; }, afterQuery: (state) => { state.userId = 'A'; } });
  assert.equal(await env.service.deleteBackup(), 'deleted');
  assert.deepEqual(env.state.deletes, ['A']);
  assert.equal(env.state.disk.get('@gruntz_backup_owner'), 'paused');
});

test('signout does not wait for a stalled remote download and invalidates its later restore', async () => {
  const env = environment({ deferRead: true }); const restore = env.service.restoreBackup();
  while (!env.state.finishQuery) await tick();
  let complete = false; const signout = env.service.signOut().then(() => { complete = true; });
  await tick(); assert.equal(complete, true, 'remote download must not hold the signout fence');
  await signout;
  assert.equal(env.state.userId, null);
  env.state.finishQuery();
  assert.equal(await restore, 'error');
  assert.equal(env.state.applied.length, 0);
});

test('signout does not wait for a stalled upload or let its later response record sync ownership', async () => {
  const env = environment({ deferWrite: true });
  const upload = env.service.pushBackup(undefined, { replaceExisting: true });
  while (!env.state.finishQuery) await tick();
  let complete = false; const signout = env.service.signOut().then(() => { complete = true; });
  await tick(); assert.equal(complete, true, 'remote upload must not hold the signout fence');
  await signout;
  assert.equal(env.state.userId, null);
  env.state.finishQuery();
  assert.equal(await upload, 'error');
  assert.equal(env.state.disk.has('@gruntz_backup_owner'), false);
});

test('session transition waits only for an already-started local restore commit', async () => {
  let finishApply;
  const env = environment({ onApply: (state) => new Promise((resolve) => { finishApply = () => { state.events.push('local-commit'); resolve(); }; }) });
  const restore = env.service.restoreBackup();
  while (!finishApply) await tick();
  let signedOut = false;
  const signout = env.service.signOut().then(() => { signedOut = true; });
  await tick(); assert.equal(signedOut, false); assert.equal(env.state.userId, 'A');
  finishApply(); await signout; await restore;
  assert.deepEqual(env.state.events, ['local-commit', 'signed-out']);
  assert.equal(env.state.disk.has('@gruntz_backup_owner'), false);
});

test('pending code verification invalidates an older restore even before the account changes', async () => {
  let finishVerify;
  const env = environment({ deferRead: true, onVerify: (state) => new Promise((resolve) => { finishVerify = () => { state.userId = 'B'; resolve(); }; }) });
  const restore = env.service.restoreBackup();
  while (!env.state.finishQuery) await tick();
  const verify = env.service.verifySignInCode('new@example.com', '123456');
  while (!finishVerify) await tick();
  env.state.finishQuery(); assert.equal(await restore, 'error');
  assert.equal(env.state.applied.length, 0);
  finishVerify(); assert.equal(await verify, 'signed-in');
});

test('logout and login to the same account cannot revive a download from its previous session', async () => {
  const env = environment({ deferRead: true, onVerify: (state) => { state.userId = 'A'; } });
  const restore = env.service.restoreBackup();
  while (!env.state.finishQuery) await tick();
  await env.service.signOut(); await env.service.verifySignInCode('a@example.com', '123456');
  env.state.finishQuery(); assert.equal(await restore, 'error');
  assert.equal(env.state.userId, 'A'); assert.equal(env.state.applied.length, 0);
});

test('a queued upload retains its original session generation instead of adopting the next account', async () => {
  const env = environment({ deferRead: true }); const restore = env.service.restoreBackup();
  while (!env.state.finishQuery) await tick();
  const upload = env.service.pushBackup(undefined, { replaceExisting: true });
  await env.service.signOut(); env.state.finishQuery();
  assert.equal(await restore, 'error'); assert.equal(await upload, 'error');
  assert.equal(env.state.writes.length, 0);
});

test('failed local restore releases the session-change fence so signout can finish', async () => {
  let failApply;
  const env = environment({ onApply: () => new Promise((_resolve, reject) => { failApply = () => reject(Error('local commit failed')); }) });
  const restore = env.service.restoreBackup();
  while (!failApply) await tick();
  const signout = env.service.signOut();
  failApply(); assert.equal(await restore, 'error'); await signout;
  assert.equal(env.state.userId, null);
  assert.equal(env.state.disk.has('@gruntz_backup_owner'), false);
});

test('a signout microtask after identity read but before local-commit publication cancels restore', async () => {
  const env = environment(); const original = env.api.auth.getSession;
  let reads = 0, signout;
  env.api.auth.getSession = () => {
    if (++reads !== 2) return original();
    return { then(resolve) {
      resolve({ data: { session: { user: { id: 'A' }, access_token: 'mock-A' } } });
      queueMicrotask(() => { signout = env.service.signOut(); });
    } };
  };
  assert.equal(await env.service.restoreBackup(), 'error');
  await signout;
  assert.equal(env.state.applied.length, 0);
  assert.equal(env.state.userId, null);
});
