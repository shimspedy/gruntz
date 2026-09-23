/**
 * Progress backup configuration.
 *
 * Both values are read from `EXPO_PUBLIC_*` env, the same way the RevenueCat keys
 * are, and both default to empty. `isBackupAvailable()` being false is a supported
 * state, not an error: the whole feature hides itself and the app behaves exactly
 * as it does today. That matters because Gruntz works entirely offline — backup is
 * a safety net bolted on the side, never something the app depends on to function.
 *
 * The anon key is a publishable key and is meant to ship in the client; every table
 * it can reach is protected by row-level security (see
 * `supabase/migrations/20260923120000_create_backups.sql`). Do not put a service
 * role key here — that one bypasses RLS and must never leave a server.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';

export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

export function isBackupAvailable(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

/**
 * Bumped when the snapshot shape changes in a way an older build would misread.
 *
 * A device refuses a payload from a *newer* schema rather than restoring a shape it
 * does not understand — half-restoring someone's training history is worse than
 * telling them to update the app.
 */
export const BACKUP_SCHEMA_VERSION = 1;

/**
 * Snapshots are pushed after meaningful changes, never on every keystroke.
 *
 * Logging a set must not cost a network round trip, so pushes are debounced and
 * always fire in the background.
 */
export const BACKUP_DEBOUNCE_MS = 20_000;
