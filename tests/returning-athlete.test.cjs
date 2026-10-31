const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function setup() {
  const kv = new Map();
  let listener = null;
  const mod = createLoader({
    '../../modules/gruntz-cloud-hint': {
      primeCloudHints() {},
      readCloudHint: (k) => kv.get(k) ?? null,
      writeCloudHint: (k, v) => { if (v === null) kv.delete(k); else kv.set(k, v); },
    },
    './supabaseClient': { getSupabase: () => ({ auth: { onAuthStateChange: (fn) => { listener = fn; } } }) },
  })('src/services/returningAthlete.ts');
  return { mod, kv, fire: (...a) => listener(...a) };
}

test('the backup email is kept in iCloud, tidied, and forgotten on request', () => {
  const { mod, kv } = setup();
  mod.rememberBackupAccount('  Alex@Example.COM ');
  assert.equal(mod.rememberedBackupAccount(), 'alex@example.com');
  mod.rememberBackupAccount(null);
  assert.equal(mod.rememberedBackupAccount(), null);
  assert.equal(kv.size, 0);
});

test('anything in iCloud that is not an email is ignored', () => {
  const { mod, kv } = setup();
  kv.set('gruntz.backupEmail', 'not an email');
  assert.equal(mod.rememberedBackupAccount(), null);
  mod.rememberBackupAccount('nope');
  assert.equal(kv.size, 0, 'an invalid value clears instead of storing');
});

test('a session that starts, including one already signed in at launch, is remembered', () => {
  const { mod, fire } = setup();
  mod.initializeReturningAthlete();
  fire('INITIAL_SESSION', { user: { email: 'pat@example.com' } });
  assert.equal(mod.rememberedBackupAccount(), 'pat@example.com');
  fire('SIGNED_OUT', null);
  assert.equal(mod.rememberedBackupAccount(), 'pat@example.com', 'signing out keeps the hint; the backup still exists');
});
