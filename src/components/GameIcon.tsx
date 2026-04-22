import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../theme';
import type { ThemeColors } from '../theme';

export type GameIconName =
  | 'home'
  | 'program'
  | 'profile'
  | 'rank'
  | 'level'
  | 'streak'
  | 'mission'
  | 'strength'
  | 'lower'
  | 'core'
  | 'run'
  | 'swim'
  | 'ruck'
  | 'recovery'
  | 'warmup'
  | 'test'
  | 'xp'
  | 'coin'
  | 'achievement'
  | 'warning'
  | 'progress'
  | 'stats'
  | 'settings'
  | 'theme'
  | 'pool'
  | 'intensity_low'
  | 'intensity_medium'
  | 'intensity_high'
  | 'check'
  | 'rest'
  | 'time'
  | 'distance'
  | 'reps'
  | 'target'
  | 'lock'
  | 'info'
  | 'arrow'
  | 'badge'
  | 'gear'
  | 'outfit'
  | 'army'
  | 'navy'
  | 'marines'
  | 'airforce'
  | 'coastguard'
  | 'spaceforce';

type IconFamily = 'ion' | 'mci';
type AnimationVariant = 'pulse' | 'scan' | 'burst';

interface IconSpec {
  family: IconFamily;
  name: string;
  variant: AnimationVariant;
  scale?: number;
}

interface GameIconProps {
  name?: string | null;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  variant?: 'full' | 'minimal';
}

const iconSpecs: Record<GameIconName, IconSpec> = {
  home: { family: 'ion', name: 'home-outline', variant: 'scan', scale: 0.56 },
  program: { family: 'mci', name: 'shield-sword-outline', variant: 'scan', scale: 0.56 },
  profile: { family: 'ion', name: 'person-outline', variant: 'pulse', scale: 0.56 },
  rank: { family: 'mci', name: 'medal-outline', variant: 'burst', scale: 0.56 },
  level: { family: 'ion', name: 'flash-outline', variant: 'pulse', scale: 0.56 },
  streak: { family: 'mci', name: 'fire', variant: 'burst', scale: 0.56 },
  mission: { family: 'mci', name: 'flag-variant-outline', variant: 'scan', scale: 0.56 },
  strength: { family: 'mci', name: 'dumbbell', variant: 'pulse', scale: 0.58 },
  lower: { family: 'ion', name: 'walk-outline', variant: 'pulse', scale: 0.56 },
  core: { family: 'ion', name: 'ellipse-outline', variant: 'pulse', scale: 0.5 },
  run: { family: 'mci', name: 'run-fast', variant: 'scan', scale: 0.58 },
  swim: { family: 'mci', name: 'swim', variant: 'scan', scale: 0.58 },
  ruck: { family: 'mci', name: 'bag-personal-outline', variant: 'scan', scale: 0.56 },
  recovery: { family: 'mci', name: 'heart-pulse', variant: 'pulse', scale: 0.54 },
  warmup: { family: 'ion', name: 'pulse-outline', variant: 'pulse', scale: 0.54 },
  test: { family: 'mci', name: 'clipboard-text-outline', variant: 'scan', scale: 0.56 },
  xp: { family: 'mci', name: 'star-four-points-outline', variant: 'burst', scale: 0.54 },
  coin: { family: 'ion', name: 'disc-outline', variant: 'burst', scale: 0.5 },
  achievement: { family: 'ion', name: 'trophy-outline', variant: 'burst', scale: 0.54 },
  warning: { family: 'ion', name: 'warning-outline', variant: 'scan', scale: 0.54 },
  progress: { family: 'ion', name: 'stats-chart-outline', variant: 'pulse', scale: 0.54 },
  stats: { family: 'mci', name: 'chart-box-outline', variant: 'pulse', scale: 0.54 },
  settings: { family: 'ion', name: 'settings-outline', variant: 'pulse', scale: 0.54 },
  theme: { family: 'ion', name: 'color-palette-outline', variant: 'pulse', scale: 0.54 },
  pool: { family: 'mci', name: 'pool', variant: 'scan', scale: 0.58 },
  intensity_low: { family: 'ion', name: 'chevron-down-outline', variant: 'pulse', scale: 0.56 },
  intensity_medium: { family: 'ion', name: 'remove-outline', variant: 'pulse', scale: 0.56 },
  intensity_high: { family: 'ion', name: 'chevron-up-outline', variant: 'burst', scale: 0.56 },
  check: { family: 'ion', name: 'checkmark-outline', variant: 'burst', scale: 0.56 },
  rest: { family: 'mci', name: 'sleep', variant: 'pulse', scale: 0.56 },
  time: { family: 'ion', name: 'time-outline', variant: 'pulse', scale: 0.54 },
  distance: { family: 'ion', name: 'navigate-outline', variant: 'scan', scale: 0.54 },
  reps: { family: 'ion', name: 'repeat-outline', variant: 'pulse', scale: 0.54 },
  target: { family: 'ion', name: 'locate-outline', variant: 'scan', scale: 0.54 },
  lock: { family: 'ion', name: 'lock-closed-outline', variant: 'pulse', scale: 0.54 },
  info: { family: 'ion', name: 'information-circle-outline', variant: 'pulse', scale: 0.54 },
  arrow: { family: 'ion', name: 'arrow-forward-outline', variant: 'scan', scale: 0.54 },
  badge: { family: 'mci', name: 'badge-account-horizontal-outline', variant: 'burst', scale: 0.56 },
  gear: { family: 'mci', name: 'toolbox-outline', variant: 'scan', scale: 0.56 },
  outfit: { family: 'mci', name: 'tshirt-crew-outline', variant: 'pulse', scale: 0.56 },
  army: { family: 'mci', name: 'star-outline', variant: 'burst', scale: 0.54 },
  navy: { family: 'mci', name: 'anchor', variant: 'scan', scale: 0.56 },
  marines: { family: 'mci', name: 'shield-sword-outline', variant: 'burst', scale: 0.56 },
  airforce: { family: 'ion', name: 'paper-plane-outline', variant: 'scan', scale: 0.54 },
  coastguard: { family: 'ion', name: 'boat-outline', variant: 'scan', scale: 0.54 },
  spaceforce: { family: 'ion', name: 'rocket-outline', variant: 'burst', scale: 0.54 },
};

