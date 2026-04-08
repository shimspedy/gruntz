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

export function getDisplayedMonthlyPrice(offering?: RevenueCatPriceCandidate | null) {
  const livePrice = offering?.priceString?.trim();
  if (!livePrice) {
    return GRUNTZ_MONTHLY_PRICE_FALLBACK;
  }

  if (livePrice.includes('4.99')) {
    return livePrice.includes('/month') ? livePrice : `${livePrice}/month`;
  }

  return GRUNTZ_MONTHLY_PRICE_FALLBACK;
}

export function hasRevenueCatPricingMismatch(offering?: RevenueCatPriceCandidate | null) {
  if (!offering?.priceString) {
    return false;
  }

  const expectedProduct = !offering.productIdentifier || offering.productIdentifier === GRUNTZ_MONTHLY_PRODUCT_ID;
  const expectedPrice = offering.priceString.includes('4.99');

  return !(expectedProduct && expectedPrice);
}
