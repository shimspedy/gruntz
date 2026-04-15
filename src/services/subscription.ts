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
export type RestoreStatus = 'restored' | 'unavailable' | 'error';

export interface OfferingSnapshot {
  offeringIdentifier: string;
  serverDescription: string;
  packageIdentifier: string;
  productIdentifier: string;
  title: string;
  description: string;
  priceString: string;
  introPriceString: string | null;
}

let purchasesModulePromise: Promise<typeof import('react-native-purchases')> | null = null;
let purchasesUiModulePromise: Promise<typeof import('react-native-purchases-ui')> | null = null;
let didConfigurePurchases = false;
let cachedPackage: PurchasesPackage | null = null;
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

function choosePackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) {
    return null;
  }
  return (
    offering.monthly ??
    offering.availablePackages[0] ??
    null
  );
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

function snapshotFromOffering(offering: PurchasesOffering | null, pkg: PurchasesPackage | null): OfferingSnapshot | null {
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
  };
}

export async function loadRevenueCatState(options?: {
  includeOfferings?: boolean;
}): Promise<{
  currentOffering: OfferingSnapshot | null;
  customerInfo: CustomerInfo | null;
  configured: boolean;
}> {
  const includeOfferings = options?.includeOfferings ?? true;
  const configured = await configureRevenueCat();
  if (!configured) {
    if (includeOfferings) {
      cachedPackage = null;
      cachedOffering = null;
    }
    return { currentOffering: null, customerInfo: null, configured: false };
  }

  const purchasesModule = await getPurchasesModule();
  if (!purchasesModule) {
    if (includeOfferings) {
      cachedPackage = null;
      cachedOffering = null;
    }
    return { currentOffering: null, customerInfo: null, configured: false };
  }

  const customerInfoPromise = purchasesModule.default.getCustomerInfo();

  if (!includeOfferings) {
    return {
      currentOffering: snapshotFromOffering(cachedOffering, cachedPackage),
      customerInfo: await customerInfoPromise,
      configured: true,
    };
  }

  const [offerings, customerInfo] = await Promise.all([
    purchasesModule.default.getOfferings(),
    customerInfoPromise,
  ]);

  const currentOffering = chooseOffering(offerings);
  cachedOffering = currentOffering;
  cachedPackage = choosePackage(currentOffering);

  return {
    currentOffering: snapshotFromOffering(currentOffering, cachedPackage),
    customerInfo,
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
