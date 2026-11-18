const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261118120000_social_profiles.sql'), 'utf8');

/** The body of one `create ... function public.<name>` up to its closing `$$;`. */
function fn(name) {
  const start = sql.search(new RegExp(`create (or replace )?function public\\.${name}\\(`));
  assert.ok(start >= 0, `${name} is defined`);
  const end = sql.indexOf('$$;', sql.indexOf('$$', start) + 2);
  return sql.slice(start, end);
}

const NEW_RPCS = ['set_athlete_bio', 'athlete_profile', 'suggested_athletes', 'feed_page', 'feed_by_athlete', 'feed_following_page', 'report_athlete'];

test('every new social function is a definer function with a fixed search path, closed to anon', () => {
  for (const name of NEW_RPCS) {
    const body = fn(name);
    assert.match(body, /security definer/, `${name} is security definer`);
    assert.match(body, /set search_path = ''/, `${name} pins search_path`);
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}\\([^)]*\\) from anon, public;`), `${name} is revoked from anon`);
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}\\([^)]*\\) to authenticated;`), `${name} is granted to signed-in athletes only`);
  }
});

test('identity always comes from the token, never from an argument', () => {
  for (const name of NEW_RPCS) assert.match(fn(name), /auth\.uid\(\)/, `${name} reads auth.uid()`);
  // The bio is only ever the caller's own.
  assert.match(fn('set_athlete_bio'), /where user_id = caller/);
});

test('a profile is hidden across a block and from strangers, and private stats stay private', () => {
  const body = fn('athlete_profile');
  assert.match(body, /athletes_blocked\(caller, target\)/);
  assert.match(body, /raise exception 'NOT_FOUND'/);
  // Training numbers and counts only for yourself, a findable athlete, or a follow either way.
  assert.match(body, /open_stats := me or findable or i_follow or they_follow;/);
  for (const column of ['p.sessions', 'p.streak', 'p.last_trained_at']) assert.match(body, new RegExp(`case when open_stats then ${column.replace('.', '\\.')} end`));
  // The photo version follows the same rule as the storage policy.
  assert.match(body, /case when me or findable or i_follow then p\.avatar_version else 0 end/);
});

test('suggestions never rank on who other athletes follow', () => {
  const body = fn('suggested_athletes');
  assert.match(body, /p\.discoverable/);
  assert.match(body, /not public\.athletes_blocked\(me\.uid, p\.user_id\)/);
  // Every follow edge read here touches the caller: friends-of-friends would leak follow lists.
  const edges = body.match(/athlete_follows f[^)]*/g) ?? [];
  assert.ok(edges.length > 0);
  for (const edge of edges) assert.match(edge, /me\.uid/, `follow lookup involves the caller: ${edge}`);
});

test('the Following feed and the athlete page keep every post behind feed_can_view', () => {
  for (const name of ['feed_page', 'feed_by_athlete', 'feed_following_page']) assert.match(fn(name), /feed_can_view\(/, `${name} checks feed_can_view`);
  // Follow buttons only for findable authors, never on your own post.
  assert.match(fn('feed_page'), /a\.discoverable and r\.user_id <> \(select uid from me\)/);
});

test('bios are bounded on the server and kept with a report', () => {
  assert.match(sql, /check \(char_length\(bio\) <= 150\)/);
  assert.match(fn('set_athlete_bio'), /left\(.*150\)/s);
  assert.match(fn('report_athlete'), /reported_bio/);
});

test('the profile screen replaces the old posts-only route everywhere', () => {
  const nav = fs.readFileSync(path.join(root, 'src/types/navigation.ts'), 'utf8');
  assert.doesNotMatch(nav, /AthletePosts/);
  assert.match(nav, /AthleteProfile: \{ userId\?: string; name\?: string \} \| undefined;/);
  for (const file of ['src/screens/FeedScreen.tsx', 'src/screens/PostDetailScreen.tsx', 'src/screens/AthletesScreen.tsx']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /'AthletePosts'/, `${file} no longer opens the old route`);
    assert.match(source, /'AthleteProfile'/, `${file} opens the profile`);
  }
});

