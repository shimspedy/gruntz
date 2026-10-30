const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file) {
  const filename = path.resolve(root, file);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { Date, Math, Number, String }, { filename })(
    (id) => { throw new Error(`unexpected import ${id}`); }, module, module.exports,
  );
  return module.exports;
}

const cards = load('src/features/shareCards.ts');
const PFT = {
  name: 'Marine PFT',
  events: [
    { id: 'pullups', name: 'Pull-ups', shortName: 'Pull-ups', unit: 'reps' },
    { id: 'plank', name: 'Plank', shortName: 'Plank', unit: 'seconds' },
    { id: 'run', name: '3-mile run', shortName: '3-mile run', unit: 'seconds' },
  ],
};

test('test card lists only logged events, formatted, and states logged coverage', () => {
  const model = cards.testCardModel(PFT, { pullups: 18, plank: 225, run: 0 }, { score: 86.4, entered: 2, total: 3 });
  assert.equal(model.kind, 'test');
  assert.equal(model.eyebrow, 'Marine PFT');
  assert.equal(model.readiness, 86);
  assert.deepEqual(JSON.parse(JSON.stringify(model.rows.map((r) => [r.label, r.value]))), [['Pull-ups', '18'], ['Plank', '3:45']]);
  assert.equal(model.note, '2 of 3 events logged');
});

test('test card never claims an official score or class', () => {
  const model = cards.testCardModel(PFT, { pullups: 23, plank: 225, run: 1080 }, { score: 100, entered: 3, total: 3 });
  const text = JSON.stringify(model).toLowerCase();
  for (const word of ['class', 'points', 'official', 'pass', 'max']) assert.ok(!text.includes(word), word);
  assert.equal(model.note, 'All events logged');
});

test('no card without a logged event, and rows are capped', () => {
  assert.equal(cards.testCardModel(PFT, {}, { score: 0, entered: 0, total: 3 }), null);
  const many = { name: 'ACFT', events: Array.from({ length: 9 }, (_, i) => ({ id: `e${i}`, name: `E${i}`, shortName: `E${i}`, unit: 'pounds' })) };
  const scores = Object.fromEntries(many.events.map((e) => [e.id, 200]));
  const model = cards.testCardModel(many, scores, { score: 70, entered: 9, total: 9 });
  assert.equal(model.rows.length, cards.MAX_TEST_ROWS);
  assert.equal(model.rows[0].value, '200 lb');
});

test('mission card picks rank-up, then level-up, then workout', () => {
  const base = { title: 'Upper Body Push', xpEarned: 120, levelBefore: 4, levelAfter: 4, rankBefore: 'Recruit', rankAfter: 'Recruit', streak: 3, minutes: 42, sets: 16 };
  const workout = cards.missionCardModel(base);
  assert.equal(workout.kind, 'workout');
  assert.equal(workout.hero, 'Upper Body Push');
  assert.deepEqual(JSON.parse(JSON.stringify(workout.rows.map((r) => r.value))), ['42 min', '16', '+120']);

  const level = cards.missionCardModel({ ...base, levelAfter: 5 });
  assert.equal(level.kind, 'level');
  assert.equal(level.hero, 'Level 5');

  const rank = cards.missionCardModel({ ...base, levelAfter: 5, rankAfter: 'Cadet' });
  assert.equal(rank.kind, 'rank');
  assert.equal(rank.hero, 'Cadet');
  assert.equal(rank.rank, 'Cadet');
});

test('mission card drops empty stats and blank titles', () => {
  const model = cards.missionCardModel({ title: '  ', xpEarned: 0, levelBefore: 1, levelAfter: 1, rankBefore: 'Recruit', rankAfter: 'Recruit', streak: 1 });
  assert.equal(model.hero, 'Workout');
  assert.equal(model.rows.length, 0);
});

test('share buttons open the card on the celebration and test screens', () => {
  const celebration = fs.readFileSync(path.join(root, 'src/screens/CelebrationScreen.tsx'), 'utf8');
  assert.match(celebration, /<ShareCardSheet[\s\S]*missionCardModel/);
  const testScreen = fs.readFileSync(path.join(root, 'src/screens/TestScreen.tsx'), 'utf8');
  assert.match(testScreen, /anyLogged \? \(\s*<Button title="Share my scores"/);
  assert.match(testScreen, /testCardModel\(test, scoped, readiness\)/);
  const sheet = fs.readFileSync(path.join(root, 'src/components/share/ShareCardSheet.tsx'), 'utf8');
  assert.match(sheet, /useContentSize\(\)/, 'card size follows the current window');
  assert.doesNotMatch(sheet, /Dimensions\.get/);
});
