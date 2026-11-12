import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InitialState, NavigationState } from '@react-navigation/native';
import { reportHandled } from '../services/crashReporting';
import { useUserStore } from '../store/useUserStore';
import { getLocalDateKey } from '../utils/dateKey';

/**
 * Remembering where the athlete was, so a relaunch after iOS ends the app in the
 * background reopens there. Kept apart from the navigator: what may be restored is a
 * rule of its own, and the navigator only needs `ready`, `initial` and `save`.
 */
/** Coalesce navigation-state writes; a tab tap should not cost a disk write. */
const NAV_SAVE_DEBOUNCE_MS = 600;
const NAV_KEY = '@gruntz_nav_state';
const NAV_MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Screens that only make sense in the moment they were opened; never restored after a relaunch. */
const TRANSIENT = new Set(['Celebration', 'Paywall', 'RunTracker', 'RoutineEditor']);
const isTransient = (r: { name: string; params?: object }) => {
  if (TRANSIENT.has(r.name)) return true;
  // A sheet's content lives in memory with whoever opened it; there is nothing to restore.
  if (r.name === 'Sheet') return true;
  if (r.name === 'ExerciseLibrary' && !!(r.params as { pick?: boolean } | undefined)?.pick) return true;
  // A screen pinned to a date is only valid on that date. Restoring one saved up to
  // twelve hours ago could present yesterday's workout as today's.
  const dateKey = (r.params as { dateKey?: string } | undefined)?.dateKey;
  return !!dateKey && dateKey !== getLocalDateKey();
};

/**
 * Drop transient screens (and anything stacked above them) from a saved navigation
 * state, at every level. Filtering only the top-level routes left a transient screen
 * nested inside a tab's own stack to be restored anyway.
 */
function restorable(state: InitialState | undefined): InitialState | undefined {
  const routes = state?.routes;
  if (!routes?.length) return undefined;
  const cut = routes.findIndex(isTransient);
  const kept = (cut === -1 ? routes : routes.slice(0, cut)).map((route) =>
    route.state ? { ...route, state: restorable(route.state as InitialState) } : route,
  );
  if (!kept.length) return undefined;
  // A stack's index is its top; a TAB navigator's index is the selected tab, and
  // forcing it to the last entry reopened the app on the last tab (Profile) on
  // every cold start, whatever the user was actually looking at. Keep the saved
  // index where it still points at a surviving route, and only clamp when the
  // screens above it were dropped.
  const saved = typeof state?.index === 'number' ? state.index : kept.length - 1;
  return { ...state, routes: kept, index: Math.min(Math.max(saved, 0), kept.length - 1) } as InitialState;
}

/** Reopen on the screen the user left, if iOS closed the app while it was in the background. */
export function useSavedNavigation(hydrated: boolean, onboarded: boolean) {
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<InitialState | undefined>();
  useEffect(() => {
    if (!hydrated || ready) return;
    if (!onboarded) return setReady(true);
    let cancelled = false;
    AsyncStorage.getItem(NAV_KEY)
      .then((raw) => {
        if (!raw || cancelled) return;
        const saved = JSON.parse(raw) as { savedAt: number; state: InitialState };
        // The app's home must be at the bottom of the stack, or Back has nowhere to go.
        if (Date.now() - saved.savedAt < NAV_MAX_AGE_MS && saved.state?.routes?.[0]?.name === 'Tabs') setInitial(restorable(saved.state));
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [hydrated, onboarded, ready]);
  // onStateChange fires on every navigation, including each tab tap and every step
  // of a gesture, and each one serialised the whole tree to disk. Coalesced to one
  // write, and flushed when the app leaves the foreground so nothing in flight is
  // lost if iOS kills us.
  const pending = useRef<NavigationState | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const write = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const state = pending.current;
    pending.current = undefined;
    if (state && useUserStore.getState().isOnboarded) {
      void AsyncStorage.setItem(NAV_KEY, JSON.stringify({ savedAt: Date.now(), state })).catch((e: unknown) => reportHandled(e, 'navigation.persist'));
    }
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') write();
    });
    return () => {
      sub.remove();
      write();
    };
  }, [write]);

  const save = (state: NavigationState | undefined) => {
    if (!state) return;
    pending.current = state;
    if (timer.current) return;
    timer.current = setTimeout(write, NAV_SAVE_DEBOUNCE_MS);
  };
  return { ready, initial, save };
}
