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
export function RestSheet({ exerciseId, slotKey, onClose }: { exerciseId: string | null; slotKey?: string | null; onClose: () => void }) {
  const ex = exerciseId ? getExerciseById(exerciseId) : undefined;
  const override = useSessionStore((s) => (exerciseId
    ? s.restOverrides[exerciseId] ?? (slotKey ? s.restPrescribed[slotKey] : undefined)
    : undefined));
  const setRestFor = useSessionStore((s) => s.setRestFor);
  const startRest = useSessionStore((s) => s.startRest);
  const resting = useSessionStore((s) => !!s.restEndsAt);
  const current = override ?? ex?.rest_seconds ?? 0;

  return (
    <Sheet visible={!!ex} onClose={onClose} title="Rest timer">
      {/* Rest normally starts itself when a set is logged. This is the way back if
          you skipped it, or want to rest without logging anything. */}
      {current > 0 ? (
        <Tap
          feedback="highlight"
          baseColor={color.bgRaised}
          pressedColor={color.surface}
          style={[styles.row, styles.start]}
          onPress={() => {
            haptic.light();
            startRest(current);
            onClose();
          }}
          accessibilityLabel={resting ? `Restart ${label(current)} rest` : `Start ${label(current)} rest`}
        >
          <Icon name="timer" size={20} color={color.accent} />
          <Text variant="bodyMedium" tone="accent" style={{ flex: 1, marginLeft: 10 }}>
            {resting ? `Restart ${label(current)} rest` : `Start ${label(current)} rest now`}
          </Text>
        </Tap>
      ) : null}
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
  start: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.line },
});
