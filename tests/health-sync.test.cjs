const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const load = createLoader();
const {
  syncHealth, importableWorkouts, toImportedActivity, toHealthExport, cleanHeartRate, activityWindow, HEALTH_LOOKBACK_DAYS,
} = load('src/features/healthSync.ts');
const { isTrackedSession } = load('src/features/activityHistory.ts');

const NOW = Date.parse('2026-10-13T18:00:00.000Z');
const HOUR = 3600000;
const iso = (ms) => new Date(ms).toISOString();
const activity = (overrides = {}) => ({
  id: 'activity-1', type: 'run', date: iso(NOW - HOUR), startedAt: iso(NOW - 2 * HOUR),
  distanceMiles: 3, durationSeconds: 3000, elevationFeet: 40, ...overrides,
});
const workout = (overrides = {}) => ({
  id: 'w1', kind: 'run', startMs: NOW - 6 * HOUR, endMs: NOW - 5 * HOUR, distanceMeters: 5000, fromGruntz: false, ...overrides,
});
const quiet = { exported: 0, imported: 0, heartRates: 0, readFailed: false, stopped: false };

function environment({ sessions = [], workouts = [], prefs = {}, heartRate = null, adapter = {} } = {}) {
  const state = {
    sessions: [...sessions], saved: [], credited: [], heartRates: [], finishedAt: null, written: [], connected: true, calls: { details: 0, heartRate: 0 },
    prefs: { writeActivities: true, importWorkouts: true, exportedIds: [], heartRateChecked: {}, lastSyncAt: null, ...prefs },
  };
  const deps = {
    adapter: {
      workouts: async () => workouts,
      workoutDetails: async () => { state.calls.details++; return {}; },
      workoutRoute: async () => [],
      heartRate: async () => { state.calls.heartRate++; return heartRate; },
      saveWorkout: async (payload) => { state.written.push(payload); return true; },
      ...adapter,
    },
    now: () => NOW,
    prefs: () => state.prefs,
    sessions: () => state.sessions,
    connected: () => state.connected,
    loadRoute: async () => undefined,
    saveImported: async (item) => { state.saved.push(item); state.sessions.unshift(item); return true; },
    credit: (item) => state.credited.push(item.id),
    setHeartRate: (id, value) => {
      state.heartRates.push({ id, ...value });
      state.sessions = state.sessions.map((s) => (s.id === id ? { ...s, averageHeartRate: value.average, maxHeartRate: value.max } : s));
    },
    heartRateChecked: (id, at) => { state.prefs = { ...state.prefs, heartRateChecked: { ...state.prefs.heartRateChecked, [id]: at } }; },
    markExported: (id) => { state.prefs = { ...state.prefs, exportedIds: [...state.prefs.exportedIds, id] }; },
    finished: (at) => { state.finishedAt = at; },
  };
  return { state, deps };
}

test('disconnect during an awaited workout read cannot import, credit or query more health data', async () => {
  for (const method of ['workoutDetails', 'workoutRoute', 'heartRate']) {
    const { state, deps } = environment({ workouts: [workout()] });
    const called = [];
    for (const name of ['workoutDetails', 'workoutRoute', 'heartRate']) {
      deps.adapter[name] = async () => {
        called.push(name);
        if (name === method) state.connected = false;
        return name === 'workoutDetails' ? {} : name === 'workoutRoute' ? [] : { average: 140, max: 160 };
      };
    }
    const result = await syncHealth(deps);
    assert.equal(result.stopped, true, method);
    assert.equal(state.saved.length, 0, method);
    assert.equal(state.credited.length, 0, method);
    assert.equal(called.at(-1), method, 'no further native read after disconnect');
    assert.equal(state.finishedAt, null);
  }
});

test('disconnect while loading an export route prevents the native Health write', async () => {
  const { state, deps } = environment({ sessions: [activity({ routePoints: 2 })], prefs: { importWorkouts: false } });
  deps.loadRoute = async () => { state.connected = false; return []; };
  assert.equal((await syncHealth(deps)).stopped, true);
  assert.equal(state.written.length, 0);
  assert.equal(state.prefs.exportedIds.length, 0);
});

test('a ruck is written as a hike with its distance in meters', () => {
  const payload = toHealthExport(activity({ type: 'ruck', caloriesEstimate: 410.4 }));
  assert.equal(payload.kind, 'hike');
  assert.equal(payload.title, 'Gruntz Ruck');
  assert.equal(payload.distanceMeters, 4828);
  assert.equal(payload.calories, 410);
  assert.equal(payload.endMs - payload.startMs, HOUR);
});