// ─── Activity ───────────────────────────────────────────────────────────────
const { createLoader } = require('./workout-test-utils.cjs');
const activitySql = fs.readFileSync(path.join(root, 'supabase/migrations/20261118130000_social_activity.sql'), 'utf8');

test('activity functions are closed to anon and read only rows aimed at the caller', () => {
  for (const name of ['my_activity', 'activity_unread_count', 'mark_activity_seen']) {
    assert.match(activitySql, new RegExp(`revoke all on function public\\.${name}\\([^)]*\\) from anon, public;`));
    assert.match(activitySql, new RegExp(`grant execute on function public\\.${name}\\([^)]*\\) to authenticated;`));
  }
  // The item helper is internal: no app role may call it with someone else's id.
  assert.match(activitySql, /revoke all on function public\.activity_items\(uuid, timestamptz, timestamptz, integer\) from anon, authenticated, public;/);
  assert.doesNotMatch(activitySql, /grant execute on function public\.activity_items/);
  assert.match(activitySql, /activity_items\(me\.uid,/);
  assert.match(activitySql, /not public\.athletes_blocked\(p_user, items\.actor_id\)/);
  assert.match(activitySql, /public\.feed_can_view\(p_user, items\.post_id\)/);
  assert.match(activitySql, /alter table public\.athlete_activity_reads enable row level security;/);
});

test('activity rows map to items and drop anything malformed', () => {
  const { toActivityItems } = createLoader({
    './supabaseClient': { getSupabase: () => null },
    './feed': { REACTIONS: [{ key: 'strong' }, { key: 'fire' }] },
  })('src/services/activity.ts');
  const row = { actor_id: 'u1', display_name: 'Brooks', avatar_version: 2, created_at: '2026-11-18T10:00:00Z', post_id: 'p1', comment_id: null, emoji: 'strong', body: null, post_preview: ' Leg day ', post_kind: 'workout', is_following: true, actor_followable: true, unread: true };
  const items = toActivityItems([
    { ...row, kind: 'reaction' },
    { ...row, kind: 'reaction', emoji: 'nuke' },
    { ...row, kind: 'hack' },
  ], new Map([['u1.jpg', 'https://signed/u1']]));
  assert.equal(items.length, 2, 'an unknown kind is dropped');
  assert.equal(items[0].reaction, 'strong');
  assert.equal(items[1].reaction, null, 'an unknown reaction is not shown');
  assert.equal(items[0].avatarUrl, 'https://signed/u1');
  assert.equal(items[0].postPreview, 'Leg day');
  assert.notEqual(items[0].key, toActivityItems([{ ...row, kind: 'follow' }], new Map())[0].key);
});

test('a follow push opens the follower, and only a well-formed profile link is trusted', () => {
  const { resolveNotificationLink } = createLoader()('src/navigation/notificationLink.ts');
  const id = '00000000-0000-0000-0000-00000000000b';
  assert.equal(resolveNotificationLink({ type: 'athlete-follow', url: 'gruntz://athletes', profileUrl: `gruntz://athlete/${id}` }, Date.now()), `gruntz://athlete/${id}`);
  assert.equal(resolveNotificationLink({ type: 'athlete-follow', url: 'gruntz://athletes', profileUrl: 'https://evil.example/athlete/x' }, Date.now()), 'gruntz://athletes');
  assert.equal(resolveNotificationLink({ type: 'athlete-follow', url: 'gruntz://athletes', profileUrl: `gruntz://athlete/${id}/../settings` }, Date.now()), 'gruntz://athletes');
  const push = fs.readFileSync(path.join(root, 'supabase/functions/team-push/index.ts'), 'utf8');
  assert.match(push, /profileUrl: `gruntz:\/\/athlete\/\$\{userId\}`/, 'the follower id is the verified caller, not request input');
});

test('Instagram stories are offered only through the allow-listed scheme', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.deepEqual(app.expo.ios.infoPlist.LSApplicationQueriesSchemes, ['instagram-stories']);
  const swift = fs.readFileSync(path.join(root, 'modules/gruntz-story-share/ios/GruntzStoryShareModule.swift'), 'utf8');
  assert.match(swift, /file\.isFileURL/, 'only a local file is read');
  assert.match(swift, /expirationDate/, 'the pasteboard item expires');
});
