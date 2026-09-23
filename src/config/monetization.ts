export const GRUNTZ_TRIAL_DAYS = 15;
export const GRUNTZ_MONTHLY_PRICE_FALLBACK = '$4.99/month';
export const GRUNTZ_PRO_LABEL = 'Gruntz Pro';
export const GRUNTZ_MONTHLY_PRODUCT_ID = 'monthly';

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'pro';

export const REVENUECAT_OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || 'default';

export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || '';

/**
 * Android is not a shipping platform for Gruntz today, so this is intentionally
 * unset and `isRevenueCatAvailable()` returns false there — the paywall shows its
 * "purchases unavailable" state rather than a dead Continue button. If Android
 * ever ships, this key MUST be set in `.env` or nobody on Android can subscribe.
 */
export const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || '';

type RevenueCatPriceCandidate = {
  productIdentifier?: string | null;
  priceString?: string | null;
};

/**
 * The live price from RevenueCat, or `null` when none has loaded.
 *
 * It used to fall back to a hardcoded "$4.99/month", which is wrong in every
 * non-US storefront and goes stale the moment the price changes in App Store
 * Connect — and it was rendered in the plan card as though it were real, while
 * the legal block on the same screen correctly refused to quote it. Nobody was
 * ever charged it (the CTA is disabled until an offering loads), so the honest
 * thing is to show no number rather than a wrong one. Callers render a loading
 * state for `null`.
 */
export function getDisplayedMonthlyPrice(offering?: RevenueCatPriceCandidate | null): string | null {
  const livePrice = offering?.priceString?.trim();
  if (!livePrice) {
    return null;
  }

  // Use the live price from RevenueCat, appending "/month" when not present
  return livePrice.includes('/') ? livePrice : `${livePrice}/month`;
}

/**
 * Development builds (simulator, dev client) run fully unlocked: every screen is reachable
 * without a purchase, and onboarding skips the paywall. Release builds are unaffected.
 */
export const DEV_UNLOCK = __DEV__;
