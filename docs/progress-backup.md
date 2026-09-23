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
4. **The one step that must be done by hand.** Supabase's default email template
   sends a magic *link*; this app asks for a *code*. In
   **Authentication → Email Templates → Magic Link**, replace the body with one that
   includes the token, e.g.:

   ```html
   <h2>Your Gruntz sign-in code</h2>
   <p>Enter this code in the app:</p>
   <p style="font-size:28px;letter-spacing:6px;"><strong>{{ .Token }}</strong></p>
   <p>It expires in an hour. If you didn't ask for it, ignore this email.</p>
   ```

   Without `{{ .Token }}` the email contains only a link and there is nothing to
   type, so sign-in cannot complete. Email auth itself is on by default; no redirect
   URL is needed, because there is no link to follow.

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

## The trial, and what still cannot be fixed here

`trial_started_at` is stored as its own column — **not** inside the snapshot payload,
because the payload excludes all subscription state on purpose. Entitlement must
never be restorable from something the client writes; RevenueCat stays the authority
on who has paid.

A trial *start* is different. `reconcileTrialStart()` runs after sign-in and adopts
the server's date only when it is **earlier** than this device's. That asymmetry is
the entire safety argument: the value can only ever shorten the remaining trial,
never extend it, so a stale or tampered one buys nobody free days. Reinstalling and
signing back in resumes the real trial instead of starting a fresh fifteen days.

**This does not fully close the leak, and no amount of code here will.** Someone who
never signs up has no identity to tie a trial to — that is the direct cost of not
having an account wall, and it is a cost worth paying. The complete fix is to make
the free period an **App Store introductory offer** instead of an app-side counter:
Apple enforces one per Apple ID, across reinstalls, whether or not anyone signs up.
That is a store configuration change plus the disclosure the paywall already knows
how to render (`introPriceString`, wired in audit item #28). Worth doing before any
real launch push.

## If the snapshot shape changes

Bump `BACKUP_SCHEMA_VERSION` in `src/config/backup.ts`. A device refuses a payload
from a *newer* schema rather than half-restoring a shape it does not understand.

## Verified against the live database

Not assumed — run as the `authenticated` role with a real JWT claim, on
`khskhjplkresilgrozhg`, with the fixtures removed afterwards:

| Check | Result |
|---|---|
| An athlete sees only their own row | 1 row, their own |
| Athlete A deleting B's backup | blocked, B's row survived |
| Athlete A updating B's backup | blocked, B's count unchanged |
| Deleting the account | backup cascades away |
| `anon` grants on `backups` | none at all |
| `authenticated` grants | exactly SELECT, INSERT, UPDATE, DELETE |
| Supabase security advisors | zero |

The grant check is the one that mattered: Supabase's automatic table exposure had
handed `TRUNCATE` to both `anon` and `authenticated`, and **`TRUNCATE` is not subject
to row-level security** — RLS protects rows, truncate empties the table. One signed-in
athlete could have wiped every backup. The migration now revokes everything before
granting back the four verbs the app actually issues.
