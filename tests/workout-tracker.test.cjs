const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function trackerHarness(options = {}) {
  let now = 100000;
  const disk = options.disk ?? new Map();
  const watches = [];
  const stepWatches = [];
  let backgroundStarted = options.backgroundStarted ?? false;
  let backgroundStarts = 0;
  let backgroundStops = 0;
  let foregroundGranted = true;
  let backgroundGranted = true;
  let backgroundAvailable = true;
  let failLocation = false;
  let failWrite = false;
  let failRead = false;
  let failStop = false;
  let pendingWatch;
  let pendingPermission;
  let querySteps = null;
  const permissionOrder = [];
  const { createActivityTracker, ACTIVE_ACTIVITY_STORAGE_KEY, MAX_ACTIVITY_ROUTE_POINTS } = createLoader()('src/services/activityTrackingCore.ts');
  const engine = createActivityTracker({
    storage: {
      getItem: async (key) => { if (failRead) throw new Error('disk read'); return disk.get(key) ?? null; },
      setItem: async (key, value) => { if (failWrite) throw new Error('disk full'); disk.set(key, value); },
      removeItem: async (key) => { if (failWrite) throw new Error('disk full'); disk.delete(key); },
    },
    now: () => now,
    platform: options.platform ?? 'android',
    foregroundPermission: async () => { permissionOrder.push('foreground'); if (pendingPermission) await pendingPermission.promise; return foregroundGranted; },
    backgroundPermission: async () => { permissionOrder.push('background'); return backgroundGranted; },
    backgroundAvailable: async () => backgroundAvailable,
    startBackground: async () => { backgroundStarts++; if (failLocation) throw new Error('native GPS'); backgroundStarted = true; },
    stopBackground: async () => { if (failStop) throw new Error('native stop'); if (backgroundStarted) backgroundStops++; backgroundStarted = false; },
    hasBackground: async () => backgroundStarted,
    isForeground: options.isForeground,
    watchForeground: async (_, callback, errorCallback) => {
      if (failLocation) throw new Error('GPS unavailable');
      const watch = { callback, errorCallback, removed: false, remove() { this.removed = true; } };
      watches.push(watch);
      if (pendingWatch) await pendingWatch.promise;
      return watch;
    },
    stepsAvailable: async () => true,
    watchSteps: (callback) => {
      const watch = { callback, removed: false, remove() { this.removed = true; } };
      stepWatches.push(watch); return watch;
    },
    getSteps: options.platform === 'ios' ? async () => { if (querySteps === null) throw new Error('no historical steps'); return querySteps; } : undefined,
  });
  const point = (meters, accuracy = 3, speed = 3, timestamp = now, altitude = 10) => ({ timestamp, coords: { latitude: meters / 111195, longitude: 0, altitude, speed, accuracy } });
  return {
    engine, disk, key: ACTIVE_ACTIVITY_STORAGE_KEY, maxPoints: MAX_ACTIVITY_ROUTE_POINTS, watches, stepWatches, permissionOrder,
    get backgroundStarts() { return backgroundStarts; }, get backgroundStops() { return backgroundStops; }, get backgroundStarted() { return backgroundStarted; },
    advance(ms) { now += ms; }, now: () => now, point,
    fix(meters, accuracy = 3, speed = 3) { return engine.acceptLocations([point(meters, accuracy, speed)]); },
    steps(count) { stepWatches.at(-1).callback(count); },
    setFailLocation(value) { failLocation = value; }, setFailWrite(value) { failWrite = value; }, setFailRead(value) { failRead = value; }, setFailStop(value) { failStop = value; },
    setForegroundGranted(value) { foregroundGranted = value; }, setBackgroundGranted(value) { backgroundGranted = value; },
    setBackgroundAvailable(value) { backgroundAvailable = value; }, setQuerySteps(value) { querySteps = value; },
    waitForWatch() { pendingWatch = deferred(); return pendingWatch; }, waitForPermission() { pendingPermission = deferred(); return pendingPermission; },
    flush: () => engine.hydrate(),
  };
}

