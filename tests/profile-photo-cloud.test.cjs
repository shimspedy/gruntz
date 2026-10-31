const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function setup({ userId = 'u1', file = null, synced = null, teamCount = 1, remote = null, local = undefined } = {}) {
  const calls = [];
  const prefs = {
    profilePhotoFile: file,
    teamAvatarSynced: synced,
    setTeamAvatarSynced(v) { prefs.teamAvatarSynced = v; },
    setProfilePhotoFile(v) { prefs.profilePhotoFile = v; },
  };
  const supabase = {
    auth: { getSession: async () => ({ data: { session: userId ? { user: { id: userId } } : null } }), onAuthStateChange() {} },
    rpc: async (fn, args) => { calls.push(['rpc', fn, args.p_version]); return { error: null }; },
    storage: { from: (bucket) => ({
      upload: async (path) => { calls.push(['upload', bucket, path]); return { error: null }; },
      remove: async (paths) => { calls.push(['remove', bucket, paths[0]]); return { error: null }; },
      download: async (path) => { calls.push(['download', bucket, path]); return remote ? { data: { arrayBuffer: async () => remote }, error: null } : { data: null, error: { message: 'not found' } }; },
    }) },
  };
  const mod = createLoader({
    './supabaseClient': { getSupabase: () => supabase },
    '../store/useUiStore': { useChromePrefs: { getState: () => prefs } },
    '../store/useReadinessStore': { useReadinessStore: { getState: () => ({ teamCount }) } },
    './profilePhoto': {
      loadProfilePhotoLocation: async () => (local !== undefined ? local : prefs.profilePhotoFile ? `file:///docs/${prefs.profilePhotoFile}` : null),
      saveDownloadedProfilePhoto: async () => { if (prefs.profilePhotoFile) return null; prefs.profilePhotoFile = 'profile-photo-1793000000000.jpg'; return prefs.profilePhotoFile; },
    },
    'expo-file-system': { File: class { constructor(uri) { this.uri = uri; } async arrayBuffer() { return new ArrayBuffer(4); } } },
  })('src/services/profilePhotoCloud.ts');
  return { mod, calls, prefs };
}

test('the photo version comes from when it was taken, so syncing again never busts caches', () => {
  const { mod } = setup();
  assert.equal(mod.photoVersion('profile-photo-1793000000123.jpg'), 1793000000);
  assert.equal(mod.photoVersion('odd.jpg', 5_000), 5);
});

test('a signed-in photo is saved once per account, and every team gets its version', async () => {
  const { mod, calls, prefs } = setup({ file: 'profile-photo-1793000000000.jpg', teamCount: 0 });
  await mod.syncProfilePhoto();
  assert.deepEqual(calls, [['upload', 'team-avatars', 'u1.jpg']], 'uploaded even outside a team, no team version');
  assert.equal(prefs.teamAvatarSynced, 'u1:profile-photo-1793000000000.jpg');
  calls.length = 0;
  await mod.syncProfilePhoto();
  assert.deepEqual(calls, [], 'nothing to do the second time');
});

test('joining a team after the upload still tells that team which photo to show', async () => {
  const { mod, calls } = setup({ file: 'profile-photo-1793000000000.jpg', synced: 'u1:profile-photo-1793000000000.jpg', teamCount: 1 });
  await mod.syncProfilePhoto();
  assert.deepEqual(calls, [['rpc', 'set_team_avatar_version', 1793000000]]);
});

test('another account on the same phone uploads its own copy', async () => {
  const { mod, calls } = setup({ userId: 'u2', file: 'profile-photo-1793000000000.jpg', synced: 'u1:profile-photo-1793000000000.jpg', teamCount: 0 });
  await mod.syncProfilePhoto();
  assert.deepEqual(calls, [['upload', 'team-avatars', 'u2.jpg']]);
});

test('removing the photo deletes the saved copy and clears it for teammates', async () => {
  const { mod, calls, prefs } = setup({ file: null, synced: 'u1:profile-photo-1.jpg', teamCount: 2 });
  await mod.syncProfilePhoto();
  assert.deepEqual(calls, [['remove', 'team-avatars', 'u1.jpg'], ['rpc', 'set_team_avatar_version', 0]]);
  assert.equal(prefs.teamAvatarSynced, null);
});

test('signed out, nothing leaves the phone', async () => {
  const { mod, calls } = setup({ userId: null, file: 'profile-photo-1.jpg' });
  await mod.syncProfilePhoto();
  assert.equal(await mod.restoreProfilePhoto(), 'none');
  assert.deepEqual(calls, []);
});

test('a new phone gets the saved photo back, but never over one already here', async () => {
  const fresh = setup({ remote: new ArrayBuffer(8) });
  assert.equal(await fresh.mod.restoreProfilePhoto(), 'restored');
  assert.equal(fresh.prefs.profilePhotoFile, 'profile-photo-1793000000000.jpg');
  assert.equal(fresh.prefs.teamAvatarSynced, 'u1:profile-photo-1793000000000.jpg', 'not uploaded again');

  const hasPhoto = setup({ file: 'profile-photo-5.jpg', remote: new ArrayBuffer(8) });
  assert.equal(await hasPhoto.mod.restoreProfilePhoto(), 'none');
  assert.deepEqual(hasPhoto.calls, []);

  const nothingSaved = setup({ remote: null });
  assert.equal(await nothingSaved.mod.restoreProfilePhoto(), 'none');
});

test('a photo removed here but not yet deleted from the server is not brought back', async () => {
  const { mod, calls } = setup({ file: null, synced: 'u1:profile-photo-1.jpg', remote: new ArrayBuffer(8) });
  assert.equal(await mod.restoreProfilePhoto(), 'none');
  assert.deepEqual(calls, []);
});
