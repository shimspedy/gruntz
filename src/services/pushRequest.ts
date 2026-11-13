import { getSupabase } from './supabaseClient';

export type PushRequest =
  | { kind: 'message'; messageId: string }
  | { kind: 'nudge'; teamId: string; userId: string }
  | { kind: 'follow'; userId: string }
  | { kind: 'comment'; commentId: string }
  | { kind: 'reaction'; postId: string };

/** Asks the server to deliver one notification. Best effort: the action itself is already saved. */
export async function requestPush(request: PushRequest): Promise<{ ok: boolean; reason?: 'rate-limited' | 'error' }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'error' };
  try {
    const { error } = await supabase.functions.invoke('team-push', { method: 'POST', body: request });
    if (!error) return { ok: true };
    const status = (error as { context?: { status?: number } }).context?.status;
    return { ok: false, reason: status === 429 ? 'rate-limited' : 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