const aliasMap: Record<string, GameIconName> = {
  home: 'home',
  '🦅': 'program',
  '⚔️': 'program',
  'shield-outline': 'program',
  basecamp: 'program',
  raider: 'program',
  recon: 'program',
  profile: 'profile',
  '🔰': 'rank',
  '🎖️': 'rank',
  '🛡️': 'rank',
  '👑': 'rank',
  '💀': 'rank',
  '⚡': 'level',
  level: 'level',
  '🔥': 'streak',
  streak: 'streak',
  '📋': 'mission',
  mission: 'mission',
  '💪': 'strength',
  '🏋️': 'strength',
  '🏋️‍♂️': 'strength',
  '🏋️‍♀️': 'strength',
  strength: 'strength',
  '🦵': 'lower',
  lower: 'lower',
  '🔄': 'core',
  '🌉': 'core',
  '💫': 'core',
  core: 'core',
  '🏃': 'run',
  '🏃‍♂️': 'run',
  '🏃‍♀️': 'run',
  run: 'run',
  cardio: 'run',
  endurance: 'run',
  '🏊': 'swim',
  '🏊‍♂️': 'swim',
  '🌊': 'swim',
  '💧': 'swim',
  swim: 'swim',
  swimming: 'swim',
  '🎒': 'ruck',
  ruck: 'ruck',
  rucking: 'ruck',
  '🧘': 'recovery',
  '🧘‍♂️': 'recovery',
  recovery: 'recovery',
  '🛌': 'rest',
  rest: 'rest',
  warmup: 'warmup',
  '⭐': 'xp',
  xp: 'xp',
  '🪙': 'coin',
  coin: 'coin',
  '🏆': 'achievement',
  'trophy-outline': 'achievement',
  achievement: 'achievement',
  achievements: 'achievement',
  '⚠️': 'warning',
  warning: 'warning',
  '📈': 'progress',
  '📉': 'progress',
  '📊': 'stats',
  progress: 'progress',
  stats: 'stats',
  '⚙️': 'settings',
  'settings-outline': 'settings',
  settings: 'settings',
  'ℹ️': 'info',
  info: 'info',
  lock: 'lock',
  locked: 'lock',
  timer: 'time',
  clock: 'time',
  arrow: 'arrow',
  next: 'arrow',
  forward: 'arrow',
  '🎯': 'target',
  target: 'target',
  badge: 'badge',
  gear: 'gear',
  outfit: 'outfit',
  army: 'army',
  navy: 'navy',
  marines: 'marines',
  airforce: 'airforce',
  coastguard: 'coastguard',
  spaceforce: 'spaceforce',
  '🌿': 'theme',
  '🏜️': 'theme',
  '🧊': 'theme',
  '🔴': 'theme',
  '⚓': 'theme',
  '✈️': 'theme',
  '🚢': 'theme',
  '🚀': 'theme',
  theme: 'theme',
  '🇺🇸': 'theme',
  '🏊 pool access': 'pool',
  pool: 'pool',
  '🟢': 'intensity_low',
  '🟡': 'intensity_medium',
  '🔴 intensity': 'intensity_high',
  '✅': 'check',
  check: 'check',
  '⏱': 'time',
  time: 'time',
  '↔️': 'distance',
  distance: 'distance',
  reps: 'reps',
  test: 'test',
};

