const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader } = require('./workout-test-utils.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));
const DATE = '2026-10-03T15:00:00.000Z';
const START = Date.parse(DATE) - 3600000;
const READINESS = '@gruntz_readiness';
const routeKey = id => `@gruntz_route:${id}`;
const activity = (overrides = {}) => ({ id: 'activity-1', type: 'run', date: DATE, distanceMiles: 1, durationSeconds: 600, elevationFeet: 10, ...overrides });
const point = (index, segment = 0) => ({ latitude: 42 + index / 1e6, longitude: -83, altitude: 100, timestamp: START + index * 1000, speed: 2, segment });
const serialized = state => JSON.stringify({ state, version: 0 });
const snapshot = sessions => ({ schema_version: 2, captured_at: DATE, stores: { [READINESS]: serialized({ trackedSessions: sessions }) } });
const routeKeys = disk => [...disk.data.keys()].filter(key => key.startsWith('@gruntz_route:'));
const storedSessions = disk => JSON.parse(disk.data.get(READINESS)).state.trackedSessions;

function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  const events = [];
  const disk = {
    data, events, failKey: null, failRead: null, beforeWrite: null,
    getItem: async key => {
      if (key === disk.failRead) throw Error('read failed');
      return data.get(key) ?? null;
    },
    getAllKeys: async () => [...data.keys()],
    setItem: async (key, value) => {
      if (key === disk.failKey) throw Error('disk unavailable');
      disk.beforeWrite?.(key, value);
      events.push(`write:${key}`); data.set(key, value);
    },
    removeItem: async key => { events.push(`remove:${key}`); data.delete(key); },
    multiGet: async keys => keys.map(key => [key, data.get(key) ?? null]),
    multiSet: async pairs => { for (const [key, value] of pairs) await disk.setItem(key, value); },
    multiRemove: async keys => { for (const key of keys) { events.push(`remove:${key}`); data.delete(key); } },
  };
  return disk;
}
// A fresh loader is a fresh process: only what reached `disk` survives.
function launch(disk) {
  const load = createLoader({
    '@react-native-async-storage/async-storage': disk,
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-secure-store': { getItemAsync: async () => null, setItemAsync: async () => {} },
    '../services/notifications': { cancelRestDone: async () => {} },
    './notifications': { cancelRestDone: async () => {}, clearWorkoutProgress: async () => {} },
    './activityTracking': { stopActiveActivityForDataChange: async () => {} },
  });
  return {
    load,
    readiness: load('src/store/useReadinessStore.ts'),
    routes: load('src/store/activityRoutes.ts'),
    backup: () => load('src/services/backupSnapshot.ts'),
  };
}
async function hydrated(disk) {
  const app = launch(disk);
  await tick();
  await app.readiness.routeMigrationSettled();
  await app.readiness.flushReadinessPersistence();
  return app;
}

test('a saved route round-trips exactly: the points loaded are the points saved', async () => {
  const disk = storage();
  const app = await hydrated(disk);
  // Full double precision, missing sensors, pauses and an omitted segment all survive.
  const route = [
    { latitude: 1e-7, longitude: 5e-324, altitude: 8848.86, timestamp: START, speed: 0 },
    { latitude: 42.412341234567891, longitude: -83.532847123456789, altitude: 154.31234567891234, timestamp: START, speed: 2.3456789012345678, segment: 0 },
    { latitude: -89.99999999999999, longitude: 179.99999999999997, altitude: null, timestamp: START + 1, speed: null, segment: 0 },
    { latitude: 0, longitude: -0.000001, altitude: -12.5, timestamp: START + 1, speed: -1, segment: 3 },
  ];
  const expected = route.map(value => ({ ...value }));
  assert.equal(await app.readiness.saveTrackedActivity(activity({ route })), true);
  await app.readiness.flushReadinessPersistence();
  assert.deepEqual(app.readiness.useReadinessStore.getState().trackedSessions, [activity({ routePoints: 4 })]);
  assert.deepEqual(storedSessions(disk), [activity({ routePoints: 4 })]);
  assert.deepEqual(routeKeys(disk), [routeKey('activity-1')]);
  assert.deepEqual(await app.routes.loadRoute('activity-1'), expected);
  // From disk in a new process, not from the cache.
  const reopened = await hydrated(disk);
  assert.deepEqual(await reopened.routes.loadRoute('activity-1'), expected);
  assert.deepEqual((await reopened.routes.loadActivityRoute(reopened.readiness.useReadinessStore.getState().trackedSessions[0])), { status: 'ready', route: expected });
  // A 6000-point route is stored whole.
  const long = Array.from({ length: 6000 }, (_, index) => point(index, index < 3000 ? 0 : 1));
  assert.equal(await reopened.readiness.saveTrackedActivity(activity({ id: 'long', route: long })), true);
  assert.deepEqual(await launch(disk).routes.loadRoute('long'), long);
  assert.equal(reopened.readiness.useReadinessStore.getState().trackedSessions[0].routePoints, 6000);
});

