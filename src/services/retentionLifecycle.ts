import { AppState } from 'react-native';
import { useSessionStore } from '../store/useSessionStore';
import { useUserStore } from '../store/useUserStore';
import { trackRetentionEvent } from './retentionAnalytics';

const sourceFor = (id: string | null) => id?.startsWith('plan:') ? 'library' : id?.startsWith('routine:') ? 'routine' : 'program';

/** Start after hydration, so loading history is never recorded as new training. */
export function startRetentionLifecycle(): () => void {
  trackRetentionEvent('app_opened', { path: useUserStore.getState().profile?.goals.includes('Military Prep') ? 'military' : 'general' });
  let backgroundAt: number | null = null;
  const foreground = AppState.addEventListener('change', (next) => {
    if (next === 'background') backgroundAt = Date.now();
    if (next === 'active') {
      // Permission sheets cause inactive -> active, not a return visit.
      if (backgroundAt !== null && Date.now() - backgroundAt >= 30000) trackRetentionEvent('app_opened');
      backgroundAt = null;
    }
  });
  const session = useSessionStore.subscribe((next, previous) => {
    if (next.active && !previous.active) trackRetentionEvent('workout_started', { source: sourceFor(next.workoutDayId), mode: next.adaptation?.mode ?? 'planned' });
    if (!next.active && previous.active && next.exercises.length === 0) {
      // Completion is recorded below, at the actual durable mission award boundary.
      // Discarding or closing a session is not a successful workout.
      trackRetentionEvent('workout_closed');
    }
  });
  return () => { foreground.remove(); session(); };
}
