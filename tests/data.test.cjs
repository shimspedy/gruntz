const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filename), name);
      if (fs.existsSync(`${resolved}.ts`)) return load(path.relative(path.resolve(__dirname, '..'), `${resolved}.ts`), mocks);
    }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports,__DEV__){${code}\n})`, { filename })(localRequire, module, module.exports, false);
  return module.exports;
}

function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => { data.set(key, value); },
    removeItem: async (key) => { data.delete(key); },
    multiGet: async (keys) => keys.map((key) => [key, data.get(key) ?? null]),
    multiSet: async (pairs) => { for (const [key, value] of pairs) data.set(key, value); },
    multiRemove: async (keys) => { for (const key of keys) data.delete(key); },
  };
}
const serialized = (state, version = 1) => JSON.stringify({ state, version });
const snapshot = (stores) => ({ schema_version: 1, captured_at: '2026-10-03T12:00:00Z', stores });
const csv = load('src/features/strongCsv.ts');
const row = (overrides = {}) => ({
  date: '2026-10-01 12:00:00', workoutName: 'Upper body', duration: '', exerciseName: 'Bench Press',
  setOrder: '1', weight: '0', reps: '10', distance: '', seconds: '', notes: '', workoutNotes: '', rpe: '', ...overrides,
});

test('CSV export/import preserves quoted multiline notes and zero weight', () => {
  const notes = 'First line, with comma\nSecond "quoted" line';
  const parsed = csv.parseStrongCsv(csv.toStrongCsv([row({ notes })]));
  assert.equal(parsed.skipped.length, 0);
  assert.equal(parsed.workouts.length, 1);
  assert.equal(parsed.workouts[0].exercises[0].notes, notes);
  assert.equal(parsed.workouts[0].exercises[0].sets[0].weight, 0);
});

test('CSV keeps distance labels on export round trip', () => {
  const parsed = csv.parseStrongCsv(csv.toStrongCsv([row({ distance: '2 mi' })]));
  assert.equal(parsed.workouts[0].exercises[0].sets[0].distance, '2 mi');
});

test('CSV rejects invalid calendar dates and never creates empty workouts', () => {
  const parsed = csv.parseStrongCsv(csv.toStrongCsv([
    row({ date: '2026-02-30 12:00:00' }), row({ setOrder: 'Rest Timer' }), row({ setOrder: '-1' }),
  ]));
  assert.equal(parsed.workouts.length, 0);
  assert.equal(parsed.skipped.length, 2);
});

test('CSV parser retains actual physical line numbers after blank and multiline rows', () => {
  const source = csv.toStrongCsv([row({ notes: 'a\nb' }), row({ setOrder: 'oops' })]);
  const parsed = csv.parseStrongCsv(source.replace('\n', '\n\n'));
  assert.equal(parsed.skipped[0].line, 5);
});

test('explicit timezone is retained and malformed trailing timestamps are rejected', () => {
  assert.equal(csv.parseStrongDate('2026-10-01T12:00:00+05:00'), '2026-10-01T07:00:00.000Z');
  assert.equal(csv.parseStrongDate('2026-10-01 12:00:00 garbage'), null);
  assert.equal(csv.parseStrongDate('2026-13-01 12:00:00'), null);
});

function snapshotModule(disk, prepare = async () => () => {}) {
  return load('src/services/backupSnapshot.ts', {
    '@react-native-async-storage/async-storage': disk,
    '../config/backup': { BACKUP_SCHEMA_VERSION: 1 },
    './backupRestoreStores': { prepareStoreRestore: prepare },
  });
}

test('corrupt backup is rejected before any existing data is removed', async () => {
  const disk = storage({ '@gruntz_user': 'keep me', '@gruntz_routines': 'keep routines' });
  const service = snapshotModule(disk);
  await assert.rejects(service.applySnapshot(snapshot({ '@gruntz_user': '{corrupt' })));
  assert.equal(disk.data.get('@gruntz_user'), 'keep me');
  assert.equal(disk.data.get('@gruntz_routines'), 'keep routines');
});

test('restore drops omitted old stores and live workout, preserves entitlement, updates memory immediately', async () => {
  const disk = storage({ '@gruntz_routines': 'old routines', '@gruntz_session': 'unfinished', '@gruntz_subscription': 'paid' });
  let updated = false;
  const service = snapshotModule(disk, async () => () => { updated = true; });
  await service.applySnapshot(snapshot({ '@gruntz_exercise_log': serialized({ logs: {} }) }));
  assert.equal(disk.data.has('@gruntz_routines'), false);
  assert.equal(disk.data.has('@gruntz_session'), false);
  assert.equal(disk.data.get('@gruntz_subscription'), 'paid');
  assert.equal(updated, true);
});

test('restore rolls back a partial storage failure', async () => {
  const disk = storage({ '@gruntz_user': 'old user', '@gruntz_routines': 'old routines' });
  let fail = true;
  const original = disk.multiSet;
  disk.multiSet = async (pairs) => {
    if (fail) { fail = false; await original(pairs.slice(0, 1)); throw new Error('disk full'); }
    return original(pairs);
  };
  const service = snapshotModule(disk);
  await assert.rejects(service.applySnapshot(snapshot({ '@gruntz_exercise_log': serialized({ logs: {} }) })), /disk full/);
  assert.equal(disk.data.get('@gruntz_user'), 'old user');
  assert.equal(disk.data.get('@gruntz_routines'), 'old routines');
  assert.equal(disk.data.has('@gruntz_exercise_log'), false);
});

test('restore cannot import subscription state or invalid workout records', () => {
  const service = snapshotModule(storage());
  assert.throws(() => service.validateSnapshot(snapshot({ '@gruntz_subscription': serialized({ isSubscribed: true }) })), /empty/);
  assert.throws(() => service.validateSnapshot(snapshot({ '@gruntz_exercise_log': serialized({ logs: { squat: 'bad' } }) })), /workout history/);
});

function backupModule({ remote = { user_id: 'athlete' }, lookupError = null, seed = {} } = {}) {
  const disk = storage(seed);
  const writes = [];
  let captured = 0;
  const api = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'athlete', email: 'athlete@example.com' } } } }),
      signInWithOtp: async () => ({ error: { status: 429 } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: remote, error: lookupError }),
      upsert: async (payload) => { writes.push(payload); return { error: null }; },
      delete() { return { eq: async () => ({ error: null }) }; },
    }),
  };
  const service = load('src/services/backup.ts', {
    '@react-native-async-storage/async-storage': disk,
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) }, Platform: { OS: 'ios' } },
    '../config/backup': { BACKUP_SCHEMA_VERSION: 1, BACKUP_DEBOUNCE_MS: 20000, isBackupAvailable: () => true },
    './supabaseClient': { getSupabase: () => api },
    './backupSnapshot': {
      captureSnapshot: async () => { captured += 1; return snapshot({ '@gruntz_user': serialized({ progress: {} }) }); },
      snapshotWorkoutCount: () => 1, applySnapshot: async () => {},
    },
  });
  return { service, disk, writes, captured: () => captured, api };
}

test('sign-in on a new phone cannot replace an existing backup automatically', async () => {
  const { service, writes, captured } = backupModule();
  assert.equal(await service.pushBackup(), 'needs-review');
  assert.equal(writes.length, 0);
  assert.equal(captured(), 0);
});

test('failed cloud lookup never permits an overwrite', async () => {
  const { service, writes } = backupModule({ remote: null, lookupError: new Error('offline') });
  assert.equal(await service.pushBackup(), 'error');
  assert.equal(writes.length, 0);
});

test('explicit replacement establishes ownership; future automatic backup succeeds', async () => {
  const { service, writes, disk } = backupModule();
  assert.equal(await service.pushBackup(undefined, { replaceExisting: true }), 'ok');
  assert.equal(disk.data.get('@gruntz_backup_owner'), 'athlete');
  assert.equal(await service.pushBackup(), 'ok');
  assert.equal(writes.length, 2);
});

test('device reset pause survives relaunch and requires explicit consent', async () => {
  const { service, disk, writes } = backupModule({ remote: null });
  await service.pauseAutomaticBackups();
  assert.equal(await service.pushBackup(), 'needs-review');
  assert.equal(writes.length, 0);
  const relaunched = backupModule({ remote: null, seed: Object.fromEntries(disk.data) });
  assert.equal(await relaunched.service.pushBackup(), 'needs-review');
  assert.equal(await relaunched.service.pushBackup(undefined, { replaceExisting: true }), 'ok');
});

test('deleting cloud backup pauses future automatic recreation', async () => {
  const { service, disk, writes } = backupModule({ seed: { '@gruntz_backup_owner': 'athlete' } });
  assert.equal(await service.deleteBackup(), 'deleted');
  assert.equal(disk.data.get('@gruntz_backup_owner'), 'paused');
  assert.equal(await service.pushBackup(), 'needs-review');
  assert.equal(writes.length, 0);
});

test('OTP rate limits produce a specific recoverable result', async () => {
  assert.equal(await backupModule().service.requestSignInCode('athlete@example.com'), 'rate-limited');
});

test('multiple Strong aliases resolving to one library exercise keep all their sets', () => {
  let received;
  const service = load('src/services/workoutTransfer.ts', {
    'expo-file-system': {}, 'expo-sharing': {},
    '../features/exerciseMatch': { matchExercise: () => ({ key: 'bench', name: 'Bench Press' }) },
    '../data/exerciseLibrary': { getLibraryItem: () => undefined },
    '../store/useExerciseLogStore': {
      MAX_ENTRIES_PER_EXERCISE: 300, MAX_TRACKED_EXERCISES: 400,
      useExerciseLogStore: { getState: () => ({ logs: {}, mergeEntries: (incoming) => {
        received = incoming;
        return { entries: 1, sets: incoming.bench[0].sets.length, exercises: 1, evictedEntries: 0, evictedExercises: 0 };
      } }) },
    },
    '../store/useExerciseNotesStore': { useExerciseNotesStore: { getState: () => ({ notes: {} }) } },
    './backup': { scheduleBackup() {} },
  });
  const { workouts } = csv.parseStrongCsv(csv.toStrongCsv([row(), row({ exerciseName: 'Bench Press (Barbell)' })]));
  const plan = service.buildPlan('workout.csv', workouts, 0);
  const report = service.applyImport(plan, 'lb');
  assert.equal(received.bench.length, 1);
  assert.equal(received.bench[0].sets.length, 2);
  assert.equal(report.sets, 2);
});

test('restoring replaces live state including absent stores, preserves actions and runs migrations', async () => {
  const exports = ['useUserStore', 'useExerciseLogStore', 'useExerciseNotesStore', 'useReadinessStore',
    'usePlanLibraryStore', 'useProgramStore', 'useRoutineStore', 'useChallengeStore', 'useSessionStore'];
  const mocks = { './notifications': { cancelRestDone: async () => {}, clearWorkoutProgress: async () => {} } };
  const targets = [];
  for (const name of exports) {
    const initial = { count: 0, hasHydrated: false, action() {} };
    let state = { ...initial, count: 99 };
    const options = { name, version: 1, storage: { setItem() {} }, migrate: (old) => ({ ...old, count: old.count + 1 }) };
    const store = {
      getState: () => state, getInitialState: () => initial,
      setState: (value) => { state = value; },
      persist: { getOptions: () => ({ ...options }), setOptions: (value) => Object.assign(options, value), clearStorage: async () => {} },
    };
    targets.push(store);
    mocks[`../store/${name}`] = { [name]: store };
  }
  const { prepareStoreRestore } = load('src/services/backupRestoreStores.ts', mocks);
  const commit = await prepareStoreRestore({ useUserStore: serialized({ count: 4, action: 'malicious' }, 0) });
  assert.equal(targets[0].getState().count, 99);
  await commit();
  assert.equal(targets[0].getState().count, 5);
  assert.equal(typeof targets[0].getState().action, 'function');
  assert.equal(targets[1].getState().count, 0);
  assert.equal(targets[8].getState().count, 0);
  assert.equal(targets[0].getState().hasHydrated, true);
});