test('imported workouts and undatable records are never written back', () => {
  assert.equal(toHealthExport(activity({ id: 'health:abc' })), null);
  assert.equal(toHealthExport(activity({ date: 'nonsense' })), null);
  assert.equal(activityWindow(activity({ startedAt: undefined })).startMs, NOW - HOUR - 3000 * 1000);
});

test('only runs and hikes from other sources are imported, and they pass history validation', () => {
  const imported = importableWorkouts([
    workout(),
    workout({ id: 'w2', kind: 'walk' }),
    workout({ id: 'w3', fromGruntz: true }),
    workout({ id: 'w4', startMs: NOW - 30000, endMs: NOW }),
    workout({ id: 'w5', kind: 'hike', startMs: NOW - 30 * HOUR, endMs: NOW - 28 * HOUR }),
  ], []);
  assert.deepEqual(imported.map((item) => item.id), ['w5', 'w1']);
  const hike = toImportedActivity(imported[0], { activeSeconds: 6000, elevationMeters: 100, calories: 700, source: ' Apple Watch ' });
  const run = toImportedActivity(imported[1]);
  assert.equal(hike.id, 'health:w5');
  assert.equal(hike.type, 'hike');
  assert.equal(hike.durationSeconds, 6000);
  assert.equal(hike.elevationFeet, 328);
  assert.equal(hike.caloriesEstimate, 700);
  assert.equal(hike.source, 'Apple Watch');
  assert.equal(run.distanceMiles, 3.11);
  assert.equal(run.durationSeconds, 3600);
  assert.ok([hike, run].every((item) => isTrackedSession(item)));
});

test('a ruck recorded by the Gruntz watch app comes back as a ruck, not a hike', () => {
  const imported = importableWorkouts([workout({ id: 'w6', kind: 'ruck', startMs: NOW - 2 * HOUR, endMs: NOW - HOUR })], []);
  assert.equal(imported.length, 1);
  const ruck = toImportedActivity(imported[0], { source: 'Apple Watch' });
  assert.equal(ruck.type, 'ruck');
  assert.ok(isTrackedSession(ruck));
});

test('a workout covering the same time as a saved activity is the same outing', () => {
  const sessions = [activity()];
  const watch = workout({ startMs: NOW - 2 * HOUR + 60000, endMs: NOW - HOUR - 60000 });
  assert.deepEqual(importableWorkouts([watch], sessions), []);
  assert.equal(importableWorkouts([workout()], sessions).length, 1);
  assert.deepEqual(importableWorkouts([workout()], [activity({ id: 'health:w1' })]), []);
});

test('a sync exports new activities once and imports watch workouts with heart rate and credit', async () => {
  const { state, deps } = environment({ sessions: [activity()], workouts: [workout()], heartRate: { average: 151.6, max: 178.2 } });
  assert.deepEqual(await syncHealth(deps), { ...quiet, exported: 1, imported: 1, heartRates: 1 });
  assert.equal(state.written[0].activityId, 'activity-1');
  assert.deepEqual(state.prefs.exportedIds, ['activity-1']);
  assert.equal(state.saved[0].averageHeartRate, 152);
  assert.equal(state.saved[0].maxHeartRate, 178);
  assert.deepEqual(state.credited, ['health:w1']);
  assert.deepEqual(state.heartRates, [{ id: 'activity-1', average: 152, max: 178 }]);
  assert.equal(state.finishedAt, NOW);
  // One lookup per activity: the import's own, and one for the phone-recorded run.
  assert.equal(state.calls.heartRate, 2);
  assert.equal(state.calls.details, 1);

  state.prefs = { ...state.prefs, lastSyncAt: NOW };
  assert.deepEqual(await syncHealth(deps), quiet);
  assert.equal(state.written.length, 1);
  assert.equal(state.calls.heartRate, 2);
});

test('totals are only fetched for workouts that will be imported', async () => {
  const { state, deps } = environment({ sessions: [activity({ id: 'health:w1' })], workouts: [workout(), workout({ id: 'w9', kind: 'walk' })] });
  assert.deepEqual(await syncHealth(deps), quiet);
  assert.equal(state.calls.details, 0);
});

test('an activity already in the health store from an earlier install is not written twice', async () => {
  const twin = workout({ id: 'old', fromGruntz: true, startMs: NOW - 2 * HOUR, endMs: NOW - HOUR });
  const { state, deps } = environment({ sessions: [activity()], workouts: [twin] });
  assert.equal((await syncHealth(deps)).exported, 0);
  assert.deepEqual(state.prefs.exportedIds, ['activity-1']);
  assert.equal(state.written.length, 0);
});

