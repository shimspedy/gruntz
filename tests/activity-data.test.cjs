const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));
const DATE = '2026-10-03T15:00:00.000Z';
const START = Date.parse(DATE) - 3600000;
const activity = (overrides = {}) => ({ id: 'activity-1', type: 'run', date: DATE, distanceMiles: 1, durationSeconds: 600, elevationFeet: 10, ...overrides });
const point = (index, segment = 0) => ({ latitude: 42 + index / 1e6, longitude: -83, altitude: 100, timestamp: START + index * 1000, speed: 2, segment });
const serialized = state => JSON.stringify({ state, version: 0 });
const snapshot = (sessions, schema = 2) => ({ schema_version: schema, captured_at: DATE, stores: { '@gruntz_readiness': serialized({ trackedSessions: sessions }) } });

function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  const events = [];
  const disk = {
    data, events, failKey: null, delay: null,
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => {
      if (disk.delay) await disk.delay;
      if (key === disk.failKey) throw Error('disk unavailable');
      events.push(`write:${key}`); data.set(key, value);
    },
    removeItem: async key => { events.push(`remove:${key}`); data.delete(key); },
    multiGet: async keys => keys.map(key => [key, data.get(key) ?? null]),
    multiSet: async pairs => { for (const [key, value] of pairs) { events.push(`write:${key}`); data.set(key, value); } },
    multiRemove: async keys => { for (const key of keys) { events.push(`remove:${key}`); data.delete(key); } },
  };
  return disk;
}
function loader(disk, overrides = {}) {
  return createLoader({
    '@react-native-async-storage/async-storage': disk,
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-secure-store': { getItemAsync: async () => null, setItemAsync: async () => {} },
    '../services/notifications': { cancelRestDone: async () => {} },
    './notifications': { cancelRestDone: async () => {}, clearWorkoutProgress: async () => {} },
    './activityTracking': { stopActiveActivityForDataChange: async () => {
      disk.events.push('tracking-stopped');
      await disk.removeItem('@gruntz_active_activity');
    } },
    ...overrides,
  });
}

test('saved activities retain more than 400 entries and deduplicate stable IDs', async () => {
  const disk = storage();
  const { useReadinessStore, flushReadinessPersistence } = loader(disk)('src/store/useReadinessStore.ts');
  await tick();
  for (let i = 0; i < 405; i++) assert.equal(useReadinessStore.getState().addTrackedSession(activity({ id: `activity-${i}` })), true);
  assert.equal(useReadinessStore.getState().addTrackedSession(activity({ id: 'activity-0', distanceMiles: 1000 })), false);
  await flushReadinessPersistence();
  assert.equal(useReadinessStore.getState().trackedSessions.length, 405);
  assert.equal(useReadinessStore.getState().trackedSessions.at(-1).distanceMiles, 1);
  assert.equal(JSON.parse(disk.data.get('@gruntz_readiness')).state.trackedSessions.length, 405);
});

test('long routes retain both pause boundaries and endpoints without changing recorded totals', async () => {
  const disk = storage();
  const load = loader(disk);
  const { MAX_SAVED_ROUTE_POINTS } = load('src/features/activityHistory.ts');
  const { useReadinessStore } = load('src/store/useReadinessStore.ts');
  await tick();
  const route = Array.from({ length: 8000 }, (_, i) => point(i, i < 4000 ? 0 : 1));
  assert.equal(useReadinessStore.getState().addTrackedSession(activity({ route, type: 'hike', distanceMiles: 15.5, durationSeconds: 9000 })), true);
  const saved = useReadinessStore.getState().trackedSessions[0];
  assert.equal(saved.route.length, MAX_SAVED_ROUTE_POINTS);
  assert.equal(saved.route[0].timestamp, route[0].timestamp);
  assert.equal(saved.route.at(-1).timestamp, route.at(-1).timestamp);
  assert.ok(saved.route.some(p => p.timestamp === route[3999].timestamp));
  assert.ok(saved.route.some(p => p.timestamp === route[4000].timestamp));
  assert.equal(saved.distanceMiles, 15.5);
  assert.equal(saved.durationSeconds, 9000);
  route[0].latitude = 0;
  assert.equal(saved.route[0].latitude, 42);
});

test('durability waits for native storage and retries a failed latest write', async () => {
  const disk = storage();
  const { useReadinessStore, flushReadinessPersistence } = loader(disk)('src/store/useReadinessStore.ts');
  await tick();
  let resolve;
  disk.delay = new Promise(done => { resolve = done; });
  useReadinessStore.getState().addTrackedSession(activity());
  let finished = false;
  const flush = flushReadinessPersistence().then(() => { finished = true; });
  await tick(); assert.equal(finished, false);
  disk.delay = null; resolve(); await flush;
  disk.failKey = '@gruntz_readiness';
  useReadinessStore.getState().addTrackedSession(activity({ id: 'activity-2' }));
  await assert.rejects(flushReadinessPersistence(), /disk unavailable/);
  disk.failKey = null;
  await flushReadinessPersistence();
  assert.equal(JSON.parse(disk.data.get('@gruntz_readiness')).state.trackedSessions.length, 2);
});