test('failed resume preserves the entire pause and stop captures elapsed time and final steps', async () => {
  const env = trackerHarness();
  assert.equal(await env.engine.start({ backgroundTracking: false }), true);
  env.advance(12345); env.steps(17);
  await env.engine.pause();
  env.advance(10000); env.setFailLocation(true);
  assert.equal(await env.engine.resume(), false);
  env.advance(15000); env.setFailLocation(false);
  assert.equal(await env.engine.resume(), true);
  env.advance(4321); env.steps(6);
  const final = await env.engine.stop();
  assert.equal(final.durationMs, 16666);
  assert.equal(final.steps, 23);
  env.advance(10000);
  assert.equal((await env.engine.stop()).durationMs, 16666);
});

test('paused movement and poor GPS fixes never add mileage, while valid small movements accumulate', async () => {
  const env = trackerHarness();
  await env.engine.start(); await env.fix(0);
  env.advance(2000); await env.fix(20);
  const before = env.engine.getSnapshot().distanceMiles;
  await env.engine.pause(); env.advance(10000); await env.engine.resume();
  await env.fix(70);
  assert.equal(env.engine.getSnapshot().distanceMiles, before);
  env.advance(2000); await env.fix(100, 100);
  env.advance(2000); await env.fix(120);
  assert.equal(env.engine.getSnapshot().distanceMiles, before);
  for (let i = 1; i <= 5; i++) { env.advance(2000); await env.fix(120 + i * 4, 10); }
  assert.ok(env.engine.getSnapshot().distanceMiles > before);
  env.advance(2000); await env.fix(150, 3, -1);
  assert.equal(env.engine.getSnapshot().currentSpeedMph, null);
});

test('an imprecise fix every few seconds does not throw away the distance walked between them', async () => {
  const env = trackerHarness();
  await env.engine.start(); await env.fix(0, 10);
  // 1.5 m/s for ten minutes, every fifth fix too imprecise to use.
  for (let i = 1; i <= 300; i++) { env.advance(2000); await env.fix(i * 3, i % 5 === 0 ? 40 : 10, 1.5); }
  const meters = env.engine.getSnapshot().distanceMiles / 0.000621371;
  assert.ok(meters > 850 && meters <= 900, `recorded ${meters} m of 900`);
  assert.equal(new Set(env.engine.getSnapshot().route.map((point) => point.segment)).size, 1);
});

test('standing still with a working GPS is not reported as a signal gap', async () => {
  const env = trackerHarness();
  await env.engine.start(); await env.fix(0);
  for (let i = 0; i < 100; i++) { env.advance(2000); await env.fix(0, 3, 0); }
  for (let i = 1; i <= 10; i++) { env.advance(2000); await env.fix(i * 6); }
  const snapshot = env.engine.getSnapshot();
  assert.equal(snapshot.recoveryNotice, null);
  assert.equal(new Set(snapshot.route.map((point) => point.segment)).size, 1);
  assert.ok(snapshot.distanceMiles > 0);
});

test('altitude noise on a flat route does not add up to a climb, while a real hill still counts', async () => {
  const flat = trackerHarness(); await flat.engine.start();
  for (let i = 0; i <= 300; i++) { await flat.engine.acceptLocations([flat.point(i * 4, 5, 2, flat.now(), 100 + (i % 2 ? 3 : -3))]); flat.advance(2000); }
  assert.ok(flat.engine.getSnapshot().elevationGainFt < 30, `flat route recorded ${flat.engine.getSnapshot().elevationGainFt} ft`);
  const hill = trackerHarness(); await hill.engine.start();
  for (let i = 0; i <= 300; i++) { await hill.engine.acceptLocations([hill.point(i * 4, 5, 2, hill.now(), 100 + i / 3)]); hill.advance(2000); }
  const feet = hill.engine.getSnapshot().elevationGainFt;
  assert.ok(feet > 280 && feet < 340, `100 m hill recorded ${feet} ft`);
});

