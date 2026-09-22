import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MuscleBodyMap } from '../components/MuscleBodyMap';
import { getExerciseById } from '../data/exercises';
import { getProgramWorkoutDay } from '../data/programWorkouts';
import { exerciseDetail, formatMinutes, muscleDistribution, muscleLabel, plural, WEEKDAYS, workoutExercises } from '../features/plan';
import { useProgramStore } from '../store/useProgramStore';
import { useSessionStore } from '../store/useSessionStore';
import { hasTrainingAccess, useSubscriptionStore } from '../store/useSubscriptionStore';
import { useUserStore } from '../store/useUserStore';
import type { RootStackParamList } from '../types/navigation';
import { Button } from '../ui/Button';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { HexIcon } from '../ui/HexIcon';
import { Icon } from '../ui/Icon';
import { EmptyState, NavHeader } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, motion, radius, space } from '../ui/tokens';
import { getLocalDateKey, parseLocalDateKey } from '../utils/dateKey';

const SECTION_LABEL: Record<string, string> = {
  warmup: 'Warm-up',
  workout: 'Workout',
  cardio: 'Conditioning',
  recovery: 'Recovery',
  test: 'Assessment',
  ruck: 'Ruck',
  swim: 'Swim',
};

export default function WorkoutDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'WorkoutDetail'>>();
  const insets = useSafeAreaInsets();
  const program = useProgramStore((s) => s.selectedProgram);
  const profile = useUserStore((s) => s.profile);
  const claimed = useUserStore((s) => s.progress.claimed_missions);
  const trialStartedAt = useSubscriptionStore((s) => s.trialStartedAt);
  const entitlementActive = useSubscriptionStore((s) => s.entitlementActive);
  const session = useSessionStore();

  const day = useMemo(() => getProgramWorkoutDay(program, params.workoutId, profile), [program, params.workoutId, profile]);
  const exercises = useMemo(() => workoutExercises(day), [day]);
  const distribution = useMemo(() => muscleDistribution(day, 3), [day]);

  if (!day) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Workout unavailable" body="This mission isn’t part of your current program. Head back and pick another day." />
      </View>
    );
  }

  const isToday = params.dateKey === getLocalDateKey();
  const completed = claimed.has(`${params.dateKey}:${day.id}`);
  const unlocked = hasTrainingAccess({ trialStartedAt, entitlementActive });
  const sameSession = session.active && session.workoutDayId === day.id;
  const date = parseLocalDateKey(params.dateKey);
  const weekday = date ? WEEKDAYS[date.getDay()] : '';

  let cta: { title: string; icon?: 'play'; disabled?: boolean; onPress?: () => void } = { title: 'Start Workout', icon: 'play' };
  if (completed) cta = { title: 'Completed today', disabled: true };
  else if (!unlocked) cta = { title: 'Unlock Gruntz Pro', onPress: () => navigation.navigate('Paywall') };
  else if (sameSession) cta = { title: 'Resume Workout', icon: 'play', onPress: () => session.expand() };
  // Both of these used to be dead disabled buttons: one with nowhere to go, one with no way to train early.
  else if (session.active) cta = { title: 'Go to your current workout', icon: 'play', onPress: () => session.expand() };
  else if (!isToday) cta = { title: `Do it now · ${weekday}'s workout`, icon: 'play' };

  const start = () => {
    if (cta.onPress) return cta.onPress();
    haptic.medium();
    session.start(day, params.dateKey);
  };

  let row = 0;
  return (
    <View style={styles.screen}>
      <NavHeader
        right={
          <View style={styles.xp}>
            <HexIcon size={15} color={color.accent} filled />
            <Text variant="subhead" tone="accent" tabular>
              +{day.rewards.xp} XP
            </Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text variant="title">{day.title}</Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6, fontSize: 17 }}>
            {plural(exercises.length, 'exercise')}, {formatMinutes(day.estimated_duration)}
          </Text>
          {day.objective ? (
            <Text variant="callout" tone="tertiary" style={{ marginTop: space.md }}>
              {day.objective}
            </Text>
          ) : null}
        </View>

        {distribution.length ? (
          <>
            <Text variant="section" style={styles.sectionTitle}>
              Muscle distribution
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
              {distribution.map((d) => (
                <View key={d.muscle} style={styles.tile}>
                  <View style={styles.tileArt}>
                    <MuscleBodyMap muscles={{ [d.muscle]: 3 }} scale={0.3} variant="soft" side={['back', 'hamstrings', 'glutes', 'triceps', 'lats', 'calves'].includes(d.muscle.toLowerCase()) ? 'back' : 'front'} />
                  </View>
                  <View style={{ gap: 6 }}>
                    <Text variant="callout">{muscleLabel(d.muscle)}</Text>
                    <View style={styles.pct}>
                      <Text variant="subhead" tabular>
                        {d.pct}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text variant="section" style={styles.sectionTitle}>
          {plural(exercises.length, 'exercise')}
        </Text>
        {day.sections.map((section) => (
          <View key={section.id}>
            <Text variant="overline" tone="tertiary" style={styles.sectionTag}>
              {SECTION_LABEL[section.type] ?? section.title}
              {section.rounds && section.rounds > 1 ? ` · ${section.rounds} rounds` : ''}
            </Text>
            {section.exercises.map((id, i) => {
              const ex = getExerciseById(id);
              if (!ex) return null;
              const delay = Math.min(row++, 8) * motion.stagger;
              return (
                <Animated.View key={`${section.id}-${i}`} entering={FadeInDown.delay(delay).duration(320)}>
                  <Tap
                    feedback="highlight"
                    baseColor={color.bg}
                    pressedColor={color.bgRaised}
                    style={styles.row}
                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
                    accessibilityLabel={`${ex.name}, ${exerciseDetail(ex)}`}
                  >
                    <ExerciseThumb exercise={ex} size={76} />
                    <View style={{ flex: 1, marginLeft: space.md }}>
                      <Text variant="callout" tone="secondary">
                        {exerciseDetail(ex)}
                      </Text>
                      <Text variant="headline" style={{ fontSize: 18, marginTop: 2 }} numberOfLines={2}>
                        {ex.name}
                      </Text>
                    </View>
                    <Icon name="info" size={22} color={color.textSecondary} />
                  </Tap>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xs }]} pointerEvents="box-none">
        <LinearGradient colors={['rgba(0,0,0,0)', color.bg]} style={styles.fade} pointerEvents="none" />
        <View style={styles.footerInner}>
          <Button title={cta.title} icon={cta.icon} disabled={cta.disabled} onPress={start} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  xp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: color.accent,
  },
  head: { paddingHorizontal: space.gutter + 4, paddingTop: space.md },
  sectionTitle: { paddingHorizontal: space.gutter + 4, marginTop: space.xxl, marginBottom: space.md },
  tiles: { paddingHorizontal: space.gutter + 4, gap: 18 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tileArt: {
    width: 76,
    height: 76,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    backgroundColor: color.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  pct: { alignSelf: 'flex-start', paddingHorizontal: 10, height: 28, borderRadius: 8, backgroundColor: color.surface, justifyContent: 'center' },
  sectionTag: { paddingHorizontal: space.gutter + 4, marginTop: space.md, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter + 4, paddingVertical: 12 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fade: { height: 48 },
  footerInner: { paddingHorizontal: space.gutter, backgroundColor: color.bg, paddingTop: 4 },
});
