const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const config = {
  GRUNTZ_TRIAL_DAYS: 15, DEV_UNLOCK: false,
  REVENUECAT_IOS_API_KEY: 'public-test-key', REVENUECAT_ANDROID_API_KEY: '',
  REVENUECAT_ENTITLEMENT_ID: 'pro', REVENUECAT_OFFERING_ID: 'default',
};
function load(file, mocks, extra = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, __DEV__: false, console,
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      throw new Error(`Unexpected dependency: ${id}`);
    },
    ...extra,
  }, { filename });
  return module.exports;
}
function customer(active = false) {
  const entitlement = { isActive: active, expirationDate: '2030-01-01T00:00:00.000Z', productIdentifier: 'monthly' };
  return { entitlements: { active: active ? { pro: entitlement } : {}, all: { pro: entitlement } }, managementURL: null };
}
function pkg(type, price) {
  return { identifier: `custom_${type}`, packageType: type, product: {
    identifier: type.toLowerCase(), title: 'Gruntz Pro', description: 'Training',
    price, priceString: `$${price.toFixed(2)}`, pricePerMonthString: type === 'ANNUAL' ? '$3.33' : '$4.99',
    introPrice: null,
  } };
}
function offering(packages = [pkg('MONTHLY', 4.99), pkg('ANNUAL', 39.99)]) {
  return { all: { default: { identifier: 'default', serverDescription: 'Pro', monthly: null, annual: null, availablePackages: packages } }, current: null };
}
function service(overrides = {}, uiOverrides = {}) {
  const calls = { configure: 0, opened: [] };
  const sdk = {
    setLogLevel: async () => {}, configure: () => { calls.configure += 1; },
    addCustomerInfoUpdateListener: () => {},
    getCustomerInfo: async () => customer(true), getOfferings: async () => offering(),
    purchasePackage: async () => ({ customerInfo: customer(true) }),
    restorePurchases: async () => customer(true), ...overrides,
  };
  const api = load('src/services/subscription.ts', {
    'react-native': { Platform: { OS: 'ios' }, Linking: { canOpenURL: async () => true, openURL: async (url) => { calls.opened.push(url); } } },
    '../config/monetization': config,
    'react-native-purchases': { __esModule: true, default: sdk, LOG_LEVEL: { DEBUG: 'debug', WARN: 'warn' }, PURCHASES_ERROR_CODE: { PAYMENT_PENDING_ERROR: '20' } },
    'react-native-purchases-ui': { __esModule: true, default: { presentCustomerCenter: async () => {}, ...uiOverrides } },
  });
  return { api, calls, sdk };
}
function store(overrides = {}) {
  let persistence;
  const serviceApi = {
    addRevenueCatCustomerInfoListener: async () => true,
    getEntitlementAccess: (info) => info?.entitlements.active.pro ?? info?.entitlements.all.pro ?? null,
    isRevenueCatAvailable: () => true,
    loadRevenueCatState: async () => ({ currentOffering: null, customerInfo: customer(true), customerInfoKnown: true, configured: true }),
    openManagementUrl: async () => true,
    purchaseCurrentRevenueCatPackage: async () => ({ status: 'purchased', customerInfo: customer(true) }),
    purchaseAnnualRevenueCatPackage: async () => ({ status: 'purchased', customerInfo: customer(true) }),
    restoreRevenueCatPurchases: async () => ({ status: 'none', customerInfo: customer(false) }),
    presentRevenueCatCustomerCenter: async () => ({ status: 'error', customerInfo: null }),
    ...overrides,
  };
  const keychain = overrides.keychain ?? new Map();
  const exports = load('src/store/useSubscriptionStore.ts', {
    '@react-native-async-storage/async-storage': {},
    'expo-secure-store': { getItemAsync: async (key) => keychain.get(key) ?? null, setItemAsync: async (key, value) => { keychain.set(key, value); } },
    zustand: require('zustand'),
    'zustand/middleware': { createJSONStorage: () => ({}), persist: (initializer, options) => { persistence = options; return initializer; } },
    '../config/monetization': config,
    '../services/subscription': serviceApi,
    '../services/notifications': { cancelTrialEndingReminder: async () => {}, scheduleTrialEndingReminder: async () => {} },
    './useUserStore': { useUserStore: { getState: () => ({ isOnboarded: true }) } },
  });
  return { ...exports, persistence, serviceApi, keychain, state: () => exports.useSubscriptionStore.getState() };
}

