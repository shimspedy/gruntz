const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const {
  parseWatchCommand, parseWatchCommands, parseWorkoutRef, planWorkoutRef, programWorkoutRef, routineWorkoutRef, watchLive, watchState, WATCH_PROTOCOL,
} = createLoader()('src/features/watchState.ts');

const session = (overrides = {}) => ({
  active: true, title: 'Push day', startedAt: 1000, index: 0, restEndsAt: null,
  exercises: [{ key: 'a:0:bench', name: 'Bench Press', kind: 'reps', weighted: true, rest: 90.4, requiredSets: 2,
    sets: [{ id: 's1', reps: 8, weight: 185, done: true }, { id: 's2', reps: 8, weight: 185, seconds: undefined, done: false }] }],
  ...overrides,
});

test('the running workout is described for the watch; no workout means nothing to show', () => {
  assert.equal(watchLive(session({ active: false }), 5000), null);
  const live = watchLive(session({ restEndsAt: 9000 }), 5000);
  assert.equal(live.id, 1000);
  assert.equal(live.restEndsAt, 9000);
  assert.deepEqual(live.exercises[0], { key: 'a:0:bench', name: 'Bench Press', kind: 'reps', weighted: true, rest: 90, required: 2,
    sets: [{ id: 's1', reps: 8, weight: 185, done: true }, { id: 's2', reps: 8, weight: 185, done: false }] });
  // A rest that has already run out is not sent as one still counting.
  assert.equal(watchLive(session({ restEndsAt: 4000 }), 5000).restEndsAt, null);
  const state = watchState({ unit: 'lb', live, workouts: Array.from({ length: 30 }, (_, i) => ({ id: `routine:${i}`, title: 'W', detail: 'd' })), result: null, notice: null });
  assert.equal(state.v, WATCH_PROTOCOL);
  assert.equal(state.workouts.length, 12);
});

test('commands from the watch are bounded field by field and anything else is dropped', () => {
  const log = { id: 'c1', t: 'log', at: 2000, session: 1000, exKey: 'a:0:bench', setId: 's2', reps: 9, weight: 187.456 };
  assert.deepEqual(parseWatchCommand(log), { ...log, weight: 187.46 });
  for (const bad of [
    null, 'log', [], { ...log, id: '' }, { ...log, id: 'x'.repeat(65) }, { ...log, at: NaN }, { ...log, session: '1000' },
    { ...log, reps: 0 }, { ...log, reps: 2.5 }, { ...log, reps: 1000 }, { ...log, weight: -1 }, { ...log, weight: 5000 },
    { ...log, seconds: 0 }, { ...log, setId: 7 }, { ...log, exKey: 'k'.repeat(301) }, { ...log, t: 'discard' },
    { id: 'c2', t: 'start', at: 1 }, { id: 'c3', t: 'rest', at: 1, session: 1000, action: 'pause' }, { id: 'c4', t: 'finish', at: 1 },
  ]) assert.equal(parseWatchCommand(bad), null, JSON.stringify(bad));
  assert.deepEqual(parseWatchCommand({ id: 'r', t: 'rest', at: 1, session: 1000, action: 'add', seconds: 99999 }), { id: 'r', t: 'rest', at: 1, session: 1000, action: 'add', seconds: 0 });
  assert.deepEqual(parseWatchCommand({ id: 'r', t: 'rest', at: 1, session: 1000, action: 'add', seconds: -15, extra: 'ignored' }), { id: 'r', t: 'rest', at: 1, session: 1000, action: 'add', seconds: -15 });
});

test('a drained queue is applied oldest first and each command once', () => {
  const seen = new Set();
  const queue = [
    { id: 'b', t: 'finish', at: 300, session: 1000 }, { id: 'a', t: 'log', at: 100, session: 1000, exKey: 'k', setId: 's' },
    { id: 'a', t: 'log', at: 100, session: 1000, exKey: 'k', setId: 's' }, { nonsense: true },
  ];
  assert.deepEqual(parseWatchCommands(queue, seen).map((c) => c.id), ['a', 'b']);
  assert.deepEqual(parseWatchCommands(queue, seen), []);
  assert.deepEqual(parseWatchCommands('not a queue'), []);
});

test('workout references round-trip and nothing else is accepted', () => {
  assert.deepEqual(parseWorkoutRef(programWorkoutRef('2026-11-10', 'bc_w1:d2')), { source: 'program', dateKey: '2026-11-10', workoutId: 'bc_w1:d2' });
  assert.deepEqual(parseWorkoutRef(planWorkoutRef('ppl-6', 'day-3')), { source: 'plan', planId: 'ppl-6', dayId: 'day-3' });
  assert.deepEqual(parseWorkoutRef(routineWorkoutRef('rabc')), { source: 'routine', routineId: 'rabc' });
  assert.equal(parseWorkoutRef('program:today:x'), null);
  assert.equal(parseWorkoutRef('settings:reset'), null);
});

test('numbers no workout can hold are clamped before they reach the watch', () => {
  const live = watchLive(session({
    index: 0.6, restEndsAt: 1e300,
    exercises: [{ key: 'a', name: 'Plank', kind: 'time', weighted: true, rest: 1e12, requiredSets: 2.4,
      sets: [{ id: 's1', reps: 1e30, weight: -5, seconds: 1e30, done: false }] }],
  }), 5000);
  assert.equal(live.index, 0);
  assert.equal(live.restEndsAt, 5000 + 24 * 60 * 60_000);
  assert.equal(live.exercises[0].rest, 3600);
  assert.equal(live.exercises[0].required, 2);
  assert.deepEqual(live.exercises[0].sets[0], { id: 's1', reps: 9999, weight: 0, seconds: 86_400, done: false });
  const state = watchState({ unit: 'lb', live: null, workouts: [], notice: null, result: { session: 1, xp: 1e40, sets: 12.6, minutes: -3, personalRecords: NaN } });
  assert.deepEqual(state.result, { session: 1, xp: 1e9, sets: 13, minutes: 0, personalRecords: 0 });
});
