/**
 * What a subscription's state means for access, and what to tell the athlete about it.
 *
 * RevenueCat is the source of truth. The app keeps a copy of the last answer only so
 * Pro keeps working offline, and only for OFFLINE_GRACE_MS after it was last confirmed.
 *
 * ONE ACTIVE DEVICE
 * The RevenueCat dashboard must be set to: Project Settings → Restore Behavior →
 * "Transfer to new App User ID". Athletes are anonymous, so when another phone
 * restores the same Apple ID / Google account, the subscription moves to that phone's
 * App User ID and this phone stops seeing it at its next check (live listener, launch
 * or foreground). There is no device fingerprinting: the store receipt plus transfer
 * is the whole mechanism. See docs/subscription-restore.md.
 */

/** Pro stays on without a fresh check for this long, then waits for the store again. */
export const OFFLINE_GRACE_MS = 72 * 60 * 60 * 1000;

/**
 * - active: paid and current.
 * - grace: the store could not take the last payment and is retrying; Pro stays on.
 * - billing-retry: the retry window ran out of grace; Pro is off until payment works.
 * - expired: ended, cancelled or refunded. RevenueCat's SDK reports a refund as an
 *   ended entitlement, so the message covers both.
 * - moved: this phone had Pro and the store no longer links it here at all, because
 *   another phone restored it.
 * - none: no Gruntz Pro purchase on this store account.
 */
export type EntitlementStatus = 'active' | 'grace' | 'billing-retry' | 'expired' | 'moved' | 'none';

export type EntitlementLike = {
  isActive: boolean;
  billingIssueDetectedAt?: string | null;
} | null | undefined;

export function classifyEntitlement(entitlement: EntitlementLike, hadAccessHere: boolean): EntitlementStatus {
  if (!entitlement) return hadAccessHere ? 'moved' : 'none';
  if (entitlement.isActive) return entitlement.billingIssueDetectedAt ? 'grace' : 'active';
  return entitlement.billingIssueDetectedAt ? 'billing-retry' : 'expired';
}

export const unlocks = (status: EntitlementStatus) => status === 'active' || status === 'grace';

/** Whether a cached "has Pro" may still be trusted without asking the store. */
export function cacheStillValid(verifiedAt: string | null, now: number): boolean {
  const at = verifiedAt ? Date.parse(verifiedAt) : NaN;
  // A clock set backwards must not stretch the window.
  return Number.isFinite(at) && at <= now + 5 * 60 * 1000 && now - at < OFFLINE_GRACE_MS;
}

export type Platform = 'ios' | 'android' | string;

const storeName = (platform: Platform) => (platform === 'ios' ? 'App Store' : 'Google Play');
const accountName = (platform: Platform) => (platform === 'ios' ? 'Apple ID' : 'Google account');
const accountWhere = (platform: Platform) => (platform === 'ios'
  ? 'Settings → your name → Media & Purchases'
  : 'the Play Store app → your profile picture');

/** What to show after a restore, or after the state changes on its own. */
export function entitlementMessage(status: EntitlementStatus, platform: Platform): { title: string; body: string } {
  switch (status) {
    case 'active':
      return { title: 'Gruntz Pro restored', body: 'Everything in Gruntz Pro is unlocked on this phone.' };
    case 'grace':
      return {
        title: 'Gruntz Pro restored',
        body: `The ${storeName(platform)} couldn’t take your last payment and is trying again. Pro stays on for now; update your payment method to keep it.`,
      };
    case 'billing-retry':
      return {
        title: 'Payment didn’t go through',
        body: `Your subscription is on hold because the ${storeName(platform)} couldn’t take the last payment. Update your payment method and Gruntz Pro turns back on by itself.`,
      };
    case 'expired':
      return {
        title: 'Your subscription has ended',
        body: 'Gruntz Pro on this account has ended, was cancelled or was refunded. You can subscribe again anytime. Your training stays on this phone.',
      };
    case 'moved':
      return {
        title: 'Gruntz Pro is on another device',
        body: 'Your subscription is now active on another device. Restore here to move it back. Your training on this phone is not affected.',
      };
    case 'none':
    default:
      return {
        title: 'No purchases found',
        body: `There’s no Gruntz Pro purchase on the ${accountName(platform)} this phone is using. Check that you’re signed into the same ${accountName(platform)} you used to subscribe (${accountWhere(platform)}), then try again.`,
      };
  }
}