test('a route write is durable before its summary, and unrelated store writes never touch routes', async () => {
  const disk = storage();
  const app = await hydrated(disk);
  await app.readiness.saveTrackedActivity(activity({ route: [point(0), point(1)] }));
  await app.readiness.flushReadinessPersistence();
  assert.ok(disk.events.indexOf(`write:${routeKey('activity-1')}`) < disk.events.indexOf(`write:${READINESS}`));
  // The store refuses to take an inline route by the synchronous path.
  assert.equal(app.readiness.useReadinessStore.getState().addTrackedSession(activity({ id: 'inline', route: [point(0)] })), false);
  disk.events.length = 0;
  app.readiness.useReadinessStore.getState().setFieldPreference('audioCues', false);
  app.readiness.useReadinessStore.getState().saveCheckIn({ date: '2026-10-03', sleepHours: 8, soreness: 2, energy: 4, stress: 2, hydration: 4 });
  await app.readiness.flushReadinessPersistence();
  assert.ok(disk.events.length > 0 && disk.events.every(event => event === `write:${READINESS}`));
  assert.ok(!disk.data.get(READINESS).includes('latitude'));
});

test('a failed route write saves nothing, credits nothing, keeps the recorder draft and can be replayed once', async () => {
  const disk = storage({ '@gruntz_active_activity': 'finished draft' });
  let app = launch(disk);
  let user = app.load('src/store/useUserStore.ts');
  await tick();
  const recorded = activity({ route: [point(0), point(1), point(2)] });
  // The same steps RunTrackerScreen takes, stopping at the first failure as it does.
  const finish = async () => {
    const added = await app.readiness.saveTrackedActivity(recorded);
    if (!added && !app.readiness.useReadinessStore.getState().trackedSessions.some(item => item.id === recorded.id)) throw Error('not saved');
    user.useUserStore.getState().recordTrackedSession({ id: recorded.id, type: 'run', miles: 1, seconds: 600 });
    await Promise.all([app.readiness.flushReadinessPersistence(), user.flushUserPersistence()]);
    await disk.removeItem('@gruntz_active_activity');
  };
  disk.failKey = routeKey('activity-1');
  await assert.rejects(finish(), /disk unavailable/);
  assert.deepEqual(app.readiness.useReadinessStore.getState().trackedSessions, []);
  assert.equal(user.useUserStore.getState().progress.total_distance_miles, 0);
  assert.equal(disk.data.get('@gruntz_active_activity'), 'finished draft');
  assert.deepEqual(routeKeys(disk), []);
  // The summary write failing after the route was stored is just as recoverable.
  disk.failKey = READINESS;
  await assert.rejects(finish(), /disk unavailable/);
  assert.equal(disk.data.get('@gruntz_active_activity'), 'finished draft');
  assert.deepEqual(routeKeys(disk), [routeKey('activity-1')]);
  disk.failKey = null;
  // Process death, then the replay from the kept draft.
  app = launch(disk);
  user = app.load('src/store/useUserStore.ts');
  await tick();
  await finish();
  assert.equal(disk.data.has('@gruntz_active_activity'), false);
  await finish().catch(() => undefined);
  assert.deepEqual(storedSessions(disk), [activity({ routePoints: 3 })]);
  assert.equal(user.useUserStore.getState().progress.total_distance_miles, 1);
  assert.deepEqual(user.useUserStore.getState().progress.credited_activity_ids, ['activity-1']);
  assert.deepEqual(await launch(disk).routes.loadRoute('activity-1'), recorded.route);
});

test('the tracker saves the route and history durably before it clears the recorder draft', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/screens/RunTrackerScreen.tsx'), 'utf8');
  const body = source.slice(source.indexOf('const stopAndSave'), source.indexOf('const end = '));
  const order = ['await saveTrackedActivity(', 'recordTrackedSession({', 'await Promise.all([flushReadinessPersistence(), flushUserPersistence()])', 'await tracker.clearFinished()'].map(step => body.indexOf(step));
  assert.ok(order.every(index => index >= 0), 'each step is present');
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.ok(!body.includes('addTrackedSession'));
});

