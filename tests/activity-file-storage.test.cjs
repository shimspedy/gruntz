const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const KEY = '@gruntz_readiness';
const payload = (value) => JSON.stringify({ state: { trackedSessions: [], value }, version: 0 });
const { createDurableFileStorage } = createLoader()('src/store/durableFileStorage.ts');

function environment(old) {
  const legacyData = new Map(old ? [[KEY, old]] : []);
  const fileData = new Map();
  const events = [];
  const legacy = {
    data: legacyData,
    getItem: async (key) => legacyData.get(key) ?? null,
    setItem: async (key, value) => {
      if (key === KEY) throw Error('Readiness must not enter Android SQLite');
      legacyData.set(key, value);
    },
    removeItem: async (key) => { events.push('legacy-removed'); legacyData.delete(key); },
    multiGet: async (keys) => keys.map((key) => [key, legacyData.get(key) ?? null]),
    multiSet: async (pairs) => pairs.forEach(([key, value]) => legacyData.set(key, value)),
    multiRemove: async (keys) => keys.forEach((key) => legacyData.delete(key)),
  };
  const files = {
    data: fileData, truncate: false, failRemove: false,
    read: async (slot) => fileData.get(slot) ?? null,
    write: async (slot, value) => {
      events.push('file-written');
      fileData.set(slot, files.truncate ? value.slice(0, value.length / 2) : value);
    },
    remove: async (slot) => {
      if (files.failRemove) throw Error('delete interrupted');
      fileData.delete(slot);
    },
  };
  return { legacy, files, events, create: () => createDurableFileStorage(KEY, legacy, files) };
}

test('Android file migration validates the complete revision before removing legacy history', async () => {
  const env = environment(payload('legacy'));
  const storage = env.create();
  env.files.truncate = true;
  await assert.rejects(storage.getItem(KEY), /saved completely/);
  assert.equal(env.legacy.data.get(KEY), payload('legacy'));
  assert.ok(!env.events.includes('legacy-removed'));
  env.files.truncate = false;
  assert.equal(await storage.getItem(KEY), payload('legacy'));
  assert.equal(env.legacy.data.has(KEY), false);
  assert.equal(await env.create().getItem(KEY), payload('legacy'));
});

test('torn newest writes recover the prior intact revision after process restart and can retry', async () => {
  const env = environment();
  const storage = env.create();
  await storage.setItem(KEY, payload('first'));
  await storage.setItem(KEY, payload('second'));
  env.files.truncate = true;
  await assert.rejects(storage.setItem(KEY, payload('third')), /saved completely/);
  assert.equal(await env.create().getItem(KEY), payload('second'));
  env.files.truncate = false;
  await storage.setItem(KEY, payload('third'));
  assert.equal(await env.create().getItem(KEY), payload('third'));
  assert.equal(env.files.data.size, 2);
});

test('checksum failures fall back; two corrupt files are preserved and block writes', async () => {
  const env = environment();
  const storage = env.create();
  await storage.setItem(KEY, payload('first'));
  await storage.setItem(KEY, payload('second'));
  const second = JSON.parse(env.files.data.get(1));
  second.payload = payload('tampered');
  env.files.data.set(1, JSON.stringify(second));
  assert.equal(await env.create().getItem(KEY), payload('first'));
  env.files.data.set(0, '{broken');
  const retained = new Map(env.files.data);
  await assert.rejects(env.create().getItem(KEY), /existing files have been kept/);
  await assert.rejects(env.create().setItem(KEY, payload('defaults')), /existing files have been kept/);
  assert.deepEqual(env.files.data, retained);
});

test('queued writes preserve order and interrupted reset cannot resurrect an old slot', async () => {
  const env = environment();
  const storage = env.create();
  await Promise.all([storage.setItem(KEY, payload('one')), storage.setItem(KEY, payload('two'))]);
  assert.equal(await env.create().getItem(KEY), payload('two'));
  env.files.failRemove = true;
  await assert.rejects(storage.removeItem(KEY), /delete interrupted/);
  assert.equal(await env.create().getItem(KEY), null);
  env.files.failRemove = false;
  await env.create().removeItem(KEY);
  assert.equal(env.files.data.size, 0);
  assert.equal(env.legacy.data.has(KEY), false);
  assert.equal(await env.create().getItem(KEY), null);
});

