import { Linking, Platform } from 'react-native';
import {
  REVENUECAT_ANDROID_API_KEY,
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_IOS_API_KEY,
  REVENUECAT_OFFERING_ID,
} from '../config/monetization';
import type {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfoUpdateListener,
} from 'react-native-purchases';

export type PurchaseStatus = 'purchased' | 'cancelled' | 'unavailable' | 'error';
export type RestoreStatus = 'restored' | 'none' | 'unavailable' | 'error';

export interface OfferingSnapshot {
  offeringIdentifier: string;
  serverDescription: string;
  packageIdentifier: string;
  productIdentifier: string;
  title: string;
  description: string;
  priceString: string;
  introPriceString: string | null;
  /**
   * Optional yearly package metadata. Present when the active offering in
   * RevenueCat exposes both a monthly and an annual package. The paywall uses
   * this to render an annual selector with auto-computed savings.
   */
  annual?: {
    packageIdentifier: string;
    productIdentifier: string;
    priceString: string;
    /** Per-month price derived from the annual product, e.g. "$2.49/month". */
    pricePerMonthString: string | null;
    /** Whole-number percent savings vs. monthly, or null if not derivable. */
    percentSavings: number | null;
  } | null;
}

let purchasesModulePromise: Promise<typeof import('react-native-purchases')> | null = null;
let purchasesUiModulePromise: Promise<typeof import('react-native-purchases-ui')> | null = null;
let didConfigurePurchases = false;
let cachedPackage: PurchasesPackage | null = null;
let cachedAnnualPackage: PurchasesPackage | null = null;
let cachedOffering: PurchasesOffering | null = null;
let customerInfoListener: CustomerInfoUpdateListener | null = null;
let didAttachCustomerInfoListener = false;

function getRevenueCatApiKey() {
  if (Platform.OS === 'ios') {
    return REVENUECAT_IOS_API_KEY;
  }
  if (Platform.OS === 'android') {
    return REVENUECAT_ANDROID_API_KEY;
  }
  return '';
}

/**
 * The monthly package, and only the monthly package.
 *
 * This used to fall back to `availablePackages[0]`, which on an offering with no
 * monthly product was the ANNUAL one — and everything downstream then treated it
 * as monthly: the card showed the yearly price with "/month" appended, the binding
 * disclosure read "auto-renewing monthly subscription at $39.99", and
 * `buildAnnualSnapshot` compared the annual price against itself and rendered
 * "Save 92%". Someone tapping Monthly would have been charged a year up front at a
 * price labelled per-month. Returning null instead means the monthly card simply
 * does not offer a price, which is the truthful outcome.
 */
function choosePackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) {
    return null;
  }
  // `offering.monthly` is only populated for the predefined `$rc_monthly`
  // identifier, so an offering that uses a custom identifier for its monthly
  // product leaves it null while the package sits in `availablePackages` with
  // `packageType: MONTHLY`. Falling back on the type covers that, and still refuses
  // to hand back the annual package — which is what `availablePackages[0]` used to
  // do, charging a year up front under a "/month" label at "Save 92%".
  const monthly = offering.monthly
    ?? offering.availablePackages.find((pkg) => pkg.packageType === 'MONTHLY')
    ?? null;
  if (!monthly && __DEV__) {
    console.warn('[subscription] offering has no monthly package; the monthly card will show no price');
  }
  return monthly;
}

function chooseAnnualPackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) {
    return null;
  }
  return offering.annual ?? null;
}

function buildAnnualSnapshot(
  monthlyPkg: PurchasesPackage | null,
  annualPkg: PurchasesPackage | null,
): OfferingSnapshot['annual'] {
  if (!annualPkg) return null;
  const annualPrice = annualPkg.product.price;
  const monthlyPrice = monthlyPkg?.product.price ?? null;
  const pricePerMonthString = annualPkg.product.pricePerMonthString
    ? `${annualPkg.product.pricePerMonthString}/month`
    : null;
  let percentSavings: number | null = null;

  if (Number.isFinite(annualPrice) && monthlyPrice !== null && monthlyPrice > 0) {
    const fullYearAtMonthly = monthlyPrice * 12;
    const saved = 1 - annualPrice / fullYearAtMonthly;
    if (saved > 0) {
      percentSavings = Math.round(saved * 100);
    }
  }

  return {
    packageIdentifier: annualPkg.identifier,
    productIdentifier: annualPkg.product.identifier,
    priceString: annualPkg.product.priceString,
    pricePerMonthString,
    percentSavings,
  };
}

function chooseOffering(offerings: PurchasesOfferings): PurchasesOffering | null {
  return offerings.all[REVENUECAT_OFFERING_ID] ?? offerings.current ?? null;
}

async function getPurchasesModule() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  if (!purchasesModulePromise) {
    purchasesModulePromise = import('react-native-purchases');
  }
  return purchasesModulePromise;
}

