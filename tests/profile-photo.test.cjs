const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function environment({ granted = true, canAskAgain = true, picked = 'file:///tmp/picked.jpg', failCopy = false } = {}) {
  const files = new Set(['file:///tmp/picked.jpg']);
  const events = [];
  const prefs = { profilePhotoFile: null, setProfilePhotoFile(file) { this.profilePhotoFile = file; events.push(`pref:${file}`); } };
  const fs = {
    documentDirectory: 'file:///docs/',
    getInfoAsync: async (uri) => ({ exists: files.has(uri) }),
    copyAsync: async ({ from, to }) => { if (failCopy) throw Error('disk full'); assert.ok(files.has(from)); files.add(to); events.push(`copy:${to.replace('file:///docs/', '')}`); },
    deleteAsync: async (uri) => { files.delete(uri); events.push(`delete:${uri.replace('file:///docs/', '')}`); },
    readDirectoryAsync: async () => [...files].filter((f) => f.startsWith('file:///docs/')).map((f) => f.replace('file:///docs/', '')),
  };
  const permission = { granted, canAskAgain };
  const load = createLoader({
    'expo-image-picker': {
      getCameraPermissionsAsync: async () => permission,
      getMediaLibraryPermissionsAsync: async () => permission,
      requestCameraPermissionsAsync: async () => { events.push('ask:camera'); return permission; },
      requestMediaLibraryPermissionsAsync: async () => { events.push('ask:library'); return permission; },
      launchImageLibraryAsync: async () => (picked ? { canceled: false, assets: [{ uri: picked, width: 3000, height: 3000 }] } : { canceled: true, assets: null }),
      launchCameraAsync: async () => (picked ? { canceled: false, assets: [{ uri: picked, width: 3000, height: 3000 }] } : { canceled: true, assets: null }),
    },
    'expo-image-manipulator': {
      SaveFormat: { JPEG: 'jpeg' },
      manipulateAsync: async (uri, actions) => { events.push(`resize:${actions[0].resize.width}`); files.add('file:///tmp/shrunk.jpg'); return { uri: 'file:///tmp/shrunk.jpg' }; },
    },
    'expo-file-system/legacy': fs,
    '../store/useUiStore': { useChromePrefs: { getState: () => prefs } },
  });
  return { ...load('src/services/profilePhoto.ts'), files, events, prefs };
}

test('a chosen photo is shrunk, stored under a fresh name, and the previous one removed', async () => {
  const env = environment();
  env.prefs.profilePhotoFile = 'profile-photo-1.jpg';
  env.files.add('file:///docs/profile-photo-1.jpg');
  assert.equal(await env.changeProfilePhoto('library'), 'saved');
  const current = env.prefs.profilePhotoFile;
  assert.match(current, /^profile-photo-\d+\.jpg$/);
  assert.notEqual(current, 'profile-photo-1.jpg');
  assert.ok(env.files.has(`file:///docs/${current}`));
  assert.ok(!env.files.has('file:///docs/profile-photo-1.jpg'));
  assert.ok(!env.files.has('file:///tmp/shrunk.jpg'));
  assert.ok(env.events.includes('resize:512'));
  // The new file is on disk before anything points at it.
  assert.ok(env.events.indexOf(`copy:${current}`) < env.events.indexOf(`pref:${current}`));
});

test('cancelling and a refused permission leave the current photo alone', async () => {
  const cancelled = environment({ picked: null });
  cancelled.prefs.profilePhotoFile = 'profile-photo-1.jpg';
  assert.equal(await cancelled.changeProfilePhoto('library'), 'cancelled');
  assert.equal(cancelled.prefs.profilePhotoFile, 'profile-photo-1.jpg');
  const refused = environment({ granted: false, canAskAgain: false });
  assert.equal(await refused.changeProfilePhoto('camera'), 'denied');
  assert.ok(!refused.events.includes('ask:camera'));
  const asks = environment({ granted: false, canAskAgain: true });
  assert.equal(await asks.changeProfilePhoto('camera'), 'denied');
  assert.ok(asks.events.includes('ask:camera'));
});

test('a failed save reports failure and keeps the previous photo', async () => {
  const env = environment({ failCopy: true });
  env.prefs.profilePhotoFile = 'profile-photo-1.jpg';
  env.files.add('file:///docs/profile-photo-1.jpg');
  assert.equal(await env.changeProfilePhoto('library'), 'failed');
  assert.equal(env.prefs.profilePhotoFile, 'profile-photo-1.jpg');
  assert.ok(env.files.has('file:///docs/profile-photo-1.jpg'));
});

test('a photo whose file is gone is forgotten, and removing deletes the file', async () => {
  const env = environment();
  env.prefs.profilePhotoFile = 'profile-photo-9.jpg';
  assert.equal(await env.loadProfilePhotoLocation(), null);
  assert.equal(env.prefs.profilePhotoFile, null);
  env.prefs.profilePhotoFile = 'profile-photo-2.jpg';
  env.files.add('file:///docs/profile-photo-2.jpg');
  assert.equal(await env.loadProfilePhotoLocation(), 'file:///docs/profile-photo-2.jpg');
  await env.removeProfilePhoto();
  assert.equal(env.prefs.profilePhotoFile, null);
  assert.ok(!env.files.has('file:///docs/profile-photo-2.jpg'));
  env.files.add('file:///docs/profile-photo-3.jpg');
  env.files.add('file:///docs/other.json');
  await env.deleteAllProfilePhotos();
  assert.ok(!env.files.has('file:///docs/profile-photo-3.jpg'));
  assert.ok(env.files.has('file:///docs/other.json'));
});
