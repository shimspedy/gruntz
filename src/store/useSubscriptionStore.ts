import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GRUNTZ_TRIAL_DAYS, DEV_UNLOCK } from '../config/monetization';
import {
  addRevenueCatCustomerInfoListener,
  getEntitlementAccess,
  isRevenueCatAvailable,
  loadRevenueCatState,
  openManagementUrl,
  purchaseAnnualRevenueCatPackage,
  purchaseCurrentRevenueCatPackage,
  type OfferingSnapshot,
  type PurchaseStatus,
  presentRevenueCatCustomerCenter,
  PURCHASE_ERROR_TEXT,
  restoreRevenueCatPurchases,
} from '../services/subscription';
import {
  cancelTrialEndingReminder,
  scheduleTrialEndingReminder,
} from '../services/notifications';
import { useUserStore } from './useUserStore';
import { cacheStillValid, classifyEntitlement, unlocks, type EntitlementStatus } from '../services/entitlementStatus';
import { logBreadcrumb } from '../services/crashReporting';

const ENTITLEMENT_STATUSES: readonly EntitlementStatus[] = ['active', 'grace', 'billing-retry', 'expired', 'moved', 'none'];
/** What a restore found: a subscription state, or why the store could not be asked. */
export type RestoreOutcome = EntitlementStatus | 'unavailable' | 'error';

const STORAGE_KEY = '@gruntz_subscription';

/**
 * The trial start, mirrored in the Keychain. App storage is wiped by an uninstall, so
 * deleting and reinstalling used to hand out a fresh trial every time; the Keychain
 * survives it. Only ever moves earlier, and a failure here never blocks the app.
 */
const TRIAL_PIN_KEY = 'gruntz_trial_started_at';
let trialPinQueue: Promise<unknown> = Promise.resolve();
const validInstant = (value: string | null | undefined): value is string => !!value && Number.isFinite(Date.parse(value));

function pinTrialStart(startedAt: string) {
  trialPinQueue = trialPinQueue.then(async () => {
    const pinned = await SecureStore.getItemAsync(TRIAL_PIN_KEY);
    if (validInstant(pinned) && Date.parse(pinned) <= Date.parse(startedAt)) return;
    await SecureStore.setItemAsync(TRIAL_PIN_KEY, startedAt);
  }).catch(() => undefined);
}

function reconcilePinnedTrialStart() {
  trialPinQueue = trialPinQueue.then(async () => {
    const pinned = await SecureStore.getItemAsync(TRIAL_PIN_KEY);
    const local = useSubscriptionStore.getState().trialStartedAt;
    if (validInstant(pinned)) useSubscriptionStore.getState().adoptTrialStart(pinned);
    else if (validInstant(local)) await SecureStore.setItemAsync(TRIAL_PIN_KEY, local);
  }).catch(() => undefined);
}
const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_CLOCK_SKEW_MS = 5 * 60 * 1000;
// A failed read must not replace the original trial or entitlement with defaults.
let subscriptionStorageWritable = false;
const subscriptionStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
  setItem: (key: string, value: string) => subscriptionStorageWritable ? AsyncStorage.setItem(key, value) : Promise.resolve(),
};

export type AccessState = 'trial' | 'subscriber' | 'locked';

interface SubscriptionState {
  trialStartedAt: string | null;
  entitlementActive: boolean;
  entitlementExpiresAt: string | null;
  entitlementProductIdentifier: string | null;
  managementUrl: string | null;
  currentOffering: OfferingSnapshot | null;
  isConfigured: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  hydrationFailed: boolean;
  lastError: string | null;
  /** The store's last confirmed answer; null before the first one on this install. */
  entitlementStatus: EntitlementStatus | null;
  /** When the store last confirmed it. Pro is only trusted offline for 72 hours after. */
  entitlementVerifiedAt: string | null;
  /** Pro moved to another phone and the athlete has not dealt with it yet. */
  movedNotice: boolean;
  dismissMovedNotice: () => void;

