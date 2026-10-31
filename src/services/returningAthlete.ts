import { primeCloudHints, readCloudHint, writeCloudHint } from '../../modules/gruntz-cloud-hint';
import { getSupabase } from './supabaseClient';

/**
 * Recognises a returning athlete on a reinstall or a new iPhone without any login:
 * the email their progress is backed up under is kept in their own iCloud
 * (key-value storage, same Apple ID only). After Get Started, Gruntz can then offer
 * "Welcome back — restore your progress?" with that email filled in. Nothing is
 * restored without the athlete confirming, and the email code is still required.
 *
 * Android needs none of this: Auto Backup restores the app's data with the phone.
 */
const KEY = 'gruntz.backupEmail';
const EMAIL = /^[^@\s]{1,64}@[^@\s]{1,189}$/;

export function rememberBackupAccount(email: string | null | undefined): void {
  const clean = email?.trim().toLowerCase() ?? '';
  writeCloudHint(KEY, EMAIL.test(clean) ? clean : null);
}

/** The backup email remembered in iCloud, if any and if it looks like one. */
export function rememberedBackupAccount(): string | null {
  const value = readCloudHint(KEY)?.trim().toLowerCase() ?? '';
  return EMAIL.test(value) ? value : null;
}

let started = false;

/** Fetches iCloud values early, and remembers the account whenever a session starts. */
export function initializeReturningAthlete(): void {
  if (started) return;
  started = true;
  primeCloudHints();
  const supabase = getSupabase();
  supabase?.auth.onAuthStateChange((event, session) => {
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user.email) rememberBackupAccount(session.user.email);
  });
}
