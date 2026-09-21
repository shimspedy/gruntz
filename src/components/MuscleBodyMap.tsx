import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Body from 'react-native-body-highlighter';
import type { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { color } from '../ui/tokens';

/**
 * Maps the app's muscle group names (exercises.ts MUSCLE_GROUPS) to body-highlighter slugs.
 * Front: chest, biceps, abs, obliques, deltoids, forearm, adductors, quadriceps, tibialis, trapezius
 * Back: upper-back, lower-back, hamstring, gluteal, abductors, trapezius, deltoids, triceps, forearm, calves
 */
export const MUSCLE_TO_SLUG: Record<string, Slug[]> = {
  chest: ['chest'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  obliques: ['obliques'],
  forearms: ['forearm'],
  adductors: ['adductors'],
  calves: ['calves'],
  shoulders: ['deltoids'],
  deltoids: ['deltoids'],
  quads: ['quadriceps'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  back: ['upper-back', 'lower-back'],
  upper_back: ['upper-back'],
  lower_back: ['lower-back'],
  lats: ['upper-back'],
  traps: ['trapezius'],
  core: ['abs', 'obliques'],
  abs: ['abs'],
  'lower abs': ['abs'],
  'hip flexors': ['adductors'],
  legs: ['quadriceps', 'hamstring', 'calves'],
  'full body': ['chest', 'deltoids', 'abs', 'quadriceps', 'upper-back', 'biceps', 'triceps'],
  'upper-back': ['upper-back'],
  'lower-back': ['lower-back'],
  hamstring: ['hamstring'],
  gluteal: ['gluteal'],
};

/** Three intensities of the accent: touched, trained, dominant. */
const LEVELS = ['#1C4E8C', '#2468C4', color.accent];

interface Props {
  /** muscle name → intensity 1..3 */
  muscles?: Record<string, number>;
  side?: 'front' | 'back';
  scale?: number;
  /** line: white outline art on black (Ranks) · soft: dim silhouette (tiles) */
  variant?: 'line' | 'soft';
  style?: StyleProp<ViewStyle>;
}

export function MuscleBodyMap({ muscles = {}, side = 'front', scale = 1, variant = 'line', style }: Props) {
  const data = useMemo<ExtendedBodyPart[]>(() => {
    const bySlug = new Map<Slug, number>();
    Object.entries(muscles).forEach(([m, level]) => {
      (MUSCLE_TO_SLUG[m.toLowerCase()] ?? []).forEach((slug) => bySlug.set(slug, Math.max(bySlug.get(slug) ?? 0, level)));
    });
    return Array.from(bySlug.entries()).map(([slug, intensity]) => ({ slug, intensity }));
  }, [muscles]);

  return (
    <View style={[styles.wrap, style]} pointerEvents="none">
      <Body
        data={data}
        gender="male"
        side={side}
        scale={scale}
        border={variant === 'line' ? '#F2F2F4' : 'none'}
        colors={LEVELS}
        defaultFill={variant === 'line' ? '#000000' : '#2A2A2E'}
        defaultStroke={variant === 'line' ? '#D8D8DC' : '#3A3A3E'}
        defaultStrokeWidth={variant === 'line' ? 1.1 : 0.6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
