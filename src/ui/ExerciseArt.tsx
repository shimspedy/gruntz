import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getExerciseMedia } from '../data/exerciseMedia';
import type { Exercise } from '../types';
import { Icon, type IconName } from './Icon';
import { color } from './tokens';

export function categoryIcon(exercise?: Pick<Exercise, 'category' | 'id'>): IconName {
  if (!exercise) return 'dumbbell';
  const id = exercise.id;
  if (id.includes('ruck')) return 'ruck';
  if (id.includes('swim') || id.includes('tread') || id.includes('float')) return 'swim';
  switch (exercise.category) {
    case 'running':
      return 'run';
    case 'rucking':
      return 'ruck';
    case 'swimming':
      return 'swim';
    case 'core':
      return 'core';
    case 'recovery':
    case 'warmup':
      return 'mobility';
    default:
      return 'strength';
  }
}

interface ThumbProps {
  exercise?: Exercise;
  /** Library clip key, for items that aren't app exercises. */
  mediaKey?: string;
  size?: number;
  /** light: studio still on a white circle (lists) · dark: x-ray still (session carousel) */
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

/** Circular exercise thumbnail with a symbol fallback for movements that have no render. */
export function ExerciseThumb({ exercise, mediaKey, size = 64, tone = 'light', style }: ThumbProps) {
  const key = mediaKey ?? exercise?.media_key;
  const media = getExerciseMedia(key);
  const bg = tone === 'light' ? '#EDEDEF' : '#0B0B0C';
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: media ? bg : color.surfaceHigh },
        styles.thumb,
        style,
      ]}
    >
      {media ? (
        <Image
          source={tone === 'light' ? media.thumb : media.poster}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={120}
          recyclingKey={key}
        />
      ) : (
        <Icon name={categoryIcon(exercise)} size={size * 0.42} color={color.textSecondary} />
      )}
    </View>
  );
}

/** Large portrait artwork for plan cards and headers. Falls back to a lit symbol on graphite. */
export function HeroArt({ exercise, style, children }: { exercise?: Exercise; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const media = getExerciseMedia(exercise?.media_key);
  return (
    <View style={[styles.hero, style]}>
      {media ? (
        <Image source={media.hero} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
          <LinearGradient colors={['#1B2433', '#0A0B0D']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
          <Icon name={categoryIcon(exercise)} size={120} color="rgba(255,255,255,0.14)" weight="ultraLight" />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden', backgroundColor: '#050506' },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
});
