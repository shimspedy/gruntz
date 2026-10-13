const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

/** A Supabase client with just enough surface for the team service, recording every call. */
function fakeSupabase({ userId = 'me', rpcResult = {}, rpcError = null } = {}) {
  const calls = [];
  return {
    calls,
    auth: { getSession: async () => ({ data: { session: userId ? { user: { id: userId } } : null } }) },
    rpc: async (fn, args) => { calls.push([fn, args]); return rpcError ? { data: null, error: rpcError } : { data: rpcResult[fn] ?? null, error: null }; },
    from: () => { throw Error('not used'); },
    storage: { from: () => ({ remove: async () => ({}) }) },
  };
}

function load(supabase, teamCount = 1) {
  const store = { teamCount, teamName: 'A', teamCode: 'X', checkIns: [], setTeam() {} };
  return createLoader({
    './supabaseClient': { getSupabase: () => supabase },
    './profilePhoto': { loadProfilePhotoLocation: async () => null },
    '../store/useUiStore': { useChromePrefs: { getState: () => ({ profilePhotoFile: null, teamAvatarSynced: null, setTeamAvatarSynced() {} }) } },
    '../store/useReadinessStore': { useReadinessStore: { getState: () => store }, calculateDailyReadiness: () => 70, getTodaysCheckIn: () => undefined },
    '../store/useUserStore': { useUserStore: { getState: () => ({ progress: { workouts_completed: 3, streak_days: 2 }, profile: { display_name: 'Alex' } }) } },
  })('src/services/teams.ts');
}

test('public teams come back ordered as the database sent them, with counts as numbers', async () => {
  const supabase = fakeSupabase({ rpcResult: { list_public_teams: [
    { id: 't1', name: 'OCS prep', description: 'PFT and CFT', member_count: '41', is_member: false },
    { id: 't2', name: 'Night shift', description: null, member_count: 7, is_member: true },
  ] } });
  const teams = load(supabase);
  const result = await teams.fetchPublicTeams('  prep  ');
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, [
    { id: 't1', name: 'OCS prep', description: 'PFT and CFT', memberCount: 41, isMember: false },
    { id: 't2', name: 'Night shift', description: '', memberCount: 7, isMember: true },
  ]);
  assert.deepEqual(supabase.calls[0], ['list_public_teams', { p_query: 'prep' }]);
});

test('joining, listing and visibility go through the database functions with the display name', async () => {
  const supabase = fakeSupabase();
  const teams = load(supabase);
  assert.deepEqual(await teams.joinPublicTeam('t1'), { ok: true, value: null });
  assert.deepEqual(await teams.setTeamVisibility('t1', true, '  Saturdays at 0700  '), { ok: true, value: null });
  assert.deepEqual(supabase.calls, [
    ['join_public_team', { p_team_id: 't1', p_display_name: 'Alex' }],
    ['set_team_visibility', { p_team_id: 't1', p_public: true, p_description: 'Saturdays at 0700' }],
  ]);
});

test('database refusals turn into reasons the screens can explain', async () => {
  const cases = [['TEAM_FULL', 'full'], ['ALREADY_IN_TEAM', 'already-in-team'], ['TOO_MANY_TEAMS', 'too-many-teams'], ['TEAM_NOT_FOUND', 'not-found'], ['boom', 'error']];
  for (const [message, reason] of cases) {
    const teams = load(fakeSupabase({ rpcError: { message } }));
    assert.deepEqual(await teams.joinPublicTeam('t1'), { ok: false, reason });
  }
  assert.deepEqual(await load(fakeSupabase({ userId: null })).fetchPublicTeams(''), { ok: false, reason: 'signed-out' });
  assert.deepEqual(await load(null).fetchPublicTeams(''), { ok: false, reason: 'unavailable' });
});

test('leaving names the team, and the last team to go takes the shared photo with it', async () => {
  const supabase = fakeSupabase();
  const teams = load(supabase, 2);
  await teams.leaveTeam('t2');
  assert.deepEqual(supabase.calls, [['leave_team', { p_team_id: 't2' }]]);
  await teams.removeTeamMember('t2', 'u9');
  assert.deepEqual(supabase.calls[1], ['remove_team_member', { p_team_id: 't2', p_user_id: 'u9' }]);
});
