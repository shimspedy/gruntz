import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getExerciseById } from '../../data/exercises';
import { useSessionStore } from '../../store/useSessionStore';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Sheet } from '../../ui/Sheet';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { color, space } from '../../ui/tokens';

const OPTIONS = [0, 30, 45, 60, 90, 120, 180];

const label = (s: number) => (s === 0 ? 'Off' : s < 60 ? `${s} sec` : s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`);

/** Rest between sets for one movement. */
export function RestSheet({ exerciseId, onClose }: { exerciseId: string | null; onClose: () => void }) {
  const ex = exerciseId ? getExerciseById(exerciseId) : undefined;
  const override = useSessionStore((s) => (exerciseId ? s.restOverrides[exerciseId] : undefined));
  const setRestFor = useSessionStore((s) => s.setRestFor);
  const current = override ?? ex?.rest_seconds ?? 0;

  return (
    <Sheet visible={!!ex} onClose={onClose} title="Rest timer">
      <View style={styles.list}>
        {OPTIONS.map((o) => {
          const active = o === current;
          return (
            <Tap
              key={o}
              feedback="highlight"
              baseColor={color.bgRaised}
              pressedColor={color.surface}
              style={styles.row}
              onPress={() => {
                haptic.selection();
                if (exerciseId) setRestFor(exerciseId, o);
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {label(o)}
              </Text>
              {o === ex?.rest_seconds ? (
                <Text variant="footnote" tone="tertiary" style={{ marginRight: 12 }}>
                  Prescribed
                </Text>
              ) : null}
              {active ? <Icon name="check" size={18} color={color.accent} weight="semibold" /> : null}
            </Tap>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: space.sm },
  row: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter },
});