test('a background relaunch with GPS still running keeps recording instead of pausing it', async () => {
  const first = trackerHarness({ platform: 'ios' }); await first.engine.start(); await first.fix(0); first.advance(3000); await first.fix(20);
  await first.flush();
  const relaunched = trackerHarness({ platform: 'ios', disk: first.disk, backgroundStarted: true, isForeground: () => false });
  await relaunched.engine.hydrate();
  assert.equal(relaunched.engine.getSnapshot().isPaused, false);
  assert.equal(relaunched.backgroundStops, 0);
  const opened = trackerHarness({ platform: 'ios', disk: first.disk, backgroundStarted: true, isForeground: () => true });
  await opened.engine.hydrate();
  assert.equal(opened.engine.getSnapshot().isPaused, true);
});

test('late foreground watch is removed after stop and duplicate starts do not reset data', async () => {
  const env = trackerHarness(); const wait = env.waitForWatch();
  const starting = env.engine.start({ backgroundTracking: false });
  while (env.watches.length === 0) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await env.engine.start(), false);
  const stopping = env.engine.stop(); wait.resolve();
  assert.equal(await starting, false);
  await stopping;
  assert.equal(env.watches[0].removed, true);
  assert.equal(env.engine.getSnapshot().isTracking, false);
});

test('background permission is requested only after foreground and uses exactly one native sampling path', async () => {
  const env = trackerHarness();
  assert.equal(await env.engine.start(), true);
  assert.deepEqual(env.permissionOrder, ['foreground', 'background']);
  assert.equal(env.backgroundStarts, 1);
  assert.equal(env.watches.length, 0);
  await env.fix(0); env.advance(3000); await env.fix(20);
  await env.engine.handleAppState('background');
  env.advance(3000); await env.fix(40);
  assert.equal(env.engine.getSnapshot().isPaused, false);
  assert.ok(env.engine.getSnapshot().distanceMiles > 0);
  assert.equal(env.engine.getSnapshot().backgroundEnabled, true);
  assert.equal(JSON.parse(env.disk.get(env.key)).route.length, 3);
  await env.engine.stop();
  assert.equal(env.backgroundStops, 1);
});

test('denied background location falls back explicitly and pauses when leaving the app', async () => {
  const env = trackerHarness(); env.setBackgroundGranted(false);
  assert.equal(await env.engine.start(), true);
  assert.equal(env.engine.getSnapshot().backgroundEnabled, false);
  assert.match(env.engine.getSnapshot().error, /Keep Gruntz open/);
  env.advance(8000); await env.engine.handleAppState('background');
  assert.equal(env.engine.getSnapshot().isPaused, true);
  env.advance(30000);
  assert.equal((await env.engine.stop()).durationMs, 8000);
});

test('denied foreground permission never starts hardware and can be retried', async () => {
  const env = trackerHarness(); env.setForegroundGranted(false);
  assert.equal(await env.engine.start(), false);
  assert.equal(env.backgroundStarts, 0);
  assert.deepEqual(env.permissionOrder, ['foreground']);
  env.setForegroundGranted(true);
  assert.equal(await env.engine.start(), true);
});

test('out-of-order, repeated and impossible GPS jumps cannot inflate distance or route', async () => {
  const env = trackerHarness(); await env.engine.start();
  const first = env.point(0); await env.engine.acceptLocations([first, first]);
  env.advance(2000); const second = env.point(20);
  await env.engine.acceptLocations([second, first, second]);
  const before = env.engine.getSnapshot().distanceMiles;
  env.advance(2000); await env.fix(1000);
  env.advance(2000); await env.fix(40); // starts another segment, rather than bridging back from the jump
  assert.equal(env.engine.getSnapshot().distanceMiles, before);
  assert.equal(env.engine.getSnapshot().route.length, 3);
  assert.notEqual(env.engine.getSnapshot().route[1].segment, env.engine.getSnapshot().route[2].segment);
});

