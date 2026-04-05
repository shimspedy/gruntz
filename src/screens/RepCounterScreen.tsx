import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { useRepCounter, getRepPreset } from '../hooks/useRepCounter';
import { useFormDetection, FormWarning } from '../hooks/useFormDetection';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const EXERCISE_OPTIONS = [
  { name: 'Push-Ups', icon: '💪', formType: 'push-up' as const },
  { name: 'Sit-Ups', icon: '🔥', formType: 'general' as const },
  { name: 'Squats', icon: '🦵', formType: 'squat' as const },
  { name: 'Pull-Ups', icon: '🏋️', formType: 'general' as const },
  { name: 'Burpees', icon: '⚡', formType: 'general' as const },
  { name: 'Lunges', icon: '🎯', formType: 'general' as const },
];

// Body placement tips per exercise
const PLACEMENT_TIPS: Record<string, string> = {
  'Push-Ups': 'Place phone on the ground facing you, full body in frame',
  'Sit-Ups': 'Prop phone at feet level, angled up to see your torso',
  'Squats': 'Place phone at hip height, 6ft away, side view is best',
  'Pull-Ups': 'Set phone on ground facing up, or have friend film',
  'Burpees': 'Place phone 8ft away at ground level, full body view',
  'Lunges': 'Phone at hip height, side view for best form check',
};

// Body guide points per exercise (relative positions 0-1)
const BODY_GUIDE: Record<string, { label: string; x: number; y: number }[]> = {
  'Push-Ups': [
    { label: 'HEAD', x: 0.5, y: 0.12 },
    { label: 'SHOULDERS', x: 0.5, y: 0.22 },
    { label: 'HIPS', x: 0.5, y: 0.48 },
    { label: 'KNEES', x: 0.5, y: 0.7 },
  ],
  'Squats': [
    { label: 'HEAD', x: 0.5, y: 0.1 },
    { label: 'BACK', x: 0.45, y: 0.3 },
    { label: 'HIPS', x: 0.5, y: 0.45 },
    { label: 'KNEES', x: 0.5, y: 0.65 },
    { label: 'FEET', x: 0.5, y: 0.88 },
  ],
  'default': [
    { label: 'HEAD', x: 0.5, y: 0.1 },
    { label: 'CORE', x: 0.5, y: 0.4 },
    { label: 'LEGS', x: 0.5, y: 0.7 },
  ],
};

