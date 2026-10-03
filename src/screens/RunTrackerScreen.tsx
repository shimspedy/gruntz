import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { useRunTracker, type RunTrackerState } from '../hooks/useRunTracker';
import { initializeActivityTracking } from '../services/activityTracking';
import { scheduleBackup } from '../services/backup';
import { flushReadinessPersistence, useReadinessStore } from '../store/useReadinessStore';
import { KG_PER_LB } from '../store/useExerciseLogStore';
import { DEFAULT_BODY_WEIGHT_LBS } from '../hooks/useRunTracker';
import { flushUserPersistence, useUserStore } from '../store/useUserStore';
import { ActivityRouteMap } from '../components/activity/ActivityRouteMap';
import type { RootStackParamList } from '../types/navigation';
import type { ActivityType } from '../types/activity';
import { Button } from '../ui/Button';
import { Chip, IconButton } from '../ui/Layout';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, font, motion, radius, space } from '../ui/tokens';

const AWAKE = 'gruntz-field-session';

function clock(ms: number) {
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function pace(minPerMile: number | null, metric: boolean) {
  if (minPerMile == null || minPerMile <= 0 || minPerMile > 60) return '--:--';
  const v = metric ? minPerMile / 1.609 : minPerMile;
  let m = Math.floor(v);
  let s = Math.round((v - m) * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RunTrackerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'RunTracker'>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RunTracker'>>();
  const insets = useSafeAreaInsets();
  const batterySaver = useReadinessStore((s) => s.batterySaver);
  const keepAwake = useReadinessStore((s) => s.keepScreenAwake);
  const audioCues = useReadinessStore((s) => s.audioCues);
  const addSession = useReadinessStore((s) => s.addTrackedSession);
  const recordTrackedSession = useUserStore((s) => s.recordTrackedSession);
  const metric = useUserStore((s) => s.profile?.settings.units === 'metric');
  const [type, setType] = useState<ActivityType>(params?.type ?? 'run');
  // The field is labelled in the athlete's own unit, so its default must be too:
  // a metric rucker was being offered a 35 "kg" pack (77 lb).
  const [pack, setPack] = useState(() => (useUserStore.getState().profile?.settings.units === 'metric' ? '16' : '35'));
  const [terrain, setTerrain] = useState('Mixed');
  const [backgroundTracking, setBackgroundTracking] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  /** `packWeightPounds` is stored in pounds whatever unit the athlete typed in. */
  const packToPounds = (raw: string, isMetric: boolean) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.round(isMetric ? n / KG_PER_LB : n);
  };

  const bodyWeightLbs = useUserStore((st) => st.profile?.body_weight_lbs) ?? DEFAULT_BODY_WEIGHT_LBS;
  const loadedWeightLbs = bodyWeightLbs + (type === 'ruck' ? packToPounds(pack, metric) ?? 0 : 0);
  const recorder = useRunTracker({ batterySaver, loadedWeightLbs, activityType: type, backgroundTracking, packWeightPounds: type === 'ruck' ? packToPounds(pack, metric) : undefined, terrain: type !== 'run' ? terrain : undefined });
  const announced = useRef(0);
  const [finished, setFinished] = useState(false);
  const [finishedMetrics, setFinishedMetrics] = useState<RunTrackerState | null>(null);
  const tracker = finished && finishedMetrics ? { ...recorder, ...finishedMetrics } : recorder;
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const promptOpen = useRef(false);
  const saved = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const idle = tracker.ready && !tracker.isTracking && !tracker.sessionId && !finished;
  const dist = metric ? tracker.distanceMiles * 1.609 : tracker.distanceMiles;
  const unit = metric ? 'km' : 'mi';
  const elev = tracker.elevationGainFt;
  // An interrupted activity restores its original mode and pack, not the new
  // route's defaults. Setup cannot relabel a recording already in progress.
  const recoveredId = useRef<string | null>(null);
  useEffect(() => {
    if (!tracker.ready || !tracker.sessionId || recoveredId.current === tracker.sessionId) return;
    recoveredId.current = tracker.sessionId;
    setType(tracker.activityType);
    if (tracker.packWeightPounds) setPack(String(metric ? Math.round(tracker.packWeightPounds * KG_PER_LB) : tracker.packWeightPounds));
    if (tracker.terrain) setTerrain(tracker.terrain);
  }, [tracker.ready, tracker.isTracking, tracker.sessionId, tracker.activityType, tracker.packWeightPounds, tracker.terrain, metric]);

  useEffect(() => {
    if (tracker.isTracking && keepAwake) {
      void activateKeepAwakeAsync(AWAKE);
      return () => void deactivateKeepAwake(AWAKE);
    }
    return undefined;
  }, [tracker.isTracking, keepAwake]);

  useEffect(() => {
    if (!tracker.isTracking) {
      announced.current = 0;
      return;
    }
    const whole = Math.floor(dist);
    if (audioCues && whole > announced.current) {
      announced.current = whole;
      Speech.speak(`${metric ? 'Kilometer' : 'Mile'} ${whole}. Pace ${pace(tracker.paceMinPerMile, metric)}.`, {
        rate: 0.92,
        // The system's own speech session ducks music under the cue, then restores it (like Maps).
        useApplicationAudioSession: false,
      });
      haptic.success();
    }
  }, [tracker.isTracking, dist, tracker.paceMinPerMile, audioCues, metric]);

  // The live dot breathes while GPS is recording.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (tracker.isTracking && !tracker.isPaused) {
      pulse.set(withRepeat(withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })), -1));
    } else {
      pulse.set(withTiming(1, { duration: 200 }));
    }
  }, [tracker.isTracking, tracker.isPaused, pulse]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  const begin = useCallback(async (recordInBackground: boolean) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    haptic.medium();
    try {
      const ok = await tracker.start({ backgroundTracking: recordInBackground });
      if (!mounted.current) return;
      if (!ok) {
        Alert.alert('Unable to start', tracker.error ?? `Check location access and GPS availability, then try your ${type} again.`);
        return;
      }
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  }, [tracker, type]);

  const start = async () => {
    if (pendingRef.current || promptOpen.current || !tracker.ready) return;
    if (!backgroundTracking) return begin(false);
    promptOpen.current = true;
    const permission = await Location.getBackgroundPermissionsAsync().catch(() => null);
    if (permission?.granted) { promptOpen.current = false; return begin(true); }
    Alert.alert('Record with your screen locked', 'Gruntz needs Always location access to save your route while the screen is locked or you use another app. Location is recorded only during an activity you start. Ending it stops recording. Force-closing the app can interrupt recording.', [
      { text: 'Cancel', style: 'cancel', onPress: () => { promptOpen.current = false; } },
      { text: 'Foreground only', onPress: () => { promptOpen.current = false; setBackgroundTracking(false); void begin(false); } },
      { text: 'Continue', onPress: () => { promptOpen.current = false; void begin(true); } },
    ]);
  };

  const resume = async (enableBackground?: boolean) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      const ok = await recorder.resume(enableBackground === true ? { backgroundTracking: true } : undefined);
      if (mounted.current && !ok) Alert.alert('Can’t resume', 'Check location access and try again.');
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  };

  const enableBackground = () => Alert.alert('Enable background recording', 'Allow Always location access so your active route continues with the screen locked or while you use another app. Gruntz records only during this activity.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', onPress: () => void resume(true) },
  ]);

  /**
   * Stop tracking and write the session to Stats.
   *
   * Both ways out of this screen end up here. The X used to call `tracker.stop()` and
   * navigate away without ever calling `addSession`, under an alert that promised
   * "End and save this session" — so a finished run was discarded with no warning.
   */
  const stopAndSave = useCallback(async () => {
    if (saved.current || pendingRef.current) return;
    saved.current = true;
    pendingRef.current = true;
    setPending(true);
    try {
      const final = await tracker.stop();
      const id = final.sessionId;
      if (!id) throw new Error('No recorded activity was found.');
      const added = addSession({
        id,
        type: final.activityType,
        date: new Date().toISOString(),
        startedAt: new Date(final.startedAt ?? Date.now()).toISOString(),
        distanceMiles: final.distanceMiles,
        durationSeconds: Math.round(final.durationMs / 1000),
        elevationFeet: final.elevationGainFt,
        packWeightPounds: final.activityType === 'ruck' ? final.packWeightPounds : undefined,
        terrain: final.terrain ?? undefined,
        route: final.route,
        steps: final.steps,
        stepsLimited: final.stepsLimited,
        caloriesEstimate: final.caloriesEstimate,
      });
      if (!added && !useReadinessStore.getState().trackedSessions.some((session) => session.id === id)) throw new Error('This activity could not be saved. Your recording is kept for retry.');
      recordTrackedSession({ id, type: final.activityType, miles: final.distanceMiles, seconds: Math.round(final.durationMs / 1000) });
      // Keep the finished draft until the history store has persisted. A storage
      // failure can then be retried using the same ID without duplicate totals.
      await Promise.all([flushReadinessPersistence(), flushUserPersistence()]);
      await tracker.clearFinished();
      scheduleBackup();
      if (mounted.current) { setSavedId(id); setFinishedMetrics(final); setFinished(true); }
      haptic.success();
    } catch (error) {
      saved.current = false;
      if (mounted.current) Alert.alert('Couldn’t save the activity', error instanceof Error ? error.message : 'Try again. Your recording is kept on this device.');
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  }, [tracker, addSession, recordTrackedSession]);

  const end = () => {
    const label = type;
    Alert.alert(`End ${label}?`, 'Your route and stats will be saved to Activity history.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: `End ${label}`,
        style: 'destructive',
        onPress: () => void stopAndSave(),
      },
    ]);
  };

  const close = () => {
    if (pendingRef.current) return;
    if (!tracker.isTracking) return navigation.goBack();
    Alert.alert('Activity in progress', tracker.isPaused ? 'Your activity will stay paused. Open the + menu to return and resume.' : tracker.backgroundEnabled ? 'Recording will continue. Open the + menu to return to your activity.' : 'Your activity stays open in Gruntz. Keep the app in the foreground to record location.', [
      { text: 'Stay here', style: 'cancel' },
      { text: tracker.isPaused ? 'Leave paused' : 'Keep recording', onPress: () => navigation.goBack() },
      { text: 'End & save', onPress: () => void stopAndSave() },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <IconButton icon="close" label="Close" onPress={close} tint={tracker.isTracking ? color.textQuaternary : color.text} />
        <View style={styles.titleRow}>
          {tracker.isTracking ? <Animated.View style={[styles.live, dotStyle, tracker.isPaused && { backgroundColor: color.flame }]} /> : null}
          <Text variant="headline" style={{ fontSize: 18 }}>
            {finished ? 'Activity saved' : tracker.isPaused ? 'Paused' : tracker.isTracking ? (type === 'ruck' ? 'Rucking' : type === 'hike' ? 'Hiking' : 'Running') : type === 'ruck' ? 'Ruck' : type === 'hike' ? 'Hike' : 'Run'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {idle ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.setup}>
            <Segmented value={type} onChange={setType} options={[{ value: 'run', label: 'Run' }, { value: 'ruck', label: 'Ruck' }, { value: 'hike', label: 'Hike' }]} />
            {type !== 'run' ? (
              <Animated.View entering={FadeInDown.duration(260)} style={styles.ruck}>
                {type === 'ruck' ? <View style={styles.packBox}>
                  <Text variant="subhead" tone="secondary">
                    Pack ({metric ? 'kg' : 'lb'})
                  </Text>
                  <TextInput
                    value={pack}
                    onChangeText={setPack}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={styles.packInput}
                    selectionColor={color.accent}
                    accessibilityLabel={metric ? 'Pack weight in kilograms' : 'Pack weight in pounds'}
                  />
                </View> : null}
                <View style={{ flex: 1 }}>
                  <Text variant="subhead" tone="secondary" style={{ marginBottom: 8 }}>
                    Terrain
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['Road', 'Trail', 'Mixed'].map((t) => (
                      <Chip key={t} label={t} active={terrain === t} onPress={() => setTerrain(t)} />
                    ))}
                  </View>
                </View>
              </Animated.View>
            ) : null}
            <View style={styles.backgroundRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">Record with screen locked</Text>
                <Text variant="caption" tone="tertiary" style={{ marginTop: 3 }}>Uses background location during this activity</Text>
              </View>
              <Switch value={backgroundTracking} onValueChange={setBackgroundTracking} trackColor={{ true: color.accent }} accessibilityLabel="Record with screen locked" />
            </View>
          </Animated.View>
        ) : null}

        <View style={styles.clockWrap}>
          <Text variant="subhead" tone="secondary">
            Time
          </Text>
          <Text style={styles.clock} tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} accessibilityLabel={`Elapsed ${clock(tracker.durationMs)}`}>
            {clock(tracker.durationMs)}
          </Text>
        </View>

        <View style={styles.primary}>
          <Big label={unit === 'km' ? 'Kilometers' : 'Miles'} value={dist.toFixed(2)} />
          <View style={styles.vr} />
          <Big label={`Pace /${unit}`} value={pace(tracker.paceMinPerMile, metric)} />
          <View style={styles.vr} />
          <Big label={metric ? 'km/h' : 'mph'} value={tracker.currentSpeedMph != null ? (metric ? tracker.currentSpeedMph * 1.609 : tracker.currentSpeedMph).toFixed(1) : '--'} />
        </View>

        <View style={styles.secondary}>
          <Small label={tracker.stepsLimited ? 'Steps (partial)' : 'Steps'} value={tracker.steps.toLocaleString()} />
          {/* Recorded GPS ascent is kept in feet; display the athlete's unit. */}
          <Small label="Elevation" value={metric ? `${Math.round(elev * 0.3048)} m` : `${elev} ft`} />
          <Small label="Calories (est.)" value={String(tracker.caloriesEstimate)} />
        </View>

        {tracker.route.length > 0 ? <View style={styles.routePanel}><ActivityRouteMap route={tracker.route} tint={color.accent} height={250} fitRoute /></View> : null}

        {idle ? (
          <Text variant="footnote" tone="tertiary" align="center" style={styles.note}>
            {batterySaver ? 'Battery saver: balanced GPS sampling.' : 'Precision GPS.'} {backgroundTracking ? 'Keep your route recording while your screen is locked. Always location access is required.' : 'Foreground recording pauses when you leave the app.'}
          </Text>
        ) : null}
        {tracker.sessionId && !finished ? (
          <View style={styles.statusBox}>
            <Text variant="subhead" tone={tracker.isTracking && tracker.backgroundEnabled ? 'accent' : 'secondary'}>{!tracker.isTracking ? 'Recording ended — save your activity' : tracker.isPaused ? 'Recording paused' : tracker.backgroundEnabled ? 'Background recording on' : 'Foreground recording only'}</Text>
            <Text variant="caption" tone="tertiary" style={{ marginTop: 5 }}>{!tracker.isTracking ? 'Your recorded route is kept on this device. Save it to add it to Activity history.' : tracker.isPaused ? 'Resume when you are ready. Paused movement is excluded.' : tracker.backgroundEnabled ? 'You can lock your screen or use another app. End this activity to stop location recording.' : 'Keep Gruntz open to record GPS. Pause, then enable background recording below to continue with the screen locked.'}</Text>
            {tracker.recoveryNotice ? <Text variant="caption" tone="secondary" style={{ marginTop: 8 }}>{tracker.recoveryNotice}</Text> : null}
            {tracker.error ? <Text variant="caption" tone="secondary" style={{ marginTop: 8 }}>{tracker.error}</Text> : null}
            {tracker.isTracking && tracker.isPaused && !tracker.backgroundEnabled ? <Button title="Enable background recording" variant="secondary" onPress={enableBackground} disabled={pending} style={{ marginTop: 12 }} /> : null}
            {tracker.isTracking && !tracker.backgroundEnabled ? <Button title="Open location settings" variant="secondary" onPress={() => void Linking.openSettings().catch(() => Alert.alert('Settings unavailable', 'Open your device settings and select Gruntz.'))} style={{ marginTop: 12 }} /> : null}
          </View>
        ) : null}
        {tracker.error && !tracker.sessionId ? <View style={styles.statusBox}><Text variant="footnote" tone="secondary">{tracker.error}</Text><Button title="Retry saved activity" variant="secondary" onPress={() => void initializeActivityTracking()} style={{ marginTop: 12 }} /></View> : null}
        {idle ? <Button title="Activity history" variant="secondary" icon="mapPin" onPress={() => navigation.navigate('ActivityHistory')} style={{ marginHorizontal: space.md, marginTop: space.lg }} /> : null}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: insets.bottom + space.xs }]}>
        {finished ? (
          <View style={{ gap: 8 }}>
            <Button title="View activity & share" icon="share" onPress={() => savedId && navigation.replace('ActivityDetail', { sessionId: savedId })} />
            <Button title="Done" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        ) : tracker.sessionId && !tracker.isTracking ? (
          <Button title="Save recovered activity" icon="check" loading={pending} onPress={() => void stopAndSave()} />
        ) : !tracker.isTracking ? (
          <Button title={tracker.ready ? `Start ${type}` : 'Loading activity…'} icon="play" loading={pending || !tracker.ready} disabled={!tracker.ready} onPress={() => void start()} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {tracker.isPaused ? (
              <Button
                title="Resume"
                icon="play"
                style={{ flex: 1 }}
                loading={pending}
                onPress={() => void resume()}
              />
            ) : (
              <Button
                title="Pause"
                icon="pause"
                variant="secondary"
                style={{ flex: 1 }}
                disabled={pending}
                onPress={async () => {
                  if (pendingRef.current) return;
                  pendingRef.current = true;
                  setPending(true);
                  try { await tracker.pause(); }
                  catch { Alert.alert('Couldn’t pause', 'Try again. Your recording is still available.'); }
                  finally { pendingRef.current = false; if (mounted.current) setPending(false); }
                }}
              />
            )}
            <Button title="End" icon="stop" variant="secondary" style={{ flex: 1 }} disabled={pending} onPress={end} />
          </View>
        )}
      </View>
    </View>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.bigValue} tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
        {value}
      </Text>
      <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function Small({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.small}>
      <Text variant="footnote" tone="tertiary">
        {label}
      </Text>
      <Text variant="headline" tabular style={{ marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  top: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  live: { width: 9, height: 9, borderRadius: 5, backgroundColor: color.success },
  setup: { paddingHorizontal: space.md, marginTop: space.sm },
  ruck: { flexDirection: 'row', gap: space.md, marginTop: space.md, alignItems: 'flex-start' },
  packBox: { width: 96 },
  packInput: {
    height: 44,
    marginTop: 8,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    color: color.text,
    fontFamily: font.semibold,
    fontSize: 20,
    textAlign: 'center',
  },
  clockWrap: { alignItems: 'center', marginTop: space.xxl },
  clock: { fontFamily: font.heavy, fontSize: 84, lineHeight: 96, color: color.text, letterSpacing: -2 },
  primary: { flexDirection: 'row', marginHorizontal: space.md, marginTop: space.xl, paddingVertical: space.lg, borderRadius: radius.lg, backgroundColor: color.surface },
  vr: { width: StyleSheet.hairlineWidth, backgroundColor: color.line },
  bigValue: { fontFamily: font.bold, fontSize: 30, color: color.text },
  secondary: { flexDirection: 'row', gap: 12, marginHorizontal: space.md, marginTop: 12 },
  small: { flex: 1, padding: space.md, borderRadius: radius.md, backgroundColor: color.bgRaised },
  note: { marginTop: space.xl, paddingHorizontal: space.xxl },
  backgroundRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginTop: space.sm },
  statusBox: { marginHorizontal: space.md, marginTop: space.lg, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: color.line, backgroundColor: color.bgRaised },
  routePanel: { marginHorizontal: space.md, marginTop: space.lg, overflow: 'hidden', borderRadius: radius.lg },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
});