test('a long GPS gap produces separate map segments without fabricated distance', async () => {
  const env = trackerHarness(); await env.engine.start(); await env.fix(0);
  env.advance(3000); await env.fix(20);
  const before = env.engine.getSnapshot().distanceMiles;
  env.advance(180000); await env.fix(1000);
  assert.equal(env.engine.getSnapshot().distanceMiles, before);
  const route = env.engine.getSnapshot().route;
  assert.notEqual(route[1].segment, route[2].segment);
  assert.match(env.engine.getSnapshot().recoveryNotice, /missing route/);
});

test('cold UI launch recovers a paused draft at its last durable time with original setup', async () => {
  const env = trackerHarness();
  await env.engine.start({ activityType: 'ruck', packWeightPounds: 35, loadedWeightLbs: 210, terrain: 'trail' });
  await env.fix(0); env.advance(3000); await env.fix(20);
  const reopened = trackerHarness({ disk: env.disk }); reopened.advance(300000);
  await reopened.engine.hydrate();
  const state = reopened.engine.getSnapshot();
  assert.equal(state.isPaused, true); assert.equal(state.durationMs, 3000);
  assert.equal(state.activityType, 'ruck'); assert.equal(state.packWeightPounds, 35); assert.equal(state.terrain, 'trail');
  assert.equal(state.route.length, 2); assert.match(state.recoveryNotice, /recovered and paused/);
  assert.equal(await reopened.engine.resume(), true);
  await reopened.fix(1000);
  assert.equal(reopened.engine.getSnapshot().distanceMiles, state.distanceMiles);
});

test('cold headless delivery after a killed gap excludes missing duration and distance', async () => {
  const env = trackerHarness(); await env.engine.start(); await env.fix(0);
  env.advance(3000); await env.fix(20);
  const reopened = trackerHarness({ disk: env.disk }); reopened.advance(300000);
  await reopened.fix(1000);
  assert.equal(reopened.engine.getSnapshot().durationMs, 3000);
  assert.equal(reopened.engine.getSnapshot().distanceMiles, env.engine.getSnapshot().distanceMiles);
  assert.match(reopened.engine.getSnapshot().recoveryNotice, /unrecorded gap/);
});

test('disk write failure pauses the recorder, stops native GPS and surfaces that route is not durable', async () => {
  const env = trackerHarness(); await env.engine.start(); env.setFailWrite(true);
  await env.fix(0);
  assert.equal(env.engine.getSnapshot().isPaused, true);
  assert.equal(env.backgroundStarted, false);
  assert.match(env.engine.getSnapshot().error, /could not be saved/);
  env.setFailWrite(false);
  assert.equal(await env.engine.resume(), true);
});

test('corrupt saved draft is preserved rather than overwritten, and explicit discard recovers', async () => {
  const env = trackerHarness(); env.disk.set(env.key, '{broken');
  assert.equal(await env.engine.start(), false);
  assert.equal(env.disk.get(env.key), '{broken');
  assert.match(env.engine.getSnapshot().error, /could not be read/);
  await env.engine.discard();
  assert.equal(await env.engine.start(), true);
});

test('reset/discard waits for native stop, removes draft, and ignores late callbacks', async () => {
  const env = trackerHarness(); await env.engine.start({ backgroundTracking: false }); await env.fix(0);
  const old = env.watches[0];
  await env.engine.discard();
  env.advance(5000); old.callback(env.point(30)); env.steps(20); await env.flush();
  assert.equal(env.disk.has(env.key), false);
  assert.equal(env.engine.getSnapshot().sessionId, null);
  assert.equal(env.engine.getSnapshot().route.length, 0);
  assert.equal(old.removed, true);
});

