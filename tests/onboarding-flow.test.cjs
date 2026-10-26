const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const flow = createLoader()('src/screens/onboarding/flow.ts');

test('essential setup keeps plan constraints, adds practice and preserves the Marines test choice', () => {
  const essential = flow.onboardingSteps(false, null);
  assert.equal(essential.length, 9);
  for (const step of ['goals', 'level', 'days', 'minutes', 'equipment', 'guardrails', 'ready', 'practice']) assert.ok(essential.includes(step));
  assert.equal(essential.includes('notify'), false);
  const marine = flow.onboardingSteps(true, 'marines');
  assert.equal(marine[marine.indexOf('branch') + 1], 'testChoice');
  assert.equal(marine[marine.indexOf('testChoice') + 1], 'testDate');
  assert.equal(flow.onboardingSteps(true, 'army').includes('testChoice'), false);
});

test('an older in-progress draft resumes without replaying setup or bypassing practice', () => {
  const general = flow.onboardingSteps(false, null);
  const marine = flow.onboardingSteps(true, 'marines');
  assert.equal(flow.resumedOnboardingStep('story1', general), 'days');
  assert.equal(flow.resumedOnboardingStep('status', marine), 'testChoice');
  assert.equal(flow.resumedOnboardingStep('notify', general), 'ready');
  assert.equal(flow.resumedOnboardingStep('commit', general), 'practice');
  assert.equal(flow.resumedOnboardingStep('equipment', general), 'equipment');
  assert.equal(flow.resumedOnboardingStep('unknown-future-screen', general), 'welcome');
});

test('military setup defaults to its built-in recommendation while explicit available choices win', () => {
  const builtin = 'builtin:basecamp';
  assert.equal(flow.preferredOnboardingPlan(true, builtin, ['library-a'], null), builtin);
  assert.equal(flow.preferredOnboardingPlan(false, builtin, ['library-a'], null), 'library-a');
  assert.equal(flow.preferredOnboardingPlan(true, builtin, ['library-a'], 'library-a'), 'library-a');
  assert.equal(flow.preferredOnboardingPlan(false, builtin, ['library-a'], builtin), 'library-a');
  assert.equal(flow.preferredOnboardingPlan(true, builtin, ['library-a'], 'removed-plan'), builtin);
  assert.equal(flow.preferredOnboardingPlan(false, builtin, [], null), builtin);
});

test('practice logs only the chosen sample value and cannot add repeated sets', () => {
  let state = { ...flow.INITIAL_PRACTICE_LOG };
  assert.equal(state.loggedReps, null);
  state = flow.practiceLogReducer(state, { type: 'adjust', amount: 1 });
  state = flow.practiceLogReducer(state, { type: 'log' });
  assert.equal(state.loggedReps, 9);
  assert.deepEqual(flow.practiceLogReducer(state, { type: 'adjust', amount: 1 }), state);
  assert.deepEqual(flow.practiceLogReducer(state, { type: 'log' }), state);
  assert.equal(flow.practiceLogReducer({ reps: 1, loggedReps: null }, { type: 'adjust', amount: -1 }).reps, 1);
  assert.equal(flow.practiceLogReducer({ reps: 50, loggedReps: null }, { type: 'adjust', amount: 1 }).reps, 50);
});
