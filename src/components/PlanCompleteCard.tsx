import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getWorkoutPlan } from '../data/workoutPlans';
import { displayTitle, planHero } from '../features/planDisplay';
import { recommendPlans } from '../features/planRecommend';
import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useUserStore } from '../store/useUserStore';
import { Button } from '../ui/Button';
import { HeroArt } from '../ui/ExerciseArt';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { toast } from '../ui/Toast';
import { color, radius, space } from '../ui/tokens';

/**
 * Shown on Train the first time a followed plan's last day is finished: the moment is worth
 * marking, and it's the natural place to ask "what now?" instead of silently resetting.
 */
export function PlanCompleteCard() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const planId = usePlanLibraryStore((s) => s.justCompleted);
  const cycle = usePlanLibraryStore((s) => s.cycle);
  const profile = useUserStore((s) => s.profile);
  const plan = planId ? getWorkoutPlan(planId) : undefined;

  const next = useMemo(() => {
    if (!profile || !plan) return undefined;
    return recommendPlans(profile, 6).find((r) => r.plan.id !== plan.id)?.plan;
  }, [profile, plan]);

  if (!plan) return null;

  const days = plan.days.length;
  const w = Math.round(width * 0.8);

  const again = () => {
    haptic.success();
    usePlanLibraryStore.getState().restartPlan(plan.id);
    toast(`${plan.title} · round ${cycle + 1}`, { icon: 'restart' });
  };

  const startNext = () => {
    if (!next) return;
    haptic.success();
    usePlanLibraryStore.getState().clearJustCompleted();
    usePlanLibraryStore.getState().follow(next.id);
    navigation.navigate('LibraryPlanDetail', { planId: next.id });
  };

  return (
    <View style={[styles.card, { width: w, alignSelf: 'center' }]}>
      <HeroArt exercise={planHero(plan)} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(8,9,11,0.97)']} locations={[0.2, 0.8]} style={StyleSheet.absoluteFill} />
      <View style={styles.body}>
        <Text variant="overline" tone="accent">
          Plan complete
        </Text>
        <Text variant="hero" style={{ marginTop: 6 }} numberOfLines={2}>
          {displayTitle(plan.title)}
        </Text>
        <Text variant="callout" tone="secondary" style={{ marginTop: 6 }}>
          {days} {days === 1 ? 'workout' : 'workouts'} done{cycle > 1 ? ` · ${cycle} rounds` : ''}. Add a little weight and run it back, or move on to something new.
        </Text>
        <View style={{ gap: space.sm, marginTop: space.lg }}>
          {next ? <Button title={`Start ${next.title}`} size="md" onPress={startNext} /> : null}
          <Button title="Run this plan again" variant="secondary" size="md" onPress={again} />
          <Button
            title="Browse plans"
            variant="outline"
            size="md"
            onPress={() => {
              usePlanLibraryStore.getState().clearJustCompleted();
              navigation.navigate('PlanBrowse');
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.hero,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: color.surface,
    minHeight: 380,
    justifyContent: 'flex-end',
  },
  body: { padding: space.xl },
});
