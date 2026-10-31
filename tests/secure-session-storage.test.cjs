const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function setup({ os = 'ios', secureFails = false } = {}) {
  const app = new Map();
  const keychain = new Map();
  const AsyncStorage = {
    getItem: async (k) => (app.has(k) ? app.get(k) : null),
    setItem: async (k, v) => { app.set(k, v); },
    removeItem: async (k) => { app.delete(k); },
    multiRemove: async (keys) => { keys.forEach((k) => app.delete(k)); },
  };
  const guard = () => { if (secureFails) throw new Error('keychain unavailable'); };
  const SecureStore = {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afterFirstUnlockThisDeviceOnly',
    getItemAsync: async (k) => { guard(); return keychain.has(k) ? keychain.get(k) : null; },
    setItemAsync: async (k, v) => { guard(); keychain.set(k, v); },
    deleteItemAsync: async (k) => { guard(); keychain.delete(k); },
  };
  const mod = createLoader({
    '@react-native-async-storage/async-storage': { __esModule: true, default: AsyncStorage },
    'expo-secure-store': SecureStore,
    'react-native': { Platform: { OS: os } },
  })('src/services/secureSessionStorage.ts');
  return { storage: mod.secureSessionStorage, app, keychain };
}

const KEY = 'sb-project-auth-token';
const SESSION = JSON.stringify({ access_token: 'a'.repeat(2500), refresh_token: 'r'.repeat(40) });

test('a session saved by an older build moves into the keychain without signing anyone out', async () => {
  const { storage, app, keychain } = setup();
  app.set(KEY, SESSION);
  assert.equal(await storage.getItem(KEY), SESSION);
  assert.equal(app.has(KEY), false);
  assert.ok(keychain.size >= 3);
  assert.equal(await storage.getItem(KEY), SESSION);
});

test('large sessions round-trip in chunks and sign-out removes every piece', async () => {
  const { storage, app, keychain } = setup();
  await storage.setItem(KEY, SESSION);
  assert.equal(app.has(KEY), false);
  for (const value of keychain.values()) assert.ok(value.length <= 1800);
  assert.equal(await storage.getItem(KEY), SESSION);
  await storage.removeItem(KEY);
  assert.equal(keychain.size, 0);
  assert.equal(await storage.getItem(KEY), null);
});

test('a reinstall starts signed out even though the keychain survived', async () => {
  const { storage, app, keychain } = setup();
  await storage.setItem(KEY, SESSION);
  app.clear();
  assert.equal(await storage.getItem(KEY), null);
  assert.equal(keychain.size, 0);
});

test('a failing keychain falls back to app storage instead of signing out', async () => {
  const { storage, app } = setup({ secureFails: true });
  await storage.setItem(KEY, SESSION);
  assert.equal(app.get(KEY), SESSION);
  assert.equal(await storage.getItem(KEY), SESSION);
});

test('web keeps using app storage', async () => {
  const { storage, app, keychain } = setup({ os: 'web' });
  await storage.setItem(KEY, SESSION);
  assert.equal(app.get(KEY), SESSION);
  assert.equal(keychain.size, 0);
});
