import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, FlatList, ScrollView, StyleSheet, View, useWindowDimensions, type ViewToken } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { getExerciseById } from '../../data/exercises';
import { formatClock, useNow } from '../../hooks/useNow';
import { clearWorkoutProgress, showWorkoutProgress } from '../../services/notifications';
import { useReadinessStore } from '../../store/useReadinessStore';
import { isExerciseDone, useSessionStore, type SessionExercise } from '../../store/useSessionStore';
import { useUserStore } from '../../store/useUserStore';
import { ExerciseThumb } from '../../ui/ExerciseArt';
import { Icon } from '../../ui/Icon';
import { Tap } from '../../ui/Pressable';
import { Text } from '../../ui/Text';
import { haptic } from '../../ui/haptics';
import { toast } from '../../ui/Toast';
import { color, font, motion, radius, space } from '../../ui/tokens';
import { ExerciseVideo } from '../ExerciseVideo';
import { GuideSheet } from './GuideSheet';
import { RestBanner } from './RestBanner';
import { RestSheet } from './RestSheet';
import { SessionSummary } from './SessionSummary';
import { SetTable } from './SetTable';

const KEEP_AWAKE_TAG = 'gruntz-session';

/**
 * The live workout. A full-screen layer above the navigator: it rises from the bottom when a
 * workout starts, drags down (or chevrons down) into the mini bar, and comes back up on tap.
 */
