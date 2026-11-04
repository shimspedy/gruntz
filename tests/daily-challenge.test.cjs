const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function createEnv(level = 'beginner') {
  const calls = [];
  const user = {
    hasHydrated: true,
    profile: { fitness_level: level, settings: { units: 'imperial' } },
    recordChallengeActivity: (c, amount) => calls.push(['activity', c.id, amount]),
    recordChallengeCompletion: ({ xpAmount }) => { calls.push(['complete', xpAmount]); return []; },
    recordChallengeBonus: ({ xpAmount }) => { calls.push(['bonus', xpAmount]); return []; },
    syncChallengeStats: () => {},
  };
  const storage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
  const load = createLoader({
    '@react-native-async-storage/async-storage': storage,
    './useUserStore': { useUserStore: { getState: () => user, subscribe: () => () => {} } },
  });
  const data = load('src/data/dailyChallenges.ts');
  const { useChallengeStore, challengeScale } = load('src/store/useChallengeStore.ts');
  return { data, store: useChallengeStore, challengeScale, calls, user };
}

const template = (data, id) => {
  for (let day = 0; day < 40; day += 1) {
    const t = data.getChallengeTemplateForDate(new Date(Date.UTC(2026, 0, 1 + day, 12)));
    if (t.id === id) return t;
  }
  throw new Error(`no template ${id}`);
};

test('targets scale by fitness level and the wording follows the number', () => {
  const { data } = createEnv();
  const crunch = template(data, 'crunch_200');
  const beginner = data.scaleChallenge(crunch, data.CHALLENGE_START_SCALE.beginner);
  assert.equal(beginner.target, 50);
  assert.equal(beginner.fullTarget, 200);
  assert.equal(beginner.name, '50 Crunches');
  assert.equal(beginner.description, 'Target those abs with 50 crunches.');
  assert.equal(beginner.bonusXp, 50);
  const full = data.scaleChallenge(crunch, 1);
  assert.equal(full.name, '200 Crunches');
  assert.equal(full.bonusXp, 0);

  const plank = data.scaleChallenge(template(data, 'plank_5min'), 0.25);
  assert.equal(plank.target, 75);
  assert.equal(plank.name, '75-Second Plank Hold');
  assert.equal(plank.description, 'Hold a plank position for 75 seconds straight.');
  assert.equal(data.scaleChallenge(template(data, 'plank_5min'), 0.5).name, '150-Second Plank Hold');
  assert.equal(data.scaleChallenge(template(data, 'amrap_20'), 0.25).name, '5-Minute AMRAP');

  const tabata = data.scaleChallenge(template(data, 'tabata_16min'), 0.5);
  assert.equal(tabata.target, 480);
  assert.equal(tabata.description, '2 rounds of Tabata (20s hard, 10s rest) x 4 exercises.');

  const lunges = data.scaleChallenge(template(data, 'lunge_100'), 0.25);
  assert.equal(lunges.description, '30 lunges (15 per leg) for leg strength.');

  assert.equal(data.scaleChallenge(template(data, 'run_5k'), 0.25).name, '1.5K Run Challenge');
  assert.equal(data.scaleChallenge(template(data, 'ruck_3mi'), 0.25).name, '0.75-Mile Ruck');
  assert.equal(data.scaleChallenge(template(data, 'swim_40min'), 0.5).name, '20-Minute Swim');
});

test('every template renders without a leftover token at every start scale', () => {
  const { data } = createEnv();
  const seen = new Set();
  for (let day = 0; day < 30; day += 1) {
    const t = data.getChallengeTemplateForDate(new Date(Date.UTC(2026, 0, 1 + day, 12)));
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    for (const scale of [0.2, 0.25, 0.5, 0.75, 1]) {
      const c = data.scaleChallenge(t, scale);
      assert.doesNotMatch(c.name, /[{}]/, `${t.id} name at ${scale}: ${c.name}`);
      assert.doesNotMatch(c.description, /[{}]/, `${t.id} description at ${scale}`);
      assert.ok(c.target > 0 && c.target <= c.fullTarget, `${t.id} target at ${scale}`);
      // The number in the title is the number the athlete is asked for.
      if (c.unit === 'reps' || c.unit === 'km' || c.unit === 'miles' || c.unit === 'minutes') assert.ok(c.name.startsWith(String(c.target)), `${t.id}: ${c.name}`);
    }
  }
  assert.equal(seen.size, 25);
});

