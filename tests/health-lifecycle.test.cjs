const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const tick = () => new Promise((resolve) => setImmediate(resolve));

function store(initial, hydrated = true) {
  let state = initial;
  const listeners = new Set(), hydration = new Set();
  return {
    getState: () => state,
    getInitialState: () => initial,
    setState(patch) { const previous = state; state = { ...state, ...patch }; for (const fn of listeners) fn(state, previous); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    persist: {
      hasHydrated: () => hydrated,
      onFinishHydration(fn) { hydration.add(fn); return () => hydration.delete(fn); },
    },
    finishHydration() { hydrated = true; this.setState({ hasHydrated: true }); for (const fn of hydration) fn(state); },
  };
}

function environment({ hydrated = true, query, save, dataChangeFailure = false } = {}) {
  const now = Date.now(), calls = { queries: 0, saved: [], credits: [] };
  const health = store({ connected: true, writeActivities: false, importWorkouts: true, exportedIds: [], heartRateChecked: {}, lastSyncAt: null });
  health.setState({
    setConnected: (connected) => health.setState({ connected }),
    setPreference: (key, value) => health.setState({ [key]: value }),
    finishedSync: (lastSyncAt) => health.setState({ lastSyncAt }),
    noteHeartRateChecked: () => {}, markExported: () => {},
  });
  const user = store({ hasHydrated: hydrated, hydrationFailed: false, recordTrackedSession: (activity) => calls.credits.push(activity) }, hydrated);
  const readiness = store({ trackedSessions: [] }, hydrated);
  health.getInitialState = () => ({ ...health.getState(), connected: false, lastSyncAt: null, exportedIds: [], heartRateChecked: {} });
  user.setState({ reset: () => user.setState({ hasHydrated: true, hydrationFailed: false }) });
  const nativeWorkout = {
    uuid: 'watch-activity', workoutActivityType: 1,
    startDate: new Date(now - 7200000), endDate: new Date(now - 3600000), duration: { quantity: 3500 },
    totalDistance: { quantity: 4000 }, totalEnergyBurned: { quantity: 300 },
    sourceRevision: { source: { name: 'Watch', bundleIdentifier: 'com.example.watch' } }, getWorkoutRoutes: async () => [],
  };
  const native = {
    WorkoutActivityType: { running: 1, hiking: 2, walking: 3 },
    queryWorkoutSamples: async () => { calls.queries++; return query ? query(nativeWorkout) : [nativeWorkout]; },
    queryStatisticsForQuantity: async () => ({}),
  };
  const disk = new Map();
  const storage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key, value) => disk.set(key, value),
    removeItem: async (key) => disk.delete(key),
    getAllKeys: async () => [...disk.keys()],
    multiGet: async (keys) => keys.map((key) => [key, disk.get(key) ?? null]),
    multiSet: async (pairs) => { for (const [key, value] of pairs) disk.set(key, value); },
    multiRemove: async (keys) => { for (const key of keys) disk.delete(key); },
  };
  const dummy = () => store({ discard() {} });
  const mocks = {
    'react-native': { Platform: { OS: 'ios' }, AppState: { addEventListener: () => ({ remove() {} }) } },
    'expo-constants': { expoConfig: { ios: { bundleIdentifier: 'com.gruntz.fitness' } } },
    '@kingstinct/react-native-healthkit': native,
    '@react-native-async-storage/async-storage': storage,
    'expo-secure-store': { deleteItemAsync: async () => {} },
    '../store/useHealthStore': { useHealthStore: health },
    '../store/useUserStore': { useUserStore: user, flushUserPersistence: async () => {} },
    '../store/useReadinessStore': {
      useReadinessStore: readiness,
      saveTrackedActivity: async (activity) => { if (save) await save(activity); calls.saved.push(activity); readiness.setState({ trackedSessions: [activity] }); return true; },
      flushReadinessPersistence: async () => {}, clearReadinessPersistence: async () => {},
    },
    '../store/activityRoutes': { loadRoute: async () => null, stageRoutes: async () => ({ rollback: async () => {} }), pruneRoutes: async () => {} },
    '../store/readinessStorage': { READINESS_STORAGE_KEY: '@gruntz_readiness', readinessStorage: storage },
    './backup': { pauseAutomaticBackups: async () => {} },
    './activityTracking': { stopActiveActivityForDataChange: async () => { if (dataChangeFailure) throw Error('native stop failed'); } },
    './profilePhoto': { deleteAllProfilePhotos: async () => {} },
    './retentionAnalytics': { clearRetentionAnalytics: async () => {} },
    './notifications': Object.fromEntries(['cancelDailyReminder', 'cancelRestDone', 'cancelTrialEndingReminder', 'cancelWeeklyRecap', 'clearWorkoutProgress', 'setNotificationsEnabled'].map((name) => [name, async () => {}])),
    './backupRestoreStores': { prepareStoreRestore: async (values) => async () => readiness.setState(JSON.parse(values['@gruntz_readiness']).state) },
  };
  for (const name of ['useProgramStore', 'useSessionStore', 'useRoutineStore', 'useChallengeStore', 'usePlanLibraryStore', 'useExerciseLogStore', 'useExerciseNotesStore', 'useOnboardingDraftStore']) {
    const fake = dummy(); fake.persist.clearStorage = async () => {};
    mocks[`../store/${name}`] = { [name]: fake };
  }
  mocks['../store/useUiStore'] = { useUiStore: dummy(), useChromePrefs: dummy() };
  const load = createLoader(mocks);
  const restoreSnapshot = { schema_version: 1, captured_at: new Date(now).toISOString(), stores: { '@gruntz_readiness': JSON.stringify({ state: { trackedSessions: [] }, version: 0 }) } };
  return {
    service: load('src/services/healthSync.ts'), health, user, readiness, calls,
    gate: load('src/services/healthSyncGate.ts'),
    reset: () => load('src/services/resetLocalData.ts').resetLocalData(),
    restore: () => load('src/services/backupSnapshot.ts').applySnapshot(restoreSnapshot),
  };
}

