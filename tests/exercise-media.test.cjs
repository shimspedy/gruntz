const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createLoader, createWorkoutEnv } = require('./workout-test-utils.cjs');

const root = path.join(__dirname, '..');
const library = JSON.parse(fs.readFileSync(path.join(root, 'src/data/exerciseLibrary.json'), 'utf8'));
const keys = new Set(library.map((i) => i.key));

test('every library entry has its video, poster and thumb', () => {
  for (const dir of ['dark', 'poster', 'thumb']) {
    const ext = dir === 'dark' ? '.mp4' : '.jpg';
    const files = new Set(fs.readdirSync(path.join(root, 'assets/exercise-media', dir)).map((f) => f.slice(0, -ext.length)));
    assert.deepEqual([...keys].filter((k) => !files.has(k)), [], `missing ${dir}`);
    assert.deepEqual([...files].filter((k) => !keys.has(k)), [], `orphan ${dir}`);
  }
});

test('every program exercise and plan slot points at a clip that exists', () => {
  const { exercises } = createLoader()('src/data/exercises.ts');
  assert.deepEqual(exercises.filter((e) => e.media_key && !keys.has(e.media_key)).map((e) => e.id), []);
  const plans = JSON.parse(fs.readFileSync(path.join(root, 'src/data/workoutPlans.json'), 'utf8'));
  const bad = [];
  for (const p of plans.plans) for (const d of p.days) for (const s of d.exercises) if (s.video_key && !keys.has(s.video_key)) bad.push(`${p.id}:${s.name}`);
  for (const [id, e] of Object.entries(plans.exercises)) {
    for (const k of [e.video_key, ...(e.alternative_video_keys ?? [])]) if (k && !keys.has(k)) bad.push(`${id}->${k}`);
  }
  assert.deepEqual(bad, []);
});

test('exercises whose clip changed keep their old history key', () => {
  const env = createWorkoutEnv();
  // Re-pointed to the matching clip; history stays where it was logged before.
  const wgs = env.getExerciseById('worlds_greatest_stretch');
  assert.equal(wgs.media_key, 'worlds-greatest-stretch');
  assert.equal(env.exerciseLogKey(wgs), 'bodyweight-alternating-lateral-lunge');
  // Lost a clip that showed a different movement; still finds its history.
  const itBand = env.getExerciseById('ais_it_band');
  assert.equal(itBand.media_key, undefined);
  assert.equal(env.exerciseLogKey(itBand), 'abdominals-stretch-variation-two');
  // Unchanged exercises still log under their clip.
  assert.equal(env.exerciseLogKey(env.getExerciseById('bench_press')), 'barbell-bench-press');
});
