import { primeCloudHints, readCloudHint, writeCloudHint } from '../../modules/gruntz-cloud-hint';

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

/**
 * Fetches iCloud values early. The email itself is written only after a backup is
 * saved or restored (see backup.ts), and cleared when the backup or account is
 * deleted, so it never points at a backup that does not exist.
 */
export function initializeReturningAthlete(): void {
  if (started) return;
  started = true;
  primeCloudHints();
}
