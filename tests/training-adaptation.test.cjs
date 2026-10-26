const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, createWorkoutEnv } = require('./workout-test-utils.cjs');

const pure = createLoader();
const focus = pure('src/features/trainingFocus.ts');
const scoreEntry = pure('src/features/testScoreEntry.ts');
const { militaryTests } = pure('src/data/militaryTests.ts');
const NOW = new Date('2026-10-26T12:00:00');
const profile = { goals: ['Military Prep'], service_branch: 'marines', fitness_test_type: 'marine_pft', fitness_test_date: '2026-11-02', workout_days_per_week: 3, fitness_level: 'beginner', preferred_intensity: 'low', movement_limitations: [] };

test('test focus ranks only entered events against the athlete’s target', () => {
  const result = focus.getTrainingFocus(profile, { 'marine_pft:plank': 160, 'marine_pft:three_mile': 1500 }, { 'marine_pft:plank': 180 }, NOW);
  assert.equal(result.eventId, 'three_mile');
  assert.equal(result.daysToTest, 7);
  assert.match(result.reason, /7 days/);
  assert.equal(focus.getTrainingFocus(profile, { 'marine_pft:pullups': NaN }, {}, NOW), null);
  assert.equal(focus.getTrainingFocus({ ...profile, goals: ['Build Muscle'] }, { 'marine_pft:plank': 160 }, {}, NOW), null);
});

test('focus reorders authored work after warm-up without adding exercises or changing identity', () => {
  const env = createWorkoutEnv();
  const result = focus.getTrainingFocus(profile, { 'marine_pft:three_mile': 1600 }, {}, NOW);
  const day = { ...env.day(), objective: 'Keep controlled', sections: [
    { id: 'warm', type: 'warmup', title: 'Warm-up', exercises: ['base_arm_circles'] },
    { id: 'strength', type: 'workout', title: 'Strength', exercises: ['pushups'] },
    { id: 'run', type: 'cardio', title: 'Run', exercises: ['base_walk_10min'] },
    { id: 'recover', type: 'recovery', title: 'Recovery', exercises: ['base_mobility_flow'] },
  ] };
  const prioritized = focus.prioritizeWorkout(day, result, env.getExerciseById);
  assert.equal(prioritized.id, day.id);
  assert.deepEqual(prioritized.sections.map(s => s.id), ['warm', 'run', 'strength', 'recover']);
  assert.deepEqual(day.sections.map(s => s.id), ['warm', 'strength', 'run', 'recover']);
  assert.equal(prioritized.sections.flatMap(s => s.exercises).length, 4);
});

test('history validation rejects unknown events and trends compare only genuinely recorded scores', () => {
  const legacy = { id: 'old', testId: 'marine_pft', recordedAt: null, scores: { three_mile: 1500 } };
  const latest = { id: 'new', testId: 'marine_pft', recordedAt: '2026-10-26T12:00:00.000Z', scores: { three_mile: 1400 } };
  assert.equal(focus.isTestAttempt(legacy), true);
  assert.equal(focus.isTestAttempt({ ...latest, scores: { unknown: 10 } }), false);
  assert.equal(focus.isTestAttempt({ ...latest, recordedAt: 'yesterday' }), false);
  const trend = focus.getTestTrend('marine_pft', militaryTests.marine_pft.events.find(e => e.id === 'three_mile'), [latest, legacy]);
  assert.equal(trend.delta, -100);
  assert.equal(trend.improved, true);
  assert.equal(trend.baseline.recordedAt, null);
  assert.equal(focus.getTestTrend('marine_pft', militaryTests.marine_pft.events[0], [latest, legacy]), null);
});

test('targets can change without inventing a test attempt, including unchanged scores already loaded today', () => {
  const events = militaryTests.marine_pft.events;
  const targetOnly = scoreEntry.prepareTestScoreEntry(events, { pullups: { current: '', target: '18' }, plank: { current: '', target: '3:30' } });
  assert.equal(targetOnly.error, null);
  assert.deepEqual(targetOnly.scores, {});
  assert.equal(targetOnly.targets.pullups, 18);
  assert.equal(targetOnly.targets.plank, 210);
  assert.equal(scoreEntry.hasTestScoreChanges(targetOnly.scores), false);
  const today = scoreEntry.prepareTestScoreEntry(events, { pullups: { current: '8', target: '18' } });
  assert.equal(scoreEntry.hasTestScoreChanges(today.scores, { pullups: 8 }), false);
  assert.equal(scoreEntry.hasTestScoreChanges({ pullups: 9 }, { pullups: 8 }), true);
  assert.equal(scoreEntry.hasTestScoreChanges({ pullups: 8 }), true);
});