test('each direction follows its own switch', async () => {
  const off = environment({ sessions: [activity()], workouts: [workout()], heartRate: { average: 140, max: 160 }, prefs: { writeActivities: false, importWorkouts: false } });
  assert.deepEqual(await syncHealth(off.deps), quiet);
  const writeOnly = environment({ sessions: [activity()], workouts: [workout()], heartRate: { average: 140, max: 160 }, prefs: { importWorkouts: false } });
  assert.deepEqual(await syncHealth(writeOnly.deps), { ...quiet, exported: 1 });
});

test('a failed write is retried next time and does not stop the rest', async () => {
  let fail = true;
  const { state, deps } = environment({
    sessions: [activity()], workouts: [workout()],
    adapter: { saveWorkout: async () => { if (fail) throw Error('denied'); return true; } },
  });
  assert.deepEqual(await syncHealth(deps), { ...quiet, imported: 1 });
  assert.deepEqual(state.prefs.exportedIds, []);
  fail = false;
  assert.equal((await syncHealth(deps)).exported, 1);
});

test('a refused workout read is reported, and exporting still goes ahead', async () => {
  const { deps } = environment({ sessions: [activity()], adapter: { workouts: async () => { throw Error('no read access'); } } });
  assert.deepEqual(await syncHealth(deps), { ...quiet, exported: 1, readFailed: true });
});

test('disconnecting mid-sync stops it before the next item and leaves the sync position alone', async () => {
  const { state, deps } = environment({
    sessions: [activity(), activity({ id: 'activity-2', date: iso(NOW - 4 * HOUR), startedAt: iso(NOW - 5 * HOUR) })],
    adapter: { saveWorkout: async () => { state.connected = false; return true; } },
  });
  const result = await syncHealth(deps);
  assert.equal(result.stopped, true);
  assert.equal(result.exported, 1);
  assert.equal(state.finishedAt, null);
});

test('heart rate is looked up for every recent activity without one, at most once a day', async () => {
  const old = NOW - (HEALTH_LOOKBACK_DAYS + 2) * 24 * HOUR;
  const { state, deps } = environment({
    sessions: [
      activity({ id: 'ancient', date: iso(old), startedAt: iso(old - HOUR) }),
      activity({ id: 'last-week', date: iso(NOW - 170 * HOUR), startedAt: iso(NOW - 171 * HOUR) }),
      activity({ id: 'checked-today', date: iso(NOW - 50 * HOUR), startedAt: iso(NOW - 51 * HOUR) }),
    ],
    heartRate: { average: 140, max: 165 },
    prefs: { lastSyncAt: NOW - HOUR, exportedIds: ['last-week', 'checked-today', 'ancient'], heartRateChecked: { 'checked-today': NOW - 2 * HOUR } },
  });
  assert.deepEqual(await syncHealth(deps), { ...quiet, heartRates: 1 });
  assert.deepEqual(state.heartRates.map((item) => item.id), ['last-week']);
  assert.equal(state.calls.heartRate, 1);
  // Nothing new to ask about until tomorrow.
  assert.deepEqual(await syncHealth(deps), quiet);
  assert.equal(state.calls.heartRate, 1);
});

test('a reading that arrives days later is still picked up', async () => {
  let reading = null;
  const { state, deps } = environment({
    sessions: [activity({ id: 'friday', date: iso(NOW - 72 * HOUR), startedAt: iso(NOW - 73 * HOUR) })],
    prefs: { lastSyncAt: NOW - HOUR, exportedIds: ['friday'], heartRateChecked: { friday: NOW - 30 * HOUR } },
    adapter: { heartRate: async () => reading },
  });
  assert.deepEqual(await syncHealth(deps), quiet);
  reading = { average: 150, max: 170 };
  state.prefs = { ...state.prefs, heartRateChecked: { friday: NOW - 30 * HOUR } };
  assert.equal((await syncHealth(deps)).heartRates, 1);
});

test('workouts missing after a restore come back even though a sync already ran', async () => {
  const { deps } = environment({ workouts: [workout({ startMs: NOW - 200 * HOUR, endMs: NOW - 199 * HOUR })], prefs: { lastSyncAt: NOW - HOUR } });
  assert.equal((await syncHealth(deps)).imported, 1);
});

test('heart rate readings outside a plausible range are dropped', () => {
  assert.equal(cleanHeartRate(null), null);
  assert.equal(cleanHeartRate({ average: 12, max: 20 }), null);
  assert.equal(cleanHeartRate({ average: 150, max: 400 }), null);
  assert.deepEqual(cleanHeartRate({ average: 150.4, max: 149 }), { average: 150, max: 150 });
});