for (const failed of ['@gruntz_readiness', '@gruntz_user']) {
  test(`finish replay after ${failed} write failure saves history and credits mileage exactly once`, async () => {
    const disk = storage();
    let load = loader(disk);
    let readiness = load('src/store/useReadinessStore.ts');
    let user = load('src/store/useUserStore.ts');
    await tick();
    disk.failKey = failed;
    readiness.useReadinessStore.getState().addTrackedSession(activity());
    user.useUserStore.getState().recordTrackedSession({ id: 'activity-1', type: 'run', miles: 1, seconds: 600 });
    const failedFlush = await Promise.allSettled([readiness.flushReadinessPersistence(), user.flushUserPersistence()]);
    assert.ok(failedFlush.some(r => r.status === 'rejected'));
    disk.failKey = null;
    // Fresh modules simulate process death/relaunch: only durable writes survive.
    load = loader(disk);
    readiness = load('src/store/useReadinessStore.ts');
    user = load('src/store/useUserStore.ts');
    await tick();
    readiness.useReadinessStore.getState().addTrackedSession(activity());
    user.useUserStore.getState().recordTrackedSession({ id: 'activity-1', type: 'run', miles: 1, seconds: 600 });
    await Promise.all([readiness.flushReadinessPersistence(), user.flushUserPersistence()]);
    assert.equal(readiness.useReadinessStore.getState().trackedSessions.length, 1);
    assert.equal(user.useUserStore.getState().progress.total_distance_miles, 1);
    assert.deepEqual(user.useUserStore.getState().progress.credited_activity_ids, ['activity-1']);
    user.useUserStore.getState().recordTrackedSession({ id: 'activity-1', type: 'run', miles: 1, seconds: 600 });
    assert.equal(user.useUserStore.getState().progress.total_distance_miles, 1);
  });
}

test('hiking adds lifetime distance without awarding running or ruck records', async () => {
  const { useUserStore, flushUserPersistence } = loader(storage())('src/store/useUserStore.ts');
  await tick();
  useUserStore.getState().recordTrackedSession({ id: 'hike', type: 'hike', miles: 1, seconds: 300 });
  await flushUserPersistence();
  const progress = useUserStore.getState().progress;
  assert.equal(progress.total_distance_miles, 1);
  assert.deepEqual(progress.best_run_times, {});
  assert.deepEqual(progress.best_ruck_times, {});
  useUserStore.getState().recordTrackedSession({ id: 'invalid', type: 'run', miles: Infinity, seconds: 300 });
  assert.equal(useUserStore.getState().progress.total_distance_miles, 1);
});

test('backup restores complete route metadata and legacy v1 activities through the actual live stores', async () => {
  const disk = storage({ '@gruntz_active_activity': 'old native draft' });
  const load = loader(disk);
  const readiness = load('src/store/useReadinessStore.ts');
  const service = load('src/services/backupSnapshot.ts');
  await tick();
  const saved = activity({ type: 'hike', startedAt: new Date(START).toISOString(), steps: 15000, caloriesEstimate: 500, title: 'Morning hike', stepsLimited: true, route: [point(0), point(1)] });
  await service.applySnapshot(snapshot([saved]));
  assert.deepEqual(readiness.useReadinessStore.getState().trackedSessions, [saved]);
  assert.equal(disk.data.has('@gruntz_active_activity'), false);
  const stopAt = disk.events.indexOf('tracking-stopped');
  assert.ok(stopAt >= 0 && stopAt < disk.events.lastIndexOf('write:@gruntz_readiness'));
  readiness.useReadinessStore.getState().setIncludeActivityRoutesInBackup(true);
  await readiness.flushReadinessPersistence();
  const captured = await service.captureSnapshot();
  assert.equal(captured.schema_version, 2);
  assert.equal(service.snapshotWorkoutCount(captured), 1);
  assert.deepEqual(JSON.parse(captured.stores['@gruntz_readiness']).state.trackedSessions[0].route, saved.route);
  const legacy = activity({ id: 'old-run' });
  await service.applySnapshot(snapshot([legacy], 1));
  assert.deepEqual(readiness.useReadinessStore.getState().trackedSessions, [legacy]);
  assert.equal(readiness.useReadinessStore.getState().includeActivityRoutesInBackup, false);
});

