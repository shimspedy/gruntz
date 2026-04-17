import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Easing,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import { useColors } from '../theme';
import type { ThemeColors } from '../theme';

interface LottieRewardProps {
  type: 'xp_gain' | 'exercise_complete' | 'streak' | 'level_up' | 'mission_complete';
  value?: number;
  visible: boolean;
  onComplete?: () => void;
}

const ANIMATION_DURATION = 2000;

/**
 * Celebratory reward animation component
 * Displays different animations based on reward type:
 * - xp_gain: "+XP" text floating up with particles
 * - exercise_complete: Checkmark with scale and glow
 * - streak: Fire emoji bouncing with glow
 * - level_up: "LEVEL UP!" text with scale animation
 * - mission_complete: Colored confetti-like dots falling
 */
export function LottieReward({ type, value, visible, onComplete }: LottieRewardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove?.();
    };
  }, []);

  // Short-circuit animation side effects when the user prefers reduce motion:
  // still fire onComplete so callers don't block, but skip all heavy particle work.
  useEffect(() => {
    if (!visible || !reduceMotion) return;
    const t = setTimeout(() => onComplete?.(), 600);
    return () => clearTimeout(t);
  }, [visible, reduceMotion, onComplete]);

  // Persist Animated.Values across renders with useRef
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Particle animations (for confetti/xp effect)
  const particles = useRef(
    Array.from({ length: 8 }).map(() => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  const resetAnimations = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    translateYAnim.setValue(0);
    glowAnim.setValue(0);
    particles.forEach((p) => {
      p.translateX.setValue(0);
      p.translateY.setValue(0);
      p.opacity.setValue(0);
    });
  }, [fadeAnim, scaleAnim, translateYAnim, glowAnim, particles]);

  const animateXPGain = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -100,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        delay: ANIMATION_DURATION - 300,
        useNativeDriver: true,
      }),
    ]).start();

    particles.forEach((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 60;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      Animated.parallel([
        Animated.timing(particle.opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateX, {
          toValue: tx,
          duration: ANIMATION_DURATION * 0.7,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: ty,
          duration: ANIMATION_DURATION * 0.7,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 300,
          delay: ANIMATION_DURATION * 0.7,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, translateYAnim, particles]);

  const animateExerciseComplete = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, glowAnim]);

  const animateStreak = useCallback(() => {
    Animated.sequence([
      Animated.timing(translateYAnim, {
        toValue: -30,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -20,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 },
    ).start();
  }, [translateYAnim, glowAnim]);

  const animateLevelUp = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 500,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, glowAnim]);

  const animateMissionComplete = useCallback(() => {
    particles.forEach((particle, index) => {
      const randomX = (Math.random() - 0.5) * 200;
      const delay = (index / particles.length) * 200;

      Animated.parallel([
        Animated.timing(particle.opacity, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: 200,
          duration: ANIMATION_DURATION - delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateX, {
          toValue: randomX,
          duration: ANIMATION_DURATION - delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 300,
          delay: ANIMATION_DURATION - 300,
          useNativeDriver: true,
        }),
      ]).start();
    });

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        delay: ANIMATION_DURATION - 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, particles]);

  useEffect(() => {
    if (!visible || reduceMotion) {
      return;
    }

    // Reset all values before starting new animations
    resetAnimations();

    if (type === 'xp_gain') {
      animateXPGain();
    } else if (type === 'exercise_complete') {
      animateExerciseComplete();
    } else if (type === 'streak') {
      animateStreak();
    } else if (type === 'level_up') {
      animateLevelUp();
    } else if (type === 'mission_complete') {
      animateMissionComplete();
    }

    const timeout = setTimeout(() => {
      resetAnimations();
      onComplete?.();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, [visible, type, reduceMotion, resetAnimations, animateXPGain, animateExerciseComplete, animateStreak, animateLevelUp, animateMissionComplete, onComplete]);

  if (!visible) {
    return null;
  }

  // Accessibility: when reduce-motion is on, render a static confirmation
  // instead of particle effects so we still give visual feedback.
  if (reduceMotion) {
    const label = type === 'level_up' ? 'LEVEL UP' : type === 'mission_complete' ? 'MISSION COMPLETE' : type === 'streak' ? 'STREAK' : '✓';
    return (
      <View style={styles.container} pointerEvents="none" accessibilityRole="alert" accessibilityLabel={label}>
        <View style={styles.checkmark}>
          <View style={styles.checkmarkInner}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {/* XP Gain Animation */}
      {type === 'xp_gain' && (
        <>
          <Animated.View
            style={[
              styles.xpText,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            <Text style={styles.xpValue}>+{value || 0} XP</Text>
          </Animated.View>

          {particles.map((particle, index) => (
            <Animated.View
              key={`particle-${index}`}
              style={[
                styles.particle,
                {
                  opacity: particle.opacity,
                  transform: [
                    { translateX: particle.translateX },
                    { translateY: particle.translateY },
                  ],
                },
              ]}
            />
          ))}
        </>
      )}

      {/* Exercise Complete - Checkmark */}
      {type === 'exercise_complete' && (
        <Animated.View
          style={[
            styles.checkmark,
            {
              transform: [{ scale: scaleAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.6],
              }),
            },
          ]}
        >
          <View style={styles.checkmarkInner}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </Animated.View>
      )}

      {/* Streak - Fire emoji */}
      {type === 'streak' && (
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glowCircle,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.8],
                }),
              },
            ]}
          />
          <Text style={styles.streakEmoji}>🔥</Text>
        </Animated.View>
      )}

      {/* Level Up - Big text */}
      {type === 'level_up' && (
        <Animated.View
          style={[
            styles.levelUpContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim.interpolate({
                inputRange: [0, 0.5, 1.2],
                outputRange: [0, 1, 1],
              }),
            },
          ]}
        >
          <View style={styles.levelUpInner}>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
          </View>
          <Animated.View
            style={[
              styles.glowCircleLarge,
              {
                opacity: glowAnim,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Mission Complete - Confetti particles */}
      {type === 'mission_complete' && (
        <>
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.missionText}>MISSION COMPLETE!</Text>
          </Animated.View>

          {particles.map((particle, index) => {
            const colorsArr = [
              colors.accent,
              colors.accentGold,
              colors.accentGreen,
              colors.accentRed,
            ];
            const color = colorsArr[index % colorsArr.length];

            return (
              <Animated.View
                key={`confetti-${index}`}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: color,
                    opacity: particle.opacity,
                    transform: [
                      { translateX: particle.translateX },
                      { translateY: particle.translateY },
                    ],
                  },
                ]}
              />
            );
          })}
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    },

    // XP Gain
    xpText: {
      position: 'absolute',
    },
    xpValue: {
      fontSize: 48,
      fontWeight: '900',
      color: colors.accent,
      textShadowColor: colors.accent,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    particle: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },

    // Exercise Complete
    checkmark: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmarkInner: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.accent + '33',
      borderWidth: 3,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkIcon: {
      fontSize: 60,
      color: colors.accent,
      fontWeight: 'bold',
    },

    // Streak
    streakContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    glowCircle: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: colors.streakFire,
    },
    streakEmoji: {
      fontSize: 80,
      zIndex: 1,
    },

    // Level Up
    levelUpContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelUpInner: {
      alignItems: 'center',
    },
    levelUpText: {
      fontSize: 72,
      fontWeight: '900',
      color: colors.accent,
      textShadowColor: colors.accent,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 20,
      zIndex: 2,
    },
    glowCircleLarge: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.accent,
    },

    // Mission Complete
    confettiContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    missionText: {
      fontSize: 56,
      fontWeight: '900',
      color: colors.accent,
      textShadowColor: colors.accent,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 15,
      zIndex: 2,
    },
    confettiDot: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  });
};
