import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getExerciseById } from '../data/exercises';
import { getMovementCard } from '../data/movementCards';
import { muscleLabel } from '../features/plan';
import type { RootStackParamList } from '../types/navigation';
import { ExerciseThumb } from '../ui/ExerciseArt';
import { Icon } from '../ui/Icon';
import { EmptyState, Hairline, NavHeader, Stat } from '../ui/Layout';
import { Tap } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { color, motion, radius, space } from '../ui/tokens';

export default function CardDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'CardDetail'>>();
  const insets = useSafeAreaInsets();
  const card = getMovementCard(params.cardId);

  if (!card) {
    return (
      <View style={styles.screen}>
        <NavHeader />
        <EmptyState icon="alert" title="Card unavailable" body="This training card couldn’t be loaded. Go back and open it again." />
      </View>
    );
  }

  const exerciseCount = card.sections.reduce((n, s) => n + s.exercises.length, 0);
  let row = 0;

  return (
    <View style={styles.screen}>
      <NavHeader title={`${card.category === 'swim' ? 'Swim' : 'Movement'} card ${card.card_number}`} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text variant="title">{card.name}</Text>
          <Text variant="body" tone="secondary" style={{ marginTop: 6 }}>
            {card.description}
          </Text>
          <View style={styles.stats}>
            <Stat label="Duration" value={`${card.estimated_duration} min`} accent style={{ flex: 1 }} />
            <Stat label="Exercises" value={String(exerciseCount)} style={{ flex: 1 }} />
            <Stat label="Level" value={card.difficulty.charAt(0).toUpperCase() + card.difficulty.slice(1)} style={{ flex: 1 }} />
          </View>
          <Hairline />
          <View style={styles.chips}>
            {card.target_muscle_groups.map((m) => (
              <View key={m} style={styles.chip}>
                <Text variant="subhead">{muscleLabel(m)}</Text>
              </View>
            ))}
          </View>
        </View>

        {card.sections.map((section) => (
          <View key={section.id} style={{ marginTop: space.xl }}>
            <View style={styles.sectionHead}>
              <Text variant="section">{section.name}</Text>
              <Text variant="subhead" tone="secondary">
                {section.rounds > 1 ? `${section.rounds} rounds` : '1 round'}
                {section.rest_between_rounds ? ` · ${section.rest_between_rounds}s rest` : ''}
              </Text>
            </View>
            {section.notes ? (
              <Text variant="callout" tone="tertiary" style={{ paddingHorizontal: space.gutter + 4, marginBottom: space.sm }}>
                {section.notes}
              </Text>
            ) : null}
            {section.exercises.map((ce, i) => {
              const ex = getExerciseById(ce.exercise_id);
              if (!ex) return null;
              const detail = ce.prescribed_reps
                ? `${ce.prescribed_sets || 1} ${(ce.prescribed_sets || 1) === 1 ? 'set' : 'sets'} x ${ce.prescribed_reps} reps`
                : ce.prescribed_duration
                  ? `${ce.prescribed_duration}s`
                  : ex.distance || '';
              const delay = Math.min(row++, 8) * motion.stagger;
              return (
                <Animated.View key={`${ce.exercise_id}-${i}`} entering={FadeInDown.delay(delay).duration(300)}>
                  <Tap
                    feedback="highlight"
                    baseColor={color.bg}
                    pressedColor={color.bgRaised}
                    style={styles.row}
                    onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
                    accessibilityLabel={`${ex.name}, ${detail}`}
                  >
                    <ExerciseThumb exercise={ex} size={72} />
                    <View style={{ flex: 1, marginLeft: space.md }}>
                      {detail ? (
                        <Text variant="callout" tone="secondary">
                          {detail}
                        </Text>
                      ) : null}
                      <Text variant="headline" style={{ fontSize: 18, marginTop: 2 }} numberOfLines={2}>
                        {ex.name}
                      </Text>
                      {ce.notes ? (
                        <Text variant="footnote" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={2}>
                          {ce.notes}
                        </Text>
                      ) : null}
                    </View>
                    <Icon name="info" size={22} color={color.textSecondary} />
                  </Tap>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  head: { paddingHorizontal: space.gutter + 4, paddingTop: space.md },
  stats: { flexDirection: 'row', paddingVertical: space.lg, marginTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.lg },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: color.surface, justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: space.gutter + 4, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter + 4, paddingVertical: 12 },
});