function androidLoader(env) {
  const slot = (path) => { const match = path.match(/history-(\d)\.json$/); return match ? Number(match[1]) : null; };
  // History slots keep their fault injection; route files are an ordinary directory.
  const ROUTES = 'file:///documents/gruntz-routes/';
  env.routeFiles ??= new Map();
  const routes = env.routeFiles;
  return createLoader({
    '@react-native-async-storage/async-storage': env.legacy,
    'react-native': { Platform: { OS: 'android' } },
    'expo-file-system/legacy': {
      documentDirectory: 'file:///documents/',
      getInfoAsync: async (path) => ({ exists: slot(path) !== null ? env.files.data.has(slot(path)) : path === ROUTES ? env.routeDirectory === true : routes.has(path) }),
      readAsStringAsync: async (path) => {
        if (slot(path) !== null) return env.files.read(slot(path));
        if (!routes.has(path)) throw Error('no such file');
        return routes.get(path);
      },
      writeAsStringAsync: async (path, value) => {
        if (slot(path) !== null) return env.files.write(slot(path), value);
        if (!path.startsWith(ROUTES) || !env.routeDirectory) throw Error('no such directory');
        if (env.failRoute?.(path)) throw Error('route disk full');
        routes.set(path, env.tearRoutes ? value.slice(0, value.length / 2) : value);
      },
      makeDirectoryAsync: async (path) => { if (path === ROUTES) env.routeDirectory = true; },
      readDirectoryAsync: async () => [...routes.keys()].map((path) => path.slice(ROUTES.length)),
      moveAsync: async ({ from, to }) => { routes.set(to, routes.get(from)); routes.delete(from); },
      deleteAsync: async (path) => {
        if (slot(path) !== null) return env.files.remove(slot(path));
        if (path === ROUTES) { routes.clear(); env.routeDirectory = false; } else routes.delete(path);
      },
    },
    './backupRestoreStores': { prepareStoreRestore: async () => async () => {} },
    './activityTracking': { stopActiveActivityForDataChange: async () => {} },
  });
}

const longRoute = (offset = 0) => Array.from({ length: 6000 }, (_, index) => ({ latitude: 42.412341 + (index + offset) / 1e7, longitude: -83.532847, altitude: 154.31, timestamp: 1791040000000 + index * 2000, speed: 2.345, segment: 0 }));
const longActivity = (index) => ({ id: `long-${index}`, type: 'hike', date: '2026-10-03T12:00:00Z', distanceMiles: 7, durationSeconds: 12000, elevationFeet: 500 });
const routePath = (id) => `file:///documents/gruntz-routes/r-${id}.json`;

