import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Easing,
  Dimensions,
} from 'react-native';
import { useColors } from '../theme';
import type { ThemeColors } from '../theme';

interface LottieRewardProps {
  type: 'xp_gain' | 'exercise_complete' | 'streak' | 'level_up' | 'mission_complete';
  value?: number;
  visible: boolean;
  onComplete?: () => void;
}

const ANIMATION_DURATION = 2000; // 2 seconds

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

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0);
  const translateYAnim = new Animated.Value(0);
  const glowAnim = new Animated.Value(0);

  // Particle animations (for confetti/xp effect)
  const particles = useMemo(
    () =>
      Array.from({ length: 8 }).map(() => ({
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(0),
      })),
    []
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Start animations
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

    // Auto-hide after animation
    const timeout = setTimeout(() => {
      hideAnimation();
      onComplete?.();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, [visible, type]);

  const animateXPGain = () => {
    // Main text floats up and fades
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

    // Particle effects
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
  };

  const animateExerciseComplete = () => {
    // Scale checkmark in with bounce
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

    // Glow pulse
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
  };

  const animateStreak = () => {
    // Fire bounces
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

    // Glow pulse throughout
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
      { iterations: 2 }
    ).start();
  };

  const animateLevelUp = () => {
    // Scale up dramatically
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

    // Strong glow pulse
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
  };

  const animateMissionComplete = () => {
    // Particles fall with rotation
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

    // Main container fades in and out
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
  };

  const hideAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
  };

  // Don't render if not visible
  if (!visible) {
    return null;
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

          {/* Particles */}
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
          <View
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
          <View
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
          <View
            style={[
              styles.confettiContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.missionText}>MISSION COMPLETE!</Text>
          </View>

          {particles.map((particle, index) => {
            const colors_arr = [
              colors.accent,
              colors.accentGold,
              colors.accentGreen,
              colors.accentRed,
            ];
            const color = colors_arr[index % colors_arr.length];

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
  const screenWidth = Dimensions.get('window').width;

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
