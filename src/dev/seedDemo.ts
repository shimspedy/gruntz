import { achievements } from '../data/achievements';
import { militaryTests } from '../data/militaryTests';
import { useChromePrefs } from '../store/useUiStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { useSessionStore } from '../store/useSessionStore';
import { useUserStore } from '../store/useUserStore';
import { getLocalDateKey } from '../utils/dateKey';
import { getLevelForXP, getRank } from '../utils/xp';

/**
 * Dev-only: fills the stores with a believable mid-program user for App Store screenshots.
 * Triggered by opening `com.gruntz.fitness://seed-demo` on a debug build.
 */
export function seedDemo() {
  if (!__DEV__) return;
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return getLocalDateKey(d);
  };

  useSessionStore.getState().discard();
  useChromePrefs.getState().hideChallengePill(null);

  // ~6 weeks of training, 4–5 sessions a week, current 12-day streak.
  const claimed = new Set<string>();
  for (let i = 0; i < 42; i++) if (i < 12 || i % 7 !== 3) claimed.add(`${day(i)}:demo`);

  const xp = 7420;
  const level = getLevelForXP(xp);
  useUserStore.setState((s) => ({
    progress: {
      ...s.progress,
      current_xp: xp,
      current_level: level,
      current_rank: getRank(level),
      streak_days: 12,
      last_workout_date: day(0),
      workouts_completed: claimed.size,
      total_reps: 6240,
      total_distance_miles: 58.4,
      strength_score: 72,
      endurance_score: 81,
      stamina_score: 68,
      mobility_score: 54,
      consistency_score: 88,
      recovery_score: 63,
      challenges_completed: 19,
      challenge_streak_days: 6,
      exercises_completed: {
        pushups: 1480, hand_release_pushups: 620, bench_press: 380, overhead_press: 260, barbell_thruster: 140,
        ammo_can_front_squats: 420, frog_squats: 310, lunges_counter_rotation: 280, forward_plank: 90, flutter_kicks: 540,
      },
      weekly_workouts: [3, 4, 4, 5, 4, 5],
      claimed_missions: claimed,
    },
    achievements: achievements.slice(0, 9).map((a) => ({ achievement_id: a.id, unlocked: true, unlocked_at: new Date().toISOString() })),
    profile: s.profile ? { ...s.profile, fitness_test_date: day(-23) } : s.profile,
  }));

  // Test scores at ~70–85% of the way from baseline to target.
  const testScores: Record<string, number> = {};
  Object.values(militaryTests).forEach((t) =>
    t.events.forEach((e, i) => {
      const f = 0.7 + ((i * 7) % 16) / 100;
      testScores[`${t.id}:${e.id}`] = Math.round(e.baseline + (e.target - e.baseline) * f);
    }),
  );

  useReadinessStore.setState({
    testScores,
    checkIns: [{ date: day(0), sleepHours: 8, soreness: 2, energy: 4, stress: 2, hydration: 4 }],
    trackedSessions: [
      { id: 'demo-r1', type: 'ruck', date: day(1), distanceMiles: 6.2, durationSeconds: 5820, elevationFeet: 410, packWeightPounds: 45, terrain: 'Trail' },
      { id: 'demo-r2', type: 'run', date: day(3), distanceMiles: 3.1, durationSeconds: 1398, elevationFeet: 120 },
      { id: 'demo-r3', type: 'run', date: day(5), distanceMiles: 2.0, durationSeconds: 868, elevationFeet: 40 },
      { id: 'demo-r4', type: 'ruck', date: day(8), distanceMiles: 4.0, durationSeconds: 3720, elevationFeet: 260, packWeightPounds: 35, terrain: 'Road' },
    ],
  });
}