test('a nonempty malformed current score cannot disappear inside a partial test save', () => {
  const events = militaryTests.marine_pft.events;
  for (const invalid of ['1:99', '-2', 'a minute', '0', '9'.repeat(400)]) {
    const prepared = scoreEntry.prepareTestScoreEntry(events, { pullups: { current: '8', target: '18' }, plank: { current: invalid, target: '3:00' } });
    assert.match(prepared.error, /valid score for Plank/, invalid);
  }
  assert.match(scoreEntry.prepareTestScoreEntry(events, { pullups: { current: '', target: '-1' } }).error, /valid target/);
});

function readinessEnv(saved) {
  const memory = new Map(saved ? [['@gruntz_readiness', JSON.stringify({ state: saved, version: 0 })]] : []);
  const storage = { getItem: async key => memory.get(key) ?? null, setItem: async (key, value) => { memory.set(key, value); }, removeItem: async key => { memory.delete(key); } };
  const load = createLoader({
    './readinessStorage': { READINESS_STORAGE_KEY: '@gruntz_readiness', readinessStorage: storage },
    './activityRoutes': { clearRoutes: async () => {}, inlineRoute: activity => activity.route, saveRoute: async () => {} },
  });
  return load('src/store/useReadinessStore.ts').useReadinessStore;
}

test('dated retests preserve undated legacy baselines and partial tests retain other latest scores', async () => {
  const store = readinessEnv({ testScores: { 'marine_pft:pullups': 6, 'marine_pft:three_mile': 1500 }, targetScores: {}, checkIns: [], trackedSessions: [] });
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().testAttempts, []);
  assert.equal(store.getState().trainingChoice, null);
  assert.equal(store.getState().saveTestAttempt('marine_pft', { pullups: 8 }, '2026-10-26T12:00:00Z'), true);
  assert.equal(store.getState().testScores['marine_pft:three_mile'], 1500);
  assert.equal(store.getState().testAttempts.length, 2);
  assert.equal(store.getState().testAttempts.find(a => a.recordedAt === null).scores.pullups, 6);
  store.getState().saveTestAttempt('marine_pft', { pullups: 9 }, '2026-10-26T13:00:00Z');
  assert.equal(store.getState().testAttempts.length, 2);
  assert.equal(store.getState().testAttempts[0].scores.pullups, 9);
  store.getState().saveTestAttempt('marine_pft', { pullups: 10 }, '2026-11-09T12:00:00Z');
  assert.equal(store.getState().testAttempts.length, 3);
  assert.equal(store.getState().saveTestAttempt('marine_pft', { pullups: NaN }), false);
  assert.equal(store.getState().saveTestAttempt('unknown', { pullups: 3 }), false);
});

test('a shorter option changes actual working targets, preserves warm-ups and original mission ID', () => {
  const env = createWorkoutEnv();
  env.readiness.trainingChoice = { date: pure('src/utils/dateKey.ts').getLocalDateKey(), mode: 'shorter' };
  env.session.getState().start(env.day(['base_arm_circles', 'bench_press', 'pushups']), '2026-10-26');
  const state = env.session.getState();
  assert.equal(state.workoutDayId, 'test-day');
  assert.equal(state.exercises[0].sets[0].reps, env.getExerciseById('base_arm_circles').reps);
  assert.equal(state.exercises[1].sets.filter(s => !s.warmup).length, 2);
  assert.equal(state.exercises[2].sets[0].reps, 10);
  assert.equal(state.adaptation.mode, 'shorter');
  const before = state.exercises;
  env.readiness.trainingChoice.mode = 'recovery';
  env.session.getState().start(env.day(), '2026-10-26');
  assert.equal(env.session.getState().exercises, before);
});

test('recovery keeps a library plan incomplete and deduplicates to one recovery identity for the day', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.readiness.trainingChoice = { date: today, mode: 'recovery' };
  const plan = env.load('src/data/workoutPlans.ts').allPlans()[0];
  env.plans.getState().follow(plan.id);
  env.session.getState().startPlanDay(plan, plan.days[0], today);
  const state = env.session.getState();
  const identity = state.workoutDayId;
  assert.equal(identity, `recovery:${today}`);
  for (const exercise of state.exercises) for (const set of exercise.sets) env.session.getState().toggleSet(exercise.key, set.id);
  env.session.getState().finish();
  assert.deepEqual(env.plans.getState().completedDayIds, []);
  env.session.getState().start(env.day(), today);
  assert.equal(env.session.getState().workoutDayId, identity);
});