test('RevenueCat config runs once when startup and paywall initialize concurrently', async () => {
  const { api, calls } = service();
  const result = await Promise.all([api.configureRevenueCat(), api.configureRevenueCat(), api.loadRevenueCatState()]);
  assert.equal(result[0], true);
  assert.equal(result[1], true);
  assert.equal(calls.configure, 1);
});

test('failed SDK configuration returns unavailable and can retry', async () => {
  let attempts = 0;
  const { api } = service({ configure() { if (++attempts === 1) throw new Error('native unavailable'); } });
  assert.equal(await api.configureRevenueCat(), false);
  assert.equal(await api.configureRevenueCat(), true);
});

test('offerings failure retains independently loaded subscriber entitlement and exposes retryable error', async () => {
  const { api } = service({ getOfferings: async () => { throw new Error('offline'); } });
  const result = await api.loadRevenueCatState();
  assert.equal(result.customerInfoKnown, true);
  assert.equal(result.customerInfo.entitlements.active.pro.isActive, true);
  assert.equal(result.currentOffering, null);
  assert.match(result.offeringsError, /try again/i);
});

test('customer-info failure is unknown, not a known non-subscriber', async () => {
  const { api } = service({ getCustomerInfo: async () => { throw new Error('offline'); } });
  const result = await api.loadRevenueCatState();
  assert.equal(result.customerInfoKnown, false);
  assert.equal(result.currentOffering.priceString, '$4.99');
});

test('annual-only and custom annual packages remain available without inventing a monthly price', async () => {
  const { api } = service({ getOfferings: async () => offering([pkg('ANNUAL', 39.99)]) });
  const result = await api.loadRevenueCatState();
  assert.equal(result.currentOffering.priceString, null);
  assert.equal(result.currentOffering.annual.priceString, '$39.99');
  assert.equal(result.currentOffering.annual.percentSavings, null);
  assert.equal((await api.purchaseAnnualRevenueCatPackage()).status, 'purchased');
  assert.equal((await api.purchaseCurrentRevenueCatPackage()).status, 'unavailable');
});

test('monthly and annual savings use their actual prices and annual intro terms are disclosed', async () => {
  const annual = pkg('ANNUAL', 39.99);
  annual.product.introPrice = { priceString: '$0.00', periodUnit: 'WEEK', periodNumberOfUnits: 1, cycles: 1 };
  const { api } = service({ getOfferings: async () => offering([pkg('MONTHLY', 4.99), annual]) });
  const result = await api.loadRevenueCatState();
  assert.equal(result.currentOffering.annual.percentSavings, 33);
  assert.match(result.currentOffering.annual.introDisclosure, /\$0.00 per 1 week/);
  assert.match(result.currentOffering.annual.introDisclosure, /Eligible accounts/);
});

test('empty offerings expose a recoverable unavailable state', async () => {
  const { api } = service({ getOfferings: async () => offering([]) });
  const result = await api.loadRevenueCatState();
  assert.equal(result.currentOffering, null);
  assert.match(result.offeringsError, /No subscription plans/);
});

test('completed transaction without Pro entitlement is pending, not success', async () => {
  const { api } = service({ purchasePackage: async () => ({ customerInfo: customer(false) }) });
  assert.equal((await api.purchaseCurrentRevenueCatPackage()).status, 'pending');
});

test('store payment approval pending is surfaced separately from cancellation and errors', async () => {
  const { api, sdk } = service({ purchasePackage: async () => { throw { code: '20' }; } });
  assert.equal((await api.purchaseAnnualRevenueCatPackage()).status, 'pending');
  sdk.purchasePackage = async () => { throw { userCancelled: true }; };
  assert.equal((await api.purchaseCurrentRevenueCatPackage()).status, 'cancelled');
});

test('restore reports none unless the configured entitlement is actually active', async () => {
  const { api } = service({ restorePurchases: async () => customer(false) });
  assert.equal((await api.restoreRevenueCatPurchases()).status, 'none');
});

test('Customer Center closing offline is still a successful presentation', async () => {
  const { api } = service({ getCustomerInfo: async () => { throw new Error('offline'); } });
  assert.equal((await api.presentRevenueCatCustomerCenter()).status, 'presented');
});

test('subscription management can open before a RevenueCat management URL is available', async () => {
  const { api, calls } = service();
  assert.equal(await api.openManagementUrl(null), true);
  assert.equal(calls.opened[0], 'https://apps.apple.com/account/subscriptions');
});

