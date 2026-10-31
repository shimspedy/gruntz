import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configuration ──────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Set by the app when the user's reminder preference changes; nothing schedules while off. */
let remindersEnabled = true;
export function setNotificationsEnabled(enabled: boolean) {
  remindersEnabled = enabled;
}
export function notificationsEnabled() {
  return remindersEnabled;
}

/** Roll back a failed opt-in/reschedule without leaving older alerts enabled. */
export async function cancelTrainingReminders() {
  setNotificationsEnabled(false);
  await Promise.all([cancelDailyReminder(), cancelWeeklyRecap(), cancelTrialEndingReminder(), cancelRestDone()]);
}

async function withNotificationGuard<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function dismissPresentedNotificationsByType(type: string) {
  await withNotificationGuard(async () => {
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented
        .filter((notification) => notification.request.content.data?.type === type)
        .map((notification) => Notifications.dismissNotificationAsync(notification.request.identifier))
    );
  }, undefined);
}

// ─── Permission ─────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  return withNotificationGuard(async () => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, false);
}

// ─── Channels (Android 16) ──────────────────────────────────────

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

  await withNotificationGuard(async () => {
    await Notifications.setNotificationChannelAsync('workout-progress', {
      name: 'Workout Progress',
      importance: Notifications.AndroidImportance.HIGH,
      sound: undefined,
      vibrationPattern: [0, 100, 50, 100],
      lightColor: '#00FF41',
    });

    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Mission Reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements & Milestones',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#FFB800',
    });
  }, undefined);
}

// ─── Daily Mission Reminder ─────────────────────────────────────

/**
 * @param weekdays 1 (Sunday) – 7 (Saturday). Empty means every day. Reminding someone who
 * trains three days a week on all seven is how an app gets its notifications turned off.
 */
export async function scheduleDailyReminder(hour: number, minute: number, weekdays: number[] = []) {
  await cancelDailyReminder();
  if (!remindersEnabled) return false;

  return withNotificationGuard(async () => {
    const content: Notifications.NotificationContentInput = {
      title: 'Time to train',
      body: 'Your next workout is ready when you are.',
      data: { type: 'daily-reminder', url: 'gruntz://train' },
      ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
    };
    if (!weekdays.length) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
      return true;
    }
    for (const weekday of weekdays) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute },
      });
    }
    return true;
  }, false);
}

export async function cancelDailyReminder() {
  await withNotificationGuard(async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'daily-reminder') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  }, undefined);
}

// ─── Workout Progress (Android 16 Progress-Centric) ─────────────

let lastProgressSignature: string | null = null;
let activeProgressId: string | null = null;

export async function showWorkoutProgress(
  exercisesDone: number,
  exercisesTotal: number,
  missionTitle: string,
) {
  // Backgrounding the app with nothing logged since last time used to tear down and
  // re-post the same notification, which reads as a fresh alert each time.
  const signature = `${missionTitle}|${exercisesDone}|${exercisesTotal}`;
  if (activeProgressId && signature === lastProgressSignature) return;
  lastProgressSignature = signature;

  const progress = exercisesTotal > 0 ? exercisesDone / exercisesTotal : 0;
  const pct = Math.round(progress * 100);

  const content: Notifications.NotificationContentInput = {
    title: missionTitle,
    body: `${exercisesDone}/${exercisesTotal} exercises complete (${pct}%)`,
    data: { type: 'workout-progress', exercisesDone, exercisesTotal, url: 'gruntz://train' },
    sticky: true,
    ...(Platform.OS === 'android' && { channelId: 'workout-progress' }),
  };

  await withNotificationGuard(async () => {
    if (activeProgressId) {
      await Notifications.dismissNotificationAsync(activeProgressId);
    }
    await dismissPresentedNotificationsByType('workout-progress');

    activeProgressId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // Immediate
    });
  }, undefined);
}

export async function clearWorkoutProgress() {
  lastProgressSignature = null;
  await withNotificationGuard(async () => {
    if (activeProgressId) {
      await Notifications.dismissNotificationAsync(activeProgressId);
      activeProgressId = null;
    }
    await dismissPresentedNotificationsByType('workout-progress');
  }, undefined);
}

// ─── Rest timer ─────────────────────────────────────────────────

