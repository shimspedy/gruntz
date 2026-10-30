const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const DATA = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/workoutPlans.json'), 'utf8'));
const workoutPlans = {
  allPlans: () => DATA.plans,
  planExercises: () => DATA.exercises,
};

function loadRecommend() {
  const filename = path.resolve(__dirname, '../src/features/planRecommend.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const req = (name) => (name === '../data/workoutPlans' ? workoutPlans : name === '../types' ? {} : require(name));
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(req, module, module.exports);
  return module.exports;
}

const { effectiveEquipmentAccess } = loadRecommend();
const NO_GEAR = new Set(['Bodyweight', 'Bench']);
const HOME = new Set([...NO_GEAR, 'Dumbbell', 'Band', 'Kettlebell', 'Stability Ball', 'Weight Plate']);
const gearOf = (plan) => plan.days.flatMap((d) => d.exercises.flatMap((s) => DATA.exercises[s.exercise_id]?.equipment ?? []));

test('a plan shown to no-gear athletes contains only bodyweight (or bench) exercises', () => {
  for (const plan of DATA.plans.filter((p) => effectiveEquipmentAccess(p) === 'none')) {
    for (const item of gearOf(plan)) assert.ok(NO_GEAR.has(item), `${plan.title} needs ${item}`);
  }
});

test('a plan shown to home athletes never needs machines, cables or barbells', () => {
  for (const plan of DATA.plans.filter((p) => effectiveEquipmentAccess(p) !== 'gym')) {
    for (const item of gearOf(plan)) assert.ok(HOME.has(item), `${plan.title} needs ${item}`);
  }
});

test('plans that mislabel themselves as bodyweight are classified by their exercises', () => {
  const treadmill = DATA.plans.find((p) => p.title === '20-Minute Treadmill Shred');
  assert.ok(treadmill);
  assert.equal(effectiveEquipmentAccess(treadmill), 'gym');
  const bodyweight = DATA.plans.find((p) => p.title === 'Full-Body Bodyweight Workout');
  assert.equal(effectiveEquipmentAccess(bodyweight), 'none');
});
