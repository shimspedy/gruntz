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
 * Returns the live price from RevenueCat when available, falling back to
 * the hardcoded default. Accepts any valid price string — never blocks
 * purchases because the live price differs from the fallback.
 */
export function getDisplayedMonthlyPrice(offering?: RevenueCatPriceCandidate | null) {
  const livePrice = offering?.priceString?.trim();
  if (!livePrice) {
    return GRUNTZ_MONTHLY_PRICE_FALLBACK;
  }

  // Use the live price from RevenueCat, appending "/month" when not present
  return livePrice.includes('/') ? livePrice : `${livePrice}/month`;
}

/**
 * Development builds (simulator, dev client) run fully unlocked: every screen is reachable
 * without a purchase, and onboarding skips the paywall. Release builds are unaffected.
 */
export const DEV_UNLOCK = __DEV__;
