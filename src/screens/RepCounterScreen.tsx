import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';
import { useSmartExercise } from '../hooks/useSmartExercise';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import type { EnginePhase, PauseReason } from '../engine/smartExerciseEngine';

// ─── Exercise Options ────────────────────────────────────

const EXERCISE_OPTIONS = [
  { name: 'Push-Ups', icon: '💪' },
  { name: 'Sit-Ups', icon: '🔥' },
  { name: 'Squats', icon: '🦵' },
  { name: 'Pull-Ups', icon: '🏋️' },
  { name: 'Burpees', icon: '⚡' },
  { name: 'Lunges', icon: '🎯' },
];

// Camera placement tips per exercise
const PLACEMENT_TIPS: Record<string, string> = {
  'Push-Ups': 'Place phone on the ground facing you, ≈ 6 ft away. Full body visible.',
  'Sit-Ups': 'Prop phone at feet level, angled up to see your torso.',
  'Squats': 'Place phone at hip height, 6 ft away. Side view is best.',
  'Pull-Ups': 'Set phone on ground facing up toward the bar.',
  'Burpees': 'Place phone 8 ft away at ground level, full body view.',
  'Lunges': 'Phone at hip height, side view for best form check.',
};

// Body guide overlay points per exercise
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

// ─── Phase Status Display ────────────────────────────────────

function phaseLabel(phase: EnginePhase): string {
  switch (phase) {
    case 'calibrating': return 'CALIBRATING';
    case 'ready': return 'GET IN POSITION';
    case 'counting': return 'COUNTING';
    case 'paused': return 'PAUSED';
    case 'complete': return 'COMPLETE';
    default: return '';
  }
}

function pauseReasonLabel(reason: PauseReason): string {
  switch (reason) {
    case 'phone_moved': return 'Phone was moved';
    case 'no_person': return "Can't see you";
    case 'wrong_exercise': return 'Wrong exercise detected';
    case 'bad_lighting': return 'Poor lighting';
    case 'too_fast': return 'Too fast';
    case 'phone_in_hand': return 'Phone must be placed down';
    default: return '';
  }
}

// ─── Component ───────────────────────────────────────────────

