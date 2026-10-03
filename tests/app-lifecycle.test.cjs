const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, cache = new Map()) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const req = (id) => {
    if (id in mocks) return mocks[id];
    if (!id.startsWith('.')) return require(id);
    const base = path.resolve(path.dirname(filename), id);
    if (fs.existsSync(base + '.json')) return require(base + '.json');
    return load(base + '.ts', mocks, cache);
  };
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
    console, setTimeout, clearTimeout, Date, __DEV__: false, process,
  }, { filename })(req, module, module.exports);
  return module.exports;
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('notification launch wins over saved navigation and response is consumed once', async () => {
  const { createInitialLinkResolver } = load('src/navigation/initialLink.ts');
  let reads = 0, clears = 0;
  const resolve = createInitialLinkResolver({
    getLink: async () => null,
    getNotificationLink: async () => { reads++; return 'gruntz://stats'; },
    clearNotification: async () => { clears++; },
  });
  assert.deepEqual(await Promise.all([resolve(), resolve()]), ['gruntz://stats', 'gruntz://stats']);
  assert.equal(reads, 1); assert.equal(clears, 1);
});

test('URL launches have priority and notification API failure does not reject startup', async () => {
  const { createInitialLinkResolver } = load('src/navigation/initialLink.ts');
  const resolve = createInitialLinkResolver({
    getLink: async () => 'gruntz://plans',
    getNotificationLink: async () => { throw Error('unsupported'); },
    clearNotification: async () => {},
  });
  assert.equal(await resolve(), 'gruntz://plans');
});

function resetHarness() {
  const events = [], stores = {};
  const initialNames = ['useSessionStore','useRoutineStore','useChallengeStore','useReadinessStore','usePlanLibraryStore','useExerciseLogStore','useExerciseNotesStore','useOnboardingDraftStore','useChromePrefs','useUiStore','useProgramStore'];
  for (const name of initialNames) {
    const initial = { data: null };
    stores[name] = {
      state: { data: 'old profile', discard() { events.push('discard'); } },
      getInitialState: () => initial,
      persist: { clearStorage: async () => {} },
      getState() { return this.state; },
      setState(value) { this.state = value; events.push(name); },
    };
  }
  stores.useUserStore = { getState: () => ({ reset: () => events.push('user-reset') }) };
  const mocks = {
    '@react-native-async-storage/async-storage': {
      getAllKeys: async () => ['@gruntz_user','@gruntz_routines','@gruntz_readiness','@gruntz_subscription','@gruntz_backup_owner','unrelated'],
      multiRemove: async keys => { events.push([...keys]); },
    },
    'expo-secure-store': { deleteItemAsync: async key => events.push(key) },
    './backup': { pauseAutomaticBackups: async () => events.push('backup-paused') },
    './notifications': Object.fromEntries(['cancelDailyReminder','cancelRestDone','cancelTrialEndingReminder','cancelWeeklyRecap','clearWorkoutProgress','setNotificationsEnabled'].map(name => [name, async () => {}])),
  };
  for (const [name, store] of Object.entries(stores)) mocks[`../store/${name}`] = { [name]: store };
  mocks['../store/useUiStore'] = { useUiStore: stores.useUiStore, useChromePrefs: stores.useChromePrefs };
  return { ...load('src/services/resetLocalData.ts', mocks), events, stores };
}

test('delete local data clears every live store and preserves billing plus cloud pause marker', async () => {
  const { resetLocalData, events, stores } = resetHarness();
  await resetLocalData();
  assert.equal(events[0], 'backup-paused');
  for (const [name, store] of Object.entries(stores)) if (name !== 'useUserStore') assert.equal(store.state.data, null, name);
  assert.deepEqual(events.at(-1), ['@gruntz_user','@gruntz_routines','@gruntz_readiness']);
  assert.equal(stores.useProgramStore.state.hasHydrated, true);
});

test('crash recovery clears transient memory while retaining readiness and run history', async () => {
  const { resetTransientState, stores, events } = resetHarness();
  await resetTransientState();
  assert.equal(stores.useSessionStore.state.data, null);
  assert.equal(stores.useReadinessStore.state.data, 'old profile');
  assert.ok(!events.flat().includes('@gruntz_readiness'));
});

test('disabled reminders cannot schedule new rest alerts; enabling permits weekday schedules', async () => {
  const scheduled = [];
  const notifications = load('src/services/notifications.ts', {
    'react-native': { Platform: { OS: 'ios' } },
    'expo-notifications': {
      setNotificationHandler() {},
      getAllScheduledNotificationsAsync: async () => [],
      getPresentedNotificationsAsync: async () => [],
      cancelScheduledNotificationAsync: async () => {},
      scheduleNotificationAsync: async input => { scheduled.push(input); return 'id'; },
      SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly' },
    },
  });
  notifications.setNotificationsEnabled(false);
  await notifications.scheduleRestDone(Date.now() + 60_000);
  await notifications.scheduleDailyReminder(7, 0, [2, 4, 6]);
  assert.equal(scheduled.length, 0);
  notifications.setNotificationsEnabled(true);
  await notifications.scheduleDailyReminder(7, 0, [2, 4, 6]);
  assert.deepEqual(scheduled.map(x => x.trigger.weekday), [2, 4, 6]);
});

test('corrupt saved user JSON survives hydration failure; retry restores progress', async () => {
  let raw = '{damaged', writes = 0;
  const storage = {
    getItem: async () => raw,
    setItem: async (_key, value) => { writes++; raw = value; },
    removeItem: async () => {},
  };
  const { useUserStore } = load('src/store/useUserStore.ts', { '@react-native-async-storage/async-storage': storage });
  await tick();
  assert.equal(useUserStore.getState().hydrationFailed, true);
  assert.equal(raw, '{damaged'); assert.equal(writes, 0);
  raw = JSON.stringify({ version: 1, state: { progress: { current_xp: 120, claimed_missions: [] } } });
  await useUserStore.persist.rehydrate();
  assert.equal(useUserStore.getState().progress.current_xp, 120);
  assert.equal(useUserStore.getState().hydrationFailed, false);
});
