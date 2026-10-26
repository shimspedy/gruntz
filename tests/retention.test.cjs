const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, createWorkoutEnv } = require('./workout-test-utils.cjs');
const retention = createLoader()('src/features/retention.ts');
const entry = (sets, unit = 'lb', at = '2026-10-19T12:00:00') => ({ id: at, at, workoutTitle: 'Session', unit, sets, movement: { exerciseId: 'bench' } });
const exercise = (sets, extra = {}) => ({ name: 'Bench press', exerciseId: 'bench', logKey: 'bench', kind: 'reps', comparable: true, sets: sets.map((set, index) => ({ id: String(index), done: true, ...set })), ...extra });

test('training attendance deduplicates performed workout logs and activities on the same calendar day', () => {
  const dates = retention.trainingDateKeys({
    bench: [entry([{ reps: 8 }]), entry([], 'lb', '2026-10-20T12:00:00')],
    squat: [entry([{ reps: 5 }])],
  }, [{ date: '2026-10-19' }, { date: '2026-10-21' }, { date: 'invalid' }]);
  assert.deepEqual([...dates].sort(), ['2026-10-19', '2026-10-21']);
});

test('finishing a future scheduled mission records attendance on its actual completion day', () => {
  const env = createWorkoutEnv();
  const scheduled = '2099-10-23';
  env.session.getState().start(env.day(), scheduled);
  const exercise = env.session.getState().exercises[0];
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  env.session.getState().finish();
  const dates = retention.trainingDateKeys(env.log.getState().logs);
  const today = env.load('src/utils/dateKey.ts').getLocalDateKey();
  assert.ok(dates.has(today));
  assert.ok(!dates.has(scheduled));
  assert.equal(dates.size, 1);
});

test('weekly comparisons use Monday to Sunday windows and a separately labelled current goal', () => {
  const week = retention.summarizeTrainingWeek(['2026-10-18', '2026-10-19', '2026-10-19', '2026-10-25', '2026-10-26'], 3, new Date(2026, 9, 25));
  assert.equal(week.startKey, '2026-10-19');
  assert.equal(week.trainingDays, 2);
  assert.equal(week.previousTrainingDays, 1);
  assert.equal(week.currentTarget, 3);
  assert.equal(retention.previousWeekStart(new Date(2026, 9, 26)).getDate(), 19);
});

test('the next action respects scheduled weekdays and does not prescribe a second session today', () => {
  const monday = new Date(2026, 9, 19, 10);
  assert.equal(retention.nextTrainingDay(3, [], monday).dateKey, '2026-10-19');
  assert.equal(retention.nextTrainingDay(3, ['2026-10-19'], monday).dateKey, '2026-10-21');
  assert.equal(retention.nextTrainingDay(3, [], new Date(2026, 9, 24)).dateKey, '2026-10-26');
});

test('comeback appears after seven local calendar days and ignores future or invalid history', () => {
  assert.equal(retention.comebackDays([], new Date(2026, 9, 26)), null);
  assert.equal(retention.comebackDays(['2026-10-20'], new Date(2026, 9, 26)), null);
  assert.equal(retention.comebackDays(['2026-10-19', '2027-10-19', 'bad'], new Date(2026, 9, 26)), 7);
  assert.equal(retention.comebackDays(['2026-10-30'], new Date(2026, 10, 6)), 7);
});

test('a set improvement compares actual reps at the same load against the whole saved history', () => {
  const history = { bench: [entry([{ reps: 10, weight: 100 }]), entry([{ reps: 7, weight: 100 }])] };
  assert.match(retention.sessionWin([exercise([{ reps: 12, weight: 100 }])], history, 'lb', false).winDetail, /12 reps at 100 lb, above your saved best of 10/);
  assert.equal(retention.sessionWin([exercise([{ reps: 8, weight: 100 }])], history, 'lb', false).winTitle, 'Your work is on the record');
});

