import AsyncStorage from '@react-native-async-storage/async-storage';
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
  restoreRevenueCatPurchases,
} from '../services/subscription';
import {
  cancelTrialEndingReminder,
  scheduleTrialEndingReminder,
} from '../services/notifications';
import { useUserStore } from './useUserStore';

const STORAGE_KEY = '@gruntz_subscription';
const DAY_MS = 24 * 60 * 60 * 1000;
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

  startTrialIfNeeded: (startAt?: string) => void;
  adoptTrialStart: (startAt: string) => void;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  loadOffering: () => Promise<void>;
  purchaseMonthly: () => Promise<PurchaseStatus>;
  purchaseAnnual: () => Promise<PurchaseStatus>;
  restoreAccess: () => Promise<'restored' | 'none' | 'unavailable' | 'error'>;
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

async function runPurchase(
  set: (partial: Partial<SubscriptionState>) => void,
  runner: PurchaseRunner,
): Promise<PurchaseStatus> {
  set({ isLoading: true, lastError: null });

  try {
    const result = await runner();

    if (result.customerInfo) {
      syncEntitlementState(set, result.customerInfo, true);
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
) {
  if (!known) return;
  const entitlement = getEntitlementAccess(customerInfo);
  const active = entitlement?.isActive === true;
  set({
    entitlementActive: active,
    entitlementExpiresAt: entitlement?.expirationDate ?? null,
    entitlementProductIdentifier: entitlement?.productIdentifier ?? null,
    managementUrl: customerInfo?.managementURL ?? null,
  });
  if (active) {
    void cancelTrialEndingReminder();
  }
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

      startTrialIfNeeded: (startAt) => {
        if (get().trialStartedAt) {
          return;
        }
        const startedAt = startAt && getTrialEndsAt(startAt) ? startAt : new Date().toISOString();
        set({ trialStartedAt: startedAt });
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
        if (!get().entitlementActive) void scheduleTrialEndingReminder(endsAt);
      },

      initialize: async () => {
        if (useUserStore.getState().isOnboarded) {
          get().startTrialIfNeeded();
        }

        set({ isLoading: true, lastError: null, isConfigured: isRevenueCatAvailable() });

        try {
          // Always attach the listener so mid-trial subscriptions are detected
          await addRevenueCatCustomerInfoListener((customerInfo) => {
            syncEntitlementState(set, customerInfo, true);
          });

          // A listener does not trigger a fetch. Always check existing purchases,
          // including during the app trial; a returning subscriber may have paid
          // on another device or while the app was closed.
          const state = await loadRevenueCatState({ includeOfferings: false });
          syncEntitlementState(set, state.customerInfo, state.customerInfoKnown);
          set({
            isConfigured: state.configured,
          });
        } catch (error) {
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
        set({ isLoading: true, lastError: null });

        try {
          const state = await loadRevenueCatState({ includeOfferings: true });
          syncEntitlementState(set, state.customerInfo, state.customerInfoKnown);
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
        set({ isLoading: true, lastError: null });

        try {
          const result = await restoreRevenueCatPurchases();

          if (result.customerInfo) {
            syncEntitlementState(set, result.customerInfo, true);
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

          if (result.status === 'restored') {
            get().refresh().catch((err) => {
              if (__DEV__) console.warn('[subscription] background refresh after restore failed', err);
            });
          }

          return result.status;
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
        set({ isLoading: true, lastError: null });
        try {
          const result = await presentRevenueCatCustomerCenter();
          if (result.customerInfo) syncEntitlementState(set, result.customerInfo, true);
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
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          subscriptionStorageWritable = false;
          useSubscriptionStore.setState({ hasHydrated: true, hydrationFailed: true });
          return;
        }
        subscriptionStorageWritable = true;
        useSubscriptionStore.setState({ hasHydrated: true, hydrationFailed: false });
      },
    }
  )
);
