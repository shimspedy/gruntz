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
  })('src/store/useUiStore.ts').useChromePrefs;
}

test('a swiped-away card is hidden for that day only, and old days are dropped', () => {
  const prefs = loadPrefs();
  prefs.getState().dismissCard('brief:planned:HR Push-Ups focus', '2026-10-31');
  prefs.getState().dismissCard('comeback', '2026-10-31');
  assert.deepEqual(prefs.getState().dismissedCards, { 'brief:planned:HR Push-Ups focus': '2026-10-31', comeback: '2026-10-31' });
  prefs.getState().dismissCard('test-purpose:HR Push-Ups focus', '2026-11-01');
  assert.deepEqual(prefs.getState().dismissedCards, { 'test-purpose:HR Push-Ups focus': '2026-11-01' });
});
