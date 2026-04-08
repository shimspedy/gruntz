import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors, spacing, MAX_FONT_MULTIPLIER } from '../theme';
import type { ThemeColors } from '../theme';
import { hapticSuccess, hapticLight, hapticSelection } from '../utils/haptics';

interface RestTimerProps {
  seconds: number;
  exerciseName?: string;
  loggedSummary?: string | null;
  onComplete: () => void;
  onSkip?: () => void;
}

export function RestTimer({
  seconds,
  exerciseName,
  loggedSummary,
  onComplete,
  onSkip,
}: RestTimerProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const safeSeconds = Math.max(1, seconds);
  const [remaining, setRemaining] = useState(safeSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isPausedRef = useRef(isPaused);
  const onCompleteRef = useRef(onComplete);

  isPausedRef.current = isPaused;
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(safeSeconds);
    setIsPaused(false);
  }, [safeSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) {
        return;
      }

      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          hapticSuccess();
          onCompleteRef.current();
          return 0;
        }
        if (prev <= 4) {
          hapticLight();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [safeSeconds]);

  useEffect(() => {
    if (remaining <= 5 && remaining > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 180, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [pulseAnim, remaining]);

  const formatTime = useCallback((secs: number) => {
    const minutes = Math.floor(secs / 60);
    const secsOnly = secs % 60;
    return minutes > 0 ? `${minutes}:${secsOnly.toString().padStart(2, '0')}` : `${secs}s`;
  }, []);

  const progress = Math.min(1, Math.max(0, (safeSeconds - remaining) / safeSeconds));

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <View style={styles.scrim} />
        <View style={styles.centerWrap}>
          <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.label}>REST TIMER</Text>
            {exerciseName ? <Text style={styles.exerciseName}>{exerciseName}</Text> : null}
            {loggedSummary ? <Text style={styles.loggedSummary}>{loggedSummary}</Text> : null}
            <Animated.Text style={styles.time} maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}>
              {formatTime(remaining)}
            </Animated.Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => {
                  hapticSelection();
                  setIsPaused((prev) => !prev);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={18} color={colors.textPrimary} />
                <Text style={styles.controlText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>
              {onSkip ? (
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => {
                    hapticLight();
                    onSkip();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.skipText}>Skip</Text>
                  <Ionicons name="play-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(5, 9, 6, 0.68)',
    },
    centerWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: 'rgba(11, 18, 12, 0.92)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
    label: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 3,
      marginBottom: spacing.xs,
    },
    exerciseName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    loggedSummary: {
      marginTop: spacing.xs,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    time: {
      marginTop: spacing.lg,
      fontSize: 64,
      fontWeight: '900',
      color: colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    progressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: colors.cardBorder,
      borderRadius: 999,
      marginTop: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 999,
    },
    buttonRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    controlBtn: {
      minWidth: 112,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.cardBorder,
      borderRadius: 12,
    },
    controlText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    skipBtn: {
      minWidth: 112,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.backgroundSecondary,
    },
    skipText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.5,
    },
  });