test('cloud routes require explicit opt-in, while local history always retains the route', async () => {
  const disk = storage();
  const load = loader(disk);
  const { useReadinessStore, flushReadinessPersistence } = load('src/store/useReadinessStore.ts');
  const { captureSnapshot } = load('src/services/backupSnapshot.ts');
  await tick();
  assert.equal(useReadinessStore.getState().includeActivityRoutesInBackup, false);
  const saved = activity({ route: [point(0), point(1)] });
  useReadinessStore.getState().addTrackedSession(saved);
  await flushReadinessPersistence();
  const local = disk.data.get('@gruntz_readiness');
  const first = JSON.parse((await captureSnapshot()).stores['@gruntz_readiness']).state;
  assert.equal(first.trackedSessions[0].route, undefined);
  assert.equal(first.trackedSessions[0].distanceMiles, 1);
  assert.equal(disk.data.get('@gruntz_readiness'), local);
  useReadinessStore.getState().setIncludeActivityRoutesInBackup(true);
  await flushReadinessPersistence();
  const optedIn = JSON.parse((await captureSnapshot()).stores['@gruntz_readiness']).state;
  assert.deepEqual(optedIn.trackedSessions[0].route, saved.route);
  useReadinessStore.getState().setIncludeActivityRoutesInBackup(false);
  await flushReadinessPersistence();
  assert.equal(JSON.parse((await captureSnapshot()).stores['@gruntz_readiness']).state.trackedSessions[0].route, undefined);
  assert.deepEqual(JSON.parse(disk.data.get('@gruntz_readiness')).state.trackedSessions[0].route, saved.route);
});

test('existing backup users with no route preference never upload precise routes', async () => {
  const saved = activity({ route: [point(0)] });
  const raw = serialized({ trackedSessions: [saved] });
  const disk = storage({ '@gruntz_readiness': raw });
  const { captureSnapshot } = loader(disk)('src/services/backupSnapshot.ts');
  const captured = await captureSnapshot();
  assert.equal(JSON.parse(captured.stores['@gruntz_readiness']).state.trackedSessions[0].route, undefined);
  assert.equal(disk.data.get('@gruntz_readiness'), raw);
});

test('invalid GPS coordinates, dates, timestamps and route sizes reject before stopping tracking or touching disk', async () => {
  const disk = storage({ '@gruntz_readiness': 'original', '@gruntz_active_activity': 'active' });
  const load = loader(disk, { './backupRestoreStores': { prepareStoreRestore: async () => () => {} } });
  const service = load('src/services/backupSnapshot.ts');
  const { MAX_SAVED_ROUTE_POINTS } = load('src/features/activityHistory.ts');
  for (const invalid of [
    activity({ date: 'invalid' }),
    activity({ route: [{ ...point(0), latitude: 91 }] }),
    activity({ route: [{ ...point(0), longitude: -181 }] }),
    activity({ route: [{ ...point(0), timestamp: -1 }] }),
    activity({ route: [point(2), point(1)] }),
    activity({ route: [point(0, 1), point(1, 0)] }),
    activity({ route: Array.from({ length: MAX_SAVED_ROUTE_POINTS + 1 }, (_, i) => point(i)) }),
  ]) await assert.rejects(service.applySnapshot(snapshot([invalid])), /activity history/);
  assert.equal(disk.data.get('@gruntz_readiness'), 'original');
  assert.equal(disk.data.get('@gruntz_active_activity'), 'active');
  assert.deepEqual(disk.events, []);
});

test('oversized backup is rejected rather than silently trimming older history', () => {
  const disk = storage();
  const service = loader(disk)('src/services/backupSnapshot.ts');
  const huge = { schema_version: 2, captured_at: DATE, stores: { '@gruntz_exercise_notes': 'x'.repeat(service.MAX_BACKUP_PAYLOAD_BYTES + 1) } };
  assert.throws(() => service.validateSnapshot(huge), { code: 'backup-too-large' });
  assert.deepEqual(disk.events, []);
});

test('a workout done ahead of schedule keeps the streak alive on the next launch', async () => {
  const load = loader(storage());
  const { useUserStore } = load('src/store/useUserStore.ts');
  await tick();
  const future = new Date(Date.now() + 3 * 86400000);
  const mission_date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
  useUserStore.getState().completeMission({
    mission_date, workout_day_id: 'early', exercises: [], total_xp: 10, completion_bonus: 0, pr_bonus: 0, has_personal_record: false,
  });
  assert.equal(useUserStore.getState().progress.streak_days, 1);
  assert.notEqual(useUserStore.getState().progress.last_workout_date, mission_date);
  useUserStore.getState().updateStreak();
  assert.equal(useUserStore.getState().progress.streak_days, 1);
});