test('automatic Health sync waits for both training stores before querying or writing', async () => {
  const env = environment({ hydrated: false });
  const stop = env.service.startHealthSyncLifecycle();
  await tick();
  assert.equal(env.calls.queries, 0);
  env.user.finishHydration(); await tick();
  assert.equal(env.calls.queries, 0);
  env.readiness.finishHydration(); await tick();
  assert.equal(env.calls.queries, 1);
  assert.equal(env.calls.saved.length, 1);
  assert.equal(env.calls.credits.length, 1);
  stop();
});

test('an unreadable user store cannot be changed by automatic Health sync', async () => {
  const env = environment(); env.user.setState({ hydrationFailed: true });
  const stop = env.service.startHealthSyncLifecycle();
  await tick();
  assert.equal(env.calls.queries, 0);
  assert.equal(env.calls.saved.length, 0);
  assert.equal(env.calls.credits.length, 0);
  stop();
});

test('disconnect and reconnect invalidate the earlier native read instead of reviving that sync', async () => {
  let completeRead;
  const env = environment({ query: (workout) => new Promise((resolve) => { completeRead = () => resolve([workout]); }) });
  const original = env.service.runHealthSync();
  while (!completeRead) await Promise.resolve();
  env.service.disconnectHealth();
  env.health.setState({ connected: true });
  completeRead();
  assert.equal((await original).stopped, true);
  assert.equal(env.calls.saved.length, 0);
  assert.equal(env.calls.credits.length, 0);
});

for (const action of ['reset', 'restore']) {
  test(`${action} drains an already-started Health import write before replacing history`, async () => {
    let finishWrite, started = false;
    const env = environment({ save: () => new Promise((resolve) => { started = true; finishWrite = resolve; }) });
    const sync = env.service.runHealthSync();
    while (!started) await tick();
    let changed = false;
    const change = env[action]().then(() => { changed = true; });
    await tick();
    assert.equal(changed, false, 'data replacement must wait for the existing route/summary write');
    finishWrite();
    await change;
    assert.equal((await sync).stopped, true);
    assert.deepEqual(env.readiness.getState().trackedSessions, []);
    assert.equal(env.calls.credits.length, 1, 'a completed save is credited before data replacement drains it');
    assert.equal(env.gate.healthSyncAllowed(), true);
  });

  test(`${action} invalidates a pending native Health read without waiting for it`, async () => {
    let finishRead;
    const env = environment({ query: (workout) => new Promise((resolve) => { finishRead = () => resolve([workout]); }) });
    const sync = env.service.runHealthSync();
    while (!finishRead) await tick();
    await env[action]();
    assert.equal(env.gate.healthSyncAllowed(), true, 'the data-change barrier releases after completion');
    finishRead();
    assert.equal((await sync).stopped, true);
    assert.equal(env.calls.saved.length, 0);
    assert.equal(env.calls.credits.length, 0);
    assert.deepEqual(env.readiness.getState().trackedSessions, []);
  });

  test(`${action} releases the Health barrier when native tracking cancellation fails`, async () => {
    const env = environment({ dataChangeFailure: true });
    await assert.rejects(env[action](), /native stop failed/);
    assert.equal(env.gate.healthSyncAllowed(), true);
  });

  test(`failed ${action} retains both the completed Health import and its matching credit`, async () => {
    let finishWrite, started = false;
    const env = environment({ dataChangeFailure: true, save: () => new Promise((resolve) => { started = true; finishWrite = resolve; }) });
    const sync = env.service.runHealthSync();
    while (!started) await tick();
    const failure = assert.rejects(env[action](), /native stop failed/);
    await tick(); finishWrite(); await failure;
    assert.equal((await sync).stopped, true);
    assert.equal(env.readiness.getState().trackedSessions.length, 1);
    assert.equal(env.calls.credits.length, 1);
    assert.equal(env.gate.healthSyncAllowed(), true);
  });
}
