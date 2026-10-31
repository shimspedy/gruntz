import { Alert } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import { getTrialEndsAt, useSubscriptionStore } from '../store/useSubscriptionStore';
import { notificationWeekdays } from '../utils/trainingDays';
import { toast } from '../ui/Toast';
import { trackRetentionEvent } from './retentionAnalytics';
import { cancelTrainingReminders, requestNotificationPermission, scheduleDailyReminder, scheduleTrialEndingReminder, scheduleWeeklyRecap, setNotificationsEnabled, setupNotificationChannels } from './notifications';

let requesting = false;
/** Called only by an explicit reminder action after a useful training moment. */
export async function promptTrainingReminder(): Promise<boolean> {
  if (requesting) return false;
  requesting = true;
  try {
    const profile = useUserStore.getState().profile;
    if (!profile) return false;
    await setupNotificationChannels();
    const granted = await requestNotificationPermission();
    trackRetentionEvent('reminder_permission', { outcome: granted ? 'granted' : 'denied' });
    if (!granted) {
      useUserStore.getState().updateSettings({ notifications_enabled: false });
      await cancelTrainingReminders();
      Alert.alert('Reminders are off', 'You can allow Gruntz notifications in your device Settings, then turn on workout reminders in Gruntz Settings.');
      return false;
    }
    const savedTime = profile.settings.reminder_time || '07:00';
    const [hours = 7, minutes = 0] = savedTime.split(':').map(Number);
    setNotificationsEnabled(true);
    const daily = await scheduleDailyReminder(Number.isInteger(hours) && hours >= 0 && hours <= 23 ? hours : 7,
      Number.isInteger(minutes) && minutes >= 0 && minutes <= 59 ? minutes : 0,
      notificationWeekdays(profile.workout_days_per_week));
    const weekly = await scheduleWeeklyRecap();
    if (!daily || !weekly) {
      useUserStore.getState().updateSettings({ notifications_enabled: false });
      await cancelTrainingReminders();
      trackRetentionEvent('reminder_scheduling', { outcome: 'failed' });
      throw new Error('Could not schedule training reminders');
    }
    const subscription = useSubscriptionStore.getState();
    const endsAt = subscription.entitlementActive ? null : getTrialEndsAt(subscription.trialStartedAt);
    if (endsAt) await scheduleTrialEndingReminder(endsAt);
    useUserStore.getState().updateSettings({ notifications_enabled: true });
    trackRetentionEvent('reminder_scheduling', { outcome: 'scheduled' });
    toast('Training reminders set · change the time in Settings', { icon: 'bell' });
    return true;
  } finally {
    requesting = false;
  }
}
