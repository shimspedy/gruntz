import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabaseClient';

/**
 * Which plan a signed-in athlete follows, so plans can be ranked by how many people are
 * on them. Signed-out athletes send nothing. The server only ever returns counts, and
 * only for plans with at least three followers.
 */
const CACHE_KEY = '@gruntz_plan_followers';
const CACHE_MS = 12 * 60 * 60 * 1000;
const PLAN_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{1,119}$/;

let counts: Record<string, number> = {};
let loadedAt = 0;
let loading: Promise<Record<string, number>> | null = null;

/** Records (or with null, clears) the plan this account is following. Best effort. */
export async function recordPlanFollow(planId: string | null): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    if (planId === null) await supabase.from('plan_follows').delete().eq('user_id', userId);
    else if (PLAN_ID.test(planId)) await supabase.from('plan_follows').upsert({ user_id: userId, plan_id: planId, started_at: new Date().toISOString() });
  } catch {
    // Popularity is a nicety; the plan itself is already active on this phone.
  }
}

function clean(value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, n] of Object.entries(value)) if (PLAN_ID.test(key) && typeof n === 'number' && Number.isFinite(n) && n >= 3) out[key] = Math.round(n);
  }
  return out;
}

/** Follower counts by plan id, fetched at most twice a day and kept between launches. */
export function planFollowerCounts(): Promise<Record<string, number>> {
  if (Date.now() - loadedAt < CACHE_MS) return Promise.resolve(counts);
  loading ??= (async () => {
    try {
      const cached = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) ?? 'null') as { at?: number; counts?: unknown } | null;
      if (cached && typeof cached.at === 'number' && Date.now() - cached.at < CACHE_MS && cached.at <= Date.now()) {
        counts = clean(cached.counts);
        loadedAt = cached.at;
        return counts;
      }
      const supabase = getSupabase();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!supabase || !session) return counts;
      const { data, error } = await supabase.rpc('plan_follower_counts');
      if (error) return counts;
      counts = clean(Object.fromEntries(((data ?? []) as { plan_id: string; followers: number }[]).map((row) => [row.plan_id, Number(row.followers)])));
      loadedAt = Date.now();
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: loadedAt, counts }));
      return counts;
    } catch {
      return counts;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

/** What is already known, without waiting; empty until the first fetch lands. */
export const knownPlanFollowers = (): Record<string, number> => counts;
