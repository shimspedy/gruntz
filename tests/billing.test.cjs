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
    'react-native': { AppState: { addEventListener: () => ({ remove() {} }) } },
    '../services/entitlementStatus': load('src/services/entitlementStatus.ts', {}),
    '../services/crashReporting': { logBreadcrumb() {} },
  });
  return { ...exports, persistence, serviceApi, keychain, state: () => exports.useSubscriptionStore.getState() };
}

test('a stale startup response cannot revoke a more recent successful purchase', async () => {
  let completeStartup;
  const oldInfo = { ...customer(false), requestDate: new Date(Date.now() - 60e3).toISOString() };
  const newInfo = { ...customer(true), requestDate: new Date().toISOString() };
  const env = store({
    loadRevenueCatState: () => new Promise((resolve) => { completeStartup = resolve; }),
    purchaseCurrentRevenueCatPackage: async () => ({ status: 'purchased', customerInfo: newInfo }),
  });
  const startup = env.state().initialize();
  while (!completeStartup) await Promise.resolve();
  assert.equal(await env.state().purchaseMonthly(), 'purchased');
  assert.equal(env.state().entitlementActive, true);
  completeStartup({ customerInfo: oldInfo, customerInfoKnown: true, configured: true });
  await startup;
  assert.equal(env.state().entitlementActive, true);
});

test('equal-second and missing RevenueCat dates cannot let an older startup undo a newer purchase', async () => {
  for (const requestDate of [new Date(Math.floor(Date.now() / 1000) * 1000).toISOString(), undefined]) {
    let completeStartup;
    const env = store({
      loadRevenueCatState: () => new Promise((resolve) => { completeStartup = resolve; }),
      purchaseCurrentRevenueCatPackage: async () => ({ status: 'purchased', customerInfo: { ...customer(true), requestDate } }),
    });
    const startup = env.state().initialize();
    while (!completeStartup) await Promise.resolve();
    assert.equal(await env.state().purchaseMonthly(), 'purchased');
    completeStartup({ customerInfo: { ...customer(false), requestDate }, customerInfoKnown: true, configured: true });
    await startup;
    assert.equal(env.state().entitlementActive, true);
  }
});

test('a new purchase with the same requestDate as the previous snapshot still activates access', async () => {
  const requestDate = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString();
  const env = store({
    loadRevenueCatState: async () => ({ customerInfo: { ...customer(false), requestDate }, customerInfoKnown: true, configured: true }),
    purchaseCurrentRevenueCatPackage: async () => ({ status: 'purchased', customerInfo: { ...customer(true), requestDate } }),
  });
  await env.state().initialize();
  assert.equal(env.state().entitlementActive, false);
  assert.equal(await env.state().purchaseMonthly(), 'purchased');
  assert.equal(env.state().entitlementActive, true);
});

test('native millisecond precision keeps a genuinely newer inactive snapshot authoritative within one second', async () => {
  let completeStartup;
  const requestDate = '2026-10-27T10:00:00Z', second = Date.parse(requestDate);
  const env = store({
    loadRevenueCatState: () => new Promise((resolve) => { completeStartup = resolve; }),
    purchaseCurrentRevenueCatPackage: async () => ({ status: 'purchased', customerInfo: { ...customer(true), requestDate, requestDateMillis: second + 100 } }),
  });
  const startup = env.state().initialize();
  while (!completeStartup) await Promise.resolve();
  await env.state().purchaseMonthly();
  completeStartup({ customerInfo: { ...customer(false), requestDate, requestDateMillis: second + 900 }, customerInfoKnown: true, configured: true });
  await startup;
  assert.equal(env.state().entitlementActive, false);
});

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
  s.useSubscriptionStore.setState({ entitlementActive: true, entitlementVerifiedAt: new Date(Date.now() - 71 * 3600e3).toISOString() });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, true);
});

test('offline, a cached subscription lasts 72 hours from its last confirmation, then waits for the store', async () => {
  const s = store({ loadRevenueCatState: async () => ({ customerInfo: null, customerInfoKnown: false, configured: true }) });
  s.useSubscriptionStore.setState({ entitlementActive: true, entitlementStatus: 'active', entitlementVerifiedAt: new Date(Date.now() - 73 * 3600e3).toISOString() });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, false);
  assert.equal(s.state().entitlementStatus, 'active', 'the last known answer is kept; only the offline trust ran out');
  // The store answering again turns it straight back on.
  s.serviceApi.loadRevenueCatState = async () => ({ currentOffering: null, customerInfo: customer(true), customerInfoKnown: true, configured: true });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, true);
});

