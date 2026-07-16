import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { useRunTracker } from '../hooks/useRunTracker';
import { useBarometerAltitude } from '../hooks/useBarometerAltitude';
import { useFloatingTabBarSpacing } from '../hooks/useFloatingTabBarSpacing';
import { hapticLight, hapticSuccess, hapticMedium } from '../utils/haptics';
import { useReadinessStore } from '../store/useReadinessStore';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';

const TRACKER_AWAKE_TAG = 'gruntz-field-session';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatPace(minPerMile: number | null): string {
  if (minPerMile == null || minPerMile <= 0 || minPerMile > 60) return '--:--';
  let mins = Math.floor(minPerMile);
  let secs = Math.round((minPerMile - mins) * 60);
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function RunTrackerScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const batterySaver = useReadinessStore((s) => s.batterySaver);
  const keepScreenAwake = useReadinessStore((s) => s.keepScreenAwake);
  const audioCues = useReadinessStore((s) => s.audioCues);
  const fieldMode = useReadinessStore((s) => s.fieldMode);
  const addTrackedSession = useReadinessStore((s) => s.addTrackedSession);
  const [sessionType, setSessionType] = useState<'run' | 'ruck'>('run');
  const [packWeight, setPackWeight] = useState('35');
  const [terrain, setTerrain] = useState('Mixed');
  const tracker = useRunTracker({ batterySaver });
  const announcedMile = useRef(0);
  const baro = useBarometerAltitude();
  const { insets } = useFloatingTabBarSpacing();
  const controlsBottomPad = Math.max(spacing.md, insets.bottom + spacing.md);
  const scrollBottomPad = controlsBottomPad + 120; // clearance for controls bar

  useEffect(() => {
    if (tracker.isTracking && keepScreenAwake) {
      void activateKeepAwakeAsync(TRACKER_AWAKE_TAG);
      return () => { void deactivateKeepAwake(TRACKER_AWAKE_TAG); };
    }
    void deactivateKeepAwake(TRACKER_AWAKE_TAG);
    return undefined;
  }, [tracker.isTracking, keepScreenAwake]);

  useEffect(() => {
    if (!tracker.isTracking) {
      announcedMile.current = 0;
      return;
    }
    const wholeMiles = Math.floor(tracker.distanceMiles);
    if (audioCues && wholeMiles > announcedMile.current) {
      announcedMile.current = wholeMiles;
      const pace = formatPace(tracker.paceMinPerMile);
      Speech.speak(`Mile ${wholeMiles}. Pace ${pace} per mile.`, { rate: 0.92 });
    }
  }, [tracker.isTracking, tracker.distanceMiles, tracker.paceMinPerMile, audioCues]);

  const handleStart = useCallback(async () => {
    hapticMedium();
    const started = await tracker.start();
    if (!started) {
      Alert.alert(
        'Location required',
        `Allow location access to track your ${sessionType}, distance, pace, and route.`
      );
      return;
    }
    await baro.start();
  }, [tracker, baro, sessionType]);

  const handlePause = useCallback(() => {
    hapticLight();
    tracker.pause();
    baro.stop();
  }, [tracker, baro]);

  const handleResume = useCallback(async () => {
    hapticLight();
    const resumed = await tracker.resume();
    if (!resumed) {
      Alert.alert(
        'Unable to resume',
        'Check location access and try again.'
      );
      return;
    }

    const barometerResumed = await baro.resume();
    if (!barometerResumed) {
      // GPS tracker remains active; altitude will fall back to GPS gain only.
    }
  }, [tracker, baro]);

  const handleStop = useCallback(() => {
    const label = sessionType === 'ruck' ? 'Ruck' : 'Run';
    Alert.alert(`End ${label}?`, `This will stop tracking your ${label.toLowerCase()}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: `End ${label}`,
        style: 'destructive',
        onPress: () => {
          hapticSuccess();
          const final = tracker.stop();
          baro.stop();
          addTrackedSession({
            id: `${Date.now()}-${sessionType}`,
            type: sessionType,
            date: new Date().toISOString(),
            distanceMiles: final.distanceMiles,
            durationSeconds: Math.round(final.durationMs / 1000),
            elevationFeet: baro.elevationGainFt || final.elevationGainFt,
            packWeightPounds: sessionType === 'ruck' ? Number(packWeight) || undefined : undefined,
            terrain: sessionType === 'ruck' ? terrain : undefined,
          });
        },
      },
    ]);
  }, [tracker, baro, sessionType, addTrackedSession, packWeight, terrain]);

  // Use barometer elevation if available, fall back to GPS elevation
  const elevationGain = baro.elevationGainFt || tracker.elevationGainFt;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}>
        {!tracker.isTracking && tracker.distanceMiles === 0 && (
          <View style={[styles.setupCard, fieldMode && styles.fieldSetupCard]}>
            <Text style={styles.setupKicker}>FIELD SESSION</Text>
            <View style={styles.segmentRow}>
              {(['run', 'ruck'] as const).map((type) => (
                <TouchableOpacity key={type} style={[styles.segment, sessionType === type && styles.segmentActive]} onPress={() => setSessionType(type)}>
                  <Ionicons name={type === 'ruck' ? 'bag-handle-outline' : 'walk-outline'} size={18} color={sessionType === type ? colors.background : colors.textSecondary} />
                  <Text style={[styles.segmentText, sessionType === type && styles.segmentTextActive]}>{type.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {sessionType === 'ruck' && (
              <View style={styles.ruckSetup}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PACK (LB)</Text>
                  <TextInput style={styles.setupInput} value={packWeight} onChangeText={setPackWeight} keyboardType="decimal-pad" maxLength={3} />
                </View>
                <View style={styles.inputGroupWide}>
                  <Text style={styles.inputLabel}>TERRAIN</Text>
                  <View style={styles.terrainRow}>
                    {['Road', 'Trail', 'Mixed'].map((item) => (
                      <TouchableOpacity key={item} style={[styles.terrainChip, terrain === item && styles.terrainChipActive]} onPress={() => setTerrain(item)}>
                        <Text style={[styles.terrainText, terrain === item && styles.terrainTextActive]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
            <Text style={styles.setupNote}>{batterySaver ? 'Battery saver: balanced GPS sampling.' : 'Precision GPS enabled.'} Confirm weather, route, water, and local safety conditions before stepping off.</Text>
          </View>
        )}
        {/* Main timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>ELAPSED</Text>
          <Text style={styles.timer}>{formatDuration(tracker.durationMs)}</Text>
        </View>

        {/* Primary stats */}
        <View style={styles.primaryRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{tracker.distanceMiles.toFixed(2)}</Text>
            <Text style={styles.statLabel}>MILES</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxCenter]}>
            <Text style={styles.statValue}>{formatPace(tracker.paceMinPerMile)}</Text>
            <Text style={styles.statLabel}>PACE /MI</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {tracker.currentSpeedMph != null ? tracker.currentSpeedMph.toFixed(1) : '--'}
            </Text>
            <Text style={styles.statLabel}>MPH</Text>
          </View>
        </View>

        {/* Secondary stats */}
        <View style={styles.secondaryRow}>
          <View style={styles.miniStat}>
            <Ionicons name="footsteps-outline" size={14} color={colors.textMuted} />
            <Text style={styles.miniStatValue}>{tracker.steps.toLocaleString()}</Text>
            <Text style={styles.miniStatLabel}>Steps</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="trending-up-outline" size={14} color={colors.textMuted} />
            <Text style={styles.miniStatValue}>{elevationGain}</Text>
            <Text style={styles.miniStatLabel}>Elev Gain (ft)</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="flame-outline" size={14} color={colors.textMuted} />
            <Text style={styles.miniStatValue}>{tracker.caloriesEstimate}</Text>
            <Text style={styles.miniStatLabel}>Calories</Text>
          </View>
        </View>

        {/* Barometer altitude */}
        {baro.isActive && baro.currentAltitudeFt != null && (
          <View style={styles.altCard}>
            <Ionicons name="analytics-outline" size={14} color={colors.textMuted} />
            <Text style={styles.altText}>
              Altitude: {baro.currentAltitudeFt} ft   ·   Pressure: {baro.currentPressure} hPa
            </Text>
          </View>
        )}

        {/* Completed stats (when stopped) */}
        {!tracker.isTracking && tracker.distanceMiles > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{sessionType.toUpperCase()} COMPLETE</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distance</Text>
              <Text style={styles.summaryValue}>{tracker.distanceMiles.toFixed(2)} mi</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatDuration(tracker.durationMs)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Avg Pace</Text>
              <Text style={styles.summaryValue}>{formatPace(tracker.paceMinPerMile)} /mi</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Steps</Text>
              <Text style={styles.summaryValue}>{tracker.steps.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Elevation Gain</Text>
              <Text style={styles.summaryValue}>{elevationGain} ft</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Calories</Text>
              <Text style={styles.summaryValue}>{tracker.caloriesEstimate} cal</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: controlsBottomPad }]}>
        {!tracker.isTracking ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
            <Ionicons name="play" size={18} color={colors.background} />
            <Text style={styles.startText}>Start {sessionType === 'ruck' ? 'Ruck' : 'Run'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlRow}>
            {tracker.isPaused ? (
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume} activeOpacity={0.8}>
                <Ionicons name="play" size={16} color={colors.background} />
                <Text style={styles.controlText}>Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.pauseButton} onPress={handlePause} activeOpacity={0.8}>
                <Ionicons name="pause" size={16} color={colors.background} />
                <Text style={styles.controlText}>Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
              <Ionicons name="stop" size={16} color={colors.background} />
              <Text style={styles.controlText}>End</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 140 },
  setupCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 16, padding: spacing.md, marginTop: spacing.md },
  fieldSetupCard: { borderColor: colors.accent, borderWidth: 2 },
  setupKicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: spacing.sm },
  segmentRow: { flexDirection: 'row', gap: spacing.sm },
  segment: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  segmentActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  segmentTextActive: { color: colors.background },
  ruckSetup: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  inputGroup: { width: 92 },
  inputGroupWide: { flex: 1 },
  inputLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  setupInput: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, color: colors.textPrimary, paddingHorizontal: spacing.sm, fontSize: 18, fontWeight: '700' },
  terrainRow: { flexDirection: 'row', gap: 5 },
  terrainChip: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  terrainChipActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}18` },
  terrainText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  terrainTextActive: { color: colors.accent },
  setupNote: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  timerContainer: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.lg },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timer: {
    fontSize: 56,
    fontWeight: '200',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  primaryRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  statBoxCenter: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  miniStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  altText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  // Controls
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
    padding: spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  startText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGold,
    borderRadius: 12,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGreen,
    borderRadius: 12,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentRed,
    borderRadius: 12,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.background,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
