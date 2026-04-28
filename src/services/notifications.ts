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
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements & Milestones',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      lightColor: '#FFB800',
    });
  }, undefined);
}

// ─── Daily Mission Reminder ─────────────────────────────────────

export async function scheduleDailyReminder(hour: number, minute: number) {
  // Cancel existing daily reminders first
  await cancelDailyReminder();

  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'GRUNTZ — Mission Awaits',
        body: "Your daily mission is ready. Don't break the streak!",
        data: { type: 'daily-reminder' },
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }, undefined);
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

let activeProgressId: string | null = null;

export async function showWorkoutProgress(
  exercisesDone: number,
  exercisesTotal: number,
  missionTitle: string,
) {
  const progress = exercisesTotal > 0 ? exercisesDone / exercisesTotal : 0;
  const pct = Math.round(progress * 100);

  const content: Notifications.NotificationContentInput = {
    title: missionTitle,
    body: `${exercisesDone}/${exercisesTotal} exercises complete (${pct}%)`,
    data: { type: 'workout-progress', exercisesDone, exercisesTotal },
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
  await withNotificationGuard(async () => {
    if (activeProgressId) {
      await Notifications.dismissNotificationAsync(activeProgressId);
      activeProgressId = null;
    }
    await dismissPresentedNotificationsByType('workout-progress');
  }, undefined);
}

export async function showWorkoutComplete(xpEarned: number, streakDays: number) {
  await clearWorkoutProgress();

  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Mission Complete',
        body: `+${xpEarned} XP earned${streakDays > 1 ? ` • ${streakDays}-day streak` : ''}`,
        data: { type: 'workout-complete' },
        ...(Platform.OS === 'android' && { channelId: 'workout-progress' }),
      },
      trigger: null,
    });
  }, undefined);
}

// ─── Achievement Notifications ──────────────────────────────────

export async function showAchievementUnlocked(achievementName: string, _icon: string) {
  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Achievement Unlocked',
        body: achievementName,
        data: { type: 'achievement' },
        ...(Platform.OS === 'android' && { channelId: 'achievements' }),
      },
      trigger: null,
    });
  }, undefined);
}

// ─── Streak Warning ─────────────────────────────────────────────

export async function showStreakWarning(streakDays: number) {
  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Streak At Risk',
        body: `Your ${streakDays}-day streak expires at midnight. Get a mission in!`,
        data: { type: 'streak-warning' },
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: null,
    });
  }, undefined);
}

// ─── Trial Ending Nudge ─────────────────────────────────────────
// Schedules a one-shot reminder ~36h before the trial window ends so the
// user has time to subscribe before losing access. Replaces any prior
// trial-ending notification on each call.

export async function scheduleTrialEndingReminder(trialEndsAt: string) {
  await cancelTrialEndingReminder();

  const endTime = new Date(trialEndsAt).getTime();
  if (!Number.isFinite(endTime)) return;
  const fireAt = new Date(endTime - 36 * 60 * 60 * 1000);
  if (fireAt.getTime() <= Date.now() + 60_000) {
    // Less than a minute away (or in the past) — nothing to schedule.
    return;
  }

  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your access ends soon',
        body: 'Your Gruntz trial wraps up in less than 2 days. Subscribe to keep your streak.',
        data: { type: 'trial-ending' },
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

  await withNotificationGuard(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Week In Review',
        body: 'See your missions, streak, and challenge XP for the week.',
        data: { type: 'weekly-recap' },
        ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday (1 in expo-notifications)
        hour,
        minute,
      },
    });
  }, undefined);
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
