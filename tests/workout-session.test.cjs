const test = require('node:test');
const assert = require('node:assert/strict');
const { createWorkoutEnv } = require('./workout-test-utils.cjs');
const DATE = '2026-10-03';

function checkAll(env) {
  for (const exercise of env.session.getState().exercises) {
    for (const set of exercise.sets.filter((s) => !s.warmup)) env.session.getState().toggleSet(exercise.key, set.id);
  }
}

test('every start path converts prior weights into the current unit', () => {
  const env = createWorkoutEnv();
  env.setUnits('metric');
  env.session.setState({ previous: { bench_press: [{ reps: 10, weight: 100, unit: 'lb' }] } });
  env.session.getState().start(env.day(), DATE);
  assert.equal(env.session.getState().exercises[0].sets[0].weight, 45.36);
  env.session.getState().discard();
  const plan = env.load('src/data/workoutPlans.ts').allPlans().find((p) => p.days[0].exercises[0].video_key);
  const day = plan.days[0];
  const id = env.libraryExerciseId(day.exercises[0].video_key);
  env.session.setState({ previous: { [id]: [{ weight: 100, unit: 'lb' }] } });
  env.session.getState().startPlanDay(plan, day, DATE);
  assert.equal(env.session.getState().exercises[0].sets.find((s) => !s.warmup).weight, 45.36);
  env.session.getState().discard();
  env.session.getState().startRoutine({ id: 'routine', name: 'Routine', items: [{ key: day.exercises[0].video_key, sets: 2, reps: 8, rest: 60 }] }, DATE);
  assert.equal(env.session.getState().exercises[0].sets[0].weight, 45.36);
});

test('starting another workout cannot erase an active session', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(), DATE);
  const startedAt = env.session.getState().startedAt;
  env.session.getState().start({ ...env.day(['pushups']), id: 'other' }, DATE);
  assert.equal(env.session.getState().workoutDayId, 'test-day');
  assert.equal(env.session.getState().startedAt, startedAt);
});

test('finishing early preserves every performed set in mission totals and exercise history', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(), DATE);
  const ex = env.session.getState().exercises[0];
  assert.ok(ex.requiredSets > 1);
  env.session.getState().updateSet(ex.key, ex.sets[0].id, { reps: 7, weight: 100 });
  env.session.getState().toggleSet(ex.key, ex.sets[0].id);
  const mission = env.session.getState().buildMission();
  assert.equal(mission.exercises.length, 1);
  assert.equal(mission.exercises[0].completed_reps, 7);
  assert.equal(mission.exercises[0].completed_sets, 1);
  assert.equal(mission.exercises[0].xp_earned, 0);
  assert.equal(mission.is_perfect, false);
  env.session.getState().finish();
  const key = env.getExerciseById(ex.exerciseId).media_key ?? ex.exerciseId;
  assert.equal(env.log.getState().logs[key].length, 1);
  assert.equal(env.log.getState().logs[key][0].sets[0].reps, 7);
  env.session.getState().finish();
  assert.equal(env.log.getState().logs[key].length, 1);
  assert.equal(env.session.getState().buildMission(), null);
});

test('removing sets keeps a reachable target and preserves at least one working set', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(), DATE);
  let ex = env.session.getState().exercises[0];
  env.session.getState().addWarmupSets(ex.key);
  for (const set of ex.sets.slice(1)) env.session.getState().removeSet(ex.key, set.id);
  ex = env.session.getState().exercises[0];
  assert.equal(ex.requiredSets, 1);
  const work = ex.sets.find((s) => !s.warmup);
  env.session.getState().removeSet(ex.key, work.id);
  assert.ok(env.session.getState().exercises[0].sets.some((s) => s.id === work.id));
  env.session.getState().toggleSet(ex.key, work.id);
  assert.equal(env.isExerciseDone(env.session.getState().exercises[0]), true);
});