test('a subscription restored on another phone switches off here and raises one gentle notice', async () => {
  const gone = { entitlements: { active: {}, all: {} }, managementURL: null };
  const s = store({ loadRevenueCatState: async () => ({ currentOffering: null, customerInfo: gone, customerInfoKnown: true, configured: true }) });
  s.useSubscriptionStore.setState({ entitlementActive: true, entitlementStatus: 'active', entitlementVerifiedAt: new Date().toISOString() });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, false);
  assert.equal(s.state().entitlementStatus, 'moved');
  assert.equal(s.state().movedNotice, true);
  s.state().dismissMovedNotice();
  await s.state().initialize();
  assert.equal(s.state().entitlementStatus, 'moved', 'still moved on the next check');
  assert.equal(s.state().movedNotice, false, 'a dismissed notice does not come back');
  s.serviceApi.loadRevenueCatState = async () => ({ currentOffering: null, customerInfo: customer(true), customerInfoKnown: true, configured: true });
  await s.state().initialize();
  assert.equal(s.state().entitlementStatus, 'active');
});

test('a restore reports exactly what the store found', async () => {
  const lapsed = { entitlements: { active: {}, all: { pro: { isActive: false, billingIssueDetectedAt: '2026-10-01T00:00:00Z' } } }, managementURL: null };
  const s = store({ restoreRevenueCatPurchases: async () => ({ status: 'none', customerInfo: lapsed }) });
  assert.equal(await s.state().restoreAccess(), 'billing-retry');
  s.serviceApi.restoreRevenueCatPurchases = async () => ({ status: 'none', customerInfo: { entitlements: { active: {}, all: {} }, managementURL: null } });
  assert.equal(await s.state().restoreAccess(), 'none', 'nothing on this account is "no purchases", never "moved"');
  s.serviceApi.restoreRevenueCatPurchases = async () => ({ status: 'error', customerInfo: null });
  assert.equal(await s.state().restoreAccess(), 'error');
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

test('a future trial start is never adopted or honored, even on a device with no trial yet', () => {
  const s = store();
  const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(s.getTrialEndsAt(future), null);
  assert.equal(s.getTrialDaysRemaining(future), 0);
  assert.equal(s.state().trialStartedAt, null);
  s.state().adoptTrialStart(future);
  assert.equal(s.state().trialStartedAt, null);
  s.state().startTrialIfNeeded(future);
  assert.ok(Date.parse(s.state().trialStartedAt) <= Date.now());
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

test('every subscription state has its own message, and no purchases names the account to check', () => {
  const e = load('src/services/entitlementStatus.ts', {});
  assert.equal(e.classifyEntitlement({ isActive: true }, false), 'active');
  assert.equal(e.classifyEntitlement({ isActive: true, billingIssueDetectedAt: 'x' }, false), 'grace');
  assert.equal(e.classifyEntitlement({ isActive: false, billingIssueDetectedAt: 'x' }, false), 'billing-retry');
  assert.equal(e.classifyEntitlement({ isActive: false }, true), 'expired');
  assert.equal(e.classifyEntitlement(null, true), 'moved');
  assert.equal(e.classifyEntitlement(null, false), 'none');
  const titles = new Set(['active', 'grace', 'billing-retry', 'expired', 'moved', 'none'].map((s) => e.entitlementMessage(s, 'ios').body));
  assert.equal(titles.size, 6);
  assert.match(e.entitlementMessage('none', 'ios').body, /same Apple ID/);
  assert.match(e.entitlementMessage('none', 'android').body, /same Google account/);
  assert.match(e.entitlementMessage('expired', 'ios').body, /refunded/);
  const now = Date.parse('2026-10-31T12:00:00Z');
  assert.equal(e.cacheStillValid('2026-10-28T13:00:00Z', now), true);
  assert.equal(e.cacheStillValid('2026-10-28T11:00:00Z', now), false);
  assert.equal(e.cacheStillValid('2026-11-30T00:00:00Z', now), false, 'a clock set back cannot stretch the window');
  assert.equal(e.cacheStillValid(null, now), false);
});

test('an old answer from the store SDK cache does not restart the 72-hour offline window', async () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600e3).toISOString();
  const cached = { ...customer(true), requestDate: tenDaysAgo };
  const s = store({ loadRevenueCatState: async () => ({ currentOffering: null, customerInfo: cached, customerInfoKnown: true, configured: true }) });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, false, 'a ten-day-old cached answer does not unlock Pro');
  assert.equal(s.state().entitlementVerifiedAt, tenDaysAgo, 'verified time is the store’s, not the phone’s');
  const fresh = { ...customer(true), requestDate: new Date().toISOString() };
  s.serviceApi.loadRevenueCatState = async () => ({ currentOffering: null, customerInfo: fresh, customerInfoKnown: true, configured: true });
  await s.state().initialize();
  assert.equal(s.state().entitlementActive, true, 'a live answer unlocks it again');
});

test('setting the clock back cannot stretch offline Pro', () => {
  const e = load('src/services/entitlementStatus.ts', {});
  const seen = Date.parse('2026-11-20T00:00:00Z');
  // Verified Nov 1, phone already saw Nov 20, clock now wound back to Nov 2.
  assert.equal(e.cacheStillValid('2026-11-01T00:00:00Z', Date.parse('2026-11-02T00:00:00Z'), seen), false);
  // An honest clock inside the window still works.
  assert.equal(e.cacheStillValid('2026-11-19T12:00:00Z', seen + 3600e3, seen), true);
});