export default function RepCounterScreen() {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_OPTIONS[0]);
  const [targetReps, setTargetReps] = useState<number | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();

  const preset = getRepPreset(selectedExercise.name);
  const repCounter = useRepCounter(preset);
  const formDetection = useFormDetection({ exerciseType: selectedExercise.formType });

  const handleStart = useCallback(async () => {
    // Request camera permission if not granted
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setCameraEnabled(false);
      }
    }
    hapticMedium();
    setSessionComplete(false);
    await repCounter.start();
    await formDetection.start();
  }, [repCounter, formDetection, permission, requestPermission]);

  const handleStop = useCallback(() => {
    hapticSuccess();
    repCounter.stop();
    formDetection.stop();
    setSessionComplete(true);
  }, [repCounter, formDetection]);

  const handleReset = useCallback(() => {
    hapticLight();
    repCounter.reset();
    formDetection.reset();
    setSessionComplete(false);
  }, [repCounter, formDetection]);

  const handleSelectExercise = (ex: typeof EXERCISE_OPTIONS[0]) => {
    if (repCounter.isActive) {
      Alert.alert('Stop First', 'Stop the current session before switching exercises.');
      return;
    }
    hapticLight();
    setSelectedExercise(ex);
    setSessionComplete(false);
  };

  const targetOptions = [10, 15, 20, 25, 30, 50];

  // Stability color
  const stabilityColor = formDetection.stabilityScore >= 80
    ? colors.accentGreen
    : formDetection.stabilityScore >= 50
      ? colors.accentGold
      : '#FF4444';

  // Form border glow color
  const borderGlowColor = formDetection.stabilityScore >= 80
    ? colors.accentGreen + '80'
    : formDetection.stabilityScore >= 50
      ? colors.accentGold + '80'
      : '#FF444480';

  const guidePoints = BODY_GUIDE[selectedExercise.name] || BODY_GUIDE['default'];
  const showCamera = repCounter.isActive && cameraEnabled && permission?.granted;

  // ─── ACTIVE SESSION: Camera + Overlays ───
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="front"
        />

        {/* Form-quality border glow */}
        <View style={[styles.cameraBorder, { borderColor: borderGlowColor }]} pointerEvents="none" />

        {/* Body guide dots */}
        <View style={styles.guideOverlay} pointerEvents="none">
          {guidePoints.map((pt) => (
            <View
              key={pt.label}
              style={[
                styles.guideDot,
                {
                  left: pt.x * screenWidth - 28,
                  top: `${pt.y * 100}%`,
                  borderColor: stabilityColor,
                },
              ]}
            >
              <View style={[styles.guideDotInner, { backgroundColor: stabilityColor }]} />
              <Text style={[styles.guideLabel, { color: stabilityColor }]}>{pt.label}</Text>
            </View>
          ))}

          {/* Connecting line between guide points */}
          {guidePoints.length > 1 && (
            <View
              style={[
                styles.guideLine,
                {
                  left: screenWidth * 0.5 - 1,
                  top: `${guidePoints[0].y * 100}%`,
                  height: `${(guidePoints[guidePoints.length - 1].y - guidePoints[0].y) * 100}%`,
                  backgroundColor: stabilityColor + '30',
                },
              ]}
            />
          )}
        </View>

        {/* Top HUD: Exercise + Rep Count */}
        <View style={styles.cameraHudTop}>
          <View style={styles.hudExerciseBadge}>
            <Text style={styles.hudExerciseText}>{selectedExercise.icon} {selectedExercise.name.toUpperCase()}</Text>
          </View>
          <View style={styles.hudRepContainer}>
            <Text style={styles.hudRepCount}>{repCounter.reps}</Text>
            {targetReps && (
              <Text style={styles.hudRepTarget}>/ {targetReps}</Text>
            )}
          </View>
        </View>

        {/* Target progress arc at top */}
        {targetReps && (
          <View style={styles.hudProgressBar}>
            <View style={[
              styles.hudProgressFill,
              { width: `${Math.min(100, (repCounter.reps / targetReps) * 100)}%` },
            ]} />
          </View>
        )}

        {/* Form quality indicator — top-right corner */}
        <View style={styles.formBadge}>
          <View style={[styles.formBadgeDot, { backgroundColor: stabilityColor }]} />
          <Text style={styles.formBadgeLabel}>FORM</Text>
          <Text style={[styles.formBadgeScore, { color: stabilityColor }]}>
            {formDetection.stabilityScore}
          </Text>
        </View>

        {/* Live form warnings — bottom overlay */}
        {formDetection.warnings.length > 0 && (
          <View style={styles.cameraWarnings}>
            {formDetection.warnings.slice(-2).map((w: FormWarning, i: number) => (
              <View key={i} style={styles.cameraWarningRow}>
                <Ionicons name="alert-circle" size={16} color={colors.accentGold} />
                <Text style={styles.cameraWarningText}>{w.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cameraToggleBtn}
            onPress={() => setCameraEnabled(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-off" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopButtonCamera} onPress={handleStop} activeOpacity={0.8}>
            <Ionicons name="stop" size={28} color="#FFF" />
            <Text style={styles.stopTextCamera}>STOP</Text>
          </TouchableOpacity>

          <View style={{ width: 48 }} />
        </View>
      </View>
    );
  }

  // ─── ACTIVE SESSION: No Camera (sensor only) ───
  if (repCounter.isActive && !showCamera) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.noCameraActive}>
          <Text style={styles.counterLabel}>{selectedExercise.name.toUpperCase()}</Text>
          <Text style={styles.counter}>{repCounter.reps}</Text>
          {targetReps && <Text style={styles.targetLabel}>/ {targetReps}</Text>}

          {targetReps && (
            <View style={[styles.progressBarBg, { marginTop: spacing.md, width: '80%' }]}>
              <View style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (repCounter.reps / targetReps) * 100)}%` },
              ]} />
            </View>
          )}

          {/* Form card */}
          <View style={[styles.formCard, { marginTop: spacing.lg, width: '100%' }]}>
            <View style={styles.formHeader}>
              <Ionicons name="body-outline" size={18} color={colors.textMuted} />
              <Text style={styles.formTitle}>FORM QUALITY</Text>
            </View>
            <View style={styles.stabilityRow}>
              <View style={styles.stabilityMeterBg}>
                <View style={[
                  styles.stabilityMeterFill,
                  { width: `${formDetection.stabilityScore}%`, backgroundColor: stabilityColor },
                ]} />
              </View>
              <Text style={[styles.stabilityScore, { color: stabilityColor }]}>
                {formDetection.stabilityScore}
              </Text>
            </View>
            {formDetection.warnings.length > 0 && (
              <View style={styles.warningsList}>
                {formDetection.warnings.slice(-3).map((w: FormWarning, i: number) => (
                  <View key={i} style={styles.warningRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.accentGold} />
                    <Text style={styles.warningText}>{w.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.cameraToggleBtnInline, { marginTop: spacing.lg }]}
            onPress={() => setCameraEnabled(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam" size={18} color={colors.accent} />
            <Text style={styles.cameraToggleText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.stopButton} onPress={handleStop} activeOpacity={0.8}>
            <Ionicons name="stop" size={24} color={colors.background} />
            <Text style={styles.controlText}>STOP</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── SETUP / SUMMARY phase ───
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Exercise selector */}
        <View style={styles.exerciseRow}>
          {EXERCISE_OPTIONS.map((ex) => (
            <TouchableOpacity
              key={ex.name}
              style={[styles.exerciseChip, selectedExercise.name === ex.name && styles.exerciseChipActive]}
              onPress={() => handleSelectExercise(ex)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseIcon}>{ex.icon}</Text>
              <Text style={[
                styles.exerciseChipText,
                selectedExercise.name === ex.name && styles.exerciseChipTextActive,
              ]}>{ex.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target reps (optional) */}
        {!sessionComplete && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TARGET (OPTIONAL)</Text>
            <View style={styles.targetRow}>
              {targetOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.targetChip, targetReps === t && styles.targetChipActive]}
                  onPress={() => { hapticLight(); setTargetReps(targetReps === t ? null : t); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.targetText, targetReps === t && styles.targetTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Camera placement tip */}
        {!sessionComplete && (
          <View style={styles.placementTip}>
            <Ionicons name="videocam-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.placementTipTitle}>CAMERA SETUP</Text>
              <Text style={styles.placementTipText}>
                {PLACEMENT_TIPS[selectedExercise.name] || 'Position phone so your full body is visible'}
              </Text>
            </View>
          </View>
        )}

        {/* Big rep counter preview */}
        {!sessionComplete && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterLabel}>{selectedExercise.name.toUpperCase()}</Text>
            <Text style={styles.counter}>0</Text>
            {targetReps && (
              <Text style={styles.targetLabel}>/ {targetReps}</Text>
            )}
          </View>
        )}

        {/* Session summary */}
        {sessionComplete && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>SESSION COMPLETE</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exercise</Text>
              <Text style={styles.summaryValue}>{selectedExercise.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reps Counted</Text>
              <Text style={styles.summaryValue}>{repCounter.reps}</Text>
            </View>
            {targetReps && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target</Text>
                <Text style={styles.summaryValue}>
                  {repCounter.reps >= targetReps ? '✅ Hit!' : `${targetReps - repCounter.reps} short`}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Form Score</Text>
              <Text style={[styles.summaryValue, { color: stabilityColor }]}>
                {formDetection.stabilityScore}/100
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Form Warnings</Text>
              <Text style={styles.summaryValue}>{formDetection.warningCount}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {!sessionComplete ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
            <Ionicons name="videocam" size={22} color={colors.background} />
            <Text style={styles.startText}>START WITH CAMERA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.accent} />
            <Text style={styles.resetText}>New Session</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 140 },

  // ─── Camera view ───
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: 0,
  },

  // ─── Body guide overlay ───
  guideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  guideDot: {
    position: 'absolute',
    width: 56,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  guideDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
  guideLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.8,
  },
  guideLine: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },

  // ─── Camera HUD ───
  cameraHudTop: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hudExerciseBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  hudExerciseText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
  },
  hudRepContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hudRepCount: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  hudRepTarget: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  hudProgressBar: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  hudProgressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },

  // ─── Form badge (top-right) ───
  formBadge: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    minWidth: 56,
  },
  formBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  formBadgeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  formBadgeScore: {
    fontSize: 20,
    fontWeight: '900',
  },

  // ─── Camera warnings ───
  cameraWarnings: {
    position: 'absolute',
    bottom: 160,
    left: 16,
    right: 16,
    gap: 6,
  },
  cameraWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentGold,
  },
  cameraWarningText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentGold,
    flex: 1,
  },

  // ─── Camera controls ───
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonCamera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF4444',
    borderRadius: 30,
    paddingHorizontal: 36,
    paddingVertical: 16,
  },
  stopTextCamera: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },

  // ─── No-camera active mode ───
  noCameraActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  cameraToggleBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent + '40',
  },
  cameraToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },

  // ─── Placement tip card ───
  placementTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accent + '10',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent + '25',
  },
  placementTipTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  placementTipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ─── Setup / Summary shared styles ───
  exerciseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  exerciseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseChipActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  exerciseIcon: { fontSize: 14 },
  exerciseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  exerciseChipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  targetChip: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  targetChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  targetText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  targetTextActive: {
    color: colors.background,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  counterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
    marginBottom: 8,
  },
  counter: {
    fontSize: 96,
    fontWeight: '800',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    lineHeight: 100,
  },
  targetLabel: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.textMuted,
    marginTop: -8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.card,
    borderRadius: 3,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  stabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stabilityMeterBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stabilityMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  stabilityScore: {
    fontSize: 18,
    fontWeight: '800',
    width: 36,
    textAlign: 'right',
  },
  warningsList: {
    marginTop: spacing.sm,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  warningText: {
    fontSize: 12,
    color: colors.accentGold,
    flex: 1,
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
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    padding: spacing.md,
    paddingBottom: 100,
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
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
});
