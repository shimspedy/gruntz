import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, spacing } from '../theme';
import type { ThemeColors } from '../theme';

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip?: () => void;
}

export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [remaining, setRemaining] = useState(seconds);
  const [isPaused, setIsPaused] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: seconds * 1000,
      useNativeDriver: false,
    }).start();
  }, [seconds]);

  useEffect(() => {
    if (isPaused || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onComplete();
          return 0;
        }
        if (prev <= 4) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remaining]);

  useEffect(() => {
    if (remaining <= 5 && remaining > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [remaining]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  }, []);

  const progress = (seconds - remaining) / seconds;

  return (
    <View style={styles.container}>
      <View style={styles.timerCard}>
        <Text style={styles.label}>REST</Text>
        <Animated.Text style={[styles.time, { transform: [{ scale: pulseAnim }] }]}>
          {formatTime(remaining)}
        </Animated.Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setIsPaused(p => !p)}
          >
            <Ionicons name={isPaused ? 'play' : 'pause'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          {onSkip && (
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>SKIP REST</Text>
              <Ionicons name="play-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  timerCard: {
    backgroundColor: colors.card,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.accent,
    borderLeftWidth: 3,
    padding: spacing.lg,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  time: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.cardBorder,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 3,
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
});
