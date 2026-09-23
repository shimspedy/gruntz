# Progress backup

Gruntz is offline-first and stays that way. Every store lives in AsyncStorage on the
device, and nothing in the app waits on the network to log a set. Backup exists for
one job: **so that losing a phone does not lose a training history.**

Signing up is optional, lives in Profile → *Back up progress*, and is never asked for
during onboarding. Someone can train for a year without an account.

## Setting it up

1. Create a Supabase project (separate from Bootz — different app, different users).
2. Put its URL and **anon/publishable** key in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
   Never the `service_role` key — it bypasses row-level security.
3. Apply `supabase/migrations/20260923120000_create_backups.sql`.
4. In Supabase → Authentication → Providers, enable **Email** with OTP. No redirect
   URL is needed: sign-in is a six-digit code typed into the app, not a magic link.

### Project settings

- **Enable Data API** — on. `supabase-js` needs it.
- **Automatically expose new tables** — **off**. The migration grants `authenticated`
  access to `backups` explicitly, so it works without this, and any future table
  stays unreachable until you deliberately grant it. `anon` is granted nothing.
- **Enable automatic RLS** — on. The migration also enables RLS on its own table, so
  this is belt and braces rather than the only thing standing between athletes.
- **Region** — closest to your users; it cannot be changed after creation.

Leave the env vars empty and `isBackupAvailable()` returns false, the Profile row is
hidden, and the Supabase SDK is never even loaded.

## How it works

- **One row per athlete**, holding a whole snapshot as JSONB. Restore replaces local
  state wholesale, so there is nothing to merge and no conflicts to resolve.
- **Snapshots come from AsyncStorage**, not the live Zustand stores, so a restore
  reproduces what a fresh install would rehydrate.
- **Pushes are debounced** (20 s) after a finished workout or a saved check-in, and
  flushed when the app backgrounds. Fire-and-forget: a dead network is invisible.
- **Restore requires an explicit confirm** and takes effect on next launch, because
  the persist middleware reads storage once at startup.

## What is deliberately not backed up

- **Subscription state.** RevenueCat is the authority on entitlement. Making Pro
  restorable from a client-written payload would be a way to grant yourself a
  subscription. "Restore purchases" already exists in Settings for the real path.
- **The plan catalog and exercise library.** Bundled, identical for everyone, megabytes.
- **The SecureStore assessment blob.** It is in SecureStore precisely so it does not
  travel, and it is re-derivable from onboarding.
- **UI state.** Worthless to restore.

## What this does not fix

The **15-day trial is still device-local** (`trialStartedAt` in AsyncStorage), so an
uninstall and reinstall still grants a fresh trial to anyone who has not signed up.
Backup means a signed-up athlete keeps their correct remaining trial; it does not
close the leak. Closing it properly needs the trial start to be server-authoritative
— a small follow-up, and worth doing before any launch push.

## If the snapshot shape changes

Bump `BACKUP_SCHEMA_VERSION` in `src/config/backup.ts`. A device refuses a payload
from a *newer* schema rather than half-restoring a shape it does not understand.