  startTrialIfNeeded: (startAt?: string) => void;
  adoptTrialStart: (startAt: string) => void;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  loadOffering: () => Promise<void>;
  purchaseMonthly: () => Promise<PurchaseStatus>;
  purchaseAnnual: () => Promise<PurchaseStatus>;
  restoreAccess: () => Promise<RestoreOutcome>;
  openCustomerCenter: () => Promise<'presented' | 'unavailable' | 'error'>;
  openSubscriptionManagement: () => Promise<void>;
  clearError: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function migratePersistedSubscriptionState(persistedState: unknown): Partial<SubscriptionState> {
  if (!isRecord(persistedState)) {
    return {};
  }

  return {
    trialStartedAt: typeof persistedState.trialStartedAt === 'string' && Number.isFinite(Date.parse(persistedState.trialStartedAt))
      ? persistedState.trialStartedAt : null,
    entitlementActive: persistedState.entitlementActive === true,
    entitlementExpiresAt:
      typeof persistedState.entitlementExpiresAt === 'string' ? persistedState.entitlementExpiresAt : null,
    entitlementProductIdentifier:
      typeof persistedState.entitlementProductIdentifier === 'string'
        ? persistedState.entitlementProductIdentifier
        : null,
    managementUrl: typeof persistedState.managementUrl === 'string' ? persistedState.managementUrl : null,
    entitlementStatus: ENTITLEMENT_STATUSES.includes(persistedState.entitlementStatus as EntitlementStatus)
      ? persistedState.entitlementStatus as EntitlementStatus : null,
    // Installs from before the offline limit start their 72 hours now, not in the past.
    entitlementVerifiedAt: typeof persistedState.entitlementVerifiedAt === 'string' && Number.isFinite(Date.parse(persistedState.entitlementVerifiedAt))
      ? persistedState.entitlementVerifiedAt
      : persistedState.entitlementActive === true ? new Date().toISOString() : null,
    movedNotice: persistedState.movedNotice === true,
    // Native package objects do not survive a restart. Pricing must be fetched
    // again before enabling a purchase, even when a previous screen was cached.
    currentOffering: null,
    isConfigured: false,
  };
}

export function getTrialEndsAt(trialStartedAt: string | null) {
  if (!trialStartedAt) {
    return null;
  }
  const started = Date.parse(trialStartedAt);
  // A trial cannot start in the future. Without this, a future date written to the
  // cloud backup row would be adopted on a fresh device and never run out.
  if (started > Date.now() + TRIAL_CLOCK_SKEW_MS) return null;
  const endsAt = started + GRUNTZ_TRIAL_DAYS * DAY_MS;
  if (!Number.isFinite(endsAt) || Math.abs(endsAt) > 8.64e15) return null;
  return new Date(endsAt).toISOString();
}

export function getTrialDaysRemaining(trialStartedAt: string | null) {
  if (!trialStartedAt) {
    return 0;
  }
  const endsAt = getTrialEndsAt(trialStartedAt);
  if (!endsAt) {
    return 0;
  }
  const remainingMs = new Date(endsAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.ceil(remainingMs / DAY_MS);
}

export function hasTrialAccess(trialStartedAt: string | null) {
  return getTrialDaysRemaining(trialStartedAt) > 0;
}

export function hasTrainingAccess(state: Pick<SubscriptionState, 'trialStartedAt' | 'entitlementActive'>) {
  return DEV_UNLOCK || state.entitlementActive || hasTrialAccess(state.trialStartedAt);
}

/** Whether Pro features (plans, programs, GPS tracking) are open: subscribed, or still inside the included trial. */
export function useTrainingAccess() {
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  return hasTrainingAccess({ trialStartedAt, entitlementActive });
}

export function getAccessState(state: Pick<SubscriptionState, 'trialStartedAt' | 'entitlementActive'>): AccessState {
  if (DEV_UNLOCK || state.entitlementActive) {
    return 'subscriber';
  }
  if (hasTrialAccess(state.trialStartedAt)) {
    return 'trial';
  }
  return 'locked';
}

/** Convert raw SDK error messages into clean, user-facing text. */
function userFacingError(raw: string | undefined | null, fallback: string): string {
  if (!raw) return fallback;
  if ((Object.values(PURCHASE_ERROR_TEXT) as string[]).includes(raw)) return raw;
  // Strip SDK noise — keep it simple for the user
  if (raw.includes('configuration') || raw.includes('products registered'))
    return 'Subscription is temporarily unavailable. Please try again later.';
  if (raw.includes('network') || raw.includes('NSURLError') || raw.includes('internet'))
    return 'Unable to reach the App Store. Check your connection and try again.';
  if (raw.includes('paywall') || raw.includes('not_presented'))
    return 'Subscription setup is in progress. Please try again shortly.';
  return fallback;
}

type PurchaseRunner = () => Promise<{
  status: PurchaseStatus;
  customerInfo: Awaited<ReturnType<typeof loadRevenueCatState>>['customerInfo'];
  message?: string;
}>;

// A startup fetch can finish after a purchase or SDK listener delivered newer info.
// Native requestDateMillis retains precision that requestDate's ISO string can omit.
// Operation order resolves equal/missing timestamps without blocking same-time purchases.
let latestCustomerInfoAt: number | null = null;
let entitlementOperation = 0;
let latestAppliedOperation = 0;

async function runPurchase(
  set: (partial: Partial<SubscriptionState>) => void,
  runner: PurchaseRunner,
): Promise<PurchaseStatus> {
  const operation = ++entitlementOperation;
  set({ isLoading: true, lastError: null });

  try {
    const result = await runner();

    if (result.customerInfo) {
      syncEntitlementState(set, result.customerInfo, true, operation);
    }

    const configured = isRevenueCatAvailable();

    if (result.status === 'error' || result.status === 'unavailable') {
      set({
        isLoading: false,
        isConfigured: configured,
        lastError: userFacingError(
          result.message,
          'Subscription is temporarily unavailable. Please try again later.',
        ),
      });
      return result.status === 'error' ? 'error' : 'unavailable';
    }

    set({ isLoading: false, isConfigured: configured, lastError: null });

    return result.status;
  } catch (error) {
    set({
      isLoading: false,
      isConfigured: isRevenueCatAvailable(),
      lastError: userFacingError(
        error instanceof Error ? error.message : null,
        'Something went wrong with your purchase. Please try again.',
      ),
    });
    return 'error';
  }
}

/**
 * Write the entitlement we just learned about.
 *
 * `known` must be false when the fetch failed. Treating "could not ask" as
 * "no subscription" downgraded paying users on any network hiccup — and because
 * the flag is persisted, it stuck across restarts until a later successful fetch.
 * The worst case was a refresh moments after a successful purchase clearing the
 * entitlement the user had just bought.
 */
function syncEntitlementState(
  set: (partial: Partial<SubscriptionState>) => void,
  customerInfo: Awaited<ReturnType<typeof loadRevenueCatState>>['customerInfo'],
  known: boolean,
  operation: number,
) {
  if (!known) return;
  const milliseconds = (customerInfo as { requestDateMillis?: unknown } | null)?.requestDateMillis;
  const requestedAt = typeof milliseconds === 'number' && Number.isFinite(milliseconds)
    ? milliseconds : Date.parse(customerInfo?.requestDate ?? '');
  if (Number.isFinite(requestedAt) && latestCustomerInfoAt !== null) {
    if (latestCustomerInfoAt !== null && requestedAt < latestCustomerInfoAt) return;
    if (requestedAt === latestCustomerInfoAt && operation < latestAppliedOperation) return;
  } else if (operation < latestAppliedOperation) return;
  if (Number.isFinite(requestedAt)) latestCustomerInfoAt = requestedAt;
  latestAppliedOperation = operation;
  const entitlement = getEntitlementAccess(customerInfo);
  const previous = useSubscriptionStore.getState();
  // 'moved' stays 'moved' until a subscription shows up here again.
  const hadAccessHere = previous.entitlementStatus
    ? unlocks(previous.entitlementStatus) || previous.entitlementStatus === 'moved'
    : previous.entitlementActive;
  const status = classifyEntitlement(entitlement, hadAccessHere);
  const active = unlocks(status);
  if (status !== previous.entitlementStatus) {
    logBreadcrumb('subscription', 'entitlement changed', { from: previous.entitlementStatus ?? 'unknown', to: status });
  }
  set({
    entitlementActive: active,
    entitlementStatus: status,
    entitlementVerifiedAt: new Date().toISOString(),
    entitlementExpiresAt: entitlement?.expirationDate ?? null,
    entitlementProductIdentifier: entitlement?.productIdentifier ?? null,
    managementUrl: customerInfo?.managementURL ?? null,
    // Raised once when Pro leaves for another phone; cleared when it comes back.
    movedNotice: status === 'moved' && (previous.entitlementStatus !== 'moved' || previous.movedNotice),
  });
  if (active) {
    void cancelTrialEndingReminder();
  }
}

/**
 * Offline, the last confirmed Pro is honoured for 72 hours, then switched off until the
 * store answers again. Never turns Pro on, and never touches the app's own trial.
 */
export function applyOfflineGrace(now = Date.now()) {
  const state = useSubscriptionStore.getState();
  if (!state.entitlementActive || cacheStillValid(state.entitlementVerifiedAt, now)) return;
  logBreadcrumb('subscription', 'offline grace ended', { verifiedAt: state.entitlementVerifiedAt });
  useSubscriptionStore.setState({ entitlementActive: false });
}

const FOREGROUND_RECHECK_MS = 30 * 1000;
let foregroundWatch = false;
let lastForegroundCheck = 0;

/** A subscription moved to another phone switches off here within the session. */
function watchForeground() {
  if (foregroundWatch) return;
  foregroundWatch = true;
  AppState.addEventListener('change', (next) => {
    if (next !== 'active') return;
    applyOfflineGrace();
    const now = Date.now();
    if (now - lastForegroundCheck < FOREGROUND_RECHECK_MS) return;
    lastForegroundCheck = now;
    void useSubscriptionStore.getState().refresh();
  });
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      trialStartedAt: null,
      entitlementActive: false,
      entitlementExpiresAt: null,
      entitlementProductIdentifier: null,
      managementUrl: null,
      currentOffering: null,
      isConfigured: false,
      isLoading: false,
      hasHydrated: false,
      hydrationFailed: false,
      lastError: null,
      entitlementStatus: null,
      entitlementVerifiedAt: null,
      movedNotice: false,
      dismissMovedNotice: () => set({ movedNotice: false }),

      startTrialIfNeeded: (startAt) => {
        if (get().trialStartedAt) {
          return;
        }
        const startedAt = startAt && getTrialEndsAt(startAt) ? startAt : new Date().toISOString();
        set({ trialStartedAt: startedAt });
        pinTrialStart(startedAt);
        const endsAt = getTrialEndsAt(startedAt);
        if (endsAt) {
          void scheduleTrialEndingReminder(endsAt);
        }
      },

      adoptTrialStart: (startAt) => {
        const endsAt = getTrialEndsAt(startAt);
        if (!endsAt) return;
        const current = get().trialStartedAt;
        if (current && Date.parse(current) <= Date.parse(startAt)) return;
        set({ trialStartedAt: startAt });
        pinTrialStart(startAt);
        if (!get().entitlementActive) void scheduleTrialEndingReminder(endsAt);
      },

      initialize: async () => {
        const operation = ++entitlementOperation;
        if (useUserStore.getState().isOnboarded) {
          get().startTrialIfNeeded();
        }

        set({ isLoading: true, lastError: null, isConfigured: isRevenueCatAvailable() });

        try {
          watchForeground();
          // Always attach the listener so mid-trial subscriptions are detected
          await addRevenueCatCustomerInfoListener((customerInfo) => {
            syncEntitlementState(set, customerInfo, true, ++entitlementOperation);
          });

          // A listener does not trigger a fetch. Always check existing purchases,
          // including during the app trial; a returning subscriber may have paid
          // on another device or while the app was closed.
          const state = await loadRevenueCatState({ includeOfferings: false });
          syncEntitlementState(set, state.customerInfo, state.customerInfoKnown, operation);
          // Could not ask the store: the cached answer holds, but only for 72 hours.
          if (!state.customerInfoKnown) applyOfflineGrace();
          set({
            isConfigured: state.configured,
          });
        } catch (error) {
          applyOfflineGrace();
          set({
            lastError: userFacingError(
              error instanceof Error ? error.message : null,
              'Unable to connect to billing. Your included access is unaffected.',
            ),
            isConfigured: isRevenueCatAvailable(),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refresh: async () => {
        await get().initialize();
      },

      loadOffering: async () => {
        const operation = ++entitlementOperation;
        set({ isLoading: true, lastError: null });

        try {
          const state = await loadRevenueCatState({ includeOfferings: true });
          syncEntitlementState(set, state.customerInfo, state.customerInfoKnown, operation);
          set({
            currentOffering: state.currentOffering,
            isConfigured: state.configured,
            lastError: !state.configured
              ? 'Purchases are unavailable on this device right now.'
              : state.offeringsError ?? null,
          });
        } catch (error) {
          set({
            currentOffering: null,
            lastError: userFacingError(
              error instanceof Error ? error.message : null,
              'Subscription is temporarily unavailable. Please try again later.',
            ),
            isConfigured: isRevenueCatAvailable(),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      purchaseMonthly: async () => runPurchase(set, purchaseCurrentRevenueCatPackage),
      purchaseAnnual: async () => runPurchase(set, purchaseAnnualRevenueCatPackage),

      restoreAccess: async () => {
        const operation = ++entitlementOperation;
        set({ isLoading: true, lastError: null });

        try {
          const result = await restoreRevenueCatPurchases();

          if (result.customerInfo) {
            syncEntitlementState(set, result.customerInfo, true, operation);
          }

          const configured = isRevenueCatAvailable();

          if (result.status === 'error' || result.status === 'unavailable') {
            set({
              isLoading: false,
              isConfigured: configured,
              lastError: userFacingError(result.message, 'Unable to restore purchases right now. Please try again.'),
            });
          } else {
            set({ isLoading: false, isConfigured: configured, lastError: null });
          }

          if (result.status === 'error' || result.status === 'unavailable') return result.status;
          // A restore that finds nothing is "no purchases", never "moved": the athlete asked.
          const found = classifyEntitlement(getEntitlementAccess(result.customerInfo), false);
          logBreadcrumb('subscription', 'restore finished', { status: found });
          if (unlocks(found)) {
            get().refresh().catch((err) => {
              if (__DEV__) console.warn('[subscription] background refresh after restore failed', err);
            });
          }
          return found;
        } catch (error) {
          set({
            isLoading: false,
            isConfigured: isRevenueCatAvailable(),
            lastError: userFacingError(
              error instanceof Error ? error.message : null,
              'Unable to restore purchases right now. Please try again.',
            ),
          });
          return 'error';
        }
      },

      openCustomerCenter: async () => {
        const operation = ++entitlementOperation;
        set({ isLoading: true, lastError: null });
        try {
          const result = await presentRevenueCatCustomerCenter();
          if (result.customerInfo) syncEntitlementState(set, result.customerInfo, true, operation);
          if (result.status === 'presented') return 'presented';
          // Callers already use the returned status to decide whether to fall
          // back. Report a successful fallback so it is not opened a second time.
          if (await openManagementUrl(get().managementUrl)) return 'presented';
          set({ lastError: 'Unable to open subscription management right now.' });
          return result.status;
        } catch {
          set({ lastError: 'Unable to open subscription management right now.' });
          return 'error';
        } finally {
          set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
        }
      },

      openSubscriptionManagement: async () => {
        const opened = await openManagementUrl(get().managementUrl);
        set({ lastError: opened ? null : 'Unable to open subscription management right now.' });
      },

      clearError: () => set({ lastError: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => subscriptionStorage),
      migrate: (persistedState) => migratePersistedSubscriptionState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...migratePersistedSubscriptionState(persistedState),
      }),
      partialize: (state) => ({
        trialStartedAt: state.trialStartedAt,
        entitlementActive: state.entitlementActive,
        entitlementExpiresAt: state.entitlementExpiresAt,
        entitlementProductIdentifier: state.entitlementProductIdentifier,
        managementUrl: state.managementUrl,
        entitlementStatus: state.entitlementStatus,
        entitlementVerifiedAt: state.entitlementVerifiedAt,
        movedNotice: state.movedNotice,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          subscriptionStorageWritable = false;
          useSubscriptionStore.setState({ hasHydrated: true, hydrationFailed: true });
          return;
        }
        subscriptionStorageWritable = true;
        useSubscriptionStore.setState({ hasHydrated: true, hydrationFailed: false });
        reconcilePinnedTrialStart();
        applyOfflineGrace();
      },
    }
  )
);
