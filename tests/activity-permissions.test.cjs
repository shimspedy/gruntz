const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const { requestActivityBackgroundPermission } = createLoader()('src/services/activityTrackingPermissions.ts');

function permissionEnvironment(overrides = {}) {
  let state = 'active'; let granted = false; let continuing = true; let requests = 0;
  const listeners = new Set();
  const deps = {
    platform: 'ios', pollMs: 5, maxWaitMs: 100,
    getPermission: async () => ({ status: granted ? 'granted' : 'undetermined', canAskAgain: true }),
    requestPermission: async () => { requests++; return { status: 'denied' }; },
    appState: () => state,
    subscribeAppState: (listener) => { listeners.add(listener); return { remove: () => listeners.delete(listener) }; },
    canContinue: () => continuing,
    ...overrides,
  };
  return {
    deps, listeners, get requests() { return requests; },
    setState(next) { state = next; listeners.forEach((listener) => listener()); },
    grant() { granted = true; }, cancel() { continuing = false; },
  };
}

test('iOS Always upgrade waits until the preceding foreground sheet is dismissed', async () => {
  const env = permissionEnvironment(); env.setState('inactive');
  const result = requestActivityBackgroundPermission(env.deps);
  await new Promise((resolve) => setTimeout(resolve, 10)); assert.equal(env.requests, 0);
  env.grant(); env.setState('active');
  assert.equal(await result, true); assert.equal(env.requests, 1); assert.equal(env.listeners.size, 0);
});

test('stale denied upgrade response is reread after Change to Always Allow without another prompt', async () => {
  const env = permissionEnvironment();
  env.deps.requestPermission = async () => {
    env.setState('inactive');
    setTimeout(() => { env.grant(); env.setState('active'); }, 10);
    return { status: 'denied' };
  };
  assert.equal(await requestActivityBackgroundPermission(env.deps), true);
  assert.equal(env.listeners.size, 0);
});

test('real denial and an inactive sheet timeout finish with a bounded false result', async () => {
  const denied = permissionEnvironment();
  assert.equal(await requestActivityBackgroundPermission(denied.deps), false);
  const inactive = permissionEnvironment({ maxWaitMs: 15 }); inactive.setState('inactive');
  assert.equal(await requestActivityBackgroundPermission(inactive.deps), false);
  assert.equal(inactive.requests, 0); assert.equal(inactive.listeners.size, 0);
});

test('canceling an outstanding native permission request does not await a late permission response', async () => {
  const env = permissionEnvironment(); let resolveNative;
  env.deps.requestPermission = () => new Promise((resolve) => { resolveNative = resolve; });
  const result = requestActivityBackgroundPermission(env.deps);
  await new Promise((resolve) => setTimeout(resolve, 10)); env.cancel();
  assert.equal(await result, false); assert.equal(env.listeners.size, 0);
  resolveNative({ status: 'granted' });
});

test('already granted permission remains immediate and never requests another prompt', async () => {
  const env = permissionEnvironment(); env.grant(); env.setState('inactive');
  assert.equal(await requestActivityBackgroundPermission(env.deps), true); assert.equal(env.requests, 0);
});

test('native adapter starts background GPS on the first Start after an early iOS permission response', async () => {
  let state = 'active'; let granted = false; let requests = 0; let backgroundStarts = 0;
  const listeners = new Set(); const disk = new Map();
  const appState = {
    get currentState() { return state; },
    addEventListener: (_, listener) => { listeners.add(listener); return { remove: () => listeners.delete(listener) }; },
  };
  const { activityTracker } = createLoader({
    '@react-native-async-storage/async-storage': { getItem: async (key) => disk.get(key) ?? null, setItem: async (key, value) => disk.set(key, value), removeItem: async (key) => disk.delete(key) },
    'react-native': { Platform: { OS: 'ios' }, AppState: appState },
    'expo-task-manager': { isTaskDefined: () => false, defineTask() {}, isAvailableAsync: async () => true },
    'expo-location': {
      Accuracy: { High: 4, BestForNavigation: 6 }, ActivityType: { Fitness: 3 },
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
      getBackgroundPermissionsAsync: async () => ({ status: granted ? 'granted' : 'undetermined', canAskAgain: true }),
      requestBackgroundPermissionsAsync: async () => {
        requests++; state = 'inactive'; listeners.forEach((listener) => listener());
        setTimeout(() => { granted = true; state = 'active'; listeners.forEach((listener) => listener()); }, 10);
        return { status: 'denied' };
      },
      hasStartedLocationUpdatesAsync: async () => backgroundStarts > 0,
      startLocationUpdatesAsync: async () => { backgroundStarts++; }, stopLocationUpdatesAsync: async () => {},
      watchPositionAsync: async () => { throw new Error('Foreground fallback must not start after Always was granted'); },
    },
    'expo-sensors': { Pedometer: { isAvailableAsync: async () => false } },
  })('src/services/activityTracking.ts');
  assert.equal(await activityTracker.start(), true);
  assert.equal(activityTracker.getSnapshot().backgroundEnabled, true);
  assert.equal(requests, 1); assert.equal(backgroundStarts, 1); assert.equal(listeners.size, 0);
});