test('failed native stop refuses discard and refuses a second GPS sampling path', async () => {
  const env = trackerHarness(); await env.engine.start(); env.setFailStop(true);
  await assert.rejects(env.engine.discard(), /could not be stopped/);
  assert.equal(env.disk.has(env.key), true);
  assert.equal(await env.engine.start({ backgroundTracking: false }), false);
  assert.equal(env.watches.length, 0);
  env.setFailStop(false); await env.engine.discard();
  assert.equal(env.disk.has(env.key), false);
});

test('iOS historical pedometer fills background steps once and excludes paused intervals', async () => {
  const env = trackerHarness({ platform: 'ios' }); await env.engine.start();
  env.steps(10); await env.flush(); env.setQuerySteps(25);
  env.advance(10000); await env.engine.handleAppState('background');
  env.advance(10000); env.setQuerySteps(45); await env.engine.pause();
  assert.equal(env.engine.getSnapshot().steps, 45);
  env.advance(100000); await env.engine.resume(); env.setQuerySteps(8); env.steps(4);
  env.advance(1000);
  assert.equal((await env.engine.stop()).steps, 53);
});

test('Android background step counts are explicitly partial', async () => {
  const env = trackerHarness(); await env.engine.start(); env.steps(10);
  await env.engine.handleAppState('background'); env.advance(10000);
  await env.engine.handleAppState('active'); env.steps(5); await env.flush();
  const state = await env.engine.stop();
  assert.equal(state.steps, 15); assert.equal(state.stepsLimited, true);
});

test('finished draft remains recoverable until its history save is acknowledged', async () => {
  const env = trackerHarness(); await env.engine.start(); await env.fix(0);
  env.advance(3000); await env.fix(20); const finished = await env.engine.stop();
  assert.equal(await env.engine.start(), false);
  const reopened = trackerHarness({ disk: env.disk }); await reopened.engine.hydrate();
  assert.equal(reopened.engine.getSnapshot().sessionId, finished.sessionId);
  assert.equal(reopened.engine.getSnapshot().isTracking, false);
  assert.equal(reopened.engine.getSnapshot().route.length, 2);
  await reopened.engine.clearFinished();
  assert.equal(reopened.disk.has(env.key), false);
});

test('all final batch points are retained and route memory remains bounded during long activities', async () => {
  const env = trackerHarness(); await env.engine.start();
  const points = [];
  for (let i = 0; i < env.maxPoints + 100; i++) { env.advance(2000); points.push(env.point(i * 4)); }
  await env.engine.acceptLocations(points);
  const final = await env.engine.stop();
  assert.ok(final.route.length <= env.maxPoints);
  assert.equal(final.route[0].latitude, points[0].coords.latitude);
  assert.equal(final.route.at(-1).latitude, points.at(-1).coords.latitude);
  assert.ok(final.distanceMiles > 14);
});

test('recovered iOS steps are banked before a new historical interval begins', async () => {
  const env = trackerHarness({ platform: 'ios' }); await env.engine.start();
  env.steps(200); await env.flush(); env.advance(10000); await env.fix(0);
  const reopened = trackerHarness({ platform: 'ios', disk: env.disk }); reopened.advance(60000); reopened.setQuerySteps(200);
  await reopened.engine.hydrate(); await reopened.engine.resume();
  reopened.setQuerySteps(300); reopened.advance(30000);
  assert.equal((await reopened.engine.stop()).steps, 500);
});

test('steps surviving a task failure are banked before resume, even without foreground step callbacks', async () => {
  const env = trackerHarness({ platform: 'ios' }); await env.engine.start();
  env.steps(200); env.setQuerySteps(200); env.advance(10000);
  await env.engine.reportTaskError('GPS failed');
  env.advance(30000); await env.engine.resume();
  env.setQuerySteps(300); env.advance(10000);
  assert.equal((await env.engine.stop()).steps, 500);
});