test('trial initialization queries customer info to find existing subscribers', async () => {
  let calls = 0;
  const s = store({ loadRevenueCatState: async () => { calls += 1; return { customerInfo: customer(true), customerInfoKnown: true, configured: true }; } });
  s.state().startTrialIfNeeded();
  await s.state().initialize();
  assert.equal(calls, 1);
  assert.equal(s.state().entitlementActive, true);
});

test('unknown entitlement results never revoke previously verified access', async () => {
  const s = store({ loadRevenueCatState: async () => ({ customerInfo: null, customerInfoKnown: false, configured: true }) });
  s.useSubscriptionStore.setState({ entitlementActive: true });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, true);
});

test('known inactive entitlement revokes access while a purchase in pending state is not announced as purchased', async () => {
  const s = store({ purchaseCurrentRevenueCatPackage: async () => ({ status: 'pending', customerInfo: customer(false) }) });
  s.useSubscriptionStore.setState({ entitlementActive: true });
  assert.equal(await s.state().purchaseMonthly(), 'pending');
  assert.equal(s.state().entitlementActive, false);
  assert.equal(s.state().isLoading, false);
});

test('offering errors propagate to the store for visible retry', async () => {
  const s = store({ loadRevenueCatState: async () => ({ customerInfo: customer(true), customerInfoKnown: true, configured: true, currentOffering: null, offeringsError: 'Retry pricing' }) });
  await s.state().loadOffering();
  assert.equal(s.state().lastError, 'Retry pricing');
  assert.equal(s.state().entitlementActive, true);
});

test('persisted store never revives stale pricing or native configured flags', () => {
  const s = store();
  const merged = s.persistence.merge({ trialStartedAt: 'bad', entitlementActive: true, currentOffering: { priceString: '$1' }, isConfigured: true }, s.state());
  assert.equal(merged.currentOffering, null);
  assert.equal(merged.isConfigured, false);
  assert.equal(merged.trialStartedAt, null);
  assert.equal(merged.entitlementActive, true);
  assert.equal(Object.hasOwn(s.persistence.partialize(s.state()), 'currentOffering'), false);
});

test('malformed trial date does not crash gating and cloud reconciliation cannot extend a trial', () => {
  const s = store();
  assert.equal(s.getTrialEndsAt('garbage'), null);
  assert.equal(s.getTrialDaysRemaining('garbage'), 0);
  s.state().adoptTrialStart('2026-01-10T00:00:00.000Z');
  s.state().adoptTrialStart('2026-02-10T00:00:00.000Z');
  assert.equal(s.state().trialStartedAt, '2026-01-10T00:00:00.000Z');
  s.state().adoptTrialStart('2026-01-01T00:00:00.000Z');
  assert.equal(s.state().trialStartedAt, '2026-01-01T00:00:00.000Z');
});

test('successful management fallback is reported as presented, avoiding duplicate opening', async () => {
  let calls = 0;
  const s = store({ openManagementUrl: async () => { calls += 1; return true; } });
  assert.equal(await s.state().openCustomerCenter(), 'presented');
  assert.equal(calls, 1);
  assert.equal(s.state().isLoading, false);
});

test('unexpected management failure resets loading and returns an error', async () => {
  const s = store({ presentRevenueCatCustomerCenter: async () => { throw new Error('native import failed'); } });
  assert.equal(await s.state().openCustomerCenter(), 'error');
  assert.equal(s.state().isLoading, false);
});

test('development billing bypass is explicit and cannot be enabled in release', () => {
  const read = (dev, flag) => load('src/config/monetization.ts', {}, { __DEV__: dev, process: { env: { EXPO_PUBLIC_DEV_UNLOCK: flag } } });
  assert.equal(read(true, undefined).DEV_UNLOCK, false);
  assert.equal(read(true, 'true').DEV_UNLOCK, true);
  assert.equal(read(false, 'true').DEV_UNLOCK, false);
});

test('reinstalling does not restart the trial: the Keychain copy of the start date wins', async () => {
  const firstInstall = '2026-01-01T00:00:00.000Z';
  const keychain = new Map([['gruntz_trial_started_at', firstInstall]]);
  const fresh = store({ keychain });
  fresh.state().startTrialIfNeeded();
  fresh.persistence.onRehydrateStorage()(undefined, undefined);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(fresh.state().trialStartedAt, firstInstall);
  assert.equal(keychain.get('gruntz_trial_started_at'), firstInstall);
  assert.equal(fresh.hasTrainingAccess(fresh.state()), false);

  const firstEver = store();
  firstEver.state().startTrialIfNeeded();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(firstEver.keychain.get('gruntz_trial_started_at'), firstEver.state().trialStartedAt);
});
