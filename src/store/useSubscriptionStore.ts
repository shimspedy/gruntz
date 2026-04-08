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

        const shouldDeferBillingSync =
          hasTrialAccess(get().trialStartedAt) && !get().entitlementActive;
        if (shouldDeferBillingSync) {
          set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
          return;
        }

        try {
          await addRevenueCatCustomerInfoListener((customerInfo) => {
            syncEntitlementState(set, customerInfo);
          });
          const state = await loadRevenueCatState({ includeOfferings: false });
          syncEntitlementState(set, state.customerInfo);
          set({
            isConfigured: state.configured,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to sync billing state.';
          set({
            lastError: message,
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
          const message = error instanceof Error ? error.message : 'Unable to load subscription options.';
          set({
            lastError: message,
            isConfigured: isRevenueCatAvailable(),
          });
        } finally {
          set({ isLoading: false });
        }
      },

      purchaseMonthly: async () => {
        set({ isLoading: true, lastError: null });
        const result = await presentRevenueCatPaywall();

        if (result.customerInfo) {
          syncEntitlementState(set, result.customerInfo);
        }

        if (result.status === 'error' || result.status === 'unavailable') {
          set({ lastError: result.message ?? 'Subscription is unavailable right now.' });
        }

        if (result.status === 'not_presented' && !get().entitlementActive) {
          set({
            lastError:
              'No hosted paywall is configured for the current offering yet. Finish the RevenueCat paywall setup in the dashboard and try again.',
          });
          set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
          return 'unavailable';
        }

        if (result.status === 'purchased' || result.status === 'restored' || result.status === 'not_presented') {
          set({ lastError: null });
        }

        set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
        if (result.status === 'purchased' || result.status === 'restored') {
          await get().refresh();
        }
        if (result.status === 'restored') {
          return 'purchased';
        }
        if (result.status === 'not_presented') {
          return get().entitlementActive ? 'purchased' : 'cancelled';
        }
        return result.status;
      },

      restoreAccess: async () => {
        set({ isLoading: true, lastError: null });
        const result = await restoreRevenueCatPurchases();

        if (result.customerInfo) {
          syncEntitlementState(set, result.customerInfo);
        }

        if (result.status === 'error' || result.status === 'unavailable') {
          set({ lastError: result.message ?? 'Restore is unavailable right now.' });
        } else {
          set({ lastError: null });
        }

        set({ isLoading: false, isConfigured: isRevenueCatAvailable() });
        if (result.status === 'restored') {
          await get().refresh();
        }
        return result.status;
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
              lastError:
                result.message ??
                'Customer Center is unavailable right now.',
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
