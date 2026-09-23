import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import { useBarometerAltitude } from '../hooks/useBarometerAltitude';
import { useRunTracker } from '../hooks/useRunTracker';
import { useReadinessStore } from '../store/useReadinessStore';
import { KG_PER_LB } from '../store/useExerciseLogStore';
import { DEFAULT_BODY_WEIGHT_LBS } from '../hooks/useRunTracker';
import { useUserStore } from '../store/useUserStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { Chip, IconButton } from '../ui/Layout';
import { Segmented } from '../ui/Segmented';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
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
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'RunTracker'>>();
  const insets = useSafeAreaInsets();
  const batterySaver = useReadinessStore((s) => s.batterySaver);
  const keepAwake = useReadinessStore((s) => s.keepScreenAwake);
  const audioCues = useReadinessStore((s) => s.audioCues);
  const addSession = useReadinessStore((s) => s.addTrackedSession);
  const recordTrackedSession = useUserStore((s) => s.recordTrackedSession);
  const metric = useUserStore((s) => s.profile?.settings.units === 'metric');
  const [type, setType] = useState<'run' | 'ruck'>(params?.type ?? 'run');
  // The field is labelled in the athlete's own unit, so its default must be too:
  // a metric rucker was being offered a 35 "kg" pack (77 lb).
  const [pack, setPack] = useState(() => (useUserStore.getState().profile?.settings.units === 'metric' ? '16' : '35'));
  const [terrain, setTerrain] = useState('Mixed');
  /** `packWeightPounds` is stored in pounds whatever unit the athlete typed in. */
  const packToPounds = (raw: string, isMetric: boolean) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.round(isMetric ? n / KG_PER_LB : n);
  };

  const bodyWeightLbs = useUserStore((st) => st.profile?.body_weight_lbs) ?? DEFAULT_BODY_WEIGHT_LBS;
  const loadedWeightLbs = bodyWeightLbs + (type === 'ruck' ? packToPounds(pack, metric) ?? 0 : 0);
  const tracker = useRunTracker({ batterySaver, loadedWeightLbs });
  const baro = useBarometerAltitude();
  const announced = useRef(0);
  const [finished, setFinished] = useState(false);

  const idle = !tracker.isTracking && !finished;
  const dist = metric ? tracker.distanceMiles * 1.609 : tracker.distanceMiles;
  const unit = metric ? 'km' : 'mi';
  const elev = baro.elevationGainFt || tracker.elevationGainFt;

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

  const start = useCallback(async () => {
    haptic.medium();
    const ok = await tracker.start();
    if (!ok) {
      Alert.alert('Location needed', `Allow location access to track your ${type}: distance, pace and route.`);
      return;
    }
    await baro.start();
  }, [tracker, baro, type]);

  /**
   * Stop tracking and write the session to Stats.
   *
   * Both ways out of this screen end up here. The X used to call `tracker.stop()` and
   * navigate away without ever calling `addSession`, under an alert that promised
   * "End and save this session" — so a finished run was discarded with no warning.
   */
  const stopAndSave = useCallback(() => {
    const final = tracker.stop();
    baro.stop();
    addSession({
      id: `${Date.now()}-${type}`,
      type,
      date: new Date().toISOString(),
      distanceMiles: final.distanceMiles,
      durationSeconds: Math.round(final.durationMs / 1000),
      elevationFeet: baro.elevationGainFt || final.elevationGainFt,
      packWeightPounds: type === 'ruck' ? packToPounds(pack, metric) : undefined,
      terrain: type === 'ruck' ? terrain : undefined,
    });
    recordTrackedSession({ type, miles: final.distanceMiles, seconds: Math.round(final.durationMs / 1000) });
    haptic.success();
  }, [tracker, baro, addSession, recordTrackedSession, type, pack, terrain, metric]);

  const end = () => {
    const label = type === 'ruck' ? 'ruck' : 'run';
    Alert.alert(`End ${label}?`, 'Your session will be saved to Stats.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: `End ${label}`,
        style: 'destructive',
        onPress: () => {
          stopAndSave();
          setFinished(true);
        },
      },
    ]);
  };

  const close = () => {
    if (tracker.isTracking) {
      Alert.alert('Session in progress', 'End and save this session, or keep tracking.', [
        { text: 'Keep tracking', style: 'cancel' },
        {
          text: 'End session',
          style: 'destructive',
          onPress: () => {
            stopAndSave();
            navigation.goBack();
          },
        },
      ]);
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <IconButton icon="close" label="Close" onPress={close} tint={tracker.isTracking ? color.textQuaternary : color.text} />
        <View style={styles.titleRow}>
          {tracker.isTracking ? <Animated.View style={[styles.live, dotStyle, tracker.isPaused && { backgroundColor: color.flame }]} /> : null}
          <Text variant="headline" style={{ fontSize: 18 }}>
            {finished ? 'Session saved' : tracker.isPaused ? 'Paused' : tracker.isTracking ? (type === 'ruck' ? 'Rucking' : 'Running') : type === 'ruck' ? 'Ruck' : 'Run'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {idle ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.setup}>
            <Segmented value={type} onChange={setType} options={[{ value: 'run', label: 'Run' }, { value: 'ruck', label: 'Ruck' }]} />
            {type === 'ruck' ? (
              <Animated.View entering={FadeInDown.duration(260)} style={styles.ruck}>
                <View style={styles.packBox}>
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
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="subhead" tone="secondary" style={{ marginBottom: 8 }}>
                    Terrain
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['Road', 'Trail', 'Mixed'].map((t) => (
                      <Chip key={t} label={t} active={terrain === t} onPress={() => setTerrain(t)} />
                    ))}
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}

        <View style={styles.clockWrap}>
          <Text variant="subhead" tone="secondary">
            Time
          </Text>
          <Text style={styles.clock} tabular accessibilityLabel={`Elapsed ${clock(tracker.durationMs)}`}>
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
          <Small label="Steps" value={tracker.steps.toLocaleString()} />
          {/* The barometer reports feet; a metric athlete should not have to convert. */}
          <Small label="Elevation" value={metric ? `${Math.round(elev * 0.3048)} m` : `${elev} ft`} />
          <Small label="Calories (est.)" value={String(tracker.caloriesEstimate)} />
        </View>

        {baro.isActive && baro.currentAltitudeFt != null ? (
          <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.md }}>
            Altitude {metric ? `${Math.round(baro.currentAltitudeFt * 0.3048)} m` : `${baro.currentAltitudeFt} ft`} · {baro.currentPressure} hPa
          </Text>
        ) : null}

        {idle ? (
          <Text variant="footnote" tone="tertiary" align="center" style={styles.note}>
            {batterySaver ? 'Battery saver: balanced GPS sampling.' : 'Precision GPS.'} Check weather, route, water and local conditions before you step off.
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: insets.bottom + space.xs }]}>
        {finished ? (
          <Button
            title="Done"
            onPress={() => {
              toast(`${type === 'ruck' ? 'Ruck' : 'Run'} saved to Stats`);
              navigation.goBack();
            }}
          />
        ) : !tracker.isTracking ? (
          <Button title={`Start ${type}`} icon="play" onPress={() => void start()} />
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {tracker.isPaused ? (
              <Button
                title="Resume"
                icon="play"
                style={{ flex: 1 }}
                onPress={async () => {
                  const ok = await tracker.resume();
                  if (!ok) Alert.alert('Can’t resume', 'Check location access and try again.');
                  else await baro.resume();
                }}
              />
            ) : (
              <Button
                title="Pause"
                icon="pause"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => {
                  tracker.pause();
                  baro.stop();
                }}
              />
            )}
            <Button title="End" icon="stop" variant="secondary" style={{ flex: 1 }} onPress={end} />
          </View>
        )}
      </View>
    </View>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.bigValue} tabular>
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
  controls: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, paddingTop: space.md, backgroundColor: color.bg },
});
