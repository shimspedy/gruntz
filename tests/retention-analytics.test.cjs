const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader } = require('./workout-test-utils.cjs');

function analyticsEnv(raw = null) {
  let saved = raw;
  const load = createLoader({ '@react-native-async-storage/async-storage': {
    getItem: async () => saved,
    setItem: async (_key, value) => { saved = value; },
    removeItem: async () => { saved = null; },
  } });
  return { ...load('src/services/retentionAnalytics.ts'), saved: () => saved };
}

test('local analytics records actual first and second completions and strips sensitive properties', async () => {
  const env = analyticsEnv();
  env.trackRetentionEvent('workout_completed', { first: true, source: 'program', sleepHours: 5, latitude: 40, testScore: 130 });
  env.trackRetentionEvent('workout_completed', { first: false, source: 'library' });
  const result = await env.getRetentionDiagnostics();
  assert.equal(result.events.length, 2);
  assert.ok(result.firstWorkoutAt);
  assert.ok(result.secondWorkoutAt);
  assert.deepEqual(result.trainingWeeks, [0]);
  assert.deepEqual(result.events[0].properties, { first: true, source: 'program' });
  assert.ok(!env.saved().includes('latitude'));
});

test('joining analytics after existing training does not invent a first workout', async () => {
  const env = analyticsEnv();
  env.trackRetentionEvent('workout_completed', { first: false, sessions: 40 });
  assert.equal((await env.getRetentionDiagnostics()).firstWorkoutAt, null);
  assert.equal((await env.getRetentionDiagnostics()).secondWorkoutAt, null);
});

test('event history is bounded without losing activation milestones', async () => {
  const env = analyticsEnv();
  env.trackRetentionEvent('workout_completed', { first: true });
  for (let i = 0; i < 1005; i++) env.trackRetentionEvent('screen_viewed', { screen: 'Train' });
  const result = await env.getRetentionDiagnostics();
  assert.equal(result.events.length, 1000);
  assert.ok(result.firstWorkoutAt);
});

test('unreadable history is kept intact and explicit reset clears disk and memory', async () => {
  const env = analyticsEnv('{bad');
  env.trackRetentionEvent('app_opened');
  assert.equal((await env.getRetentionDiagnostics()).readable, false);
  assert.equal(env.saved(), '{bad');
  await env.clearRetentionAnalytics();
  assert.equal(env.saved(), null);
  assert.equal((await env.getRetentionDiagnostics()).events.length, 0);
});

