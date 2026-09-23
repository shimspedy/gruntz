import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { GRUNTZ_PRIVACY_POLICY_URL, GRUNTZ_SUPPORT_URL, GRUNTZ_TERMS_OF_USE_URL } from '../config/legal';
import { Linking } from 'react-native';
import {
  cancelDailyReminder,
  cancelRestDone,
  cancelTrialEndingReminder,
  cancelWeeklyRecap,
  setNotificationsEnabled,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleWeeklyRecap,
  setupNotificationChannels,
} from '../services/notifications';
import { useReadinessStore } from '../store/useReadinessStore';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useExerciseNotesStore } from '../store/useExerciseNotesStore';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { convertSessionWeights, useSessionStore } from '../store/useSessionStore';
import { getAccessState, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import { notificationWeekdays, trainingWeekdays } from '../utils/trainingDays';
import { Group, NavHeader, Row } from '../ui/Layout';
import { Sheet } from '../ui/Sheet';
import { Tap } from '../ui/Pressable';
import { Icon } from '../ui/Icon';
import { Wordmark } from '../ui/Logo';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { space } from '../ui/tokens';
import { color } from '../ui/tokens';
import { openExternalUrl } from '../utils/externalLinks';
import { maybeRequestReview } from '../utils/socialActions';

/** Times people actually train. Settings said "change it anytime" while 07:00 was hardcoded. */
const REMINDER_TIMES = ['05:30', '06:00', '06:30', '07:00', '08:00', '12:00', '17:00', '18:00', '19:00', '20:00'];

function formatTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function SettingsScreen() {
  const [timeSheet, setTimeSheet] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const updateSettings = useUserStore((s) => s.updateSettings);
  const resetUser = useUserStore((s) => s.reset);
  const fieldMode = useReadinessStore((s) => s.fieldMode);
  const audioCues = useReadinessStore((s) => s.audioCues);
  const keepScreenAwake = useReadinessStore((s) => s.keepScreenAwake);
  const batterySaver = useReadinessStore((s) => s.batterySaver);
  const setField = useReadinessStore((s) => s.setFieldPreference);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const restore = useSubscriptionStore((s) => s.restoreAccess);
  const access = getAccessState({ trialStartedAt, entitlementActive });

  const notifications = profile?.settings.notifications_enabled ?? true;
  const imperial = (profile?.settings.units ?? 'imperial') === 'imperial';

  const open = async (url: string, label: string) => {
    const ok = await openExternalUrl(url);
    if (!ok) Alert.alert('Link unavailable', `Unable to open ${label.toLowerCase()} right now.`);
  };

  const toggleNotifications = async (v: boolean) => {
    try {
      if (v) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          updateSettings({ notifications_enabled: false });
          setNotificationsEnabled(false);
          Alert.alert('Notifications are off', 'Gruntz needs permission in Settings before it can remind you.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ]);
          return;
        }
        await setupNotificationChannels();
        // Turning reminders back on used to hardcode 07:00 and overwrite reminder_time,
        // silently discarding a time the athlete had chosen in the picker below.
        const savedTime = profile?.settings.reminder_time || '07:00';
        const [savedHour, savedMinute] = savedTime.split(':').map(Number);
        await scheduleDailyReminder(savedHour, savedMinute, notificationWeekdays(profile?.workout_days_per_week));
        await scheduleWeeklyRecap();
        updateSettings({ notifications_enabled: true, reminder_time: savedTime });
        setNotificationsEnabled(true);
        toast(`Reminders on · ${formatTime(savedTime)}`, { icon: 'bell' });
        return;
      }
      // Turning reminders off must silence everything, including the trial nudge and rest alert.
      await cancelDailyReminder();
      await cancelWeeklyRecap();
      await cancelTrialEndingReminder();
      await cancelRestDone();
      setNotificationsEnabled(false);
      updateSettings({ notifications_enabled: false });
    } catch {
      Alert.alert('Couldn’t update reminders', 'Try again in a moment.');
    }
  };

  const deleteAll = () => {
    haptic.warning();
    Alert.alert(
      'Delete all data?',
      'This erases your profile, workouts, streaks, challenges and achievements on this device. It can’t be undone. Your subscription is managed by the App Store and must be cancelled separately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                // Clear storage first so persist middleware can't flush stale state back.
                const keys = await AsyncStorage.getAllKeys();
                const ours = keys.filter((k) => k.startsWith('@gruntz'));
                if (ours.length) await AsyncStorage.multiRemove(ours);
                await SecureStore.deleteItemAsync('gruntz_assessment').catch(() => {});
                await Promise.all([cancelDailyReminder(), cancelWeeklyRecap(), cancelTrialEndingReminder(), cancelRestDone()]);
                setNotificationsEnabled(false);
                // Stores hold their own copies in memory; without this they re-persist after the wipe.
                useSessionStore.getState().discard();
                usePlanLibraryStore.getState().unfollow();
                useExerciseLogStore.setState({ logs: {} });
                useExerciseNotesStore.setState({ notes: {} });
                useSessionStore.getState().discard();
                // RootNavigator watches isOnboarded and returns to onboarding.
                resetUser();
              } catch {
                Alert.alert('Couldn’t erase all data', 'Try again, or reinstall the app to fully reset.');
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <NavHeader title="Settings" />
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + space.xxl }]} showsVerticalScrollIndicator={false}>
        <Group label="Profile and training">
          <Row icon="dumbbell" title="Training preferences" subtitle="Goals, days, session length, equipment" onPress={() => navigation.navigate('TrainingPreferences')} />
          <Row icon="flag" title="Service & test profile" onPress={() => navigation.navigate('ServiceProfile')} />
          <Row icon="calendar" title="Program" onPress={() => navigation.navigate('ProgramSelect')} />
          <Row
            icon="bell"
            title="Workout reminders"
            subtitle={notifications
              ? `${trainingWeekdays(profile?.workout_days_per_week).length}× a week at ${formatTime(profile?.settings.reminder_time ?? '07:00')}, weekly recap`
              : 'Off'}
            toggle={notifications}
            onToggle={(v) => void toggleNotifications(v)}
          />
          {notifications ? (
            <Row
              icon="timer"
              title="Reminder time"
              value={formatTime(profile?.settings.reminder_time ?? '07:00')}
              onPress={() => setTimeSheet(true)}
            />
          ) : null}
        </Group>

        <Group label="Preferences" style={styles.group}>
          <Row
            icon="gauge"
            title="Units"
            value={imperial ? 'Imperial · lb, mi' : 'Metric · kg, km'}
            onPress={() => {
              const to = imperial ? 'metric' : 'imperial';
              // Weights are stored as typed, so switching without converting would relabel
              // a 135 lb bench as "135 kg" and poison every record.
              Alert.alert(
                `Switch to ${to === 'metric' ? 'metric' : 'imperial'}?`,
                'Weights you already logged keep their real value and are converted for display.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Switch',
                    onPress: () => {
                      haptic.selection();
                      updateSettings({ units: to });
                      convertSessionWeights(to === 'metric' ? 'kg' : 'lb');
                    },
                  },
                ],
              );
            }}
          />
        </Group>

        <Group label="Field mode" style={styles.group}>
          <Row icon="sun" title="Field mode" subtitle="High contrast, simplified controls" toggle={fieldMode} onToggle={(v) => setField('fieldMode', v)} />
          <Row icon="speaker" title="Audio cues" subtitle="Spoken splits during runs and rucks" toggle={audioCues} onToggle={(v) => setField('audioCues', v)} />
          <Row icon="eye" title="Keep screen awake" subtitle="During workouts and tracked sessions" toggle={keepScreenAwake} onToggle={(v) => setField('keepScreenAwake', v)} />
          <Row icon="battery" title="Battery saver" subtitle="Lighter GPS sampling" toggle={batterySaver} onToggle={(v) => setField('batterySaver', v)} />
        </Group>

        <Group label="Membership" style={styles.group}>
          <Row icon="starFill" title={access === 'subscriber' ? 'Gruntz Pro' : 'Upgrade to Pro'} value={access === 'subscriber' ? 'Active' : undefined} onPress={() => navigation.navigate('Paywall')} />
          <Row
            icon="restart"
            title="Restore purchases"
            value={restoring ? 'Checking…' : undefined}
            onPress={() => {
              if (restoring) return;
              setRestoring(true);
              // Named per platform: this said "App Store"/"Apple ID" on Android too.
              const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
              const account = Platform.OS === 'ios' ? 'Apple ID' : 'Google account';
              void restore().finally(() => setRestoring(false)).then((r) => {
                if (r === 'restored') toast('Purchases restored');
                else if (r === 'none') Alert.alert('Nothing to restore', `No active Gruntz Pro subscription was found for this ${account}.`);
                // "unavailable" is not a connectivity problem, and saying so sent
                // users to check a connection that was never the issue.
                else if (r === 'unavailable') Alert.alert('Purchases unavailable', `In-app purchases aren't available on this device right now, so there's nothing to restore.`);
                else Alert.alert('Restore didn’t finish', `We couldn’t reach the ${store}. Check your connection and try again.`);
              });
            }}
          />
        </Group>

        <Group label="Support" style={styles.group}>
          <Row icon="mail" title="Contact support" onPress={() => void open(GRUNTZ_SUPPORT_URL, 'Support')} external />
          <Row icon="star" title="Leave us a review" onPress={() => void maybeRequestReview('settings')} />
        </Group>

        <Group label="Legal" style={styles.group}>
          <Row icon="doc" title="Privacy policy" onPress={() => void open(GRUNTZ_PRIVACY_POLICY_URL, 'Privacy Policy')} external />
          <Row icon="book" title="Terms of use" onPress={() => void open(GRUNTZ_TERMS_OF_USE_URL, 'Terms of Use')} external />
        </Group>

        <Group style={styles.group}>
          <Row icon="trash" title="Delete all data" tone="danger" onPress={deleteAll} />
        </Group>

        <View style={styles.footer}>
          <Wordmark height={40} />
          <Text variant="footnote" tone="tertiary" style={{ marginTop: space.sm }}>
            Version {Constants.expoConfig?.version ?? '1.0'}
          </Text>
        </View>
      </ScrollView>

      <Sheet visible={timeSheet} onClose={() => setTimeSheet(false)} title="Reminder time">
        <View style={{ paddingBottom: space.sm }}>
          {REMINDER_TIMES.map((t) => {
            const active = (profile?.settings.reminder_time ?? '07:00') === t;
            return (
              <Tap
                key={t}
                feedback="highlight"
                baseColor={color.bgRaised}
                pressedColor={color.surface}
                style={styles.timeRow}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  haptic.selection();
                  const [h, m] = t.split(':').map(Number);
                  void cancelDailyReminder()
                    .then(() => scheduleDailyReminder(h, m, notificationWeekdays(profile?.workout_days_per_week)))
                    .catch(() => undefined);
                  updateSettings({ reminder_time: t });
                  setTimeSheet(false);
                  toast(`Reminders at ${formatTime(t)}`, { icon: 'bell' });
                }}
              >
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {formatTime(t)}
                </Text>
                {active ? <Icon name="check" size={18} color={color.accent} weight="semibold" /> : null}
              </Tap>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  timeRow: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter },
  screen: { flex: 1, backgroundColor: color.bg },
  body: { paddingHorizontal: space.md, paddingTop: space.lg },
  group: { marginTop: space.xl },
  footer: { alignItems: 'center', marginTop: space.xxxl },
});
