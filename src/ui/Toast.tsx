import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { useSessionStore } from '../store/useSessionStore';
import { Icon, type IconName } from './Icon';
import { Tap } from './Pressable';
import { Text } from './Text';
import { color, motion, space } from './tokens';

type Tone = 'success' | 'info' | 'error';
type ToastOpts = { tone?: Tone; icon?: IconName; action?: { label: string; onPress: () => void } };
type QueuedToast = { id: number; message: string; tone: Tone; icon?: IconName; action?: { label: string; onPress: () => void } };

interface ToastState {
  /** Current toast, then anything raised while it was on screen. */
  queue: QueuedToast[];
  nextId: number;
  show: (message: string, opts?: ToastOpts) => void;
  /** Drop the current toast and move to the next one waiting. */
  clear: () => void;
}

const MAX_QUEUE = 3;

export const useToast = create<ToastState>((set) => ({
  queue: [],
  nextId: 1,
  // Toasts used to overwrite each other: finishing a set and levelling up in the
  // same moment showed only the second one. They line up instead.
  show: (message, opts) =>
    set((s) => {
      const next: QueuedToast = { id: s.nextId, message, tone: opts?.tone ?? 'success', icon: opts?.icon, action: opts?.action };
      // Don't stack the same message twice in a row (double-tap, repeated save).
      if (s.queue.some((t) => t.message === message)) return s;
      return { queue: [...s.queue, next].slice(0, MAX_QUEUE), nextId: s.nextId + 1 };
    }),
  clear: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

export const toast = (message: string, opts?: ToastOpts) => useToast.getState().show(message, opts);

const tones: Record<Tone, string> = { success: '#1FA84F', info: color.accent, error: color.danger };

/** Full-width banner that drops from under the status bar, then retreats. */
export function ToastHost() {
  const current = useToast((t) => t.queue[0]);
  const clear = useToast((t) => t.clear);
  const { id, message, tone, icon, action } = current ?? { id: 0, message: null, tone: 'success' as Tone, icon: undefined, action: undefined };
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-160);

  useEffect(() => {
    if (!message) return;
    y.set(-160);
    y.set(withSpring(0, motion.sheet));
    y.set(
      withDelay(
        2600,
        withTiming(-160, { duration: 260, easing: motion.easeOut }, (done) => {
          if (done) scheduleOnRN(clear);
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // While the workout is open its own top bar owns the top of the screen; sliding the toast
  // under it stops the banner hiding Finish for three seconds.
  const sessionOpen = useSessionStore((st) => st.active && !st.minimized);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  if (!message) return null;

  return (
    // Sheets are transparent native modals, so a toast rendered at the app root
    // was painted underneath them and never seen. Presenting it the same way puts
    // it back on top. Same flags as ui/Sheet so the two layers behave alike.
    <Modal transparent visible statusBarTranslucent animationType="none">
      <Animated.View
        pointerEvents={action ? 'box-none' : 'none'}
        accessibilityLiveRegion="polite"
        style={[styles.toast, { paddingTop: insets.top + (sessionOpen ? 62 : 6), backgroundColor: tones[tone] }, style]}
      >
        <View style={styles.row}>
          <View style={styles.check}>
            <Icon name={icon ?? (tone === 'error' ? 'alert' : 'check')} size={15} color={tones[tone]} weight="bold" />
          </View>
          <Text variant="headline" style={{ flex: 1 }} numberOfLines={2}>
            {message}
          </Text>
          {action ? (
            <Tap
              feedback="opacity"
              hitSlop={12}
              onPress={() => {
                action.onPress();
                clear();
              }}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text variant="cta" style={{ fontSize: 15 }}>
                {action.label}
              </Text>
            </Tap>
          ) : null}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingBottom: 14, paddingHorizontal: space.gutter },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
});