test('actual Android readiness store rehydrates a >2 MB history written by an older build, then moves its routes into files', async () => {
  const env = environment();
  const load = androidLoader(env);
  // What the previous build left on disk: every route inline in one file revision.
  const inline = Array.from({ length: 4 }, (_, index) => ({ ...longActivity(index), route: longRoute(index) }));
  const old = JSON.stringify({ state: { trackedSessions: inline }, version: 0 });
  assert.ok(Buffer.byteLength(old) > 2 * 1024 * 1024);
  await load('src/store/readinessStorage.ts').readinessStorage.setItem(KEY, old);
  const readiness = load('src/store/useReadinessStore.ts');
  await readiness.useReadinessStore.persist.rehydrate();
  assert.equal(readiness.useReadinessStore.getState().trackedSessions.length, 4);
  await readiness.migrateInlineRoutes();
  await readiness.flushReadinessPersistence();
  const raw = await load('src/store/readinessStorage.ts').readinessStorage.getItem(KEY);
  assert.ok(Buffer.byteLength(raw) < 4096, 'history no longer carries routes');
  assert.equal(env.routeFiles.size, 4);
  // Neither the history nor any route may enter Android SQLite.
  assert.equal(env.legacy.data.size, 0);
  const reopenedLoad = androidLoader(env);
  const reopened = reopenedLoad('src/store/useReadinessStore.ts');
  await reopened.useReadinessStore.persist.rehydrate();
  assert.equal(reopened.useReadinessStore.getState().trackedSessions.length, 4);
  assert.equal(reopened.useReadinessStore.getState().trackedSessions[3].route, undefined);
  assert.equal(reopened.useReadinessStore.getState().trackedSessions[3].routePoints, 6000);
  assert.deepEqual(await reopenedLoad('src/store/activityRoutes.ts').loadRoute('long-3'), inline[3].route);
  const backup = load('src/services/backupSnapshot.ts');
  const captured = await backup.captureSnapshot();
  assert.equal(JSON.parse(captured.stores[KEY]).state.trackedSessions.length, 4);
  assert.equal(JSON.parse(captured.stores[KEY]).state.trackedSessions[0].route, undefined);
  readiness.useReadinessStore.getState().setIncludeActivityRoutesInBackup(true);
  await readiness.flushReadinessPersistence();
  const fullBackup = await backup.captureSnapshot();
  assert.deepEqual(JSON.parse(fullBackup.stores[KEY]).state.trackedSessions, inline);
  await readiness.clearReadinessPersistence();
  assert.equal(env.files.data.size, 0);
  assert.equal(env.routeFiles.size, 0, 'deleting activity history deletes its route files');
  await backup.applySnapshot(fullBackup);
  assert.equal(JSON.parse(await load('src/store/readinessStorage.ts').readinessStorage.getItem(KEY)).state.trackedSessions.length, 4);
  assert.deepEqual(await androidLoader(env)('src/store/activityRoutes.ts').loadRoute('long-0'), inline[0].route);
  assert.equal(env.legacy.data.size, 0);
  // A backup omitting readiness must clear both file slots, legacy data and every route file.
  await backup.applySnapshot({ schema_version: 2, captured_at: '2026-10-03T12:00:00Z', stores: { '@gruntz_exercise_log': JSON.stringify({ state: { logs: {} }, version: 0 }) } });
  assert.equal(env.files.data.size, 0);
  assert.equal(env.routeFiles.size, 0);
  assert.equal(env.legacy.data.has(KEY), false);
});

test('Android saves a new 6000-point route as its own file before the summary and survives a torn route write', async () => {
  const env = environment();
  const load = androidLoader(env);
  const readiness = load('src/store/useReadinessStore.ts');
  await readiness.useReadinessStore.persist.rehydrate();
  const route = longRoute();
  env.tearRoutes = true;
  await assert.rejects(readiness.saveTrackedActivity({ ...longActivity(0), route }), /saved completely/);
  assert.equal(readiness.useReadinessStore.getState().trackedSessions.length, 0);
  assert.equal(env.routeFiles.has(routePath('long-0')), false, 'a torn write never appears under the real name');
  env.tearRoutes = false;
  assert.equal(await readiness.saveTrackedActivity({ ...longActivity(0), route }), true);
  await readiness.flushReadinessPersistence();
  assert.deepEqual([...env.routeFiles.keys()], [routePath('long-0')]);
  assert.equal(env.legacy.data.size, 0);
  const reopened = androidLoader(env);
  assert.deepEqual(await reopened('src/store/activityRoutes.ts').loadRoute('long-0'), route);
  // IDs that are not safe file names still get one distinct, valid file each.
  const { routeFileName } = load('src/store/activityRoutes.ts');
  const names = ['a/b', 'a%2Fb', '../x', 'A', 'a', 'x'.repeat(200), `${'x'.repeat(199)}y`, '\ud800'].map(routeFileName);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) assert.match(name, /^[A-Za-z0-9%_-]{1,200}\.json$/);
});

test('failed Android restore retains the previous file revision and rolls back other stores', async () => {
  const env = environment();
  const load = androidLoader(env);
  const storage = load('src/store/readinessStorage.ts').readinessStorage;
  await storage.setItem(KEY, payload('original history'));
  const user = JSON.stringify({ state: { progress: { current_xp: 42 } }, version: 0 });
  env.legacy.data.set('@gruntz_user', user);
  env.files.truncate = true;
  const backup = load('src/services/backupSnapshot.ts');
  await assert.rejects(backup.applySnapshot({ schema_version: 2, captured_at: '2026-10-03T12:00:00Z', stores: {
    [KEY]: payload('replacement history'),
    '@gruntz_user': JSON.stringify({ state: { progress: { current_xp: 100 } }, version: 0 }),
  } }), /saved completely/);
  assert.equal(await storage.getItem(KEY), payload('original history'));
  assert.equal(env.legacy.data.get('@gruntz_user'), user);
});