test('an event arriving during erase waits for the barrier and cannot resurrect the previous installation', async () => {
  let saved = null, releaseRemove;
  let removing = false, writesDuringRemove = 0;
  const load = createLoader({ '@react-native-async-storage/async-storage': {
    getItem: async () => saved,
    setItem: async (_key, value) => { if (removing) writesDuringRemove += 1; saved = value; },
    removeItem: async () => { removing = true; await new Promise((resolve) => { releaseRemove = resolve; }); saved = null; removing = false; },
  } });
  const env = load('src/services/retentionAnalytics.ts');
  env.trackRetentionEvent('workout_completed', { first: true });
  await env.getRetentionDiagnostics();
  const erase = env.clearRetentionAnalytics();
  await new Promise((resolve) => setImmediate(resolve));
  env.trackRetentionEvent('onboarding_step_viewed', { step: 'welcome' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(writesDuringRemove, 0);
  releaseRemove();
  await erase;
  const result = await env.getRetentionDiagnostics();
  assert.deepEqual(result.events.map((event) => event.name), ['onboarding_step_viewed']);
  assert.equal(result.firstWorkoutAt, null);
  assert.equal(result.secondWorkoutAt, null);
  assert.deepEqual(result.trainingWeeks, []);
  assert.ok(!saved.includes('workout_completed'));
});

test('weekly recap opens its own review rather than unrelated totals', async () => {
  const scheduled = [];
  const load = createLoader({
    'react-native': { Platform: { OS: 'ios' } },
    'expo-notifications': {
      setNotificationHandler() {}, getAllScheduledNotificationsAsync: async () => [],
      scheduleNotificationAsync: async (input) => { scheduled.push(input); return 'recap'; },
      SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
    },
  });
  const notifications = load('src/services/notifications.ts');
  await notifications.scheduleWeeklyRecap();
  assert.equal(scheduled[0].content.data.url, 'gruntz://weekly-debrief');
});

test('Sunday recap keeps its delivered week when opened on Monday, for iOS seconds and Android milliseconds', () => {
  const { resolveNotificationLink } = createLoader()('src/navigation/notificationLink.ts');
  const delivered = new Date(2026, 9, 25, 19, 0).getTime();
  const data = { type: 'weekly-recap', url: 'gruntz://weekly-debrief' };
  for (const at of [delivered, delivered / 1000]) assert.equal(resolveNotificationLink(data, at), 'gruntz://weekly-debrief?weekStart=2026-10-19');
  assert.equal(resolveNotificationLink({ type: 'weekly-recap', url: 'gruntz://stats' }, delivered), 'gruntz://weekly-debrief?weekStart=2026-10-19');
  assert.equal(resolveNotificationLink({ type: 'daily-reminder', url: 'gruntz://train' }, delivered), 'gruntz://train');
  assert.equal(resolveNotificationLink({ type: 'daily-reminder', url: 'https://example.com' }, delivered), null);
  assert.equal(resolveNotificationLink({ url: 'javascript:alert(1)' }, delivered), null);
});

test('native notification scheduling failure is reported instead of returning success', async () => {
  const load = createLoader({
    'react-native': { Platform: { OS: 'ios' } },
    'expo-notifications': {
      setNotificationHandler() {}, getAllScheduledNotificationsAsync: async () => [],
      scheduleNotificationAsync: async () => { throw new Error('native schedule failed'); },
      SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
    },
  });
  const notifications = load('src/services/notifications.ts');
  assert.equal(await notifications.scheduleDailyReminder(7, 0, [2, 4, 6]), false);
  assert.equal(await notifications.scheduleWeeklyRecap(), false);
});

test('reminder opt-in never claims success when scheduling fails after permission is granted', async () => {
  const changes = [], toasts = [], canceled = [];
  const load = createLoader({
    'react-native': { Alert: { alert() {} } },
    '../store/useUserStore': { useUserStore: { getState: () => ({ profile: { settings: { reminder_time: '07:00', notifications_enabled: false }, workout_days_per_week: 3 }, updateSettings: (patch) => changes.push(patch) }) } },
    '../store/useSubscriptionStore': { useSubscriptionStore: { getState: () => ({ entitlementActive: false, trialStartedAt: null }) }, getTrialEndsAt: () => null },
    '../ui/Toast': { toast: (message) => toasts.push(message) },
    './retentionAnalytics': { trackRetentionEvent() {} },
    './notifications': {
      setupNotificationChannels: async () => {}, requestNotificationPermission: async () => true,
      setNotificationsEnabled() {}, scheduleDailyReminder: async () => false, scheduleWeeklyRecap: async () => true,
      cancelTrainingReminders: async () => canceled.push('all'),
    },
  });
  const { promptTrainingReminder } = load('src/services/retentionReminders.ts');
  await assert.rejects(promptTrainingReminder(), /Could not schedule/);
  assert.deepEqual(changes, [{ notifications_enabled: false }]);
  assert.deepEqual(toasts, []);
  assert.deepEqual(canceled, ['all']);
});

test('failed reminder opt-in rollback cancels older daily, weekly, trial and rest alerts', async () => {
  const canceled = new Set();
  const existing = ['daily-reminder', 'weekly-recap', 'trial-ending'].map((type) => ({ identifier: type, content: { data: { type } } }));
  const load = createLoader({
    'react-native': { Platform: { OS: 'ios' } },
    'expo-notifications': {
      setNotificationHandler() {}, getAllScheduledNotificationsAsync: async () => existing,
      getPresentedNotificationsAsync: async () => [],
      cancelScheduledNotificationAsync: async (id) => canceled.add(id),
    },
  });
  const notifications = load('src/services/notifications.ts');
  notifications.setNotificationsEnabled(true);
  await notifications.cancelTrainingReminders();
  assert.equal(notifications.notificationsEnabled(), false);
  assert.deepEqual([...canceled].sort(), ['daily-reminder', 'rest-done', 'trial-ending', 'weekly-recap']);
});
