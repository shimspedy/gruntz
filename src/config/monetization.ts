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
