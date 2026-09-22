import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { getExerciseById, libraryExerciseId } from '../data/exercises';
import { scheduleLabel } from '../screens/RoutineDetailScreen';
import { routineMinutes, useRoutineStore, type Routine } from '../store/useRoutineStore';
import { HeroArt } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { SectionTitle } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { plural } from '../features/plan';
import { Text } from '../ui/Text';
import { haptic } from '../ui/haptics';
import { color, radius, space } from '../ui/tokens';

const W = 168;
const H = 208;

/** The user's own workouts: a "new" tile first, then each saved routine. */
export function MyWorkouts() {
  const navigation = useNavigation();
  const routines = useRoutineStore((s) => s.routines);

  const create = () => {
    haptic.light();
    useRoutineStore.getState().newDraft();
    navigation.navigate('RoutineEditor');
  };

  return (
    <View>
      <SectionTitle title="My Workouts" style={styles.title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Tap onPress={create} scaleTo={0.96} style={styles.newTile} accessibilityLabel="Plan a new workout">
          <View style={styles.plus}>
            <Icon name="plus" size={26} color={color.text} weight="medium" />
          </View>
          <Text variant="headline" style={{ marginTop: space.md }}>
            New workout
          </Text>
          <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: 4, paddingHorizontal: 12 }}>
            Pick from {EXERCISE_LIBRARY.length} videos
          </Text>
        </Tap>
        {routines.map((r) => (
          <Animated.View key={r.id} entering={FadeIn.duration(240)}>
            <RoutineCard routine={r} onPress={() => navigation.navigate('RoutineDetail', { routineId: r.id })} />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

function RoutineCard({ routine, onPress }: { routine: Routine; onPress: () => void }) {
  const first = routine.items[0]?.key;
  return (
    <Tap onPress={onPress} scaleTo={0.96} style={styles.card} accessibilityLabel={`${routine.name}, ${plural(routine.items.length, 'exercise')}`}>
      {first ? <HeroArt exercise={getExerciseById(libraryExerciseId(first))} style={StyleSheet.absoluteFill} /> : null}
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(6,7,9,0.95)']} locations={[0.3, 0.95]} style={StyleSheet.absoluteFill} />
      <View style={styles.cardCopy}>
        <Text variant="headline" numberOfLines={2}>
          {routine.name}
        </Text>
        <Text variant="footnote" tone="secondary" style={{ marginTop: 3 }}>
          {plural(routine.items.length, 'exercise')} · {routineMinutes(routine)} min
        </Text>
        <Text variant="caption" tone="accent" style={{ marginTop: 4 }} numberOfLines={1}>
          {scheduleLabel(routine.days)}
        </Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: space.gutter, marginTop: space.xxl, marginBottom: space.md },
  row: { paddingHorizontal: space.gutter, gap: 12 },
  newTile: {
    width: W,
    height: H,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  card: { width: W, height: H, borderRadius: radius.lg, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: color.surface },
  cardCopy: { position: 'absolute', left: 14, right: 14, bottom: 14 },
});
