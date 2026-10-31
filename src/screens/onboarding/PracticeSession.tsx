import { useReducer, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getExerciseById } from '../../data/exercises';
import { trackRetentionEvent } from '../../services/retentionAnalytics';
import { Button } from '../../ui/Button';
import { ExerciseThumb } from '../../ui/ExerciseArt';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, radius, space } from '../../ui/tokens';
import { INITIAL_PRACTICE_LOG, practiceLogReducer } from './flow';
import { Question } from './parts';

/** A hands-on sample: no physical exercise, workout records or rewards. */
export function PracticeSession({ onReady }: { onReady: () => void }) {
  const [log, dispatch] = useReducer(practiceLogReducer, INITIAL_PRACTICE_LOG);
  const reported = useRef(false);
  const logged = log.loggedReps !== null;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
      <Question title={logged ? 'That’s the training loop' : 'Try logging a set'} subtitle="Practice only · no exercise needed" />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.exercise}>
            <ExerciseThumb exercise={getExerciseById('air_squats')} size={56} />
            <View style={{ flex: 1 }}>
              <Text variant="headline">Air squats</Text>
              <Text variant="subhead" tone="secondary" style={{ marginTop: 4 }}>Sample set · 8 reps planned</Text>
            </View>
          </View>
          <Text variant="callout" tone="secondary" style={{ marginTop: space.lg }}>
            {logged ? 'Your sample set is checked off.' : 'Adjust the sample reps, then mark the set done.'}
          </Text>
          <View style={styles.logger}>
            <Text variant="subhead" tone="secondary" style={{ flex: 1 }}>SET 1</Text>
            <Tap
              onPress={() => dispatch({ type: 'adjust', amount: -1 })}
              disabled={logged || log.reps <= 1}
              style={styles.adjust}
              accessibilityLabel="Decrease sample reps"
            ><Icon name="minus" size={18} color={logged || log.reps <= 1 ? color.textQuaternary : color.text} /></Tap>
            <View style={styles.repValue} accessible accessibilityLabel={`${log.reps} sample reps`} accessibilityLiveRegion="polite">
              <Text variant="title" tabular>{log.reps}</Text>
              <Text variant="caption" tone="secondary">reps</Text>
            </View>
            <Tap
              onPress={() => dispatch({ type: 'adjust', amount: 1 })}
              disabled={logged || log.reps >= 50}
              style={styles.adjust}
              accessibilityLabel="Increase sample reps"
            ><Icon name="plus" size={18} color={logged || log.reps >= 50 ? color.textQuaternary : color.text} /></Tap>
          </View>
          <Button
            title={logged ? 'Sample set logged' : 'Log sample set'}
            icon="check"
            variant={logged ? 'secondary' : 'primary'}
            disabled={logged}
            size="md"
            onPress={() => {
              if (reported.current) return;
              reported.current = true;
              dispatch({ type: 'log' });
              trackRetentionEvent('practice_completed');
              onReady();
              haptic.success();
            }}
          />
        </View>
        {logged ? (
          <Animated.View entering={FadeInDown.duration(240)} style={styles.debrief} accessibilityLiveRegion="polite">
            <Text variant="overline" tone="accent">Practice debrief</Text>
            <Text variant="title" style={{ marginTop: 8 }}>1 set · {log.loggedReps} reps</Text>
            <Text variant="callout" tone="secondary" style={{ marginTop: 10 }}>
              In a real workout, your logged sets build your history and reveal progress. Finish a mission to earn XP and start your streak.
            </Text>
            <View style={styles.next}>
              <Icon name="arrowRight" size={18} color={color.accent} />
              <Text variant="subhead" style={{ flex: 1 }}>Next: open your plan and start your first real session.</Text>
            </View>
          </Animated.View>
        ) : null}
        <Text variant="footnote" tone="tertiary" align="center" style={{ marginTop: space.lg }}>
          This sample stays here. It adds no workout, XP or streak progress.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, gap: space.md },
  card: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space.lg },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  logger: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: space.lg },
  adjust: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bgRaised },
  repValue: { minWidth: 56, alignItems: 'center' },
  debrief: { padding: space.lg, borderRadius: radius.lg, backgroundColor: color.surface },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: space.lg },
});
