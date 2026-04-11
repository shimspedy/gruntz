import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Body from 'react-native-body-highlighter';
import type { Slug, ExtendedBodyPart } from 'react-native-body-highlighter';
import { useColors } from '../theme';
import type { ThemeColors } from '../theme';

interface MuscleBodyMapProps {
  /** Muscle group names from exercise data (e.g. 'chest', 'quads', 'back') */
  activeMuscles?: string[];
  onMusclePress?: (muscleId: string) => void;
  side?: 'front' | 'back';
  scale?: number;
}

/**
 * Maps the app's internal muscle group names (from exercises.ts MUSCLE_GROUPS)
 * to react-native-body-highlighter slugs.
 *
 * Library slugs (front): chest, biceps, abs, obliques, deltoids, forearm,
 *   adductors, quadriceps, tibialis, trapezius, neck, hands, feet, head, knees
 * Library slugs (back): upper-back, lower-back, hamstring, gluteal, abductors,
 *   trapezius, deltoids, triceps, forearm, calves
 */
const MUSCLE_TO_SLUG: Record<string, Slug[]> = {
  // Direct matches
  chest: ['chest'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  obliques: ['obliques'],
  forearms: ['forearm'],
  adductors: ['adductors'],
  calves: ['calves'],

  // Our names → library slugs
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

  // Pass-throughs for any that already match
  'upper-back': ['upper-back'],
  'lower-back': ['lower-back'],
  hamstring: ['hamstring'],
  gluteal: ['gluteal'],
};

/**
 * Convert app muscle names to library BodyPartObject[] data.
 */
function buildBodyData(activeMuscles: string[]): ExtendedBodyPart[] {
  const slugSet = new Set<Slug>();

  activeMuscles.forEach((muscle) => {
    const mappedSlugs = MUSCLE_TO_SLUG[muscle.toLowerCase()];
    if (mappedSlugs) {
      mappedSlugs.forEach((s) => slugSet.add(s));
    }
  });

  return Array.from(slugSet).map((slug) => ({
    slug,
    intensity: 2,
  }));
}

/**
 * Anatomical muscle body map using react-native-body-highlighter.
 * Shows a detailed SVG body with tappable muscle regions.
 * Active muscles glow in electric lime.
 */
export function MuscleBodyMap({
  activeMuscles = [],
  onMusclePress,
  side = 'front',
  scale = 1,
}: MuscleBodyMapProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const bodyData = useMemo(() => buildBodyData(activeMuscles), [activeMuscles]);

  const handlePress = useCallback(
    (muscle: ExtendedBodyPart) => {
      if (!muscle.slug) return;
      // Reverse-map slug back to our muscle name
      const entry = Object.entries(MUSCLE_TO_SLUG).find(([, slugs]) =>
        slugs.includes(muscle.slug as Slug),
      );
      const muscleId = entry ? entry[0] : muscle.slug;
      onMusclePress?.(muscleId);
    },
    [onMusclePress],
  );

  return (
    <View style={styles.container}>
      <Body
        data={bodyData}
        gender="male"
        side={side}
        scale={scale}
        border="none"
        colors={[colors.accent + '66', colors.accent + '99', colors.accent]}
        onBodyPartPress={handlePress}
        defaultFill="#FFFFFF0A"
        defaultStroke="#FFFFFF18"
        defaultStrokeWidth={0.5}
      />
    </View>
  );
}

/** Re-export the slug mapping so HomeScreen can use it */
export { MUSCLE_TO_SLUG };

const createStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
