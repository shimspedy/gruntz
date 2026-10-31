import { Alert, AppState } from 'react-native';
import { useSessionStore } from '../store/useSessionStore';
import { relativeTime } from '../utils/relativeTime';
import { cancelWorkoutLeftOpen, scheduleWorkoutLeftOpen } from './notifications';
import { syncLiveActivity } from './liveActivity';

/** Coming back after this long with a workout still open asks what happened. */
export const LEFT_OPEN_PROMPT_MS = 60 * 60 * 1000;

let started = false;
let promptedFor: number | null = null;

/** Whether returning to the app should ask about a workout left open. */
export function shouldAskAboutOpenWorkout(state: { active: boolean; lastActivityAt: number | null; startedAt: number | null }, now: number): boolean {
  if (!state.active) return false;
  const last = state.lastActivityAt ?? state.startedAt;
  return last !== null && now - last > LEFT_OPEN_PROMPT_MS;
}

function askAboutOpenWorkout() {
  const s = useSessionStore.getState();
  const last = s.lastActivityAt ?? s.startedAt;
  if (!shouldAskAboutOpenWorkout(s, Date.now()) || last === null || promptedFor === last) return;
  promptedFor = last;
  Alert.alert(
    'Still training?',
    `${s.title || 'Your workout'} is still open. Your last set was ${relativeTime(last)}. Finishing saves it with the time you actually trained.`,
    [
      { text: 'Keep going', onPress: () => useSessionStore.setState({ lastActivityAt: Date.now() }) },
      { text: 'Discard', style: 'destructive', onPress: () => useSessionStore.getState().discard() },
      { text: 'Finish workout', style: 'default', onPress: () => useSessionStore.getState().expand() },
    ],
  );
}

/**
 * Watches the running workout: re-arms the "still open" reminders whenever a set is
 * logged, clears them when the workout ends, keeps the Live Activity in step, and
 * asks on return when a workout was left open for a long time.
 */
export function initializeWorkoutPresence() {
  if (started) return;
  started = true;
  let previous = useSessionStore.getState();
  const react = (s: typeof previous, prev: typeof previous | null) => {
    if (!s.active) {
      if (!prev || prev.active) void cancelWorkoutLeftOpen();
    } else if (!prev || !prev.active || prev.lastActivityAt !== s.lastActivityAt) {
      const last = s.lastActivityAt ?? s.startedAt;
      if (last !== null) void scheduleWorkoutLeftOpen(last, s.title);
    }
    void syncLiveActivity(s);
  };
  react(previous, null);
  useSessionStore.subscribe((s) => {
    const prev = previous;
    previous = s;
    react(s, prev);
  });
  AppState.addEventListener('change', (next) => {
    if (next === 'active') setTimeout(askAboutOpenWorkout, 600);
  });
  setTimeout(askAboutOpenWorkout, 1500);
}