export default function RepCounterScreen() {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_OPTIONS[0]);
  const [targetReps, setTargetReps] = useState<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Smart exercise engine
  const engine = useSmartExercise(selectedExercise.name);
  const cameraRef = useRef<CameraView>(null);

  // ─── Handlers ───────────────────────────────────────────

  const handleStart = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Required',
          'The smart rep counter needs camera access to verify your form and count accurately.',
        );
        return;
      }
    }
    hapticMedium();
    engine.setCameraRef(cameraRef.current);
    await engine.start();
  }, [engine, permission, requestPermission]);

  const handleStop = useCallback(() => {
    hapticSuccess();
    engine.stop();
  }, [engine]);

  const handleReset = useCallback(() => {
    hapticLight();
    engine.reset();
  }, [engine]);

  const handleSelectExercise = (ex: typeof EXERCISE_OPTIONS[0]) => {
    if (engine.isActive) {
      Alert.alert('Stop First', 'Stop the current session before switching exercises.');
      return;
    }
    hapticLight();
    setSelectedExercise(ex);
  };

  // ─── Derived state ─────────────────────────────────────

  const targetOptions = [10, 15, 20, 25, 30, 50];

  const formColor = engine.formScore >= 70
    ? colors.accentGreen
    : engine.formScore >= 40
      ? colors.accentGold
      : '#FF4444';

  const phaseColor = engine.phase === 'counting'
    ? colors.accentGreen
    : engine.phase === 'paused'
      ? '#FF4444'
      : engine.phase === 'ready'
        ? colors.accentGold
        : colors.accent;

  const guidePoints = BODY_GUIDE[selectedExercise.name] || BODY_GUIDE['default'];
  const isSessionActive = engine.phase !== 'setup' && engine.phase !== 'complete';
  const showCamera = isSessionActive && permission?.granted;

  // ─── ACTIVE SESSION: Camera + Smart Overlays ───────────

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        />

        {/* Phase-colored border */}
        <View style={[styles.cameraBorder, {
          borderColor: engine.phase === 'counting'
            ? formColor + '60'
            : engine.phase === 'paused'
              ? '#FF444460'
              : colors.accent + '40',
        }]} pointerEvents="none" />

        {/* Body guide dots (only when counting) */}
        {engine.phase === 'counting' && (
          <View style={styles.guideOverlay} pointerEvents="none">
            {guidePoints.map((pt) => (
              <View
                key={pt.label}
                style={[
                  styles.guideDot,
                  {
                    left: pt.x * screenWidth - 28,
                    top: `${pt.y * 100}%`,
                    borderColor: formColor,
                  },
                ]}
              >
                <View style={[styles.guideDotInner, { backgroundColor: formColor }]} />
                <Text style={[styles.guideLabel, { color: formColor }]}>{pt.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── ENGINE STATUS BANNER ─── */}
        <View style={[styles.statusBanner, { backgroundColor: phaseColor + '25' }]}>
          <View style={[styles.statusDot, { backgroundColor: phaseColor }]} />
          <Text style={[styles.statusText, { color: phaseColor }]}>
            {phaseLabel(engine.phase)}
          </Text>
          {engine.phase === 'calibrating' && (
            <View style={styles.calibrationBarBg}>
              <View style={[styles.calibrationBarFill, {
                width: `${engine.calibrationProgress}%`,
              }]} />
            </View>
          )}
        </View>

        {/* ─── TOP HUD: Exercise + Rep Count ─── */}
        <View style={styles.cameraHudTop}>
          <View style={styles.hudExerciseBadge}>
            <Text style={styles.hudExerciseText}>
              {selectedExercise.icon} {selectedExercise.name.toUpperCase()}
            </Text>
          </View>
          {engine.phase === 'counting' && (
            <View style={styles.hudRepContainer}>
              <Text style={styles.hudRepCount}>{engine.reps}</Text>
              {targetReps && (
                <Text style={styles.hudRepTarget}>/ {targetReps}</Text>
              )}
            </View>
          )}
          {engine.phase === 'calibrating' && (
            <Text style={styles.hudCalibrationText}>
              📱 Place phone on stable surface
            </Text>
          )}
          {engine.phase === 'ready' && (
            <Text style={styles.hudReadyText}>
              👤 Get in position — camera is watching
            </Text>
          )}
        </View>

        {/* Target progress bar */}
        {targetReps && engine.phase === 'counting' && (
          <View style={styles.hudProgressBar}>
            <View style={[
              styles.hudProgressFill,
              { width: `${Math.min(100, (engine.reps / targetReps) * 100)}%` },
            ]} />
          </View>
        )}

        {/* ─── FORM + VISION BADGE (top-right) ─── */}
        <View style={styles.formBadge}>
          <View style={[styles.formBadgeDot, { backgroundColor: formColor }]} />
          <Text style={styles.formBadgeLabel}>FORM</Text>
          <Text style={[styles.formBadgeScore, { color: formColor }]}>
            {engine.formScore}
          </Text>
          {engine.visionAvailable && (
            <View style={styles.visionIndicator}>
              <Ionicons
                name="eye"
                size={10}
                color={engine.personVisible ? colors.accentGreen : colors.textMuted}
              />
              <Text style={[styles.visionLabel, {
                color: engine.personVisible ? colors.accentGreen : colors.textMuted,
              }]}>
                {engine.personVisible ? 'SEEN' : 'NO VIS'}
              </Text>
            </View>
          )}
        </View>

        {/* ─── REJECTED REP INDICATOR (top-left) ─── */}
        {engine.rejectedReps > 0 && (
          <View style={styles.rejectedBadge}>
            <Ionicons name="close-circle" size={14} color="#FF6666" />
            <Text style={styles.rejectedText}>{engine.rejectedReps} rejected</Text>
          </View>
        )}

        {/* ─── SMART COACH MESSAGE ─── */}
        {engine.coachMessage && (
          <View style={[styles.coachBanner, {
            borderLeftColor: engine.phase === 'paused' ? '#FF4444' : colors.accent,
          }]}>
            <Ionicons
              name={engine.phase === 'paused' ? 'alert-circle' : 'megaphone'}
              size={16}
              color={engine.phase === 'paused' ? '#FF6666' : colors.accent}
            />
            <Text style={[styles.coachText, {
              color: engine.phase === 'paused' ? '#FF6666' : colors.textPrimary,
            }]}>
              {engine.coachMessage}
            </Text>
          </View>
        )}

        {/* ─── PAUSE OVERLAY ─── */}
        {engine.phase === 'paused' && (
          <View style={styles.pauseOverlay} pointerEvents="none">
            <Ionicons name="pause-circle" size={64} color="#FF444480" />
            <Text style={styles.pauseTitle}>PAUSED</Text>
            <Text style={styles.pauseReason}>
              {pauseReasonLabel(engine.pauseReason)}
            </Text>
          </View>
        )}

        {/* ─── FORM ERRORS FROM VISION ─── */}
        {engine.lastVisionResult && engine.lastVisionResult.formErrors.length > 0 && (
          <View style={styles.cameraWarnings}>
            {engine.lastVisionResult.formErrors.slice(0, 2).map((err: string, i: number) => (
              <View key={i} style={styles.cameraWarningRow}>
                <Ionicons name="alert-circle" size={14} color={colors.accentGold} />
                <Text style={styles.cameraWarningText}>{err}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── BOTTOM CONTROLS ─── */}
        <View style={styles.cameraControls}>
          <View style={{ width: 48 }} />
          <TouchableOpacity style={styles.stopButtonCamera} onPress={handleStop} activeOpacity={0.8}>
            <Ionicons name="stop" size={28} color="#FFF" />
            <Text style={styles.stopTextCamera}>STOP</Text>
          </TouchableOpacity>
          <View style={{ width: 48 }} />
        </View>
      </View>
    );
  }

  // ─── SETUP / SUMMARY PHASE ────────────────────────────

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

        {/* Target reps */}
        {engine.phase === 'setup' && (
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
        {engine.phase === 'setup' && (
          <View style={styles.placementTip}>
            <Ionicons name="videocam-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.placementTipTitle}>SMART CAMERA SETUP</Text>
              <Text style={styles.placementTipText}>
                {PLACEMENT_TIPS[selectedExercise.name] || 'Position phone so your full body is visible'}
              </Text>
            </View>
          </View>
        )}

        {/* How it works card */}
        {engine.phase === 'setup' && (
          <View style={styles.howItWorks}>
            <Text style={styles.howTitle}>HOW SMART COUNTING WORKS</Text>
            <View style={styles.howRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.accent} />
              <Text style={styles.howText}>Phone must be placed on a stable surface</Text>
            </View>
            <View style={styles.howRow}>
              <Ionicons name="eye-outline" size={16} color={colors.accent} />
              <Text style={styles.howText}>AI camera validates you are doing {selectedExercise.name}</Text>
            </View>
            <View style={styles.howRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
              <Text style={styles.howText}>Only valid reps count — no false positives</Text>
            </View>
            <View style={styles.howRow}>
              <Ionicons name="fitness-outline" size={16} color={colors.accent} />
              <Text style={styles.howText}>Real-time form coaching based on exercise DB</Text>
            </View>
          </View>
        )}

        {/* Big rep counter preview */}
        {engine.phase === 'setup' && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterLabel}>{selectedExercise.name.toUpperCase()}</Text>
            <Text style={styles.counter}>0</Text>
            {targetReps && (
              <Text style={styles.targetLabel}>/ {targetReps}</Text>
            )}
          </View>
        )}

        {/* ─── SESSION SUMMARY ─── */}
        {engine.phase === 'complete' && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>SESSION COMPLETE</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exercise</Text>
              <Text style={styles.summaryValue}>{selectedExercise.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valid Reps</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>
                {engine.reps}
              </Text>
            </View>
            {engine.rejectedReps > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rejected Reps</Text>
                <Text style={[styles.summaryValue, { color: '#FF6666' }]}>
                  {engine.rejectedReps}
                </Text>
              </View>
            )}
            {targetReps && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target</Text>
                <Text style={styles.summaryValue}>
                  {engine.reps >= targetReps ? '✅ Hit!' : `${targetReps - engine.reps} short`}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Form Score</Text>
              <Text style={[styles.summaryValue, { color: formColor }]}>
                {engine.formScore}/100
              </Text>
            </View>
            {engine.formTrend !== 'unknown' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Form Trend</Text>
                <Text style={[styles.summaryValue, {
                  color: engine.formTrend === 'improving' ? colors.accentGreen
                    : engine.formTrend === 'declining' ? '#FF6666' : colors.textMuted,
                }]}>
                  {engine.formTrend === 'improving' ? '📈 Improving' :
                   engine.formTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
                </Text>
              </View>
            )}
            {engine.visionAnalysisCount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>AI Checks</Text>
                <Text style={styles.summaryValue}>
                  {engine.visionAnalysisCount} frame{engine.visionAnalysisCount !== 1 ? 's' : ''} analyzed
                </Text>
              </View>
            )}
            {engine.lastVisionResult && engine.lastVisionResult.formErrors.length > 0 && (
              <View style={styles.summaryFormErrors}>
                <Text style={styles.summaryFormErrorsTitle}>FORM NOTES</Text>
                {engine.lastVisionResult.formErrors.map((err: string, i: number) => (
                  <View key={i} style={styles.summaryFormErrorRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.accentGold} />
                    <Text style={styles.summaryFormErrorText}>{err}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {engine.phase === 'setup' ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
            <Ionicons name="flash" size={22} color={colors.background} />
            <Text style={styles.startText}>START SMART SESSION</Text>
          </TouchableOpacity>
        ) : engine.phase === 'complete' ? (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.accent} />
            <Text style={styles.resetText}>New Session</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 140 },

  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 3, borderRadius: 0,
  },

  // Status banner (top, below safe area)
  statusBanner: {
    position: 'absolute',
    top: 44,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  statusText: {
    fontSize: 11, fontWeight: '900', letterSpacing: 2,
  },
  calibrationBarBg: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 8,
  },
  calibrationBarFill: {
    height: '100%', borderRadius: 2, backgroundColor: colors.accent,
  },

  // Guide overlay
  guideOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  guideDot: {
    position: 'absolute', width: 56, height: 28,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 4,
  },
  guideDotInner: {
    width: 10, height: 10, borderRadius: 5, opacity: 0.7,
  },
  guideLabel: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1, opacity: 0.8,
  },

  // Camera HUD
  cameraHudTop: {
    position: 'absolute', top: 70, left: 0, right: 0, alignItems: 'center',
  },
  hudExerciseBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6, marginBottom: 8,
  },
  hudExerciseText: {
    fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: 2,
  },
  hudRepContainer: {
    flexDirection: 'row', alignItems: 'baseline',
  },
  hudRepCount: {
    fontSize: 72, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  hudRepTarget: {
    fontSize: 28, fontWeight: '300', color: 'rgba(255,255,255,0.5)', marginLeft: 4,
  },
  hudCalibrationText: {
    fontSize: 16, fontWeight: '700', color: '#FFF', marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  hudReadyText: {
    fontSize: 15, fontWeight: '600', color: colors.accentGold, marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  hudProgressBar: {
    position: 'absolute', top: 64, left: 0, right: 0,
    height: 3, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  hudProgressFill: {
    height: '100%', backgroundColor: colors.accent,
  },

  // Form badge (top-right)
  formBadge: {
    position: 'absolute', top: 80, right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12,
    padding: 10, alignItems: 'center', minWidth: 56,
  },
  formBadgeDot: {
    width: 8, height: 8, borderRadius: 4, marginBottom: 4,
  },
  formBadgeLabel: {
    fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1, marginBottom: 2,
  },
  formBadgeScore: {
    fontSize: 20, fontWeight: '900',
  },
  visionIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginTop: 6, paddingTop: 6,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  visionLabel: {
    fontSize: 7, fontWeight: '800', letterSpacing: 0.5,
  },

  // Rejected badge (top-left)
  rejectedBadge: {
    position: 'absolute', top: 80, left: 16,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  rejectedText: {
    fontSize: 11, fontWeight: '700', color: '#FF6666',
  },

  // Coach banner
  coachBanner: {
    position: 'absolute', bottom: 150, left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderLeftWidth: 3,
  },
  coachText: {
    fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 18,
  },

  // Pause overlay
  pauseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  pauseTitle: {
    fontSize: 28, fontWeight: '900', color: '#FF4444',
    letterSpacing: 3, marginTop: 12,
  },
  pauseReason: {
    fontSize: 15, fontWeight: '600', color: '#FF8888', marginTop: 8,
  },

  // Camera warnings (form errors from vision)
  cameraWarnings: {
    position: 'absolute', bottom: 190, left: 16, right: 16, gap: 6,
  },
  cameraWarningRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderLeftWidth: 3, borderLeftColor: colors.accentGold,
  },
  cameraWarningText: {
    fontSize: 13, fontWeight: '600', color: colors.accentGold, flex: 1,
  },

  // Camera controls
  cameraControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  stopButtonCamera: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FF4444', borderRadius: 30,
    paddingHorizontal: 36, paddingVertical: 16,
  },
  stopTextCamera: {
    fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1,
  },

  // How it works card
  howItWorks: {
    backgroundColor: colors.card, borderRadius: 14, padding: spacing.md,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder,
  },
  howTitle: {
    fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 2, marginBottom: spacing.sm,
  },
  howRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6,
  },
  howText: {
    fontSize: 13, color: colors.textSecondary, flex: 1,
  },

  // Placement tip
  placementTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.accent + '10', borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accent + '25',
  },
  placementTipTitle: {
    fontSize: 10, fontWeight: '800', color: colors.accent,
    letterSpacing: 1.5, marginBottom: 2,
  },
  placementTipText: {
    fontSize: 13, color: colors.textSecondary, lineHeight: 18,
  },

  // Exercise selector
  exerciseRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.lg,
  },
  exerciseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.card, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  exerciseChipActive: {
    backgroundColor: colors.accent + '20', borderColor: colors.accent,
  },
  exerciseIcon: { fontSize: 14 },
  exerciseChipText: {
    fontSize: 12, fontWeight: '600', color: colors.textPrimary,
  },
  exerciseChipTextActive: {
    color: colors.accent, fontWeight: '700',
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 2, marginBottom: spacing.sm,
  },
  targetRow: { flexDirection: 'row', gap: spacing.sm },
  targetChip: {
    flex: 1, height: 42, borderRadius: 10, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  targetChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  targetText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  targetTextActive: { color: colors.background },

  // Counter preview
  counterContainer: {
    alignItems: 'center', marginBottom: spacing.md, paddingVertical: spacing.lg,
  },
  counterLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 3, marginBottom: 8,
  },
  counter: {
    fontSize: 96, fontWeight: '800', color: colors.accent,
    fontVariant: ['tabular-nums'], lineHeight: 100,
  },
  targetLabel: {
    fontSize: 24, fontWeight: '300', color: colors.textMuted, marginTop: -8,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.accent + '40',
    borderTopWidth: 3, borderTopColor: colors.accent,
  },
  summaryTitle: {
    fontSize: 14, fontWeight: '800', color: colors.accent,
    letterSpacing: 2, marginBottom: spacing.md, textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  summaryFormErrors: {
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  summaryFormErrorsTitle: {
    fontSize: 10, fontWeight: '800', color: colors.accentGold,
    letterSpacing: 1.5, marginBottom: spacing.xs,
  },
  summaryFormErrorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4,
  },
  summaryFormErrorText: {
    fontSize: 13, color: colors.accentGold, flex: 1,
  },

  // Bottom controls
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, borderTopWidth: 1,
    borderTopColor: colors.cardBorder, padding: spacing.md, paddingBottom: 100,
  },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 18, gap: spacing.sm,
  },
  startText: {
    fontSize: 17, fontWeight: '800', color: colors.background, letterSpacing: 1,
  },
  resetButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: 18,
  },
  resetText: {
    fontSize: 15, fontWeight: '600', color: colors.accent,
  },
});
