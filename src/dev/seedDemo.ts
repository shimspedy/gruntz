import { achievements } from '../data/achievements';
import { militaryTests } from '../data/militaryTests';
import { useChromePrefs } from '../store/useUiStore';
import { useReadinessStore } from '../store/useReadinessStore';
import { useSessionStore } from '../store/useSessionStore';
import { useUserStore } from '../store/useUserStore';
import { getLocalDateKey } from '../utils/dateKey';
import { getLevelForXP, getRank } from '../utils/xp';
import { setDemoTeam } from '../services/teams';
import { saveRoute } from '../store/activityRoutes';
import { useRoutineStore } from '../store/useRoutineStore';
import type { RoutePoint } from '../types/activity';

/** A park loop of about 5.8 miles, so the demo ruck has a real route to draw. */
function demoLoop(startedAt: number, seconds: number): RoutePoint[] {
  const points = 600;
  const tilt = (29 * Math.PI) / 180;
  return Array.from({ length: points + 1 }, (_, i) => {
    const t = (i / points) * 2 * Math.PI;
    const wobble = 1 + 0.06 * Math.sin(t * 5) + 0.03 * Math.cos(t * 9);
    const north = 2050 * Math.cos(t) * wobble;
    const east = 420 * Math.sin(t) * wobble;
    const x = east * Math.cos(tilt) + north * Math.sin(tilt);
    const y = north * Math.cos(tilt) - east * Math.sin(tilt);
    return {
      latitude: 40.7812 + y / 111195,
      longitude: -73.9665 + x / (111195 * Math.cos((40.7812 * Math.PI) / 180)),
      altitude: 30 + 12 * Math.sin(t * 2),
      timestamp: startedAt + Math.round((i / points) * seconds * 1000),
      speed: 1.6,
      segment: 0,
    };
  });
}

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

  // With a workout already open, dress that workout for the logging screenshot instead of
  // closing it: last time's numbers, today's weight, and the first set logged with rest running.
  const session = useSessionStore.getState();
  if (session.active && session.exercises.length) {
    const [first] = session.exercises;
    useSessionStore.setState((state) => ({
      previous: { ...state.previous, [first.exerciseId]: first.sets.map(() => ({ reps: 5, weight: 215, seconds: undefined, distance: undefined, unit: 'lb' as const })) },
    }));
    const [firstSet] = first.sets;
    if (firstSet && !firstSet.done) {
      session.updateSet(first.key, firstSet.id, { weight: 225, reps: 5 });
      session.toggleSet(first.key, firstSet.id);
    }
  } else {
    session.discard();
  }
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
    profile: s.profile
      ? {
        ...s.profile,
        display_name: 'Alex',
        goals: Array.from(new Set([...s.profile.goals, 'Military Prep'])),
        service_branch: 'army',
        service_status: 'active',
        fitness_test_type: 'army_aft',
        fitness_test_date: day(-23),
      }
      : s.profile,
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
      { id: 'demo-r1', type: 'ruck', date: day(1), distanceMiles: 5.8, durationSeconds: 5820, elevationFeet: 410, packWeightPounds: 45, terrain: 'Trail', title: 'Morning ruck', routePoints: 601, steps: 11840, caloriesEstimate: 742 },
      { id: 'demo-r2', type: 'run', date: day(3), distanceMiles: 3.1, durationSeconds: 1398, elevationFeet: 120 },
      { id: 'demo-r3', type: 'run', date: day(5), distanceMiles: 2.0, durationSeconds: 868, elevationFeet: 40 },
      { id: 'demo-r4', type: 'ruck', date: day(8), distanceMiles: 4.0, durationSeconds: 3720, elevationFeet: 260, packWeightPounds: 35, terrain: 'Road' },
    ],
  });

  const rucked = Date.now() - 86400000 - 5820000;
  void saveRoute('demo-r1', demoLoop(rucked, 5820)).catch(() => undefined);

  useRoutineStore.setState((state) => ({
    routines: state.routines.some((routine) => routine.id === 'demo-push')
      ? state.routines
      : [
        {
          id: 'demo-push',
          name: 'Push day',
          days: [1, 4],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: ['barbell-bench-press', 'dumbbell-incline-bench-press', 'parralel-bar-dips', 'dumbbell-lateral-raise', 'cable-rope-pushdown'].map((key, i) => ({
            uid: `demo-${i}`, key, sets: i < 2 ? 4 : 3, reps: i < 2 ? 6 : 12, rest: i < 2 ? 120 : 60,
          })),
        },
        ...state.routines,
      ],
  }));

  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();
  setDemoTeam({
    id: 'demo-team',
    name: '2nd Platoon',
    inviteCode: 'RK7M4Q',
    isLeader: true,
    members: [
      { userId: 'me', displayName: 'Alex', role: 'leader', sessions: claimed.size, streak: 12, status: 'green', updatedAt: minutesAgo(1), isMe: true },
      { userId: 'a', displayName: 'Brooks', role: 'member', sessions: 52, streak: 21, status: 'green', updatedAt: minutesAgo(38), isMe: false },
      { userId: 'b', displayName: 'Dana R.', role: 'member', sessions: 44, streak: 9, status: 'amber', updatedAt: minutesAgo(95), isMe: false },
      { userId: 'c', displayName: 'Ortiz', role: 'member', sessions: 39, streak: 14, status: 'green', updatedAt: minutesAgo(180), isMe: false },
      { userId: 'd', displayName: 'Sam K.', role: 'member', sessions: 31, streak: 3, status: 'red', updatedAt: minutesAgo(410), isMe: false },
      { userId: 'e', displayName: 'Whitaker', role: 'member', sessions: 27, streak: 6, status: 'unknown', updatedAt: minutesAgo(1500), isMe: false },
    ],
  });
}
