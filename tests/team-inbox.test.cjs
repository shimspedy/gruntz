const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

const load = () => createLoader({})('src/features/teamInbox.ts');
const NOW = Date.parse('2026-10-13T12:00:00Z');
const stub = (id, teamId, userId, createdAt) => ({ id, teamId, userId, createdAt });

test('lines from others after the last read count; mine and already-read ones do not', () => {
  const { countUnread } = load();
  const counts = countUnread(
    [
      stub('1', 'a', 'them', '2026-10-13T10:00:00Z'),
      stub('2', 'a', 'me', '2026-10-13T10:30:00Z'),
      stub('3', 'a', 'them', '2026-10-13T11:00:00Z'),
      stub('4', 'b', 'them', '2026-10-13T09:00:00Z'),
    ],
    { a: '2026-10-13T10:15:00Z', b: '2026-10-13T09:30:00Z' },
    'me',
    NOW,
  );
  assert.deepEqual(counts.unread, { a: 1 });
  assert.equal(counts.latestAt.a, '2026-10-13T11:00:00Z');
  assert.equal(counts.latestAt.b, '2026-10-13T09:00:00Z');
});

test('a chat never opened counts the last week, not the whole history', () => {
  const { countUnread } = load();
  const counts = countUnread(
    [stub('old', 'a', 'them', '2026-09-01T10:00:00Z'), stub('recent', 'a', 'them', '2026-10-12T10:00:00Z')],
    {},
    'me',
    NOW,
  );
  assert.deepEqual(counts.unread, { a: 1 });
});

test('the badge sums teams and caps at 99+', () => {
  const { totalUnread, badgeLabel } = load();
  assert.equal(totalUnread({ a: 2, b: 3 }), 5);
  assert.equal(badgeLabel(7), '7');
  assert.equal(badgeLabel(140), '99+');
});

test('the icon opens the chat with the newest unread line, else the only team, else the list', () => {
  const { pickInboxTarget } = load();
  const counts = { unread: { a: 1, b: 4 }, latestAt: { a: '2026-10-13T11:00:00Z', b: '2026-10-13T10:00:00Z' } };
  assert.deepEqual(pickInboxTarget(['a', 'b'], counts), { kind: 'chat', teamId: 'a' });
  // A team the user has since left is ignored even if stale counts mention it.
  assert.deepEqual(pickInboxTarget(['b'], counts), { kind: 'chat', teamId: 'b' });
  assert.deepEqual(pickInboxTarget(['solo'], { unread: {}, latestAt: {} }), { kind: 'chat', teamId: 'solo' });
  assert.deepEqual(pickInboxTarget(['a', 'b'], { unread: {}, latestAt: {} }), { kind: 'teams' });
});
