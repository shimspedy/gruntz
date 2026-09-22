import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, AppState, FlatList, ScrollView, StyleSheet, View, useWindowDimensions, type ViewToken } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
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
import { navigationRef } from '../../navigation/ref';
import { formatClock, useNow } from '../../hooks/useNow';
import { cancelRestDone, clearWorkoutProgress, notificationsEnabled, scheduleRestDone, showWorkoutProgress } from '../../services/notifications';
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
import { RestBanner } from './RestBanner';
import { RestSheet } from './RestSheet';
import { SessionSummary } from './SessionSummary';
import { ExerciseInsights } from './ExerciseInsights';
import { SetTable } from './SetTable';

const BUBBLE = 68;
const BUBBLE_STEP = BUBBLE + 14;

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
    if (active && keepAwake && !minimized) {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }
    return undefined;
  }, [active, keepAwake, minimized]);

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
  const [restFor, setRestFor] = useState<string | null>(null);
  const pager = useRef<FlatList<SessionExercise>>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);
  const carousel = useRef<ScrollView>(null);
  const summaryX = useSharedValue(0);

  const completed = s.exercises.filter(isExerciseDone).length;
  const allDone = s.exercises.length > 0 && completed === s.exercises.length;

  // The progress notification is for when the user leaves the app mid-workout; in the foreground
  // the session UI already shows it, so a banner would only interrupt.
  const latest = useRef({ completed, total: s.exercises.length, title: s.title, active: s.active });
  latest.current = { completed, total: s.exercises.length, title: s.title, active: s.active };
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const l = latest.current;
      if (next === 'background' && l.active && l.completed > 0 && notificationsEnabled()) void showWorkoutProgress(l.completed, l.total, l.title);
      if (next === 'background' && l.active && notificationsEnabled()) {
        const st = useSessionStore.getState();
        const upNext = st.exercises[st.index];
        if (st.restEndsAt) void scheduleRestDone(st.restEndsAt, upNext ? getExerciseById(upNext.exerciseId)?.name : undefined);
      }
      if (next === 'active') {
        void clearWorkoutProgress();
        void cancelRestDone();
      }
    });
    return () => {
      sub.remove();
      void clearWorkoutProgress();
      void cancelRestDone();
    };
  }, []);

  // Keep pager + carousel in sync with the store index.
  useEffect(() => {
    if (!s.exercises.length) return;
    pager.current?.scrollToIndex({ index: s.index, animated: true });
    carousel.current?.scrollTo({ x: Math.max(0, s.index * BUBBLE_STEP - width / 2 + BUBBLE / 2 + space.gutter), animated: true });
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
          clearTimeout(advanceTimer.current);
          advanceTimer.current = setTimeout(() => {
            const st = useSessionStore.getState();
            if (st.active && st.exercises.length > target) st.setIndex(target);
          }, 650);
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

  // Until every set is logged the corner stays quiet: ending early is a deliberate, menu-level choice.
  const sessionMenu = () => {
    haptic.light();
    const finishEarly = () => setPhase('summary');
    const discard = () =>
      Alert.alert('Discard workout?', 'Logged sets from this session will be lost.', [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            haptic.warning();
            useSessionStore.getState().discard();
          },
        },
      ]);
    const message = `${completed} of ${s.exercises.length} exercises logged.`;
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: s.title, message, options: ['Finish early', 'Discard workout', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2, userInterfaceStyle: 'dark' },
        (i) => {
          if (i === 0) finishEarly();
          if (i === 1) discard();
        },
      );
      return;
    }
    Alert.alert(s.title, message, [
      { text: 'Finish early', onPress: finishEarly },
      { text: 'Discard workout', style: 'destructive', onPress: discard },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
              <Text variant="headline" tabular style={styles.clock} accessibilityLabel={`Elapsed time ${s.startedAt ? formatClock(now - s.startedAt) : '0:00'}`}>
                {s.startedAt ? formatClock(now - s.startedAt) : '0:00'}
              </Text>
              {allDone ? (
                <Animated.View key="finish" entering={FadeIn.duration(240)} exiting={FadeOut.duration(120)}>
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
                </Animated.View>
              ) : (
                <Animated.View key="more" entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
                  <Tap feedback="opacity" hitSlop={10} onPress={sessionMenu} style={styles.topIcon} accessibilityLabel="Workout options">
                    <Icon name="more" size={22} color={color.textSecondary} weight="semibold" />
                  </Tap>
                </Animated.View>
              )}
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
                    <ExerciseThumb exercise={ex} size={activeEx ? 62 : 64} tone="dark" />
                    {doneEx ? (
                      <View style={styles.bubbleCheck}>
                        <Icon name="check" size={12} color="#FFFFFF" weight="bold" />
                      </View>
                    ) : null}
                  </Tap>
                );
              })}
              <Tap
                scaleTo={0.94}
                onPress={() => {
                  haptic.light();
                  s.minimize();
                  navigationRef.navigate('ExerciseLibrary', { pick: true, target: 'session' });
                }}
                accessibilityLabel="Add exercise"
                style={[styles.bubble, styles.bubbleAdd]}
              >
                <Icon name="plus" size={24} color={color.textSecondary} weight="medium" />
              </Tap>
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
  onRest,
  onToggle,
}: {
  exercise: SessionExercise;
  active: boolean;
  width: number;
  units: 'imperial' | 'metric';
  bottomPad: number;
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
  // Sized so the set table starts above the fold: logging is the job, the video is the reference.
  const videoH = Math.round(width * 0.6);

  const replace = () => {
    if (!alternative) return;
    haptic.light();
    replaceExercise(exercise.key, alternative.id);
    toast(`Swapped to ${alternative.name}`, { tone: 'info', icon: 'replace' });
  };
  const remove = () => {
    haptic.warning();
    removeExercise(exercise.key);
  };

  // Rare, destructive actions live behind the overflow button, never beside the sets.
  const openMore = () => {
    haptic.light();
    const name = ex?.name ?? 'This exercise';
    const message = `Removing ${name} means it won’t count toward today’s mission.`;
    const canWarmup = !exercise.sets.some((st) => st.warmup);
    const warmupLabel = 'Add warm-up sets';
    const options = [
      ...(canWarmup ? [warmupLabel] : []),
      ...(alternative ? [`Replace with ${alternative.name}`] : []),
      'Remove exercise',
      'Cancel',
    ];
    const addWarmup = () => {
      haptic.light();
      useSessionStore.getState().addWarmupSets(exercise.key);
    };
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: name, message, options, destructiveButtonIndex: options.length - 2, cancelButtonIndex: options.length - 1, userInterfaceStyle: 'dark' },
        (i) => {
          const chosen = options[i];
          if (chosen === warmupLabel) addWarmup();
          else if (alternative && chosen?.startsWith('Replace with')) replace();
          else if (chosen === 'Remove exercise') remove();
        },
      );
      return;
    }
    Alert.alert(name, message, [
      ...(canWarmup ? [{ text: warmupLabel, onPress: addWarmup }] : []),
      ...(alternative ? [{ text: `Replace with ${alternative.name}`, onPress: replace }] : []),
      { text: 'Remove exercise', style: 'destructive' as const, onPress: remove },
      { text: 'Cancel', style: 'cancel' as const },
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
        <Tap feedback="opacity" hitSlop={8} onPress={openMore} style={styles.moreIcon} accessibilityLabel="Exercise options">
          <Icon name="more" size={22} color={color.textSecondary} weight="semibold" />
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

      <ExerciseInsights exercise={ex} exerciseKey={exercise.key} unit={units === 'metric' ? 'kg' : 'lb'} />
    </ScrollView>
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
  carousel: { paddingHorizontal: space.gutter, gap: BUBBLE_STEP - BUBBLE, paddingVertical: 10 },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    borderWidth: 1,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleActive: { borderWidth: 2.5, borderColor: '#FFFFFF' },
  bubbleAdd: { borderStyle: 'dashed', borderColor: color.lineStrong, backgroundColor: color.surface },
  bubbleCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.accent,
    borderWidth: 2,
    borderColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, marginTop: space.md },
  name: { flex: 1, fontSize: 25, lineHeight: 30 },
  restIcon: { alignItems: 'center', marginLeft: space.md },
  moreIcon: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: space.xs },
  desc: { paddingHorizontal: space.gutter, marginTop: space.sm },
  sectionTag: { paddingHorizontal: space.gutter, marginTop: space.md, marginBottom: space.sm },
  summary: { backgroundColor: color.bg },
});