export function WorkoutSessionHost() {
  const active = useSessionStore((s) => s.active);
  const minimized = useSessionStore((s) => s.minimized);
  const minimize = useSessionStore((s) => s.minimize);
  const { height } = useWindowDimensions();
  const y = useSharedValue(height);
  const [mounted, setMounted] = useState(active);
  const keepAwake = useReadinessStore((s) => s.keepScreenAwake);

  useEffect(() => {
    if (active) setMounted(true);
  }, [active]);

  useEffect(() => {
    if (!mounted) return;
    if (active && !minimized) {
      y.set(withSpring(0, motion.sheet));
    } else {
      y.set(
        withTiming(height, { duration: 280, easing: motion.easeOut }, (done) => {
          if (done && !active) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [active, minimized, mounted, height, y]);

  useEffect(() => {
    if (active && keepAwake) {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }
    return undefined;
  }, [active, keepAwake]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .onChange((e) => {
      y.set(Math.max(0, y.get() + e.changeY));
    })
    .onEnd((e) => {
      if (y.get() + e.velocityY * 0.15 > height * 0.28 || e.velocityY > 900) {
        scheduleOnRN(minimize);
      } else {
        y.set(withSpring(0, { ...motion.sheet, velocity: e.velocityY }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }],
    borderRadius: interpolate(y.get(), [0, 60], [0, 28], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.layer, sheetStyle]} pointerEvents={active && !minimized ? 'auto' : 'none'}>
      <SessionBody panGesture={pan} visible={active && !minimized} />
    </Animated.View>
  );
}

function SessionBody({ panGesture, visible }: { panGesture: ReturnType<typeof Gesture.Pan>; visible: boolean }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const s = useSessionStore();
  const units = useUserStore((u) => u.profile?.settings.units ?? 'imperial');
  const now = useNow(visible);
  const [phase, setPhase] = useState<'log' | 'summary'>('log');
  const [guideFor, setGuideFor] = useState<string | null>(null);
  const [restFor, setRestFor] = useState<string | null>(null);
  const pager = useRef<FlatList<SessionExercise>>(null);
  const carousel = useRef<ScrollView>(null);
  const summaryX = useSharedValue(0);

  const completed = s.exercises.filter(isExerciseDone).length;

  // The progress notification is for when the user leaves the app mid-workout; in the foreground
  // the session UI already shows it, so a banner would only interrupt.
  const latest = useRef({ completed, total: s.exercises.length, title: s.title, active: s.active });
  latest.current = { completed, total: s.exercises.length, title: s.title, active: s.active };
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const l = latest.current;
      if (next === 'background' && l.active && l.completed > 0) void showWorkoutProgress(l.completed, l.total, l.title);
      if (next === 'active') void clearWorkoutProgress();
    });
    return () => {
      sub.remove();
      void clearWorkoutProgress();
    };
  }, []);

  // Keep pager + carousel in sync with the store index.
  useEffect(() => {
    if (!s.exercises.length) return;
    pager.current?.scrollToIndex({ index: s.index, animated: true });
    carousel.current?.scrollTo({ x: Math.max(0, s.index * 126 - width / 2 + 63 + space.gutter), animated: true });
  }, [s.index, s.exercises.length, width]);

  useEffect(() => {
    summaryX.set(withSpring(phase === 'summary' ? 1 : 0, motion.settle));
  }, [phase, summaryX]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null && first.index !== useSessionStore.getState().index) {
      haptic.selection();
      useSessionStore.getState().setIndex(first.index);
    }
  }).current;

  const handleToggle = useCallback(
    (ex: SessionExercise, setId: string) => {
      const r = useSessionStore.getState().toggleSet(ex.key, setId);
      if (r.completedExercise) {
        const state = useSessionStore.getState();
        const nextIndex = state.exercises.findIndex((e, i) => i > state.index && !isExerciseDone(e));
        const fallback = state.exercises.findIndex((e) => !isExerciseDone(e));
        const target = nextIndex >= 0 ? nextIndex : fallback;
        if (target >= 0) {
          setTimeout(() => useSessionStore.getState().setIndex(target), 650);
        } else {
          toast('Every exercise logged. Finish when ready.', { tone: 'info', icon: 'flag' });
        }
      }
    },
    [],
  );

  const summaryStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - summaryX.get()) * width }] }));
  const logStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -summaryX.get() * width * 0.3 }], opacity: 1 - summaryX.get() * 0.4 }));

  const current = s.exercises[s.index];

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[{ flex: 1 }, logStyle]}>
        <GestureDetector gesture={panGesture}>
          <View style={{ paddingTop: insets.top, backgroundColor: color.bg }}>
            <View style={styles.topBar}>
              <Tap feedback="opacity" hitSlop={10} onPress={() => { haptic.light(); s.minimize(); }} style={styles.topIcon} accessibilityLabel="Minimize workout">
                <Icon name="chevronDown" size={24} color={color.textSecondary} weight="medium" />
              </Tap>
              <Tap
                feedback="opacity"
                hitSlop={10}
                onPress={() => current && setRestFor(current.exerciseId)}
                style={styles.topIcon}
                accessibilityLabel="Rest timer"
              >
                <Icon name="stopwatch" size={24} color={color.textSecondary} />
              </Tap>
              <Text variant="headline" tabular style={styles.clock} accessibilityLabel="Elapsed time">
                {s.startedAt ? formatClock(now - s.startedAt) : '0:00'}
              </Text>
              <Tap
                onPress={() => {
                  haptic.light();
                  setPhase('summary');
                }}
                style={styles.finish}
                accessibilityLabel="Finish workout"
              >
                <Text variant="headline" tone="inverse">
                  Finish
                </Text>
              </Tap>
            </View>
            <ScrollView
              ref={carousel}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
            >
              {s.exercises.map((e, i) => {
                const ex = getExerciseById(e.exerciseId);
                const doneEx = isExerciseDone(e);
                const activeEx = i === s.index;
                return (
                  <Tap
                    key={e.key}
                    scaleTo={0.94}
                    onPress={() => {
                      haptic.selection();
                      s.setIndex(i);
                    }}
                    accessibilityLabel={`${ex?.name ?? 'Exercise'}${doneEx ? ', done' : ''}`}
                    style={[styles.bubble, activeEx && styles.bubbleActive]}
                  >
                    <ExerciseThumb exercise={ex} size={activeEx ? 98 : 100} tone="dark" />
                    {doneEx ? (
                      <View style={styles.bubbleCheck}>
                        <Icon name="check" size={12} color="#FFFFFF" weight="bold" />
                      </View>
                    ) : null}
                  </Tap>
                );
              })}
            </ScrollView>
          </View>
        </GestureDetector>

        <FlatList
          ref={pager}
          style={{ flex: 1 }}
          data={s.exercises}
          keyExtractor={(e) => e.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={s.index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          renderItem={({ item, index }) => (
            <ExercisePage
              exercise={item}
              active={visible && index === s.index}
              width={width}
              units={units}
              bottomPad={insets.bottom + 120}
              onGuide={() => setGuideFor(item.exerciseId)}
              onRest={() => setRestFor(item.exerciseId)}
              onToggle={(setId) => handleToggle(item, setId)}
            />
          )}
        />
        <RestBanner bottom={insets.bottom + space.md} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, styles.summary, summaryStyle]} pointerEvents={phase === 'summary' ? 'auto' : 'none'}>
        {phase === 'summary' ? <SessionSummary onBack={() => setPhase('log')} onDone={() => setPhase('log')} /> : null}
      </Animated.View>

      <GuideSheet exerciseId={guideFor} onClose={() => setGuideFor(null)} />
      <RestSheet exerciseId={restFor} onClose={() => setRestFor(null)} />
    </View>
  );
}

