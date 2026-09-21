import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { getExerciseById } from '../../data/exercises';
import { Sheet } from '../../ui/Sheet';
import { Text } from '../../ui/Text';
import { color, space } from '../../ui/tokens';
import { ExerciseVideo } from '../ExerciseVideo';

/** How-to for the current movement without leaving the workout. */
export function GuideSheet({ exerciseId, onClose }: { exerciseId: string | null; onClose: () => void }) {
  const ex = exerciseId ? getExerciseById(exerciseId) : undefined;
  const { height, width } = useWindowDimensions();
  const lastEx = React.useRef(ex);
  if (ex) lastEx.current = ex;
  const shown = ex ?? lastEx.current;

  return (
    <Sheet visible={!!ex} onClose={onClose} title={shown?.name}>
      <ScrollView style={{ maxHeight: height * 0.72 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.video}>
          <ExerciseVideo exercise={shown} active={!!ex} style={{ width: width - space.gutter * 2, height: (width - space.gutter * 2) * 0.62 }} />
        </View>
        {shown?.steps?.length ? (
          <>
            <Text variant="overline" tone="secondary" style={styles.label}>
              How to
            </Text>
            {shown.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text variant="subhead" tabular>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="callout" style={{ flex: 1 }}>
                  {step}
                </Text>
              </View>
            ))}
          </>
        ) : shown?.description ? (
          <Text variant="callout" tone="secondary" style={{ marginTop: space.md }}>
            {shown.description}
          </Text>
        ) : null}
        {shown?.form_tips?.length ? (
          <>
            <Text variant="overline" tone="secondary" style={styles.label}>
              Form cues
            </Text>
            {shown.form_tips.map((tip, i) => (
              <View key={i} style={styles.tip}>
                <View style={styles.dot} />
                <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
                  {tip}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.gutter, paddingBottom: space.lg },
  video: { borderRadius: 20, overflow: 'hidden', marginTop: space.sm, borderCurve: 'continuous' },
  label: { marginTop: space.xl, marginBottom: space.sm },
  step: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.accent, marginTop: 8 },
});
