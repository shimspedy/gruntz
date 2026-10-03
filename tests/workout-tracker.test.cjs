const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function trackerHarness() {
  const slots = [];
  const cleanups = [];
  let cursor = 0;
  let now = 100000;
  let callback;
  let stepCallback;
  let appStateCallback;
  let failLocation = false;
  let pendingWatch;
  let permissionError = false;
  const watches = [];
  const realNow = Date.now;
  const realInterval = global.setInterval;
  const realClearInterval = global.clearInterval;
  Date.now = () => now;
  global.setInterval = () => 123;
  global.clearInterval = () => {};
  const React = {
    useState(initial) {
      const at = cursor++;
      if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial;
      return [slots[at], (next) => { slots[at] = typeof next === 'function' ? next(slots[at]) : next; }];
    },
    useRef(initial) {
      const at = cursor++;
      if (!(at in slots)) slots[at] = { current: initial };
      return slots[at];
    },
    useCallback(fn) { return fn; },
    useEffect(fn) {
      const at = cursor++;
      if (!(at in slots)) { slots[at] = true; cleanups.push(fn()); }
    },
  };
  const load = createLoader({
    react: React,
    'react-native': { AppState: { addEventListener: (_, fn) => { appStateCallback = fn; return { remove() {} }; } } },
    'expo-location': {
      Accuracy: { Balanced: 1, BestForNavigation: 2 },
      requestForegroundPermissionsAsync: async () => {
        if (permissionError) throw new Error('native permission failure');
        return { status: 'granted' };
      },
      watchPositionAsync: async (_, fn) => {
        callback = fn;
        if (failLocation) throw new Error('GPS unavailable');
        const sub = { removed: false, remove() { this.removed = true; } };
        watches.push(sub);
        if (pendingWatch) { await pendingWatch.promise; pendingWatch = null; }
        return sub;
      },
    },
    'expo-sensors': { Pedometer: { isAvailableAsync: async () => true, watchStepCount: (fn) => { stepCallback = fn; return { remove() {} }; } } },
  });
  const { useRunTracker } = load('src/hooks/useRunTracker.ts');
  const render = () => { cursor = 0; return useRunTracker(); };
  return {
    render,
    advance(ms) { now += ms; },
    fix(meters, accuracy = 3, speed = 3) {
      callback({ timestamp: now, coords: { latitude: meters / 111195, longitude: 0, altitude: 10, speed, accuracy } });
    },
    steps(count) { stepCallback({ steps: count }); },
    background() { appStateCallback('background'); },
    setFailLocation(value) { failLocation = value; },
    setPermissionError(value) { permissionError = value; },
    waitForWatch() { pendingWatch = deferred(); return pendingWatch; },
    watches,
    cleanup() { for (const fn of cleanups) fn?.(); Date.now = realNow; global.setInterval = realInterval; global.clearInterval = realClearInterval; },
  };
}

test('failed resume preserves the entire pause and stop captures exact elapsed time and final steps', async () => {
  const env = trackerHarness();
  try {
    let tracker = env.render();
    assert.equal(await tracker.start(), true);
    env.advance(12345);
    env.steps(17);
    tracker = env.render();
    tracker.pause();
    env.advance(10000);
    env.setFailLocation(true);
    assert.equal(await env.render().resume(), false);
    env.advance(15000);
    env.setFailLocation(false);
    assert.equal(await env.render().resume(), true);
    env.advance(4321);
    env.steps(6);
    const final = env.render().stop();
    assert.equal(final.durationMs, 16666);
    assert.equal(final.steps, 23);
    env.advance(10000);
    assert.equal(env.render().stop().durationMs, 16666);
  } finally { env.cleanup(); }
});

test('paused movement and poor GPS fixes never add mileage, and valid small movements accumulate', async () => {
  const env = trackerHarness();
  try {
    await env.render().start();
    env.fix(0);
    env.advance(2000); env.fix(20);
    const before = env.render().distanceMiles;
    env.render().pause();
    env.advance(10000);
    await env.render().resume();
    env.fix(70);
    assert.equal(env.render().distanceMiles, before);
    env.advance(2000); env.fix(100, 100);
    env.advance(2000); env.fix(120);
    assert.equal(env.render().distanceMiles, before);
    // Accuracy = 10m: retain an anchor until small valid movements total >10m.
    for (let i = 1; i <= 5; i++) { env.advance(2000); env.fix(120 + i * 4, 10); }
    assert.ok(env.render().distanceMiles > before);
    env.advance(2000); env.fix(150, 3, -1);
    assert.equal(env.render().currentSpeedMph, null);
  } finally { env.cleanup(); }
});

test('a GPS watch resolving after stop is immediately removed, and duplicate starts do not reset data', async () => {
  const env = trackerHarness();
  try {
    const wait = env.waitForWatch();
    const tracker = env.render();
    const starting = tracker.start();
    await Promise.resolve();
    assert.equal(await tracker.start(), false);
    tracker.stop();
    wait.resolve();
    assert.equal(await starting, false);
    assert.equal(env.watches.length, 1);
    assert.equal(env.watches[0].removed, true);
    assert.equal(env.render().isTracking, false);
  } finally { env.cleanup(); }
});

test('permission exceptions are recoverable and backgrounding automatically pauses foreground-only tracking', async () => {
  const env = trackerHarness();
  try {
    env.setPermissionError(true);
    assert.equal(await env.render().start(), false);
    env.setPermissionError(false);
    assert.equal(await env.render().start(), true);
    env.advance(8000);
    env.background();
    assert.equal(env.render().isPaused, true);
    env.advance(30000);
    assert.equal(env.render().stop().durationMs, 8000);
  } finally { env.cleanup(); }
});
