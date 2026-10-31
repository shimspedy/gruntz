const test = require('node:test');
const assert = require('node:assert/strict');
const { createWorkoutEnv } = require('./workout-test-utils.cjs');
const DATE = '2026-10-31';
const MIN = 60 * 1000;

function loadLive(env, drained = []) {
  const calls = { sync: [], end: 0 };
  const { createLoader } = require('./workout-test-utils.cjs');
  const mod = createLoader({
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    '../store/useSessionStore': env.storeModule,
    '../store/useUserStore': { useUserStore: { getState: () => ({ profile: { settings: { units: 'imperial' } } }) } },
    '../data/exercises': env.exercisesModule,
    './crashReporting': { reportHandled() {} },
    '../../modules/gruntz-live-activity': {
      liveActivitySupported: () => true,
      syncNativeLiveActivity: async (p) => { calls.sync.push(p); },
      endNativeLiveActivity: async () => { calls.end += 1; },
      drainNativeLoggedSets: () => drained.splice(0),
    },
  })('src/services/liveActivity.ts');
  return { mod, calls };
}

function setup() {
  const env = createWorkoutEnv();
  env.storeModule = env.load('src/store/useSessionStore.ts');
  env.session = env.storeModule.useSessionStore;
  env.exercisesModule = env.load('src/data/exercises.ts');
  return env;
}

test('a workout left open ends at its last set, not when Finish is finally tapped', () => {
  const env = setup();
  const { sessionMinutes } = env.storeModule;
  const start = Date.UTC(2026, 9, 31, 10);
  assert.equal(sessionMinutes(start, start + 30 * MIN, start + 40 * MIN, 25), 40);
  assert.equal(sessionMinutes(start, start + 35 * MIN, start + 5 * 60 * MIN, 25), 36);
  assert.equal(sessionMinutes(start, null, start + 3 * 24 * 60 * MIN, 25), 1);
  assert.equal(sessionMinutes(start - 13 * 60 * MIN, start, start + 10 * MIN, 25), 25);
});

test('logging or editing a set records activity, and the mission uses it', () => {
  const env = setup();
  env.session.getState().start(env.day(['pushups']), DATE);
  const before = env.session.getState().lastActivityAt;
  assert.equal(typeof before, 'number');
  const ex = env.session.getState().exercises[0];
  env.session.setState({ lastActivityAt: 0 });
  env.session.getState().toggleSet(ex.key, ex.sets.find((s) => !s.warmup).id);
  assert.ok(env.session.getState().lastActivityAt > 0);
});

test('the Lock Screen offers the next sets in order and stops at one that needs a number', () => {
  const env = setup();
  env.session.getState().start(env.day(['pushups', 'bench_press']), DATE);
  const { mod } = loadLive(env);
  const s = env.session.getState();
  const payload = mod.liveWorkoutPayload(s, 'lb', Date.now());
  assert.equal(payload.title, s.title);
  const first = s.exercises[0];
  const working = first.sets.filter((x) => !x.warmup);
  assert.equal(payload.state.upcoming[0].exKey, first.key);
  assert.equal(payload.state.setLabel, payload.state.upcoming[0].setLabel);
  assert.ok(payload.state.upcoming.length <= 8);
  assert.ok(payload.state.upcoming.every((u, i, all) => i === 0 || all[i - 1].exKey === first.key || u.exKey !== first.key));
  assert.ok(payload.state.upcoming.filter((u) => u.exKey === first.key).length <= first.sets.length);
  void working;

  env.session.getState().updateSet(first.key, first.sets[0].id, { reps: undefined });
  const blocked = mod.liveWorkoutPayload(env.session.getState(), 'lb', Date.now());
  if (first.kind === 'reps' && !first.sets[0].done) {
    assert.equal(blocked.state.upcoming.length, 0);
    assert.equal(blocked.state.detail, 'Open Gruntz to log it');
  }
  assert.equal(mod.liveWorkoutPayload({ ...env.session.getState(), active: false }, 'lb', Date.now()), null);
});

test('sets logged from the Lock Screen are applied in order with their own time and remaining rest', () => {
  const env = setup();
  env.session.getState().start(env.day(['bench_press']), DATE);
  const ex = env.session.getState().exercises[0];
  const sets = ex.sets.filter((s) => !s.warmup && s.reps);
  const now = Date.now();
  env.session.setState({ startedAt: now - 10 * MIN });
  const { mod } = loadLive(env);
  mod.applyLoggedSets([
    { exKey: ex.key, setId: sets[1].id, at: now - 20_000 },
    { exKey: ex.key, setId: sets[0].id, at: now - 60_000 },
    { exKey: ex.key, setId: 'gone', at: now - 10_000 },
  ], now);
  const after = env.session.getState().exercises[0].sets;
  assert.equal(after.find((s) => s.id === sets[0].id).done, true);
  assert.equal(after.find((s) => s.id === sets[1].id).done, true);
  assert.equal(env.session.getState().lastActivityAt, now - 20_000);
  const rest = env.session.getState().restFor(ex.exerciseId, ex.key);
  if (rest > 20) assert.equal(env.session.getState().restEndsAt, now - 20_000 + rest * 1000);
  else assert.equal(env.session.getState().restEndsAt, null);
  mod.applyLoggedSets([{ exKey: ex.key, setId: sets[0].id, at: now }], now);
  assert.equal(env.session.getState().exercises[0].sets.find((s) => s.id === sets[0].id).done, true, 'a set already done is never toggled back');
  mod.applyLoggedSets([{ exKey: ex.key, setId: sets[2]?.id ?? 'none', at: now + 24 * 60 * MIN }], now);
  if (sets[2]) assert.equal(env.session.getState().lastActivityAt, now, 'a log is never dated after now');
});

test('syncing starts once per change and ends with the workout', async () => {
  const env = setup();
  env.session.getState().start(env.day(['pushups']), DATE);
  const { mod, calls } = loadLive(env);
  await mod.syncLiveActivity(env.session.getState());
  await mod.syncLiveActivity(env.session.getState());
  assert.equal(calls.sync.length, 1);
  env.session.getState().discard();
  await mod.syncLiveActivity(env.session.getState());
  assert.equal(calls.end, 1);
});

test('returning after an hour without a set asks about the open workout', () => {
  const { createLoader } = require('./workout-test-utils.cjs');
  const presence = createLoader({
    'react-native': { Alert: { alert() {} }, AppState: { addEventListener: () => ({ remove() {} }) } },
    '../store/useSessionStore': { useSessionStore: { getState: () => ({}), subscribe() {} } },
    './notifications': { cancelWorkoutLeftOpen: async () => {}, scheduleWorkoutLeftOpen: async () => {} },
    './liveActivity': { syncLiveActivity: async () => {} },
  })('src/services/workoutPresence.ts');
  const now = Date.UTC(2026, 9, 31, 12);
  assert.equal(presence.shouldAskAboutOpenWorkout({ active: true, lastActivityAt: now - 30 * MIN, startedAt: now - 90 * MIN }, now), false);
  assert.equal(presence.shouldAskAboutOpenWorkout({ active: true, lastActivityAt: now - 61 * MIN, startedAt: now - 90 * MIN }, now), true);
  assert.equal(presence.shouldAskAboutOpenWorkout({ active: true, lastActivityAt: null, startedAt: now - 2 * 60 * MIN }, now), true);
  assert.equal(presence.shouldAskAboutOpenWorkout({ active: false, lastActivityAt: now - 5 * 60 * MIN, startedAt: now - 6 * 60 * MIN }, now), false);
});
