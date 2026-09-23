import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isBackupAvailable, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/backup';

/**
 * The Supabase client, created lazily and only when backup is configured.
 *
 * Lazy because Gruntz is offline-first and the overwhelming majority of sessions
 * never touch the network: an athlete who has not signed up should not pay for
 * this module at startup, and one who has no connectivity should not see it try.
 * `null` is a normal return, not a failure — every caller handles it.
 */
let client: SupabaseClient | null = null;
let failed = false;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (failed || !isBackupAvailable()) return null;

  try {
    // Required lazily so an unconfigured build never loads the SDK at all.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        // The session has to survive a relaunch, or "restore my progress" would
        // mean signing in every time.
        persistSession: true,
        autoRefreshToken: true,
        // No deep-link callback: sign-in is a six-digit code typed into the app,
        // so there is no URL to detect and nothing to route.
        detectSessionInUrl: false,
      },
    });
    return client;
  } catch (error) {
    // A missing or broken SDK must not take the app down — it only means backup
    // is unavailable, which is a state the app already supports everywhere.
    failed = true;
    if (__DEV__) console.warn('[backup] Supabase client unavailable', error);
    return null;
  }
}