test('a heavier set is only compared at the same reps with weights converted into the current unit', () => {
  const history = { bench: [entry([{ reps: 8, weight: 100 }], 'lb')] };
  const converted = retention.sessionWin([exercise([{ reps: 8, weight: 45.36 }])], history, 'kg', false);
  assert.equal(converted.winTitle, 'Your work is on the record');
  const improved = retention.sessionWin([exercise([{ reps: 8, weight: 50 }])], history, 'kg', false);
  assert.match(improved.winDetail, /50 kg, up from your saved best of 45.4 kg for 8 reps/);
  assert.equal(retention.sessionWin([exercise([{ reps: 5, weight: 120 }])], history, 'lb', false).winTitle, 'Your work is on the record');
});

test('warmups, incomplete sets, substituted movements and timed holds do not invent performance gains', () => {
  const history = { bench: [entry([{ reps: 5, weight: 100 }])] };
  const win = retention.sessionWin([
    exercise([{ reps: 20, weight: 100, warmup: true }, { reps: 20, weight: 100, done: false }, { reps: 8, weight: 100 }], { comparable: false }),
    exercise([{ seconds: 90 }], { kind: 'time' }),
  ], history, 'lb', true);
  assert.equal(win.winTitle, 'Your starting point is saved');
  assert.match(win.winDetail, /^2 working sets across 2 movements/);
});

test('unknown units or malformed loads in restored history cannot produce a personal gain', () => {
  const current = [exercise([{ reps: 8, weight: 100 }])];
  const history = { bench: [entry([{ reps: 8, weight: 30 }], undefined)] };
  history.bench[0].unit = undefined;
  assert.equal(retention.sessionWin(current, history, 'lb', false).winTitle, 'Your work is on the record');
  history.bench[0].unit = 'lb';
  history.bench[0].sets[0].weight = '30';
  assert.equal(retention.sessionWin(current, history, 'lb', false).winTitle, 'Your work is on the record');
});

test('legacy, malformed and different movement provenance cannot support a gain on a shared history key', () => {
  const current = [exercise([{ reps: 10 }])];
  for (const movement of [undefined, null, [], { exerciseId: 'other' }, { exerciseId: 'bench', prescribedName: 'Knee variation' }, { exerciseId: 'bench', prescribedName: '' }]) {
    const old = entry([{ reps: 8 }]);
    old.movement = movement;
    assert.equal(retention.sessionWin(current, { bench: [old] }, 'lb', false).winTitle, 'Your work is on the record');
  }
  assert.match(retention.sessionWin(current, { bench: [entry([{ reps: 8 }])] }, 'lb', false).winDetail, /above your saved best of 8/);
});

test('a prior plan substitution remains saved but is not a record for its canonical demonstration movement', () => {
  const env = createWorkoutEnv();
  const plan = { id: 'substitute-plan', title: 'Plan with a demonstration substitution' };
  const day = { id: 'substitute-day', title: 'Knee pushups', estimated_minutes: 5, exercises: [{ order: 1, exercise_id: 'knee-push-up', video_key: 'push-up', name: 'Knee Push-Up', measure: 'reps', sets: 1, reps: 8, rest_seconds: 60 }] };
  env.session.getState().startPlanDay(plan, day, '2026-10-26');
  const performed = env.session.getState().exercises[0];
  env.session.getState().toggleSet(performed.key, performed.sets[0].id);
  env.session.getState().finish();
  const canonical = env.getExerciseById(env.libraryExerciseId('push-up'));
  const key = env.exerciseLogKey(canonical);
  const history = env.log.getState().logs;
  assert.deepEqual(history[key][0].movement, { exerciseId: canonical.id, prescribedName: 'Knee Push-Up' });
  assert.equal(history[key][0].sets[0].reps, 8);
  const win = retention.sessionWin([exercise([{ reps: 10 }], { exerciseId: canonical.id, name: canonical.name, logKey: key })], history, 'lb', false);
  assert.equal(win.winTitle, 'Your work is on the record');
});