test('backgrounding during async foreground setup still pauses the completed recorder', async () => {
  const env = trackerHarness(); const wait = env.waitForWatch();
  const starting = env.engine.start({ backgroundTracking: false });
  while (env.watches.length === 0) await new Promise((resolve) => setImmediate(resolve));
  const backgrounding = env.engine.handleAppState('background');
  wait.resolve(); await starting; await backgrounding;
  assert.equal(env.engine.getSnapshot().isPaused, true);
  assert.equal(env.watches[0].removed, true);
});

test('a large headless batch updates subscribers once instead of copying routes per fix', async () => {
  const env = trackerHarness(); await env.engine.start(); let updates = 0;
  const unsubscribe = env.engine.subscribe(() => updates++);
  const points = [];
  for (let i = 0; i < 1000; i++) { env.advance(2000); points.push(env.point(i * 4)); }
  await env.engine.acceptLocations(points);
  assert.equal(updates, 1); assert.equal(env.engine.getSnapshot().route.length, 1000);
  unsubscribe();
});

test('global TaskManager executor persists background samples without mounting a React screen', async () => {
  let now = 100000; const disk = new Map(); const defined = new Map(); const starts = [];
  const load = createLoader({
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => disk.get(key) ?? null,
      setItem: async (key, value) => disk.set(key, value), removeItem: async (key) => disk.delete(key),
    },
    'react-native': { Platform: { OS: 'android' }, AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-task-manager': { isTaskDefined: (key) => defined.has(key), defineTask: (key, executor) => defined.set(key, executor), isAvailableAsync: async () => true },
    'expo-location': {
      Accuracy: { High: 4, BestForNavigation: 6 }, ActivityType: { Fitness: 3 },
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' }), getBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
      hasStartedLocationUpdatesAsync: async () => starts.length > 0,
      startLocationUpdatesAsync: async (name, options) => starts.push({ name, options }), stopLocationUpdatesAsync: async () => {},
    },
    'expo-sensors': { Pedometer: { isAvailableAsync: async () => false } },
  });
  const realNow = Date.now; Date.now = () => now;
  try {
    const { activityTracker, ACTIVITY_LOCATION_TASK, ACTIVE_ACTIVITY_STORAGE_KEY } = load('src/services/activityTracking.ts');
    assert.equal(defined.size, 1);
    assert.equal(await activityTracker.start(), true);
    assert.equal(starts[0].options.showsBackgroundLocationIndicator, true);
    assert.equal(starts[0].options.pausesUpdatesAutomatically, false);
    assert.equal(starts[0].options.foregroundService.killServiceOnDestroy, true);
    now += 2000;
    await defined.get(ACTIVITY_LOCATION_TASK)({ data: { locations: [{ timestamp: now, coords: { latitude: 42, longitude: -83, accuracy: 3, altitude: 10, speed: 2 } }] } });
    const stored = JSON.parse(disk.get(ACTIVE_ACTIVITY_STORAGE_KEY));
    assert.equal(stored.status, 'recording'); assert.equal(stored.route.length, 1);
    assert.equal(activityTracker.getSnapshot().stepsLimited, true);
  } finally { Date.now = realNow; }
});

test('tracker screen unmount detaches its UI only and start honors an immediate foreground-only choice', async () => {
  const slots = []; let cursor = 0; const cleanups = []; let stopCalls = 0; let detached = false; let passed;
  const realInterval = global.setInterval; const realClear = global.clearInterval;
  global.setInterval = () => 1; global.clearInterval = () => {};
  try {
    const controller = {
      getSnapshot: () => ({ ready: true, isTracking: true, backgroundEnabled: true }),
      subscribe: () => () => { detached = true; }, tick() {}, checkpoint: async () => {},
      start: async (options) => { passed = options; return true; }, resume: async () => true, pause: async () => {},
      stop: async () => { stopCalls++; }, clearFinished: async () => {},
    };
    const React = {
      useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
      useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], () => {}]; },
      useEffect(fn) { const index = cursor++; if (!(index in slots)) { slots[index] = true; cleanups.push(fn()); } },
      useCallback(fn) { return fn; },
    };
    const { useRunTracker } = createLoader({ react: React, '../services/activityTracking': { activityTracker: controller, initializeActivityTracking: async () => {} } })('src/hooks/useRunTracker.ts');
    const tracker = useRunTracker({ activityType: 'hike', backgroundTracking: true });
    assert.equal(await tracker.start({ backgroundTracking: false }), true);
    assert.equal(passed.activityType, 'hike'); assert.equal(passed.backgroundTracking, false);
    cleanups.forEach((cleanup) => cleanup());
    assert.equal(detached, true); assert.equal(stopCalls, 0);
  } finally { global.setInterval = realInterval; global.clearInterval = realClear; }
});

