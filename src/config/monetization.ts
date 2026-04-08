export const GRUNTZ_TRIAL_DAYS = 15;
export const GRUNTZ_MONTHLY_PRICE_FALLBACK = '$4.99/month';
export const GRUNTZ_PRO_LABEL = 'Gruntz Pro';

export const REVENUECAT_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || 'pro';

export const REVENUECAT_OFFERING_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID?.trim() || 'default';

export const REVENUECAT_IOS_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || '';

export const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || '';