test('inline routes from an older build migrate losslessly; a failed write stays inline and completes on the next launch', async () => {
  const first = [point(0), point(1), { ...point(2), altitude: null, speed: null }];
  const second = Array.from({ length: 6000 }, (_, index) => point(index, index < 10 ? 0 : 1));
  const old = [activity({ route: first, title: 'One' }), activity({ id: 'activity-2', route: second }), activity({ id: 'plain' }), activity({ id: 'empty', route: [] })];
  const original = serialized({ trackedSessions: old, includeActivityRoutesInBackup: true, fieldMode: true });
  const disk = storage({ [READINESS]: original });
  // At no write may a route exist neither inline nor in route storage.
  const everywhere = new Map(old.filter(item => item.route?.length).map(item => [item.id, item.route]));
  let checked = 0;
  disk.beforeWrite = (key, value) => {
    if (key !== READINESS) return;
    for (const session of JSON.parse(value).state.trackedSessions) {
      if (!everywhere.has(session.id)) continue;
      checked += 1;
      if (session.route) assert.deepEqual(session.route, everywhere.get(session.id));
      else assert.deepEqual(JSON.parse(disk.data.get(routeKey(session.id))).points, everywhere.get(session.id));
    }
  };
  disk.failKey = routeKey('activity-2');
  let app = await hydrated(disk);
  let sessions = app.readiness.useReadinessStore.getState().trackedSessions;
  assert.deepEqual(sessions[0], activity({ title: 'One', routePoints: 3 }));
  assert.deepEqual(sessions[1], old[1], 'the route that could not be written is still inline');
  assert.deepEqual(sessions[2], activity({ id: 'plain' }));
  assert.deepEqual(sessions[3], activity({ id: 'empty' }));
  assert.deepEqual(storedSessions(disk)[1].route, second);
  assert.deepEqual(routeKeys(disk), [routeKey('activity-1')]);
  // The unmigrated activity still resolves, and a backup still carries both routes.
  assert.deepEqual(app.routes.activityRouteNow(sessions[1]), { status: 'ready', route: second });
  assert.deepEqual(JSON.parse((await app.backup().captureSnapshot()).stores[READINESS]).state.trackedSessions.map(item => item.route), [first, second, undefined, undefined]);
  // Next launch, storage has recovered.
  disk.failKey = null;
  app = await hydrated(disk);
  sessions = app.readiness.useReadinessStore.getState().trackedSessions;
  assert.deepEqual(sessions, [activity({ title: 'One', routePoints: 3 }), activity({ id: 'activity-2', routePoints: 6000 }), activity({ id: 'plain' }), activity({ id: 'empty' })]);
  assert.deepEqual(storedSessions(disk), sessions);
  assert.ok(!disk.data.get(READINESS).includes('latitude'));
  const state = JSON.parse(disk.data.get(READINESS)).state;
  assert.equal(state.includeActivityRoutesInBackup, true);
  assert.equal(state.fieldMode, true);
  const fresh = launch(disk);
  assert.deepEqual(await fresh.routes.loadRoute('activity-1'), first);
  assert.deepEqual(await fresh.routes.loadRoute('activity-2'), second);
  assert.ok(checked > 0);
  // Running again changes nothing and writes nothing.
  disk.events.length = 0;
  app = await hydrated(disk);
  await app.readiness.migrateInlineRoutes();
  await app.readiness.flushReadinessPersistence();
  assert.deepEqual(disk.events, []);
  // An older build can still restore what this one backs up.
  assert.deepEqual(JSON.parse((await app.backup().captureSnapshot()).stores[READINESS]).state.trackedSessions, [old[0], old[1], old[2], activity({ id: 'empty' })]);
});