test('obsolete foreground watcher errors cannot pause a later activity', async () => {
  const env = trackerHarness(); await env.engine.start({ backgroundTracking: false }); const old = env.watches[0];
  await env.engine.discard(); env.advance(10000); await env.engine.start({ backgroundTracking: false });
  const id = env.engine.getSnapshot().sessionId;
  old.errorCallback(); await env.flush();
  assert.equal(env.engine.getSnapshot().sessionId, id); assert.equal(env.engine.getSnapshot().isPaused, false);
});

test('menu activity status ignores metric ticks but observes pause and identity changes', () => {
  let snapshot = { ready: true, sessionId: 'run-a', isTracking: true, isPaused: false, activityType: 'run', backgroundEnabled: true, durationMs: 0 };
  let current; let updates = 0; let listener;
  const React = {
    useState(initial) { current = initial(); return [current, (next) => { const value = typeof next === 'function' ? next(current) : next; if (value !== current) updates++; current = value; }]; },
    useEffect(fn) { fn(); }, useCallback(fn) { return fn; }, useRef(initial) { return { current: initial }; },
  };
  const { useActivityStatus } = createLoader({ react: React, '../services/activityTracking': {
    activityTracker: { getSnapshot: () => snapshot, subscribe: (fn) => { listener = fn; return () => {}; } }, initializeActivityTracking: async () => {},
  } })('src/hooks/useRunTracker.ts');
  useActivityStatus();
  snapshot = { ...snapshot, durationMs: 10000, distanceMiles: 0.25 }; listener(); assert.equal(updates, 0);
  snapshot = { ...snapshot, isPaused: true }; listener(); assert.equal(updates, 1);
  snapshot = { ...snapshot, sessionId: 'run-b' }; listener(); assert.equal(updates, 2);
});

test('foreground timing and durability checkpoints are shared and suspend with the app', async () => {
  const realInterval = global.setInterval; const realClear = global.clearInterval;
  const intervals = new Map(); let created = 0; let lifecycle;
  global.setInterval = (callback, ms) => { intervals.set(++created, { callback, ms }); return created; };
  global.clearInterval = (id) => intervals.delete(id);
  try {
    const service = createLoader({
      '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
      'react-native': { Platform: { OS: 'android' }, AppState: { currentState: 'active', addEventListener: (_, fn) => { lifecycle = fn; } } },
      'expo-task-manager': { isTaskDefined: () => false, defineTask() {}, isAvailableAsync: async () => true },
      'expo-location': { hasStartedLocationUpdatesAsync: async () => false },
      'expo-sensors': { Pedometer: {} },
    })('src/services/activityTracking.ts');
    await service.initializeActivityTracking(); await service.initializeActivityTracking();
    assert.equal(intervals.size, 2); assert.equal(created, 2);
    assert.deepEqual([...intervals.values()].map((value) => value.ms), [1000, 15000]);
    lifecycle('background'); assert.equal(intervals.size, 0);
    lifecycle('active'); lifecycle('active'); assert.equal(intervals.size, 2); assert.equal(created, 4);
    lifecycle('background'); await service.activityTracker.hydrate(); assert.equal(intervals.size, 0);
  } finally { global.setInterval = realInterval; global.clearInterval = realClear; }
});