async function getPurchasesUiModule() {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  if (!purchasesUiModulePromise) {
    purchasesUiModulePromise = import('react-native-purchases-ui');
  }
  return purchasesUiModulePromise;
}

export function isRevenueCatAvailable() {
  return Boolean(getRevenueCatApiKey());
}

export async function configureRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    return false;
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    return false;
  }

  if (didConfigurePurchases) {
    return true;
  }

  try {
    await purchasesModule.default.setLogLevel(
      __DEV__ ? purchasesModule.LOG_LEVEL.DEBUG : purchasesModule.LOG_LEVEL.WARN
    );
    purchasesModule.default.configure({ apiKey });
    didConfigurePurchases = true;
    return true;
  } catch {
    didConfigurePurchases = false;
    cachedPackage = null;
    cachedAnnualPackage = null;
    cachedOffering = null;
    return false;
  }
}

export async function addRevenueCatCustomerInfoListener(
  onCustomerInfoUpdated: (customerInfo: CustomerInfo) => void
) {
  const configured = await configureRevenueCat();
  if (!configured) {
    return false;
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    return false;
  }

  if (didAttachCustomerInfoListener && customerInfoListener) {
    return true;
  }

  customerInfoListener = (customerInfo) => {
    onCustomerInfoUpdated(customerInfo);
  };
  purchasesModule.default.addCustomerInfoUpdateListener(customerInfoListener);
  didAttachCustomerInfoListener = true;
  return true;
}

export function getEntitlementAccess(customerInfo: CustomerInfo | null) {
  if (!customerInfo) {
    return null;
  }

  return (
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ??
    customerInfo.entitlements.all[REVENUECAT_ENTITLEMENT_ID] ??
    null
  );
}

function snapshotFromOffering(
  offering: PurchasesOffering | null,
  pkg: PurchasesPackage | null,
  annualPkg: PurchasesPackage | null = null,
): OfferingSnapshot | null {
  if (!offering || !pkg) {
    return null;
  }

  return {
    offeringIdentifier: offering.identifier,
    serverDescription: offering.serverDescription,
    packageIdentifier: pkg.identifier,
    productIdentifier: pkg.product.identifier,
    title: pkg.product.title,
    description: pkg.product.description,
    priceString: pkg.product.priceString,
    introPriceString: pkg.product.introPrice?.priceString ?? null,
    annual: buildAnnualSnapshot(pkg, annualPkg),
  };
}

export async function loadRevenueCatState(options?: {
  includeOfferings?: boolean;
}): Promise<{
  currentOffering: OfferingSnapshot | null;
  customerInfo: CustomerInfo | null;
  /**
   * Whether the entitlement state is actually KNOWN — i.e. `getCustomerInfo`
   * returned. A null `customerInfo` with this false means "we could not ask", not
   * "no subscription", and callers must not downgrade the user on it. Previously
   * one failed `getOfferings` nulled the customer info too and silently locked a
   * paying subscriber out until a later successful fetch, persisted across restarts.
   */
  customerInfoKnown: boolean;
  configured: boolean;
}> {
  const includeOfferings = options?.includeOfferings ?? true;
  const configured = await configureRevenueCat();
  if (!configured) {
    if (includeOfferings) {
      cachedPackage = null;
      cachedAnnualPackage = null;
      cachedOffering = null;
    }
    return { currentOffering: null, customerInfo: null, customerInfoKnown: false, configured: false };
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    if (includeOfferings) {
      cachedPackage = null;
      cachedAnnualPackage = null;
      cachedOffering = null;
    }
    return { currentOffering: null, customerInfo: null, customerInfoKnown: false, configured: false };
  }

  const customerInfoPromise = purchasesModule.default.getCustomerInfo();

  if (!includeOfferings) {
    try {
      return {
        currentOffering: snapshotFromOffering(cachedOffering, cachedPackage, cachedAnnualPackage),
        customerInfo: await customerInfoPromise,
        customerInfoKnown: true,
        configured: true,
      };
    } catch (err) {
      if (__DEV__) console.warn('[subscription] getCustomerInfo failed', err);
      return { currentOffering: snapshotFromOffering(cachedOffering, cachedPackage, cachedAnnualPackage), customerInfo: null, customerInfoKnown: false, configured: true };
    }
  }

  // Settled independently: the offerings and the customer info are separate calls,
  // and one failing says nothing about the other. Awaiting them with Promise.all
  // meant a flaky `getOfferings` discarded a perfectly good entitlement.
  const [offeringsResult, customerInfoResult] = await Promise.allSettled([
    purchasesModule.default.getOfferings(),
    customerInfoPromise,
  ]);

  if (offeringsResult.status === 'fulfilled') {
    const currentOffering = chooseOffering(offeringsResult.value);
    cachedOffering = currentOffering;
    cachedPackage = choosePackage(currentOffering);
    cachedAnnualPackage = chooseAnnualPackage(currentOffering);
  } else if (__DEV__) {
    console.warn('[subscription] getOfferings failed', offeringsResult.reason);
  }

  if (customerInfoResult.status === 'rejected' && __DEV__) {
    console.warn('[subscription] getCustomerInfo failed', customerInfoResult.reason);
  }

  return {
    currentOffering: offeringsResult.status === 'fulfilled'
      ? snapshotFromOffering(cachedOffering, cachedPackage, cachedAnnualPackage)
      : null,
    customerInfo: customerInfoResult.status === 'fulfilled' ? customerInfoResult.value : null,
    customerInfoKnown: customerInfoResult.status === 'fulfilled',
    configured: true,
  };
}

