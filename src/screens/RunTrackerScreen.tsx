import React, { useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { useRunTracker } from '../hooks/useRunTracker';
import { useBarometerAltitude } from '../hooks/useBarometerAltitude';
import { hapticLight, hapticSuccess, hapticMedium } from '../utils/haptics';

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
  const tracker = useRunTracker();
  const baro = useBarometerAltitude();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const controlsBottomPad = Math.max(spacing.md, tabBarHeight + insets.bottom + spacing.sm);
  const scrollBottomPad = controlsBottomPad + 120; // clearance for controls bar

  const handleStart = useCallback(async () => {
    hapticMedium();
    const started = await tracker.start();
    if (!started) {
      Alert.alert(
        'Location required',
        'Allow location access to track your run, distance, pace, and route.'
      );
      return;
    }
    await baro.start();
  }, [tracker, baro]);

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
    Alert.alert('End Run?', 'This will stop tracking your run.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Run',
        style: 'destructive',
        onPress: () => {
          hapticSuccess();
          tracker.stop();
          baro.stop();
        },
      },
    ]);
  }, [tracker, baro]);

  // Use barometer elevation if available, fall back to GPS elevation
  const elevationGain = baro.elevationGainFt || tracker.elevationGainFt;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}>
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
            <Ionicons name="footsteps-outline" size={18} color={colors.accent} />
            <Text style={styles.miniStatValue}>{tracker.steps.toLocaleString()}</Text>
            <Text style={styles.miniStatLabel}>Steps</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="trending-up-outline" size={18} color={colors.accentGreen} />
            <Text style={styles.miniStatValue}>{elevationGain}</Text>
            <Text style={styles.miniStatLabel}>Elev Gain (ft)</Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="flame-outline" size={18} color={colors.streakFire} />
            <Text style={styles.miniStatValue}>{tracker.caloriesEstimate}</Text>
            <Text style={styles.miniStatLabel}>Calories</Text>
          </View>
        </View>

        {/* Barometer altitude */}
        {baro.isActive && baro.currentAltitudeFt != null && (
          <View style={styles.altCard}>
            <Ionicons name="analytics-outline" size={18} color={colors.textMuted} />
            <Text style={styles.altText}>
              Altitude: {baro.currentAltitudeFt} ft   ·   Pressure: {baro.currentPressure} hPa
            </Text>
          </View>
        )}

        {/* Completed stats (when stopped) */}
        {!tracker.isTracking && tracker.distanceMiles > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>RUN COMPLETE</Text>
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
            <Ionicons name="play" size={28} color={colors.background} />
            <Text style={styles.startText}>START RUN</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlRow}>
            {tracker.isPaused ? (
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume} activeOpacity={0.8}>
                <Ionicons name="play" size={24} color={colors.background} />
                <Text style={styles.controlText}>RESUME</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.pauseButton} onPress={handlePause} activeOpacity={0.8}>
                <Ionicons name="pause" size={24} color={colors.background} />
                <Text style={styles.controlText}>PAUSE</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
              <Ionicons name="stop" size={24} color={colors.background} />
              <Text style={styles.controlText}>END</Text>
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
  timerContainer: { alignItems: 'center', marginBottom: spacing.lg, paddingTop: spacing.lg },
  timerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
    marginBottom: 4,
  },
  timer: {
    fontSize: 64,
    fontWeight: '200',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  primaryRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statBoxCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  secondaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  miniStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  altText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    borderTopWidth: 3,
    borderTopColor: colors.accent,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // Controls
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    padding: spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  startText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGold,
    borderRadius: 14,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentGreen,
    borderRadius: 14,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  stopButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentRed,
    borderRadius: 14,
    paddingVertical: 18,
    gap: spacing.sm,
  },
  controlText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 1,
  },
});