function ExercisePage({
  exercise,
  active,
  width,
  units,
  bottomPad,
  onGuide,
  onRest,
  onToggle,
}: {
  exercise: SessionExercise;
  active: boolean;
  width: number;
  units: 'imperial' | 'metric';
  bottomPad: number;
  onGuide: () => void;
  onRest: () => void;
  onToggle: (setId: string) => void;
}) {
  const ex = getExerciseById(exercise.exerciseId);
  const previous = useSessionStore((st) => st.previous[exercise.exerciseId]);
  const rest = useSessionStore((st) => st.restOverrides[exercise.exerciseId]) ?? ex?.rest_seconds ?? 0;
  const updateSet = useSessionStore((st) => st.updateSet);
  const addSet = useSessionStore((st) => st.addSet);
  const removeExercise = useSessionStore((st) => st.removeExercise);
  const replaceExercise = useSessionStore((st) => st.replaceExercise);
  const alternative = ex?.gym_alternative_id ? getExerciseById(ex.gym_alternative_id) : undefined;
  const videoH = Math.round(width * 0.74);

  const confirmRemove = () => {
    Alert.alert('Remove exercise?', `${ex?.name ?? 'This exercise'} won’t count toward today’s mission.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          haptic.warning();
          removeExercise(exercise.key);
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      <ExerciseVideo exercise={ex} active={active} style={{ width, height: videoH }} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <ActionChip icon="play" label="Guide" onPress={onGuide} />
        {alternative ? (
          <ActionChip
            icon="replace"
            label="Replace"
            onPress={() => {
              haptic.light();
              replaceExercise(exercise.key, alternative.id);
              toast(`Swapped to ${alternative.name}`, { tone: 'info', icon: 'replace' });
            }}
          />
        ) : null}
        <ActionChip icon="trash" label="Remove" danger onPress={confirmRemove} />
      </ScrollView>

      <View style={styles.nameRow}>
        <Text variant="title" style={styles.name} numberOfLines={2}>
          {ex?.name ?? 'Exercise'}
        </Text>
        <Tap feedback="opacity" hitSlop={8} onPress={onRest} style={styles.restIcon} accessibilityLabel={`Rest ${rest} seconds`}>
          <Icon name="timer" size={24} color={color.accent} />
          <Text variant="caption" tone="accent" tabular style={{ fontFamily: font.semibold, marginTop: 1 }}>
            {rest > 0 ? `${rest}s` : 'Off'}
          </Text>
        </Tap>
      </View>
      {ex?.description ? (
        <Text variant="body" tone="secondary" style={styles.desc}>
          {ex.description}
        </Text>
      ) : null}
      <Text variant="footnote" tone="tertiary" style={styles.sectionTag}>
        {exercise.section} · {exercise.requiredSets} {exercise.requiredSets === 1 ? 'set' : 'sets'} to complete
      </Text>

      <SetTable
        exercise={exercise}
        previous={previous}
        units={units}
        onChange={(setId, patch) => updateSet(exercise.key, setId, patch)}
        onToggle={onToggle}
        onAdd={() => addSet(exercise.key)}
      />
    </ScrollView>
  );
}

function ActionChip({ icon, label, onPress, danger }: { icon: 'play' | 'replace' | 'trash'; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Tap onPress={onPress} scaleTo={0.95} style={[styles.chip, danger && styles.chipDanger]} accessibilityLabel={label}>
      <Icon name={icon} size={16} color="#FFFFFF" weight="semibold" />
      <Text variant="headline" style={{ fontSize: 16 }}>
        {label}
      </Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  layer: { backgroundColor: color.bg, overflow: 'hidden', zIndex: 50 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md },
  topIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  clock: { flex: 1, textAlign: 'center', fontSize: 20, marginRight: 44 },
  finish: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: { paddingHorizontal: space.gutter, gap: 22, paddingVertical: 14 },
  bubble: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleActive: { borderWidth: 3, borderColor: '#FFFFFF' },
  bubbleCheck: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.accent,
    borderWidth: 2,
    borderColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { paddingHorizontal: space.gutter, gap: 12, paddingTop: space.md },
  chip: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipDanger: { backgroundColor: '#E5484D' },
  nameRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, marginTop: space.xl },
  name: { flex: 1, fontSize: 25, lineHeight: 30 },
  restIcon: { alignItems: 'center', marginLeft: space.md },
  desc: { paddingHorizontal: space.gutter, marginTop: space.sm },
  sectionTag: { paddingHorizontal: space.gutter, marginTop: space.md, marginBottom: space.sm },
  summary: { backgroundColor: color.bg },
});
