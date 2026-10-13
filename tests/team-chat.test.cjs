const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function load() {
  return createLoader({
    './supabaseClient': { getSupabase: () => null },
    './teams': { localTeamStatus: () => ({ displayName: 'Alex' }) },
  })('src/services/teamChat.ts');
}
const message = (id, createdAt, extra = {}) => ({ id, teamId: 't', userId: 'u', displayName: 'A', body: 'hi', createdAt, isMe: false, ...extra });

test('a message is trimmed, bounded, and never empty', () => {
  const { cleanMessage, MAX_MESSAGE_LENGTH } = load();
  assert.equal(cleanMessage('  Ruck at 0600  \n'), 'Ruck at 0600');
  assert.equal(cleanMessage('   \n\t'), null);
  assert.equal(cleanMessage('x'.repeat(MAX_MESSAGE_LENGTH + 50)).length, MAX_MESSAGE_LENGTH);
});

test('merging keeps messages in time order without duplicates', () => {
  const { mergeMessages } = load();
  const merged = mergeMessages(
    [message('b', '2026-10-13T10:01:00Z'), message('a', '2026-10-13T10:00:00Z')],
    [message('b', '2026-10-13T10:01:00Z', { body: 'edited' }), message('c', '2026-10-13T09:00:00Z')],
  );
  assert.deepEqual(merged.map((m) => m.id), ['c', 'a', 'b']);
  assert.equal(merged[2].body, 'edited');
});

test('without a backend, reading and sending fail cleanly instead of throwing', async () => {
  const chat = load();
  assert.deepEqual(await chat.fetchMessages('t'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await chat.sendMessage('t', 'hello'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await chat.sendMessage('t', '   '), { ok: false, reason: 'error' });
  assert.equal(typeof chat.subscribeToMessages('t', () => {}), 'function');
});