test('a previous-day option expires and custom routines honor today’s choice', () => {
  const env = createWorkoutEnv();
  env.readiness.trainingChoice = { date: '2001-01-01', mode: 'shorter' };
  env.session.getState().start(env.day(), '2026-10-26');
  assert.equal(env.session.getState().exercises[0].sets.length, 3);
  env.session.getState().discard();
  env.readiness.trainingChoice = { date: pure('src/utils/dateKey.ts').getLocalDateKey(), mode: 'shorter' };
  const plan = env.load('src/data/workoutPlans.ts').allPlans()[0];
  const video = plan.days[0].exercises.find(e => e.video_key).video_key;
  env.session.getState().startRoutine({ id: 'test', name: 'Custom', items: [{ key: video, sets: 3, reps: 10, rest: 60 }] }, '2026-10-26');
  assert.equal(env.session.getState().exercises[0].requiredSets, 2);
});

test('shorter sessions reduce catalog distance ranges while keeping their original mission identity', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.readiness.trainingChoice = { date: today, mode: 'shorter' };
  for (const [exerciseId, expected] of [['ruck_1_2mi', '0.6-1.3 miles'], ['jog_100_200m', '66-133 m'], ['tempo_run_short', '1.3-2 miles'], ['easy_pace_run', '2-4.6 miles']]) {
    env.session.getState().start(env.day([exerciseId]), today);
    const state = env.session.getState();
    assert.equal(state.exercises[0].sets[0].distance, expected, exerciseId);
    assert.equal(state.workoutDayId, 'test-day');
    assert.ok(state.estimatedMinutes < 25);
    assert.ok(state.rewardXp < 50);
    env.session.getState().discard();
  }
});

test('unmeasured courses and fixed interval totals keep their targets, estimates and rewards honestly', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.readiness.trainingChoice = { date: today, mode: 'shorter' };
  for (const exerciseId of ['underwater_swim', 'pyramid_track', 'base_arm_circles', 'base_mobility_flow']) {
    const original = env.getExerciseById(exerciseId);
    env.session.getState().start(env.day([exerciseId]), today);
    const state = env.session.getState();
    assert.equal(state.exercises[0].sets[0].distance, original.distance);
    assert.equal(state.exercises[0].sets[0].reps, original.reps);
    assert.equal(state.estimatedMinutes, 25);
    assert.equal(state.rewardXp, 50);
    assert.equal(state.adaptation.label, 'Original targets kept');
    env.session.getState().discard();
  }
  env.session.getState().start(env.day(['bench_press', 'underwater_swim']), today);
  assert.equal(env.session.getState().exercises[1].sets[0].distance, 'pool length');
  assert.match(env.session.getState().adaptation.reason, /Targets kept as prescribed: Underwater Swim/);
});

test('every measurable catalog distance can shorten by sets or target without silently keeping full work', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.readiness.trainingChoice = { date: today, mode: 'shorter' };
  for (const exercise of env.exercises.filter(exercise => exercise.distance && !['pool length', '4000m total'].includes(exercise.distance))) {
    env.session.getState().start(env.day([exercise.id]), today);
    const changed = env.session.getState().exercises[0];
    assert.ok(changed.sets.length < (exercise.sets ?? 1) || changed.sets[0].distance !== exercise.distance, exercise.id);
    env.session.getState().discard();
  }
});

test('saved sets include the performed movement identity even when a demonstration clip is shared', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.session.getState().start(env.day(['broad_jumps']), today);
  const exercise = env.session.getState().exercises[0];
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  env.session.getState().finish();
  const entry = env.log.getState().logs[env.exerciseLogKey(env.getExerciseById('broad_jumps'))][0];
  assert.deepEqual(entry.movement, { exerciseId: 'broad_jumps' });
});

