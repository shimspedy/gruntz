import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GRUNTZ_TRIAL_DAYS } from '../config/monetization';
import {
  addRevenueCatCustomerInfoListener,
  getEntitlementAccess,
  isRevenueCatAvailable,
  loadRevenueCatState,
  openManagementUrl,
  type OfferingSnapshot,
  presentRevenueCatCustomerCenter,
  presentRevenueCatPaywall,
  restoreRevenueCatPurchases,
} from '../services/subscription';
import { useUserStore } from './useUserStore';

const STORAGE_KEY = '@gruntz_subscription';
const DAY_MS = 24 * 60 * 60 * 1000;

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
  lastError: string | null;

  startTrialIfNeeded: (startAt?: string) => void;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  loadOffering: () => Promise<void>;
  purchaseMonthly: () => Promise<'purchased' | 'cancelled' | 'unavailable' | 'error'>;
  restoreAccess: () => Promise<'restored' | 'unavailable' | 'error'>;
  openCustomerCenter: () => Promise<'presented' | 'unavailable' | 'error'>;
  openSubscriptionManagement: () => Promise<void>;
  clearError: () => void;
}

export function getTrialEndsAt(trialStartedAt: string | null) {
  if (!trialStartedAt) {
    return null;
  }
  const started = new Date(trialStartedAt);
  return new Date(started.getTime() + GRUNTZ_TRIAL_DAYS * DAY_MS).toISOString();
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
  return state.entitlementActive || hasTrialAccess(state.trialStartedAt);
}

export function getAccessState(state: Pick<SubscriptionState, 'trialStartedAt' | 'entitlementActive'>): AccessState {
  if (state.entitlementActive) {
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

function syncEntitlementState(set: (partial: Partial<SubscriptionState>) => void, customerInfo: Awaited<ReturnType<typeof loadRevenueCatState>>['customerInfo']) {
  const entitlement = getEntitlementAccess(customerInfo);
  set({
    entitlementActive: entitlement?.isActive === true,
    entitlementExpiresAt: entitlement?.expirationDate ?? null,
    entitlementProductIdentifier: entitlement?.productIdentifier ?? null,
    managementUrl: customerInfo?.managementURL ?? null,
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
      lastError: null,

      startTrialIfNeeded: (startAt) => {
        if (get().trialStartedAt) {
          return;
        }
        set({ trialStartedAt: startAt ?? new Date().toISOString() });
      },

      initialize: async () => {
        if (useUserStore.getState().isOnboarded) {
          get().startTrialIfNeeded();
        }

        set({ isLoading: true, lastError: null, isConfigured: isRevenueCatAvailable() });

        try {
          // Always attach the listener so mid-trial subscriptions are detected
          await addRevenueCatCustomerInfoListener((customerInfo) => {
            syncEntitlementState(set, customerInfo);
          });

          // During an active trial (and not already a subscriber), defer the
          // full offerings fetch for faster startup — the listener will catch
          // any entitlement changes in real time.
          const shouldDeferBillingSync =
            hasTrialAccess(get().trialStartedAt) && !get().entitlementActive;
          if (shouldDeferBillingSync) {
            set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
            return;
          }

          const state = await loadRevenueCatState({ includeOfferings: false });
          syncEntitlementState(set, state.customerInfo);
          set({
            isConfigured: state.configured,
          });
        } catch (error) {
          set({
            lastError: userFacingError(
              error instanceof Error ? error.message : null,
              'Unable to connect to billing. Your trial access is unaffected.',
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
          syncEntitlementState(set, state.customerInfo);
          set({
            currentOffering: state.currentOffering,
            isConfigured: state.configured,
          });
        } catch (error) {
          set({
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

      purchaseMonthly: async () => {
        set({ isLoading: true, lastError: null });

        try {
          const result = await presentRevenueCatPaywall();

          if (result.customerInfo) {
            syncEntitlementState(set, result.customerInfo);
          }

          const configured = isRevenueCatAvailable();

          if (result.status === 'not_presented' && !get().entitlementActive) {
            set({
              isLoading: false,
              isConfigured: configured,
              lastError: userFacingError(result.message, 'Subscription setup is in progress. Please try again shortly.'),
            });
            return 'unavailable';
          }

          if (result.status === 'error' || result.status === 'unavailable') {
            set({
              isLoading: false,
              isConfigured: configured,
              lastError: userFacingError(result.message, 'Subscription is temporarily unavailable. Please try again later.'),
            });
            return result.status === 'error' ? 'error' : 'unavailable';
          }

          // Success paths — clear errors first, then refresh in background
          set({ isLoading: false, isConfigured: configured, lastError: null });

          if (result.status === 'purchased' || result.status === 'restored') {
            // Refresh in background — don't block UI
            get().refresh().catch(() => {});
            return 'purchased';
          }

          if (result.status === 'not_presented') {
            return get().entitlementActive ? 'purchased' : 'cancelled';
          }

          return 'cancelled';
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
      },

      restoreAccess: async () => {
        set({ isLoading: true, lastError: null });

        try {
          const result = await restoreRevenueCatPurchases();

          if (result.customerInfo) {
            syncEntitlementState(set, result.customerInfo);
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
            get().refresh().catch(() => {});
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
        const result = await presentRevenueCatCustomerCenter();

        if (result.customerInfo) {
          syncEntitlementState(set, result.customerInfo);
        }

        if (result.status !== 'presented') {
          const fallbackOpened = await openManagementUrl(get().managementUrl);
          if (!fallbackOpened) {
            set({
              lastError: userFacingError(
                result.message,
                'Unable to open subscription management right now.',
              ),
            });
          } else {
            set({ lastError: null });
          }
        } else {
          set({ lastError: null });
          await get().refresh();
        }

        set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
        return result.status;
      },

      openSubscriptionManagement: async () => {
        await openManagementUrl(get().managementUrl);
      },

      clearError: () => set({ lastError: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        trialStartedAt: state.trialStartedAt,
        entitlementActive: state.entitlementActive,
        entitlementExpiresAt: state.entitlementExpiresAt,
        entitlementProductIdentifier: state.entitlementProductIdentifier,
        managementUrl: state.managementUrl,
        currentOffering: state.currentOffering,
        isConfigured: state.isConfigured,
      }),
      onRehydrateStorage: () => () => {
        useSubscriptionStore.setState({ hasHydrated: true });
      },
    }
  )
);