function normalizeName(name?: string | null): GameIconName {
  if (!name) return 'mission';
  const direct = aliasMap[name];
  if (direct) return direct;
  const normalized = name.trim().toLowerCase();
  if (aliasMap[normalized]) return aliasMap[normalized];
  if (normalized.includes('swim')) return 'swim';
  if (normalized.includes('ruck') || normalized.includes('pack')) return 'ruck';
  if (normalized.includes('run') || normalized.includes('tempo') || normalized.includes('sprint')) return 'run';
  if (normalized.includes('recover') || normalized.includes('sleep') || normalized.includes('rest')) return 'recovery';
  if (normalized.includes('strength') || normalized.includes('dumbbell') || normalized.includes('press') || normalized.includes('pull')) return 'strength';
  if (normalized.includes('profile') || normalized.includes('operator')) return 'profile';
  if (normalized.includes('lock') || normalized.includes('secure')) return 'lock';
  if (normalized.includes('info')) return 'info';
  if (normalized.includes('arrow') || normalized.includes('forward') || normalized.includes('next')) return 'arrow';
  if (normalized.includes('timer') || normalized.includes('clock')) return 'time';
  if (normalized.includes('badge')) return 'badge';
  if (normalized.includes('outfit') || normalized.includes('uniform')) return 'outfit';
  if (normalized.includes('gear') || normalized.includes('watch') || normalized.includes('glove')) return 'gear';
  if (normalized.includes('army')) return 'army';
  if (normalized.includes('navy')) return 'navy';
  if (normalized.includes('marine')) return 'marines';
  if (normalized.includes('air')) return 'airforce';
  if (normalized.includes('coast')) return 'coastguard';
  if (normalized.includes('space')) return 'spaceforce';
  if (normalized.includes('mission') || normalized.includes('program')) return 'mission';
  if (normalized.includes('warm')) return 'warmup';
  if (normalized.includes('time') || normalized.includes('clock')) return 'time';
  if (normalized.includes('distance') || normalized.includes('mile')) return 'distance';
  if (normalized.includes('theme') || normalized.includes('branch')) return 'theme';
  if (normalized.includes('set') || normalized.includes('rep')) return 'reps';
  if (normalized.includes('push') || normalized.includes('pull') || normalized.includes('dip') || normalized.includes('burpee')) return 'strength';
  if (normalized.includes('squat') || normalized.includes('lunge')) return 'lower';
  if (normalized.includes('situp') || normalized.includes('crunch') || normalized.includes('plank') || normalized.includes('hollow') || normalized.includes('lsit')) return 'core';
  if (normalized.includes('handstand')) return 'warmup';
  if (normalized.includes('climb')) return 'run';
  if (normalized.includes('swimming')) return 'swim';
  if (normalized.includes('running')) return 'run';
  return 'mission';
}

function renderIcon(family: IconFamily, name: string, size: number, color: string) {
  if (family === 'ion') {
    return <Ionicons name={name as never} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={name as never} size={size} color={color} />;
}

export function GameIcon({
  name,
  size = 28,
  color,
  style,
  animated = false,
  variant = 'full',
}: GameIconProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolvedName = normalizeName(name);
  const spec = iconSpecs[resolvedName];
  const overlayColor = color ?? colors.textPrimary;
  const iconSize = Math.round(size * (spec.scale ?? 0.56));
  const innerSize = variant === 'minimal' ? size * 0.62 : size * 0.72;
  const phase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    phase.stopAnimation();
    phase.setValue(0);

    if (!animated) {
      return;
    }

    const duration = spec.variant === 'burst' ? 920 : spec.variant === 'scan' ? 1500 : 1800;
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration,
        easing: spec.variant === 'scan' ? Easing.inOut(Easing.ease) : Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    loop.start();

    return () => {
      loop.stop();
      phase.stopAnimation();
    };
  }, [animated, phase, spec.variant]);

  const haloOpacity =
    spec.variant === 'burst'
      ? phase.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.18, 0.55, 0.04] })
      : spec.variant === 'scan'
        ? phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.12, 0.26, 0.12] })
        : phase.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.06] });

  const haloScale =
    spec.variant === 'burst'
      ? phase.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.16] })
      : phase.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.08] });

  const accentOpacity =
    spec.variant === 'scan'
      ? phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.16, 0.9, 0.16] })
      : phase.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.3, 0.85, 0.3] });

  const accentTranslate =
    spec.variant === 'scan'
      ? phase.interpolate({ inputRange: [0, 1], outputRange: [-(size * 0.12), size * 0.12] })
      : phase.interpolate({ inputRange: [0, 1], outputRange: [-(size * 0.02), size * 0.02] });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {animated ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.hudHalo,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: overlayColor,
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.hudAccent,
              {
                width: size * 0.42,
                backgroundColor: overlayColor,
                opacity: accentOpacity,
                transform: [{ translateX: accentTranslate }],
              },
            ]}
          />
        </>
      ) : null}
      <View
        style={[
          styles.innerPlate,
          variant === 'minimal' && styles.innerPlateMinimal,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {renderIcon(spec.family, spec.name, iconSize, overlayColor)}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    hudHalo: {
      position: 'absolute',
      borderWidth: 1,
    },
    hudAccent: {
      position: 'absolute',
      top: '18%',
      height: 2,
      borderRadius: 999,
    },
    innerPlate: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(10, 10, 15, 0.42)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    innerPlateMinimal: {
      backgroundColor: 'rgba(10, 10, 15, 0.24)',
      borderColor: 'rgba(255,255,255,0.05)',
    },
  });
