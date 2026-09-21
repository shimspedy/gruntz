import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { GRUNTZ_PRIVACY_POLICY_URL, GRUNTZ_SUPPORT_URL, GRUNTZ_TERMS_OF_USE_URL } from '../config/legal';
import {
  cancelDailyReminder,
  cancelWeeklyRecap,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleWeeklyRecap,
  setupNotificationChannels,
} from '../services/notifications';
import { useReadinessStore } from '../store/useReadinessStore';
import { useSessionStore } from '../store/useSessionStore';
import { getAccessState, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import { Group, NavHeader, Row } from '../ui/Layout';
import { Wordmark } from '../ui/Logo';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { space } from '../ui/tokens';
import { color } from '../ui/tokens';
import { openExternalUrl } from '../utils/externalLinks';
import { maybeRequestReview } from '../utils/socialActions';

export default function SettingsScreen() {
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
          Alert.alert('Notifications are off', 'Turn on notifications for Gruntz in iOS Settings to get mission reminders.');
          return;
        }
        await setupNotificationChannels();
        await scheduleDailyReminder(7, 0);
        await scheduleWeeklyRecap();
        updateSettings({ notifications_enabled: true, reminder_time: '07:00' });
        toast('Reminders on · 7:00 AM daily', { icon: 'bell' });
        return;
      }
      await cancelDailyReminder();
      await cancelWeeklyRecap();
      updateSettings({ notifications_enabled: false });
    } catch {
      Alert.alert('Couldn’t update reminders', 'Try again in a moment.');
    }
  };

  const deleteAll = () => {
    haptic.warning();
    Alert.alert(
      'Delete all data?',
      'This erases your profile, missions, streaks, challenges and achievements on this device. It can’t be undone. Your subscription is managed by the App Store and must be cancelled separately.',
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
                await Promise.all([cancelDailyReminder(), cancelWeeklyRecap()]);
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
          <Row icon="flag" title="Service & test profile" onPress={() => navigation.navigate('ServiceProfile')} />
          <Row icon="calendar" title="Program" onPress={() => navigation.navigate('ProgramSelect')} />
          <Row icon="bell" title="Mission reminders" subtitle="Daily at 7:00 AM, weekly recap" toggle={notifications} onToggle={(v) => void toggleNotifications(v)} />
        </Group>

        <Group label="Preferences" style={styles.group}>
          <Row
            icon="gauge"
            title="Units"
            value={imperial ? 'Imperial · lb, mi' : 'Metric · kg, km'}
            onPress={() => {
              haptic.selection();
              updateSettings({ units: imperial ? 'metric' : 'imperial' });
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
            onPress={() => {
              void restore().then((r) => {
                if (r === 'restored') toast('Purchases restored');
                else Alert.alert('Nothing to restore', 'No active Gruntz Pro subscription was found for this Apple ID.');
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { paddingHorizontal: space.md, paddingTop: space.lg },
  group: { marginTop: space.xl },
  footer: { alignItems: 'center', marginTop: space.xxxl },
});