test('a migration interrupted after the route writes but before the history write reruns safely', async () => {
  const route = [point(0), point(1)];
  const original = serialized({ trackedSessions: [activity({ route })] });
  const disk = storage({ [READINESS]: original });
  // The process dies before the stripped history reaches disk.
  disk.failKey = READINESS;
  const dying = launch(disk);
  await tick();
  await dying.readiness.routeMigrationSettled();
  await assert.rejects(dying.readiness.flushReadinessPersistence(), /disk unavailable/);
  assert.equal(disk.data.get(READINESS), original);
  assert.deepEqual(routeKeys(disk), [routeKey('activity-1')]);
  disk.failKey = null;
  disk.events.length = 0;
  const app = await hydrated(disk);
  assert.deepEqual(disk.events, [`write:${READINESS}`], 'the identical route is not rewritten');
  assert.deepEqual(storedSessions(disk), [activity({ routePoints: 2 })]);
  assert.deepEqual(await app.routes.loadRoute('activity-1'), route);
});

test('an activity whose route item is missing, corrupt or unreadable still lists with its summary', async () => {
  const disk = storage();
  let app = await hydrated(disk);
  await app.readiness.saveTrackedActivity(activity({ route: [point(0), point(1)] }));
  await app.readiness.saveTrackedActivity(activity({ id: 'no-gps' }));
  await app.readiness.flushReadinessPersistence();
  const good = disk.data.get(routeKey('activity-1'));
  for (const damage of [
    () => disk.data.delete(routeKey('activity-1')),
    () => disk.data.set(routeKey('activity-1'), good.slice(0, good.length / 2)),
    () => disk.data.set(routeKey('activity-1'), JSON.stringify({ v: 1, id: 'someone-else', points: [point(0)] })),
    () => { disk.data.set(routeKey('activity-1'), good); disk.failRead = routeKey('activity-1'); },
  ]) {
    damage();
    app = await hydrated(disk);
    const sessions = app.readiness.useReadinessStore.getState().trackedSessions;
    assert.deepEqual(sessions, [activity({ id: 'no-gps' }), activity({ routePoints: 2 })]);
    assert.deepEqual(app.routes.activityRouteNow(sessions[1]), { status: 'loading', route: [] });
    assert.deepEqual(await app.routes.loadActivityRoute(sessions[1]), { status: 'missing', route: [] });
    assert.deepEqual(await app.routes.loadActivityRoute(sessions[0]), { status: 'none', route: [] });
    // History is not rewritten or trimmed because a route could not be read.
    assert.deepEqual(storedSessions(disk), sessions);
  }
  // With routes opted in, a missing route backs up the summary; a storage failure
  // refuses to upload a copy that would silently lose the route.
  app.readiness.useReadinessStore.getState().setIncludeActivityRoutesInBackup(true);
  await app.readiness.flushReadinessPersistence();
  await assert.rejects(app.backup().captureSnapshot(), /read failed/);
  disk.failRead = null;
  disk.data.delete(routeKey('activity-1'));
  assert.deepEqual(JSON.parse((await app.backup().captureSnapshot()).stores[READINESS]).state.trackedSessions, [activity({ id: 'no-gps' }), activity()]);
});

test('restore moves inline routes into route storage, drops routes of replaced activities and leaves other keys alone', async () => {
  const disk = storage({ '@gruntz_subscription': 'paid' });
  const app = await hydrated(disk);
  await app.readiness.saveTrackedActivity(activity({ id: 'local-only', route: [point(5), point(6)] }));
  await app.readiness.saveTrackedActivity(activity({ id: 'kept', route: [point(7), point(8)] }));
  await app.readiness.flushReadinessPersistence();
  const incoming = [activity({ id: 'kept', route: [point(7), point(8)] }), activity({ id: 'new', route: [point(1), point(2), point(3)] }), activity({ id: 'summary-only', routePoints: 99 })];
  await app.backup().applySnapshot(snapshot(incoming));
  const expected = [activity({ id: 'kept', routePoints: 2 }), activity({ id: 'new', routePoints: 3 }), activity({ id: 'summary-only' })];
  assert.deepEqual(app.readiness.useReadinessStore.getState().trackedSessions, expected);
  assert.deepEqual(storedSessions(disk), expected);
  assert.deepEqual(routeKeys(disk).sort(), [routeKey('kept'), routeKey('new')]);
  assert.equal(disk.data.get('@gruntz_subscription'), 'paid');
  const fresh = launch(disk);
  assert.deepEqual(await fresh.routes.loadRoute('new'), incoming[1].route);
  assert.deepEqual(await fresh.routes.loadRoute('kept'), incoming[0].route);
  assert.equal(await app.routes.loadRoute('local-only'), null);
  // A backup made without routes replaces history wholesale, as it always has.
  await app.backup().applySnapshot(snapshot([activity({ id: 'kept' })]));
  assert.deepEqual(storedSessions(disk), [activity({ id: 'kept' })]);
  assert.deepEqual(routeKeys(disk), []);
});

