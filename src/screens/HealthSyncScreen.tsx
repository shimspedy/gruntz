import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  connectHealth, disconnectHealth, healthAvailability, healthPlatformName, healthWriteDenied, openHealthSettings, runHealthSync, type HealthAvailability,
} from '../services/healthSync';
import { useHealthStore } from '../store/useHealthStore';
import { Button } from '../ui/Button';
import { Group, NavHeader, Row } from '../ui/Layout';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, space } from '../ui/tokens';
import { relativeTime } from '../utils/relativeTime';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Connects Gruntz to Apple Health or Health Connect, which is how a watch's workouts and heart rate get here. */
export default function HealthSyncScreen() {
  const insets = useSafeAreaInsets();
  const connected = useHealthStore((s) => s.connected);
  const writeActivities = useHealthStore((s) => s.writeActivities);
  const importWorkouts = useHealthStore((s) => s.importWorkouts);
  const lastSyncAt = useHealthStore((s) => s.lastSyncAt);
  const setPreference = useHealthStore((s) => s.setPreference);
  const [availability, setAvailability] = useState<HealthAvailability | null>(null);
  const [busy, setBusy] = useState(false);
  // Read on every render: it changes after the permission sheet and after a trip to Settings.
  const writeDenied = connected && writeActivities && healthWriteDenied();

  useEffect(() => {
    let current = true;
    void healthAvailability().then((next) => { if (current) setAvailability(next); });
    return () => { current = false; };
  }, []);

  const connect = async () => {
    setBusy(true);
    const granted = await connectHealth();
    setBusy(false);
    if (granted) { haptic.success(); toast(`${healthPlatformName} connected`); return; }
    // iOS answers the sheet without saying what was allowed; this alert is Android's.
    Alert.alert(`${healthPlatformName} not connected`, `Gruntz was not given access. You can allow it in ${healthPlatformName} and try again.`, [
      { text: 'Not now', style: 'cancel' },
      { text: `Open ${healthPlatformName}`, onPress: openHealthSettings },
    ]);
  };

  const sync = async () => {
    setBusy(true);
    const result = await runHealthSync();
    setBusy(false);
    if (!result || result.stopped) { toast('Sync didn’t finish. Try again.', { tone: 'info', icon: 'alert' }); return; }
    if (result.readFailed) {
      toast(`${healthPlatformName} wouldn’t share workouts. Check Manage access.`, { tone: 'info', icon: 'alert' });
      return;
    }
    haptic.success();
    const parts = [
      result.imported ? `${count(result.imported, 'workout', 'workouts')} imported` : null,
      result.exported ? `${count(result.exported, 'activity', 'activities')} saved` : null,
      result.heartRates ? `heart rate added to ${count(result.heartRates, 'activity', 'activities')}` : null,
    ].filter(Boolean);
    toast(parts.length ? parts.join(' · ') : 'Everything is up to date');
  };

  const disconnect = () => Alert.alert(`Disconnect ${healthPlatformName}?`, `Gruntz will stop reading and saving. Activities already saved to ${healthPlatformName} stay there, and workouts already imported stay in your history.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Disconnect', style: 'destructive', onPress: disconnectHealth },
  ]);

  return (
    <View style={styles.screen}>
      <NavHeader title={healthPlatformName} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl, paddingHorizontal: space.md }} showsVerticalScrollIndicator={false}>
        <Text variant="callout" tone="secondary" style={styles.intro}>
          {Platform.OS === 'ios'
            ? 'Apple Watch, Garmin, Whoop and most other wearables save to Apple Health. Connect it and their runs, hikes and heart rate show up in your Activity history.'
            : 'Pixel Watch, Galaxy Watch, Garmin, Fitbit and most other wearables save to Health Connect. Connect it and their runs, hikes and heart rate show up in your Activity history.'}
        </Text>

        {availability === 'unavailable' ? (
          <Text variant="callout" tone="secondary" style={styles.note}>
            {healthPlatformName} isn’t available on this device.
          </Text>
        ) : availability === 'needsUpdate' ? (
          <>
            <Text variant="callout" tone="secondary" style={styles.note}>
              Health Connect needs to be installed or updated before Gruntz can use it.
            </Text>
            <Button title="Open Health Connect" variant="secondary" onPress={openHealthSettings} style={styles.action} />
          </>
        ) : !connected ? (
          <Button title={Platform.OS === 'ios' ? 'Connect Apple Health' : 'Connect'} loading={busy || availability === null} onPress={() => { void connect(); }} style={styles.action} />
        ) : (
          <>
            <Group style={styles.group}>
              <Row icon="send" title="Save my activities" subtitle={writeDenied ? `${healthPlatformName} is not allowing Gruntz to save. Turn it on under Manage access.` : `Runs, rucks and hikes you record go to ${healthPlatformName}`} toggle={writeActivities} onToggle={(v) => setPreference('writeActivities', v)} />
              <Row icon="heart" title="Import workouts and heart rate" subtitle="Runs and hikes from your watch, and heart rate for your activities" toggle={importWorkouts} onToggle={(v) => setPreference('importWorkouts', v)} />
            </Group>
            <Group style={styles.group}>
              <Row icon="restart" title="Sync now" value={busy ? 'Syncing…' : lastSyncAt ? relativeTime(lastSyncAt) : 'Not yet'} chevron={false} onPress={busy ? undefined : () => { void sync(); }} />
              <Row icon="shield" title="Manage access" subtitle={`Choose what Gruntz can read and save in ${healthPlatformName}`} onPress={openHealthSettings} external />
            </Group>
            <Group style={styles.group}>
              <Row title={Platform.OS === 'ios' ? 'Disconnect Apple Health' : 'Disconnect'} tone="danger" chevron={false} onPress={disconnect} />
            </Group>
          </>
        )}

        <Text variant="footnote" tone="tertiary" style={styles.footnote}>
          Workouts and heart rate that come from {healthPlatformName} stay on this phone. They are left out of cloud backup and are never shared.
          {Platform.OS === 'ios' ? ' A ruck is saved to Apple Health as a hike.' : ' A ruck is saved to Health Connect as a hike.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  intro: { paddingHorizontal: 6, marginTop: space.sm },
  note: { paddingHorizontal: 6, marginTop: space.lg },
  action: { marginTop: space.xl },
  group: { marginTop: space.xl },
  footnote: { paddingHorizontal: 6, marginTop: space.xl },
});