test('shared demonstration keys and unknown legacy sets cannot award a different movement a personal record', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.log.getState().record('box-jump', { id: 'box', at: '2026-10-24T12:00:00Z', workoutTitle: 'Box jumps', unit: 'lb', sets: [{ reps: 1 }], movement: { exerciseId: 'box_jumps' } });
  env.log.getState().record('box-jump', { id: 'legacy', at: '2026-10-25T12:00:00Z', workoutTitle: 'Unknown movement', unit: 'lb', sets: [{ reps: 2 }] });
  env.session.getState().start(env.day(['broad_jumps']), today);
  let exercise = env.session.getState().exercises[0];
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  let mission = env.session.getState().buildMission();
  assert.equal(mission.has_personal_record, false);
  assert.equal(mission.pr_bonus, 0);
  env.session.getState().discard();
  env.log.getState().record('box-jump', { id: 'broad', at: '2026-10-25T13:00:00Z', workoutTitle: 'Broad jumps', unit: 'lb', sets: [{ reps: 8 }], movement: { exerciseId: 'broad_jumps' } });
  env.session.getState().start(env.day(['broad_jumps']), today);
  exercise = env.session.getState().exercises[0];
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  mission = env.session.getState().buildMission();
  assert.equal(mission.has_personal_record, true);
  assert.equal(mission.pr_bonus, 25);
});

test('a plan’s different prescribed movement cannot earn PR XP from its demonstration history', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.log.getState().record('box-jump', { id: 'box', at: '2026-10-25T12:00:00Z', workoutTitle: 'Box jumps', unit: 'lb', sets: [{ reps: 1 }], movement: { exerciseId: 'lib:box-jump' } });
  const plan = env.load('src/data/workoutPlans.ts').allPlans()[0];
  const day = { ...plan.days[0], exercises: [{ order: 1, exercise_id: 'jumping', name: 'Jumping drill', measure: 'reps', sets: 1, reps: 10, rest_seconds: 60, video_key: 'box-jump' }] };
  env.session.getState().startPlanDay(plan, day, today);
  const exercise = env.session.getState().exercises[0];
  assert.equal(exercise.prescribedName, 'Jumping drill');
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  assert.equal(env.session.getState().buildMission().pr_bonus, 0);
});

test('PR comparisons require valid logged units and finite positive comparable results', () => {
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  for (const bad of [
    { unit: undefined, sets: [{ reps: 1 }] },
    { unit: 'stone', sets: [{ reps: 1 }] },
    { unit: 'lb', sets: [{ reps: NaN }] },
    { unit: 'lb', sets: [{ reps: 1, weight: Infinity }] },
    { unit: 'lb', sets: [{ reps: 1, weight: -20 }] },
    { unit: 'kg', sets: [{ reps: 1, weight: '1' }] },
    { unit: 'lb', sets: [{ reps: 0 }] },
    { unit: 'lb', sets: [{ reps: 1, seconds: 'bad' }] },
  ]) {
    const env = createWorkoutEnv();
    env.log.getState().record('box-jump', { id: 'bad', at: '2026-10-25T12:00:00Z', workoutTitle: 'Old data', movement: { exerciseId: 'broad_jumps' }, ...bad });
    env.session.getState().start(env.day(['broad_jumps']), today);
    const exercise = env.session.getState().exercises[0];
    env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
    assert.equal(env.session.getState().buildMission().pr_bonus, 0, JSON.stringify(bad));
  }
  const env = createWorkoutEnv();
  env.log.getState().record('barbell-bench-press', { id: 'valid', at: '2026-10-25T12:00:00Z', workoutTitle: 'Bench', unit: 'lb', sets: [{ reps: 8, weight: 100 }], movement: { exerciseId: 'bench_press' } });
  env.setUnits('metric');
  env.session.getState().start(env.day(['bench_press']), today);
  const exercise = env.session.getState().exercises[0];
  env.session.getState().updateSet(exercise.key, exercise.sets[0].id, { reps: 9, weight: 45.359237 });
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  assert.equal(env.session.getState().buildMission().pr_bonus, 25);
});

test('weighted PRs cannot compare a load estimate against earlier unweighted rep counts', () => {
  const env = createWorkoutEnv();
  const today = pure('src/utils/dateKey.ts').getLocalDateKey();
  env.log.getState().record('barbell-bench-press', { id: 'no-load', at: '2026-10-25T12:00:00Z', workoutTitle: 'Bench without recorded load', unit: 'lb', sets: [{ reps: 10 }], movement: { exerciseId: 'bench_press' } });
  env.session.getState().start(env.day(['bench_press']), today);
  const exercise = env.session.getState().exercises[0];
  env.session.getState().updateSet(exercise.key, exercise.sets[0].id, { reps: 10, weight: 100 });
  env.session.getState().toggleSet(exercise.key, exercise.sets[0].id);
  assert.equal(env.session.getState().buildMission().pr_bonus, 0);
});
