const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));

for (const kind of ['program', 'subscription']) {
  test(`${kind} hydration failure preserves disk data until successful retry`, async () => {
    let raw = '{corrupt saved state', writes = 0, secureReads = 0;
    const storage = {
      getItem: async () => raw,
      setItem: async (_key, value) => { writes++; raw = value; },
      removeItem: async () => {},
    };
    const load = createLoader({
      '@react-native-async-storage/async-storage': storage,
      'expo-secure-store': { getItemAsync: async () => { secureReads++; return null; }, setItemAsync: async () => {} },
      '../config/monetization': { GRUNTZ_TRIAL_DAYS: 15, DEV_UNLOCK: false },
      '../services/subscription': {},
      '../services/notifications': { scheduleTrialEndingReminder: async () => {}, cancelTrialEndingReminder: async () => {} },
      './useUserStore': { useUserStore: { getState: () => ({ isOnboarded: false }) } },
    });
    const store = kind === 'program'
      ? load('src/store/useProgramStore.ts').useProgramStore
      : load('src/store/useSubscriptionStore.ts').useSubscriptionStore;
    await tick();
    assert.equal(store.getState().hydrationFailed, true);
    assert.equal(writes, 0);
    assert.equal(raw, '{corrupt saved state');
    assert.equal(secureReads, 0);
    // Subsequent state updates must also be unable to destroy the failed read.
    if (kind === 'program') store.getState().setHasSeenProgramSelect(true);
    else store.getState().clearError();
    assert.equal(writes, 0);
    raw = JSON.stringify({ version: 2, state: kind === 'program'
      ? { selectedProgram: 'recon', currentWeek: 6, hasSeenProgramSelect: true }
      : { trialStartedAt: '2026-09-01T00:00:00.000Z', entitlementActive: true } });
    await store.persist.rehydrate();
    assert.equal(store.getState().hydrationFailed, false);
    assert.ok(writes > 0);
    if (kind === 'program') {
      assert.equal(store.getState().selectedProgram, 'recon');
      assert.equal(store.getState().currentWeek, 6);
      assert.equal(secureReads, 1);
    } else {
      assert.equal(store.getState().trialStartedAt, '2026-09-01T00:00:00.000Z');
      assert.equal(store.getState().entitlementActive, true);
    }
  });
}