test('exercise swaps cannot reattribute logged sets and clear incompatible prescriptions', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(), DATE);
  const ex = env.session.getState().exercises[0];
  env.session.getState().updateSet(ex.key, ex.sets[0].id, { weight: 100 });
  env.session.getState().toggleSet(ex.key, ex.sets[0].id);
  assert.equal(env.session.getState().replaceExercise(ex.key, 'forward_plank'), false);
  assert.equal(env.session.getState().exercises[0].exerciseId, 'bench_press');
  env.session.getState().toggleSet(ex.key, ex.sets[0].id);
  assert.equal(env.session.getState().replaceExercise(ex.key, 'forward_plank'), true);
  const next = env.session.getState().exercises[0];
  assert.equal(next.kind, 'time');
  assert.equal(next.sets[0].weight, undefined);
  assert.equal(next.sets[0].reps, undefined);
  assert.equal(next.sets[0].seconds, 60);
});

test('adding a distance set retains its distance and invalid toggles cannot start rest', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(['farmers_carry']), DATE);
  const ex = env.session.getState().exercises[0];
  env.session.getState().addSet(ex.key);
  assert.equal(env.session.getState().exercises[0].sets.at(-1).distance, ex.sets[0].distance);
  assert.deepEqual(env.session.getState().toggleSet(ex.key, 'missing'), { completedExercise: false, startedRest: false });
  assert.equal(env.session.getState().restEndsAt, null);
});

test('partial plan workouts remain incomplete; a full day is credited to the followed plan after switching away', () => {
  const env = createWorkoutEnv();
  const [plan, other] = env.load('src/data/workoutPlans.ts').allPlans();
  const day = plan.days[0];
  env.plans.getState().follow(plan.id);
  env.session.getState().startPlanDay(plan, day, DATE);
  const ex = env.session.getState().exercises[0];
  env.session.getState().toggleSet(ex.key, ex.sets.find((s) => !s.warmup).id);
  env.session.getState().finish();
  assert.equal(env.plans.getState().completedDayIds.includes(day.id), false);
  env.session.getState().startPlanDay(plan, day, DATE);
  checkAll(env);
  env.plans.getState().follow(other.id);
  env.session.getState().finish();
  assert.ok(env.plans.getState().progressByPlan[plan.id].completedDayIds.includes(day.id));
  assert.deepEqual(env.plans.getState().completedDayIds, []);
});

test('undoing the last completed plan day also reverses its cycle award', () => {
  const env = createWorkoutEnv();
  const plan = env.load('src/data/workoutPlans.ts').allPlans()[0];
  env.plans.getState().follow(plan.id);
  for (const day of plan.days) env.plans.getState().markDayDone(day.id);
  assert.equal(env.plans.getState().cycle, 1);
  env.plans.getState().unmarkDay(plan.days.at(-1).id);
  assert.equal(env.plans.getState().cycle, 0);
  assert.equal(env.plans.getState().justCompleted, null);
  env.plans.getState().markDayDone(plan.days.at(-1).id);
  assert.equal(env.plans.getState().cycle, 1);
});

test('all bundled plan days produce reachable working sets and valid exercise references', () => {
  const env = createWorkoutEnv();
  const plans = env.load('src/data/workoutPlans.ts').allPlans();
  let days = 0;
  for (const plan of plans) {
    for (const day of plan.days) {
      days += 1;
      env.session.getState().startPlanDay(plan, day, DATE);
      const exercises = env.session.getState().exercises;
      assert.ok(exercises.length > 0, `${plan.id}/${day.id}: empty workout`);
      assert.equal(exercises.length, day.exercises.length, `${plan.id}/${day.id}: missing prescribed exercises`);
      for (const ex of exercises) {
        assert.ok(env.getExerciseById(ex.exerciseId), ex.exerciseId);
        assert.equal(ex.requiredSets, ex.sets.filter((s) => !s.warmup).length);
        assert.ok(ex.requiredSets >= 1);
      }
      env.session.getState().discard();
    }
  }
  assert.ok(plans.length >= 500);
  assert.ok(days > 1000);
});

