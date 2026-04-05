import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configuration ──────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Permission ─────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Channels (Android 16) ──────────────────────────────────────

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

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
}

// ─── Daily Mission Reminder ─────────────────────────────────────

export async function scheduleDailyReminder(hour: number, minute: number) {
  // Cancel existing daily reminders first
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚔️ GRUNTZ — Mission Awaits',
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
}

export async function cancelDailyReminder() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily-reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
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
    title: `💪 ${missionTitle}`,
    body: `${exercisesDone}/${exercisesTotal} exercises complete (${pct}%)`,
    data: { type: 'workout-progress', exercisesDone, exercisesTotal },
    sticky: true,
    ...(Platform.OS === 'android' && { channelId: 'workout-progress' }),
  };

  if (activeProgressId) {
    // Update existing notification
    await Notifications.dismissNotificationAsync(activeProgressId);
  }

  activeProgressId = await Notifications.scheduleNotificationAsync({
    content,
    trigger: null, // Immediate
  });
}

export async function clearWorkoutProgress() {
  if (activeProgressId) {
    await Notifications.dismissNotificationAsync(activeProgressId);
    activeProgressId = null;
  }
}

export async function showWorkoutComplete(xpEarned: number, streakDays: number) {
  await clearWorkoutProgress();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Mission Complete!',
      body: `+${xpEarned} XP earned${streakDays > 1 ? ` • 🔥 ${streakDays}-day streak` : ''}`,
      data: { type: 'workout-complete' },
      ...(Platform.OS === 'android' && { channelId: 'workout-progress' }),
    },
    trigger: null,
  });
}

// ─── Achievement Notifications ──────────────────────────────────

export async function showAchievementUnlocked(achievementName: string, icon: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🏆 Achievement Unlocked!`,
      body: `${icon} ${achievementName}`,
      data: { type: 'achievement' },
      ...(Platform.OS === 'android' && { channelId: 'achievements' }),
    },
    trigger: null,
  });
}

// ─── Streak Warning ─────────────────────────────────────────────

export async function showStreakWarning(streakDays: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Streak at Risk!',
      body: `Your ${streakDays}-day streak expires at midnight. Get a mission in!`,
      data: { type: 'streak-warning' },
      ...(Platform.OS === 'android' && { channelId: 'daily-reminder' }),
    },
    trigger: null,
  });
}
