/**
 * Unread team chat, as pure arithmetic over message stubs. The service fetches, the
 * store remembers where each chat was last read, and the header badge shows the sum.
 */
export interface InboxMessage {
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
}

export interface InboxCounts {
  /** Unread messages per team, teams with none omitted. */
  unread: Record<string, number>;
  /** The newest message seen per team, read or not. */
  latestAt: Record<string, string>;
}

/** How far back the first look at a chat counts; older lines were never "new" to this phone. */
export const INBOX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A line counts when someone else wrote it after the chat was last read. A chat never
 * opened on this phone counts everything inside the window, so a new member sees that
 * the team has been talking.
 */
export function countUnread(messages: InboxMessage[], lastReadAt: Record<string, string>, myUserId: string | null, now = Date.now()): InboxCounts {
  const unread: Record<string, number> = {};
  const latestAt: Record<string, string> = {};
  const floor = new Date(now - INBOX_WINDOW_MS).toISOString();
  for (const message of messages) {
    if (!latestAt[message.teamId] || message.createdAt > latestAt[message.teamId]) latestAt[message.teamId] = message.createdAt;
    if (message.userId === myUserId) continue;
    const since = lastReadAt[message.teamId] ?? floor;
    if (message.createdAt > since) unread[message.teamId] = (unread[message.teamId] ?? 0) + 1;
  }
  return { unread, latestAt };
}

export const totalUnread = (unread: Record<string, number>) => Object.values(unread).reduce((sum, n) => sum + n, 0);

/** Shown on the badge: exact up to 99, then "99+". */
export const badgeLabel = (count: number) => (count > 99 ? '99+' : String(count));

/**
 * Where the header icon goes: the chat with the newest unread line, else the only
 * team's chat, else the Teams list to choose from.
 */
export function pickInboxTarget(teamIds: string[], counts: InboxCounts): { kind: 'chat'; teamId: string } | { kind: 'teams' } {
  const withUnread = Object.keys(counts.unread).filter((id) => counts.unread[id] > 0 && teamIds.includes(id));
  if (withUnread.length) {
    const newest = withUnread.sort((a, b) => (counts.latestAt[b] ?? '').localeCompare(counts.latestAt[a] ?? ''))[0];
    return { kind: 'chat', teamId: newest };
  }
  if (teamIds.length === 1) return { kind: 'chat', teamId: teamIds[0] };
  return { kind: 'teams' };
}
