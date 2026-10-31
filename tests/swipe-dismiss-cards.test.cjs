const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function loadPrefs() {
  const memory = new Map();
  const AsyncStorage = {
    getItem: async (k) => memory.get(k) ?? null,
    setItem: async (k, v) => { memory.set(k, v); },
    removeItem: async (k) => { memory.delete(k); },
  };
  return createLoader({
    '@react-native-async-storage/async-storage': { __esModule: true, default: AsyncStorage },
  })('src/store/useUiStore.ts');
}

test('a swiped-away card stays hidden through its day or week, and expired entries are dropped', () => {
  const { useChromePrefs: prefs, isCardHidden } = loadPrefs();
  prefs.getState().dismissCard('brief:planned:HR Push-Ups focus', '2026-10-31', '2026-10-31');
  prefs.getState().dismissCard('weekly:2026-10-26', '2026-11-01', '2026-10-31');
  const hidden = (key, today) => isCardHidden(prefs.getState().dismissedCards, key, today);
  assert.equal(hidden('brief:planned:HR Push-Ups focus', '2026-10-31'), true);
  assert.equal(hidden('brief:planned:HR Push-Ups focus', '2026-11-01'), false);
  assert.equal(hidden('weekly:2026-10-26', '2026-11-01'), true);
  assert.equal(hidden('weekly:2026-10-26', '2026-11-02'), false);
  prefs.getState().dismissCard('test-purpose:HR Push-Ups focus', '2026-11-02', '2026-11-02');
  assert.deepEqual(prefs.getState().dismissedCards, { 'test-purpose:HR Push-Ups focus': '2026-11-02' });
});