/** Fires when a rest ends while the app is in the background or the phone is locked. */
export async function scheduleRestDone(endsAt: number, nextLabel?: string) {
  await cancelRestDone();
  if (!remindersEnabled) return;
  if (endsAt <= Date.now() + 1000) return;
  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      identifier: 'rest-done',
      content: {
        title: 'Rest’s up',
        body: nextLabel ? `Time for your next set: ${nextLabel}` : 'Time for your next set.',
        data: { type: 'rest-done', url: 'gruntz://train' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'workout-progress' }),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
    });
  }, undefined);
}

export async function cancelRestDone() {
  await withNotificationGuard(async () => {
    await Notifications.cancelScheduledNotificationAsync('rest-done');
  }, undefined);
  await dismissPresentedNotificationsByType('rest-done');
}

// ─── Workout left open ──────────────────────────────────────────

const LEFT_OPEN_IDS = ['workout-open-1', 'workout-open-2'];

/**
 * Two nudges after the last logged set: one at an hour, one at three. Re-armed each
 * time a set is logged, cancelled on finish or discard, so they only reach someone
 * who walked away from an open workout.
 */
export async function scheduleWorkoutLeftOpen(lastActivityAt: number, title: string) {
  await cancelWorkoutLeftOpen();
  if (!remindersEnabled) return;
  const nudges = [
    { id: LEFT_OPEN_IDS[0], at: lastActivityAt + 60 * 60 * 1000, title: 'Workout still open', body: `${title || 'Your workout'} has had no sets for an hour. Finish it so your log stays accurate.` },
    { id: LEFT_OPEN_IDS[1], at: lastActivityAt + 3 * 60 * 60 * 1000, title: 'Still training?', body: `Finish or discard ${title || 'your workout'}. The time since your last set won’t count.` },
  ];
  await withNotificationGuard(async () => {
    for (const nudge of nudges) {
      if (nudge.at <= Date.now() + 1000) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: nudge.id,
        content: {
          title: nudge.title,
          body: nudge.body,
          data: { type: 'workout-open', url: 'gruntz://train' },
          ...(Platform.OS === 'android' && { channelId: 'workout-progress' }),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(nudge.at) },
      });
    }
  }, undefined);
}

export async function cancelWorkoutLeftOpen() {
  await withNotificationGuard(async () => {
    for (const id of LEFT_OPEN_IDS) await Notifications.cancelScheduledNotificationAsync(id);
  }, undefined);
  await dismissPresentedNotificationsByType('workout-open');
}

// ─── Trial Ending Nudge ─────────────────────────────────────────
// Schedules a one-shot reminder ~36h before the trial window ends so the
// user has time to subscribe before losing access. Replaces any prior
// trial-ending notification on each call.

export async function scheduleTrialEndingReminder(trialEndsAt: string) {
  await cancelTrialEndingReminder();
  // Same guard the daily reminder has. Without it, someone who declined the reminder
  // step in onboarding still got a trial sales push scheduled on first launch — and
  // would only ever silence it by toggling a setting they never turned on.
  if (!remindersEnabled) return;

  const endTime = new Date(trialEndsAt).getTime();
  if (!Number.isFinite(endTime)) return;
  const fireAt = new Date(endTime - 36 * 60 * 60 * 1000);
  // Nobody wants a sales push at 3am: pull it into the evening of the same day.
  if (fireAt.getHours() < 9 || fireAt.getHours() > 20) fireAt.setHours(18, 0, 0, 0);
  if (fireAt.getTime() <= Date.now() + 60_000) {
    // Less than a minute away (or in the past) — nothing to schedule.
    return;
  }

  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your access ends soon',
        body: 'Your included Gruntz days end in under 2 days. Your history and routines stay yours either way.',
        data: { type: 'trial-ending', url: 'gruntz://paywall' },
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
  }, undefined);
}

export async function cancelTrialEndingReminder() {
  await withNotificationGuard(async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'trial-ending') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  }, undefined);
}

// ─── Weekly Recap ───────────────────────────────────────────────
// Sunday-evening prompt. Encourages a quick check-in on missions,
// streaks, and challenge wins — keeps the user looping back into the app.

export async function scheduleWeeklyRecap(hour = 19, minute = 0) {
  await cancelWeeklyRecap();
  if (!remindersEnabled) return false;

  return withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your weekly debrief',
        body: 'Review your training, see what moved, and plan your next mission.',
        data: { type: 'weekly-recap', url: 'gruntz://weekly-debrief' },
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday (1 in expo-notifications)
        hour,
        minute,
      },
    });
    return true;
  }, false);
}

export async function cancelWeeklyRecap() {
  await withNotificationGuard(async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'weekly-recap') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  }, undefined);
}