export async function purchaseCurrentRevenueCatPackage(): Promise<{
  status: PurchaseStatus;
  customerInfo: CustomerInfo | null;
  message?: string;
}> {
  const configured = await configureRevenueCat();
  if (!configured) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not configured yet.' };
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not available on this platform.' };
  }

  if (!cachedPackage) {
    const state = await loadRevenueCatState();
    if (!state.currentOffering || !cachedPackage) {
      return { status: 'unavailable', customerInfo: state.customerInfo, message: 'No subscription package is available yet.' };
    }
  }

  try {
    const result = await purchasesModule.default.purchasePackage(cachedPackage as PurchasesPackage);
    return { status: 'purchased', customerInfo: result.customerInfo };
  } catch (error) {
    const err = error as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) {
      return { status: 'cancelled', customerInfo: null };
    }
    return {
      status: 'error',
      customerInfo: null,
      message: err.message || 'Purchase failed. Try again in a moment.',
    };
  }
}

export async function purchaseAnnualRevenueCatPackage(): Promise<{
  status: PurchaseStatus;
  customerInfo: CustomerInfo | null;
  message?: string;
}> {
  const configured = await configureRevenueCat();
  if (!configured) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not configured yet.' };
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not available on this platform.' };
  }

  if (!cachedAnnualPackage) {
    await loadRevenueCatState();
    if (!cachedAnnualPackage) {
      return { status: 'unavailable', customerInfo: null, message: 'No annual subscription package is available yet.' };
    }
  }

  try {
    const result = await purchasesModule.default.purchasePackage(cachedAnnualPackage as PurchasesPackage);
    return { status: 'purchased', customerInfo: result.customerInfo };
  } catch (error) {
    const err = error as { userCancelled?: boolean; message?: string };
    if (err.userCancelled) {
      return { status: 'cancelled', customerInfo: null };
    }
    return {
      status: 'error',
      customerInfo: null,
      message: err.message || 'Purchase failed. Try again in a moment.',
    };
  }
}

export async function restoreRevenueCatPurchases(): Promise<{
  status: RestoreStatus;
  customerInfo: CustomerInfo | null;
  message?: string;
}> {
  const configured = await configureRevenueCat();
  if (!configured) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not configured yet.' };
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not available on this platform.' };
  }

  try {
    const customerInfo = await purchasesModule.default.restorePurchases();
    // Restoring "successfully" with nothing to restore left paying users locked out with a
    // success message, so only report 'restored' when an entitlement really came back.
    if (!getEntitlementAccess(customerInfo)?.isActive) {
      return { status: 'none', customerInfo, message: 'No active subscription was found for this account.' };
    }
    return { status: 'restored', customerInfo };
  } catch (error) {
    const err = error as { message?: string };
    return {
      status: 'error',
      customerInfo: null,
      message: err.message || 'Restore failed. Try again in a moment.',
    };
  }
}

export async function presentRevenueCatCustomerCenter(): Promise<{
  status: 'presented' | 'unavailable' | 'error';
  customerInfo: CustomerInfo | null;
  message?: string;
}> {
  const configured = await configureRevenueCat();
  if (!configured) {
    return { status: 'unavailable', customerInfo: null, message: 'Billing is not configured yet.' };
  }

  const [purchasesModule, purchasesUiModule] = await Promise.all([
    getPurchasesModule(),
    getPurchasesUiModule(),
  ]);
  if (!purchasesModule || !purchasesUiModule) {
    return { status: 'unavailable', customerInfo: null, message: 'Customer Center is not available on this platform.' };
  }

  try {
    await purchasesUiModule.default.presentCustomerCenter();
    const customerInfo = await purchasesModule.default.getCustomerInfo();
    return { status: 'presented', customerInfo };
  } catch (error) {
    const err = error as { message?: string };
    return {
      status: 'error',
      customerInfo: null,
      message: err.message || 'Unable to open Customer Center right now.',
    };
  }
}

export async function openManagementUrl(url: string | null) {
  if (!url) {
    return false;
  }
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