test('AMRAP and cleared sets require an actual result instead of invented library defaults', () => {
  const env = createWorkoutEnv();
  const plan = env.load('src/data/workoutPlans.ts').allPlans().find((p) => p.days.some((d) => d.exercises.some((e) => e.measure === 'amrap')));
  const day = plan.days.find((d) => d.exercises.some((e) => e.measure === 'amrap'));
  env.session.getState().startPlanDay(plan, day, DATE);
  const at = day.exercises.findIndex((e) => e.measure === 'amrap');
  const ex = env.session.getState().exercises[at];
  const set = ex.sets.find((s) => !s.warmup);
  env.session.getState().updateSet(ex.key, set.id, { reps: undefined });
  assert.equal(env.session.getState().toggleSet(ex.key, set.id).needsValue, true);
  assert.equal(env.session.getState().exercises[at].sets.find((s) => s.id === set.id).done, false);
  env.session.getState().updateSet(ex.key, set.id, { reps: 17 });
  assert.equal(env.session.getState().toggleSet(ex.key, set.id).needsValue, undefined);
  assert.equal(env.session.getState().exercises[at].sets.find((s) => s.id === set.id).done, true);
  env.session.getState().updateSet(ex.key, set.id, { reps: undefined });
  assert.equal(env.session.getState().exercises[at].sets.find((s) => s.id === set.id).done, false);
  assert.equal(env.session.getState().restEndsAt, null);
});

test('all weeks of all built-in programs reference valid movements', () => {
  const env = createWorkoutEnv();
  const programs = env.load('src/data/programWorkouts.ts');
  let days = 0;
  for (const program of ['basecamp', 'raider', 'recon']) {
    for (let week = 1; week <= programs.getProgramMaxWeek(program); week++) {
      for (const day of programs.getProgramWeek(program, week)) {
        days++;
        env.session.getState().start(day, DATE);
        assert.equal(env.session.getState().exercises.length, day.sections.reduce((n, s) => n + s.exercises.length, 0), day.id);
        if (!env.session.getState().exercises.length) {
          assert.equal(day.estimated_duration, 0, day.id);
          assert.equal(env.session.getState().active, false, day.id);
        }
        env.session.getState().discard();
      }
    }
  }
  assert.equal(days, 151);
});

test('a weight typed on one set carries to the sets still to do, without overwriting choices or logged sets', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(), DATE);
  const key = env.session.getState().exercises[0].key;
  const sets = () => env.session.getState().exercises[0].sets;
  assert.ok(sets().length >= 3);
  const [first, second, third] = sets().map((set) => set.id);
  env.session.getState().updateSet(key, first, { weight: 30 });
  assert.deepEqual(sets().slice(0, 3).map((set) => set.weight), [30, 30, 30]);
  // Correcting the first set moves the ones that were following it.
  env.session.getState().updateSet(key, first, { weight: 35 });
  assert.deepEqual(sets().slice(0, 3).map((set) => set.weight), [35, 35, 35]);
  // A set the athlete changed is theirs, and a later edit never reaches back up.
  env.session.getState().updateSet(key, third, { weight: 50 });
  assert.deepEqual(sets().slice(0, 3).map((set) => set.weight), [35, 35, 50]);
  // A logged set keeps what was logged.
  env.session.getState().toggleSet(key, second);
  env.session.getState().updateSet(key, first, { weight: 40 });
  assert.deepEqual(sets().slice(0, 3).map((set) => set.weight), [40, 35, 50]);
});

test('sets below follow a weight keystroke by keystroke, including through a cleared field', () => {
  const env = createWorkoutEnv();
  env.session.getState().start(env.day(), DATE);
  const key = env.session.getState().exercises[0].key;
  const weights = () => env.session.getState().exercises[0].sets.slice(0, 3).map((set) => set.weight);
  const first = env.session.getState().exercises[0].sets[0].id;
  for (const typed of [4, 45]) env.session.getState().updateSet(key, first, { weight: typed });
  assert.deepEqual(weights(), [45, 45, 45]);
  for (const typed of [4, undefined, 5, 50]) env.session.getState().updateSet(key, first, { weight: typed });
  assert.deepEqual(weights(), [50, 50, 50]);
  // Editing reps alone never touches anyone's weight.
  env.session.getState().updateSet(key, first, { reps: 8 });
  assert.deepEqual(weights(), [50, 50, 50]);
});
