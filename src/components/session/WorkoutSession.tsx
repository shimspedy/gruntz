import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, AppState, FlatList, ScrollView, StyleSheet, View, type ViewToken } from 'react-native';
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
import { color, motion, radius, space } from '../../ui/tokens';
import { RestBanner } from './RestBanner';
import { ExercisePage } from './ExercisePage';
import { RestSheet } from './RestSheet';
import { SessionSummary } from './SessionSummary';
import { SetInputAccessory } from './SetTable';
import { useContentSize } from '../../ui/useContentSize';

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
  const { height } = useContentSize();
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
  const { width, height } = useContentSize();
  // Granular selectors, not the whole store: `restEndsAt` ticks every second and
  // `previous`/`restOverrides` change on every swap, and subscribing to all of it
  // re-rendered the pager, carousel and clock on each one.
  const exercises = useSessionStore((st) => st.exercises);
  const index = useSessionStore((st) => st.index);
  const title = useSessionStore((st) => st.title);
  const adaptation = useSessionStore((st) => st.adaptation);
  const active = useSessionStore((st) => st.active);
  const startedAt = useSessionStore((st) => st.startedAt);
  const minimize = useSessionStore((st) => st.minimize);
  const setIndex = useSessionStore((st) => st.setIndex);
  const units = useUserStore((u) => u.profile?.settings.units ?? 'imperial');
  const [phase, setPhase] = useState<'log' | 'summary'>('log');
  const [restFor, setRestFor] = useState<{ exerciseId: string; slotKey: string } | null>(null);
  const pager = useRef<FlatList<SessionExercise>>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);
  const carousel = useRef<ScrollView>(null);
  const summaryX = useSharedValue(0);

  const completed = exercises.filter(isExerciseDone).length;
  const allDone = exercises.length > 0 && completed === exercises.length;

  // The progress notification is for when the user leaves the app mid-workout; in the foreground
  // the session UI already shows it, so a banner would only interrupt.
  const latest = useRef({ completed, total: exercises.length, title, active });
  latest.current = { completed, total: exercises.length, title, active };
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

  // Keep pager + carousel in sync with the store index. The scroll this triggers makes
  // the pager report a new viewable item, so mark it as ours: otherwise `onViewable`
  // treats a tap on a bubble as a swipe and fires a second haptic on top of its own.
  const programmaticScroll = useRef(false);
  // The page the pager last reported; -1 until it has reported one.
  const visiblePage = useRef(-1);
  useEffect(() => {
    if (!exercises.length) return;
    // Only a scroll that will move the pager is ours to ignore. Adding an exercise or
    // resizing the window re-runs this without changing the page; flagging that left the
    // guard set with nothing to clear it, so the athlete's next swipe was swallowed.
    programmaticScroll.current = visiblePage.current !== index;
    pager.current?.scrollToIndex({ index, animated: true });
    carousel.current?.scrollTo({ x: Math.max(0, index * BUBBLE_STEP - width / 2 + BUBBLE / 2 + space.gutter), animated: true });
  }, [index, exercises.length, width]);

  useEffect(() => {
    summaryX.set(withSpring(phase === 'summary' ? 1 : 0, motion.settle));
  }, [phase, summaryX]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index == null) return;
    visiblePage.current = first.index;
    if (first.index === useSessionStore.getState().index) {
      // The programmatic scroll has arrived where it was going. The guard has to be
      // consumed HERE — this is the branch a bubble tap or the auto-advance actually
      // takes. Returning before clearing it left it set, so the next genuine swipe
      // was swallowed instead: the pager showed exercise N+1 while the store still
      // said N, highlighting the wrong bubble and playing the wrong page's video.
      programmaticScroll.current = false;
      return;
    }
    if (programmaticScroll.current) {
      programmaticScroll.current = false;
      return;
    }
    haptic.selection();
    useSessionStore.getState().setIndex(first.index);
  }).current;

  const handleToggle = useCallback(
    (ex: SessionExercise, setId: string) => {
      clearTimeout(advanceTimer.current);
      const r = useSessionStore.getState().toggleSet(ex.key, setId);
      if (r.needsValue) {
        toast(`Enter ${ex.kind === 'reps' ? 'reps' : ex.kind === 'time' ? 'a time' : 'a distance'} before logging this set.`, { tone: 'info', icon: 'info' });
        return;
      }
      if (r.completedExercise) {
        const state = useSessionStore.getState();
        const nextIndex = state.exercises.findIndex((e, i) => i > state.index && !isExerciseDone(e));
        const fallback = state.exercises.findIndex((e) => !isExerciseDone(e));
        const target = nextIndex >= 0 ? nextIndex : fallback;
        if (target >= 0) {
          clearTimeout(advanceTimer.current);
          advanceTimer.current = setTimeout(() => {
            const st = useSessionStore.getState();
            if (st.active && st.startedAt === state.startedAt && st.exercises.length > target) st.setIndex(target);
          }, 650);
        } else {
          toast('Every exercise logged. Finish when ready.', { tone: 'info', icon: 'flag' });
        }
      }
    },
    [],
  );

  const handleRest = useCallback((ex: SessionExercise) => setRestFor({ exerciseId: ex.exerciseId, slotKey: ex.key }), []);
  const bottomPad = insets.bottom + 120;
  const renderPage = useCallback(
    ({ item, index: page }: { item: SessionExercise; index: number }) => (
      <ExercisePage
        exercise={item}
        active={visible && page === index}
        width={width}
        height={height}
        units={units}
        bottomPad={bottomPad}
        onRest={handleRest}
        onToggle={handleToggle}
      />
    ),
    [visible, index, width, height, units, bottomPad, handleRest, handleToggle],
  );

  const summaryStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - summaryX.get()) * width }] }));
  const logStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -summaryX.get() * width * 0.3 }], opacity: 1 - summaryX.get() * 0.4 }));

  const current = exercises[index];

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
    const message = `${completed} of ${exercises.length} exercises logged.`;
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title, message, options: ['Finish early', 'Discard workout', 'Cancel'], destructiveButtonIndex: 1, cancelButtonIndex: 2, userInterfaceStyle: 'dark' },
        (i) => {
          if (i === 0) finishEarly();
          if (i === 1) discard();
        },
      );
      return;
    }
    Alert.alert(title, message, [
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
              <Tap feedback="opacity" hitSlop={10} onPress={() => { haptic.light(); minimize(); }} style={styles.topIcon} accessibilityLabel="Minimize workout">
                <Icon name="chevronDown" size={24} color={color.textSecondary} weight="medium" />
              </Tap>
              <Tap
                feedback="opacity"
                hitSlop={10}
                onPress={() => current && setRestFor({ exerciseId: current.exerciseId, slotKey: current.key })}
                style={styles.topIcon}
                accessibilityLabel="Rest timer"
              >
                <Icon name="stopwatch" size={24} color={color.textSecondary} />
              </Tap>
              <SessionClock startedAt={startedAt} visible={visible} />
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
              {exercises.map((e, i) => {
                const ex = getExerciseById(e.exerciseId);
                const doneEx = isExerciseDone(e);
                const activeEx = i === index;
                return (
                  <Tap
                    key={e.key}
                    scaleTo={0.94}
                    onPress={() => {
                      haptic.selection();
                      setIndex(i);
                    }}
                    accessibilityLabel={`${ex?.name ?? 'Exercise'}${doneEx ? ', done' : ''}`}
                    accessibilityState={{ selected: activeEx }}
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
                  minimize();
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

        {adaptation ? (
          <View style={{ marginHorizontal: space.gutter, paddingHorizontal: space.md, paddingVertical: space.sm, marginBottom: space.sm, borderRadius: radius.md, backgroundColor: color.accentSoft }}>
            <Text variant="subhead" tone="accent">{adaptation.label}</Text>
            <Text variant="caption" tone="secondary" style={{ marginTop: 3 }}>{adaptation.reason}</Text>
          </View>
        ) : null}

        {exercises.length === 0 ? (
          // Removing the last exercise used to leave a black screen with no way out.
          <View style={styles.empty}>
            <Icon name="dumbbell" size={40} color={color.textTertiary} />
            <Text variant="title" style={{ textAlign: 'center' }}>Nothing left to log</Text>
            <Text variant="body" tone="secondary" style={{ textAlign: 'center' }}>
              You removed every exercise from this workout. Add one back, or discard the session.
            </Text>
            <Tap
              onPress={() => {
                haptic.light();
                minimize();
                navigationRef.navigate('ExerciseLibrary', { pick: true, target: 'session' });
              }}
              style={styles.emptyAction}
              accessibilityLabel="Add an exercise"
            >
              <Text variant="headline" tone="inverse">Add an exercise</Text>
            </Tap>
            <Tap feedback="opacity" onPress={sessionMenu} accessibilityLabel="Workout options">
              <Text variant="body" tone="secondary">Workout options</Text>
            </Tap>
          </View>
        ) : (
        <FlatList
          ref={pager}
          style={{ flex: 1 }}
          data={exercises}
          keyExtractor={(e) => e.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          // windowSize 3 unmounted a page as soon as you swiped two away, losing its
          // scroll position and which insight tab was open. 5 keeps the neighbours.
          windowSize={5}
          removeClippedSubviews={false}
          renderItem={renderPage}
        />
        )}
        <RestBanner bottom={insets.bottom + space.md} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, styles.summary, summaryStyle]} pointerEvents={phase === 'summary' ? 'auto' : 'none'}>
        {phase === 'summary' ? <SessionSummary onBack={() => setPhase('log')} onDone={() => setPhase('log')} /> : null}
      </Animated.View>

      <RestSheet exerciseId={restFor?.exerciseId ?? null} slotKey={restFor?.slotKey} onClose={() => setRestFor(null)} />
      <SetInputAccessory />
    </View>
  );
}

// Isolated so the once-a-second tick repaints one label, not the pager and every mounted page.
function SessionClock({ startedAt, visible }: { startedAt: number | null; visible: boolean }) {
  const now = useNow(visible);
  const label = startedAt ? formatClock(now - startedAt) : '0:00';
  return (
    <Text variant="headline" tabular style={styles.clock} accessibilityLabel={`Elapsed time ${label}`}>
      {label}
    </Text>
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
    backgroundColor: color.cta,
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.xl },
  emptyAction: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    backgroundColor: color.cta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  summary: { backgroundColor: color.bg },
});