test('a failed restore leaves the previous history and every one of its routes exactly as they were', async () => {
  const disk = storage();
  const app = await hydrated(disk);
  const mine = [point(5), point(6)];
  await app.readiness.saveTrackedActivity(activity({ id: 'mine', route: mine }));
  await app.readiness.saveTrackedActivity(activity({ id: 'shared', route: mine }));
  await app.readiness.flushReadinessPersistence();
  const activityData = () => new Map([...disk.data].filter(([key]) => key === READINESS || key.startsWith('@gruntz_route:')));
  const before = activityData();
  const incoming = snapshot([activity({ id: 'shared', route: [point(1), point(2), point(3)] }), activity({ id: 'new', route: [point(9)] })]);
  for (const failKey of [READINESS, routeKey('new')]) {
    disk.failKey = failKey;
    // The rollback has to be able to write the history back.
    const original = disk.setItem;
    let failed = false;
    disk.setItem = async (key, value) => {
      if (key === failKey && !failed) { failed = true; throw Error('disk unavailable'); }
      disk.failKey = null;
      return original(key, value);
    };
    await assert.rejects(app.backup().applySnapshot(incoming), /disk unavailable/);
    disk.setItem = original;
    disk.failKey = null;
    assert.deepEqual(activityData(), before);
    assert.deepEqual(app.readiness.useReadinessStore.getState().trackedSessions.map(item => item.id), ['shared', 'mine']);
    assert.deepEqual(await app.routes.loadRoute('shared'), mine);
  }
});

test('deleting activity history removes every route item and nothing else', async () => {
  const disk = storage({ '@gruntz_subscription': 'paid', '@gruntz_user': 'profile' });
  const app = await hydrated(disk);
  for (const id of ['a', 'b', 'c']) await app.readiness.saveTrackedActivity(activity({ id, route: [point(0), point(1)] }));
  await app.readiness.flushReadinessPersistence();
  assert.equal(routeKeys(disk).length, 3);
  // resetLocalData empties the live store, then calls this.
  app.readiness.useReadinessStore.setState(app.readiness.useReadinessStore.getInitialState());
  await app.readiness.flushReadinessPersistence();
  await app.readiness.clearReadinessPersistence();
  assert.deepEqual([...disk.data.keys()].sort(), ['@gruntz_subscription', '@gruntz_user']);
  assert.equal(await app.routes.loadRoute('a'), null, 'the cache is cleared too');
  // Its key prefix also puts every route inside the reset's own `@gruntz` sweep.
  assert.ok(app.routes.ROUTE_KEY_PREFIX.startsWith('@gruntz'));
  const reset = fs.readFileSync(path.resolve(__dirname, '../src/services/resetLocalData.ts'), 'utf8');
  assert.ok(reset.includes('await clearReadinessPersistence()') && reset.includes("key.startsWith('@gruntz')"));
});

test('pruning and removal are exact and keep the cache honest', async () => {
  const disk = storage({ '@gruntz_user': 'profile' });
  const { routes } = launch(disk);
  for (const id of ['a', 'b', 'c']) await routes.saveRoute(id, [point(1), point(2)]);
  await routes.pruneRoutes(['a', 'c', 'never-saved']);
  assert.deepEqual(routeKeys(disk).sort(), [routeKey('a'), routeKey('c')]);
  assert.equal(routes.cachedRoute('b'), undefined);
  assert.equal(await routes.loadRoute('b'), null);
  await routes.removeRoute('a');
  assert.equal(await routes.loadRoute('a'), null);
  assert.equal(disk.data.get('@gruntz_user'), 'profile');
  // Saving the same points again is a no-op on disk; different points replace them.
  disk.events.length = 0;
  await routes.saveRoute('c', [point(1), point(2)]);
  assert.deepEqual(disk.events, []);
  await routes.saveRoute('c', [point(3)]);
  assert.deepEqual(await launch(disk).routes.loadRoute('c'), [point(3)]);
  // The cache is bounded, and an evicted route is read back from storage.
  for (let index = 0; index < 20; index++) await routes.saveRoute(`many-${index}`, [point(index)]);
  assert.equal(routes.cachedRoute('many-0'), undefined);
  assert.deepEqual(routes.cachedRoute('many-19'), [point(19)]);
  assert.deepEqual(await routes.loadRoute('many-0'), [point(0)]);
});