test('temporary signal loss keeps background GPS alive and never bridges the missing route', async () => {
  const env = trackerHarness({ platform: 'ios' }); await env.engine.start(); await env.fix(0);
  env.advance(3000); await env.fix(20); const before = env.engine.getSnapshot().distanceMiles;
  const checkpoint = JSON.parse(env.disk.get(env.key)).updatedAt;
  env.advance(10000); await env.engine.reportSignalLoss();
  assert.equal(env.engine.getSnapshot().isPaused, false); assert.equal(env.backgroundStarted, true);
  assert.equal(env.backgroundStops, 0); assert.match(env.engine.getSnapshot().recoveryNotice, /Waiting for a precise GPS signal/);
  assert.equal(JSON.parse(env.disk.get(env.key)).updatedAt, checkpoint);
  env.advance(10000); await env.fix(500);
  assert.equal(env.engine.getSnapshot().distanceMiles, before);
  assert.equal(env.engine.getSnapshot().recoveryNotice, null);
  const route = env.engine.getSnapshot().route;
  assert.notEqual(route[1].segment, route[2].segment);
  env.advance(3000); await env.fix(520);
  assert.ok(env.engine.getSnapshot().distanceMiles > before);
});

test('native iOS TaskManager code0 remains recording, while denied code1 pauses', async () => {
  const disk = new Map(); let executor; let active = false; let stops = 0;
  const { activityTracker } = createLoader({
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => disk.get(key) ?? null, setItem: async (key, value) => disk.set(key, value), removeItem: async (key) => disk.delete(key),
    },
    'react-native': { Platform: { OS: 'ios' }, AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-task-manager': { isTaskDefined: () => false, defineTask: (_, callback) => { executor = callback; }, isAvailableAsync: async () => true },
    'expo-location': {
      Accuracy: { High: 4, BestForNavigation: 6 }, ActivityType: { Fitness: 3 },
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' }), getBackgroundPermissionsAsync: async () => ({ status: 'granted' }),
      hasStartedLocationUpdatesAsync: async () => active, startLocationUpdatesAsync: async () => { active = true; },
      stopLocationUpdatesAsync: async () => { active = false; stops++; },
    },
    'expo-sensors': { Pedometer: { isAvailableAsync: async () => false, getStepCountAsync: async () => ({ steps: 0 }) } },
  })('src/services/activityTracking.ts');
  await activityTracker.start();
  await executor({ error: { code: 0, message: 'kCLErrorDomain Code=0' } });
  assert.equal(activityTracker.getSnapshot().isPaused, false); assert.equal(active, true); assert.equal(stops, 0);
  await executor({ error: { code: 1, message: 'kCLErrorDomain Code=1' } });
  assert.equal(activityTracker.getSnapshot().isPaused, true); assert.equal(active, false); assert.equal(stops, 1);
});

test('successful hydration retry clears the obsolete read error', async () => {
  const env = trackerHarness(); env.setFailRead(true);
  await env.engine.hydrate(); assert.match(env.engine.getSnapshot().error, /could not be read/);
  env.setFailRead(false); await env.engine.hydrate();
  assert.equal(env.engine.getSnapshot().ready, true); assert.equal(env.engine.getSnapshot().error, null);
  assert.equal(await env.engine.start(), true);
});

test('successful read retry retains native stop errors and unrelated write errors', async () => {
  const env = trackerHarness(); env.setFailRead(true); await env.engine.hydrate();
  env.setFailRead(false); env.setFailStop(true); await env.engine.hydrate();
  assert.match(env.engine.getSnapshot().error, /could not be stopped/);
  env.setFailStop(false); await env.engine.discard(); await env.engine.start();
  env.setFailWrite(true); await env.fix(0);
  assert.match(env.engine.getSnapshot().error, /could not be saved/);
  await env.engine.hydrate();
  assert.match(env.engine.getSnapshot().error, /could not be saved/);
});
