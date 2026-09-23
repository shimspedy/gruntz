# Progress backup

Gruntz is offline-first and stays that way. Every store lives in AsyncStorage on the
device, and nothing in the app waits on the network to log a set. Backup exists for
one job: **so that losing a phone does not lose a training history.**

Signing up is optional, lives in Profile → *Back up progress*, and is never asked for
during onboarding. Someone can train for a year without an account.

## Build configuration

`.env` is gitignored and **EAS does not read it**, so local builds and cloud builds get
their config from different places. Release builds read the EAS environment, where both
values are now set for `production`, `preview` and `development`:

```
EXPO_PUBLIC_SUPABASE_URL=https://khskhjplkresilgrozhg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_…
```

This is the failure mode worth understanding: with them missing, nothing errors.
`isBackupAvailable()` simply returns false, the Profile row hides itself, and the feature
is silently absent from the shipped app — the same graceful degradation that makes the
build safe is what would hide the mistake. **If you ever move projects or rotate the key,
change it in both places**, and check with `eas env:list --environment production`.

## Setting it up

1. Create a Supabase project (separate from Bootz — different app, different users).
2. Put its URL and **anon/publishable** key in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
   Never the `service_role` key — it bypasses row-level security.
3. Apply `supabase/migrations/20260923120000_create_backups.sql`.
4. ~~Configure the email template.~~ **Done** — see below.

### Already configured on `khskhjplkresilgrozhg`

Set up and verified on 2026-09-23:

- **Schema applied**, RLS on, four policies, `anon` holding no grants at all.
- **Magic link / OTP template** rebranded: subject "Your Gruntz sign-in code", dark
  card, the app icon from `https://gruntzfit.com/brand/gruntz-icon.png`, and the code
  rendered from `{{ .Token }}`.

  The logo sits **above a real text wordmark**, and the image carries `alt=""`. Most
  email clients block remote images by default, and a blocked image with alt text
  produces a broken-image icon — so the brand is carried by type that always renders,
  and the image is decoration on top of it. Images on: icon + wordmark. Images off:
  wordmark alone, no broken icon, nothing missing.

  **The dashboard preview is not the email.** It does not substitute template
  variables, so it shows a literal `{{ .Token }}`, and its iframe sandbox blocks the
  external image. Both are artifacts of the preview; a real send substitutes the code
  and loads the image. Confirm with an actual sign-in, not the preview.
- **Email provider** enabled, new signups allowed, confirm-email on.
- **Both** templates that this flow can trigger are branded, which matters more than
  it looks: a first-time athlete is sent **"Confirm sign up"**, not "Magic link or
  OTP". Only branding the latter left real users receiving Supabase's stock
  "Confirm your email address" email — a bare link, no code, no branding. If you
  ever add another auth path, brand its template before shipping it.
- The app verifies the code as `email` **and then** `signup`, because those two
  emails carry different token types. Trying one alone made the first sign-in on any
  account fail with "that code didn't work" when the code was fine.
- **OTP: 3600 s expiry, 8 digits.** The expiry is what the email copy claims. The length
  is mirrored by `OTP_CODE_LENGTH` in `src/config/backup.ts`, which drives the input's
  `maxLength`, its placeholder and the on-screen copy — **these must agree with the
  dashboard.** They did not at first: the input was capped at 6 while the project issues
  8, so a correct code could not be typed in full and every sign-in failed. Nothing
  reports that mismatch; it just looks like the code is wrong.
- **"Automatically expose new tables"** is off.

Verified the Data API actually serves the table: an anonymous `GET /rest/v1/backups`
returns `42501 permission denied`, **not** `PGRST205 table not found`. That distinction
matters — it proves PostgREST can see the table and is refusing the caller, rather than
the table being invisible to the API. The dashboard's "0 of 1 tables exposed" counts
`anon` exposure, which is zero on purpose.

### SMTP

Custom SMTP through **Resend** (the same provider Bootz already uses —
`smtp.resend.com`, port 465, username `resend`). Everything is configured except the
API key, which has to be pasted by hand: a secret does not belong in a transcript.

**The sender is currently `onboarding@resend.dev`, a testing address.** Resend only
delivers mail from it to the account owner — right for verifying the flow, useless
for real users.

`auth.gruntzfit.com` has been added to Resend (region us-east-1) and its DNS records
are live in the Netlify zone for `gruntzfit.com`:

| Type | Name | Value |
|---|---|---|
| TXT | `resend._domainkey.auth` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7t1+Q…` |
| CNAME | `rsend.auth` | `rsend.forge.rmta.net` |
| CNAME | `send.auth` | `send.forge.rmta.net` |

All three were confirmed resolving from the authoritative nameserver
(`dns1.p03.nsone.net`) before Resend was asked to verify. The optional root `_dmarc`
record was **not** added: it would apply to all mail from `gruntzfit.com`, not just
this subdomain, so it is a decision for whoever owns the domain's mail policy.

**Do not switch the Supabase sender until Resend shows the domain Verified.** Sending
from an unverified domain is rejected outright, so changing it early breaks email
that currently works. Once it verifies, the only change is the sender address in
Authentication → Emails → SMTP Settings:
`noreply@auth.gruntzfit.com`.

### Before you ship: email sending is capped at 2/hour

The project uses Supabase's built-in email service, whose **rate limit is 2 emails per
hour for the whole project** (Authentication → Rate Limits). That is fine for testing
and useless in production: the third person to request a sign-in code that hour gets
nothing, and there is no way for the app to tell them why.

Enabling custom SMTP raises that to **30/hour** automatically, and it can be raised
further under Authentication → Rate Limits. See the SMTP section above for what is
configured and what is still needed.

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
