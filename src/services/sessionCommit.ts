import { exerciseLogKey, getExerciseById } from '../data/exercises';
import { sessionWin } from '../features/retention';
import { navigationRef } from '../navigation/ref';
import { useExerciseLogStore } from '../store/useExerciseLogStore';
import { useProgramStore } from '../store/useProgramStore';
import { useSessionStore } from '../store/useSessionStore';
import { useUserStore } from '../store/useUserStore';
import type { CelebrationParams } from '../types/navigation';
import { toast } from '../ui/Toast';
import { haptic } from '../ui/haptics';
import { maybeRequestReview } from '../utils/socialActions';
import { scheduleBackup } from './backup';
import { clearWorkoutProgress } from './notifications';
import { trackRetentionEvent } from './retentionAnalytics';

export interface CommitOutcome {
  /** The same workout was already counted today: the sets are logged, no XP is paid twice. */
  repeatOfToday: boolean;
  celebration: CelebrationParams;
  sets: number;
  minutes: number;
  personalRecords: number;
  /** The session this was, by its start time. */
  session: number | null;
}

const listeners = new Set<(outcome: CommitOutcome) => void>();
/** Told about every saved workout, wherever it was finished from. */
export function onSessionCommitted(listener: (outcome: CommitOutcome) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/**
 * Commits the running workout: pays XP, writes the exercise log and clears the session.
 * The one path for finishing, whether the tap came from the phone or from the watch.
 * Null when there is nothing to save (no workout open, or no working set logged).
 */
export function commitSession(): CommitOutcome | null {
  // Recording into a log that has not been read back yet would overwrite the saved history.
  if (!useExerciseLogStore.persist.hasHydrated()) return null;
  const fresh = useSessionStore.getState().buildMission();
  if (!fresh || !fresh.exercises.length) return null;
  const before = useUserStore.getState().progress;
  // completeMission dedupes on mission_date + workout_day_id and returns state
  // unchanged, but save() used to carry on regardless: it wiped the session and
  // pushed a celebration reading "+0 XP" with no explanation. The sets still reach
  // the exercise log either way, so say that plainly instead of celebrating nothing.
  const repeatOfToday = before.claimed_missions?.has(`${fresh.mission_date}:${fresh.workout_day_id}`) ?? false;
  const levelBefore = before.current_level;
  const rankBefore = before.current_rank;
  const xpBefore = before.current_xp;
  const session = useSessionStore.getState();
  const title = session.title;
  const firstWorkout = before.workouts_completed === 0;
  const unit = useUserStore.getState().profile?.settings.units === 'metric' ? 'kg' : 'lb';
  const win = sessionWin(session.exercises.map((item) => {
    const exercise = getExerciseById(item.exerciseId);
    return {
      name: item.prescribedName ?? exercise?.name ?? 'Movement',
      exerciseId: item.exerciseId,
      logKey: exercise ? exerciseLogKey(exercise) : item.exerciseId,
      kind: item.kind,
      comparable: !!exercise && !item.prescribedName,
      sets: item.sets,
    };
  }), useExerciseLogStore.getState().logs, unit, firstWorkout);
  const sets = session.exercises.reduce((total, item) => total + item.sets.filter((set) => set.done && !set.warmup).length, 0);
  const debrief = { ...win, sets, minutes: fresh.duration_minutes, firstWorkout };
  useUserStore.getState().completeMission(fresh);
  void clearWorkoutProgress();
  // Worth keeping: queue a backup for anyone who has opted into one.
  scheduleBackup();
  // If that was the last workout of the program week, move to the next one.
  useProgramStore.getState().advanceWeekIfComplete();
  // The celebration screen presents XP and unlocks; no system banners while the app is open.
  const ids = useUserStore.getState().checkAchievements();
  // Snapshotted AFTER checkAchievements, because achievement rewards are XP this
  // workout earned. Reading it first meant the celebration showed "+150 XP · Level 5"
  // over an XP bar already displaying level 6's numbers, and a level-up caused by an
  // achievement got no celebration at all.
  const after = useUserStore.getState().progress;
  // Record the explicit save action, never a hydration/backup store replacement.
  if (!repeatOfToday && after.workouts_completed === before.workouts_completed + 1) {
    trackRetentionEvent('workout_completed', {
      first: firstWorkout,
      sessions: after.workouts_completed,
      source: fresh.workout_day_id.startsWith('plan:') ? 'library' : fresh.workout_day_id.startsWith('routine:') ? 'routine' : 'program',
      mode: session.adaptation?.mode ?? 'planned',
    });
  }
  // Team rosters show sessions and streak; a no-op for anyone not in a team.
  void import('./teams').then((teams) => teams.syncTeamStatus()).catch(() => undefined);
  useSessionStore.getState().finish();
  const outcome: CommitOutcome = {
    repeatOfToday,
    sets,
    minutes: fresh.duration_minutes,
    personalRecords: fresh.exercises.filter((exercise) => exercise.is_personal_record).length,
    session: session.startedAt,
    celebration: {
      xpEarned: after.current_xp - xpBefore,
      levelBefore,
      levelAfter: after.current_level,
      rankBefore,
      rankAfter: after.current_rank,
      streak: after.streak_days,
      achievementIds: ids,
      title,
      debrief,
    },
  };
  for (const listener of listeners) listener(outcome);
  return outcome;
}

/** What the athlete sees after a commit: the celebration, or a plain note for a repeat. */
export function presentCommit(outcome: CommitOutcome) {
  if (outcome.repeatOfToday) {
    // Otherwise the celebration screen owns the success haptic; firing one here as
    // well stacked three buzzes inside half a second.
    haptic.success();
    toast('Saved to your history · already counted today', { tone: 'info', icon: 'check' });
    return;
  }
  if (navigationRef.isReady()) navigationRef.navigate('Celebration', outcome.celebration);
  void maybeRequestReview('mission_complete');
}