test('the scale starts from the profile level, climbs on completion, and jumps on a bonus', () => {
  const env = createEnv('beginner');
  const crunch = env.data.scaleChallenge(template(env.data, 'crunch_200'), env.store.getState().scaleFor('reps', 'beginner'));
  assert.equal(crunch.target, 50);

  let r = env.store.getState().addProgress(40, crunch);
  assert.equal(r.completedNow, false);
  r = env.store.getState().addProgress(10, crunch);
  assert.equal(r.completedNow, true);
  assert.equal(r.bonusNow, false);
  assert.equal(r.xpAwarded, 100);
  assert.equal(env.store.getState().scaleByMode.reps, 0.3);
  // Other kinds still follow the profile level until they are completed.
  assert.equal(env.store.getState().scaleFor('time', 'beginner'), 0.25);
  assert.equal(env.store.getState().scaleFor('time', 'intermediate'), 0.5);

  // Logging stays open up to the full target; reaching it pays the bonus once.
  r = env.store.getState().addProgress(100, crunch);
  assert.equal(r.bonusNow, false);
  assert.equal(r.currentProgress, 150);
  r = env.store.getState().addProgress(100, crunch);
  assert.equal(r.bonusNow, true);
  assert.equal(r.currentProgress, 200);
  assert.equal(r.xpAwarded, 50);
  assert.equal(env.store.getState().scaleByMode.reps, 0.4);
  r = env.store.getState().addProgress(10, crunch);
  assert.equal(r.bonusNow, false);
  assert.equal(r.xpAwarded, 0);
  assert.equal(r.currentProgress, 200);

  const kinds = env.calls.map((c) => c[0]);
  assert.deepEqual(kinds.filter((k) => k !== 'activity'), ['complete', 'bonus']);
  assert.deepEqual(env.calls.filter((c) => c[0] === 'activity').map((c) => c[2]), [40, 10, 100, 50]);
  assert.equal(env.calls.find((c) => c[0] === 'bonus')[1], 50);
});

test('an athlete at full scale earns flat XP and cannot log past the target', () => {
  const env = createEnv('advanced');
  const crunch = env.data.scaleChallenge(template(env.data, 'crunch_200'), env.store.getState().scaleFor('reps', 'advanced'));
  assert.equal(crunch.target, 200);
  assert.equal(crunch.bonusXp, 0);
  const r = env.store.getState().completeChallenge(crunch);
  assert.equal(r.completedNow, true);
  assert.equal(r.xpAwarded, 100);
  assert.equal(env.store.getState().addProgress(50, crunch).currentProgress, 200);
  assert.equal(env.store.getState().scaleByMode.reps, 1);
});

test('mark as complete logs only the gap and never pays a bonus by itself', () => {
  const env = createEnv('beginner');
  const pullups = env.data.scaleChallenge(template(env.data, 'pullup_50'), 0.25);
  assert.equal(pullups.target, 15);
  env.store.getState().addProgress(10, pullups);
  const r = env.store.getState().completeChallenge(pullups);
  assert.equal(r.completedNow, true);
  assert.equal(r.bonusNow, false);
  assert.equal(r.currentProgress, 15);
  // Progress already past a (newly lowered) target still completes on the next touch.
  const env2 = createEnv('beginner');
  env2.store.setState({ activeDate: env2.store.getState().activeDate, currentProgress: 0 });
  const crunch = env2.data.scaleChallenge(template(env2.data, 'crunch_200'), 0.25);
  env2.store.getState().addProgress(60, crunch);
  assert.equal(env2.store.getState().completeChallenge(crunch).currentProgress, 60);
});

test('persisted state from before scaling migrates with level-based defaults', () => {
  const env = createEnv('intermediate');
  const migrated = env.store.persist.getOptions().migrate({ currentProgress: 30, completedDates: ['2026-10-01'], todayCompleted: false, activeDate: '2026-10-01' }, 1);
  assert.deepEqual(migrated.scaleByMode, {});
  assert.deepEqual(migrated.bonusDates, []);
  assert.equal(env.challengeScale(migrated.scaleByMode, 'reps', 'intermediate'), 0.5);
  assert.equal(env.challengeScale({ reps: 7 }, 'reps', 'beginner'), 1);
});
