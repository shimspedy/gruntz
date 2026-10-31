import { Alert, Platform } from 'react-native';
import { entitlementMessage, unlocks } from '../services/entitlementStatus';
import type { RestoreOutcome } from '../store/useSubscriptionStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { toast } from '../ui/Toast';

/**
 * The one way a restore result is shown, so the paywall, Settings and the welcome
 * screen all say the same thing for the same state.
 */
export function showRestoreResult(outcome: RestoreOutcome, options: { onUnlocked?: () => void; retry?: () => void } = {}) {
  const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  if (outcome === 'unavailable') {
    // Not a network problem, and retrying cannot help.
    Alert.alert('Purchases unavailable', 'In-app purchases aren’t available on this device right now, so there’s nothing to restore. Try again after updating the app.');
    return;
  }
  if (outcome === 'error') {
    Alert.alert('Restore didn’t finish', `We couldn’t reach the ${store}. Check your connection and try again. You won’t be charged twice.`, options.retry
      ? [{ text: 'Cancel', style: 'cancel' }, { text: 'Try again', onPress: options.retry }]
      : undefined);
    return;
  }
  const { title, body } = entitlementMessage(outcome, Platform.OS);
  const updatePayment = { text: 'Update payment', onPress: () => void useSubscriptionStore.getState().openSubscriptionManagement() };
  if (unlocks(outcome)) {
    toast(title, { icon: 'check' });
    if (outcome === 'grace') Alert.alert('Payment problem', body, [{ text: 'Not now', style: 'cancel' }, updatePayment]);
    options.onUnlocked?.();
    return;
  }
  Alert.alert(title, body, outcome === 'billing-retry' ? [{ text: 'Not now', style: 'cancel' }, updatePayment] : undefined);
}
