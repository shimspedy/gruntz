import { calculateDailyReadiness, type DailyReadinessCheckIn } from '../store/useReadinessStore';
import { getLocalDateKey } from '../utils/dateKey';

/**
 * The two training measures Gruntz can honestly report.
 *
 * The Ranks tab used to show six "Skill Rankings" — strength, endurance, stamina,
 * mobility, consistency, recovery — read from `progress.*_score` fields that
 * **nothing in the app ever wrote**. Every athlete, at every level, saw six bars at
 * zero reading "Not measured yet" forever, including someone who had just finished
 * an eight-week program.
 *
 * Four of those six were dropped rather than filled in. A 0-100 "Strength" or
 * "Mobility" score reads as a measurement of what the athlete can *do*, and nothing
 * here measures that — Gruntz logs what was prescribed and ticked, not load tested
 * against a standard. Deriving such a number from training mix would be a guess
 * wearing the clothes of a measurement, which is worse than an empty row.
 *
 * These two are different: they are computed from what the athlete actually did and
 * what they themselves reported.
 */
export type SkillMeasure = {
  key: 'consistency' | 'recovery';
  name: string;
  blurb: string;
  icon: 'calendar' | 'moon';
  /** 0-100, or null when there is genuinely nothing to report yet. */
  score: number | null;
  /** Says plainly where the number came from. */
  basis: string;
};

const DAY_MS = 86400000;
const WINDOW_DAYS = 28;

/**
 * Sessions completed against sessions planned over the last four weeks.
 *
 * Capped at 100 so training more than planned reads as 100 rather than a number
 * that rewards overreaching, and null until the athlete has been here long enough
 * for the ratio to mean anything.
 */
export function consistencyScore(input: {
  workoutDates: Set<string>;
  daysPerWeek: number | null | undefined;
  joinedAt?: string | null;
  now?: Date;
}): number | null {
  const now = input.now ?? new Date();
  const perWeek = Math.max(1, Math.min(7, Math.round(input.daysPerWeek ?? 3)));

  const joined = input.joinedAt ? new Date(input.joinedAt) : null;
  const daysSinceJoin = joined && !Number.isNaN(joined.getTime())
    ? Math.floor((now.getTime() - joined.getTime()) / DAY_MS)
    : WINDOW_DAYS;
  // Under a week of history cannot describe a habit.
  if (daysSinceJoin < 7) return null;

  const days = Math.min(WINDOW_DAYS, Math.max(7, daysSinceJoin));
  const cutoff = new Date(now.getTime() - days * DAY_MS);
  let done = 0;
  for (const key of input.workoutDates) {
    const date = new Date(`${key}T12:00:00`);
    if (!Number.isNaN(date.getTime()) && date >= cutoff && date <= now) done += 1;
  }

  const planned = (days / 7) * perWeek;
  if (planned <= 0) return null;
  return Math.round(Math.max(0, Math.min(100, (done / planned) * 100)));
}

/**
 * The average of the athlete's own readiness check-ins over the last four weeks.
 *
 * `calculateDailyReadiness` returns 70 for a missing check-in, which is a sensible
 * neutral for a single day but would quietly invent a score here — so days without
 * a check-in are skipped, and no check-ins at all means no number.
 */
export function recoveryScore(checkIns: DailyReadinessCheckIn[], now = new Date()): number | null {
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const recent = checkIns.filter((entry) => {
    const date = new Date(`${entry.date}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date >= cutoff && date <= now;
  });
  if (!recent.length) return null;
  const total = recent.reduce((sum, entry) => sum + calculateDailyReadiness(entry), 0);
  return Math.round(total / recent.length);
}

export function buildSkillMeasures(input: {
  workoutDates: Set<string>;
  daysPerWeek: number | null | undefined;
  joinedAt?: string | null;
  checkIns: DailyReadinessCheckIn[];
  now?: Date;
}): SkillMeasure[] {
  const now = input.now ?? new Date();
  return [
    {
      key: 'consistency',
      name: 'Consistency',
      blurb: 'Showing up on schedule, week after week.',
      icon: 'calendar',
      score: consistencyScore({ ...input, now }),
      basis: 'Sessions completed vs planned, last 4 weeks',
    },
    {
      key: 'recovery',
      name: 'Recovery',
      blurb: 'Sleep, readiness and smart rest days.',
      icon: 'moon',
      score: recoveryScore(input.checkIns, now),
      basis: 'Your readiness check-ins, last 4 weeks',
    },
  ];
}

/** Workout dates out of `<dateKey>:<workoutId>` claim keys. */
export function workoutDatesFromClaims(claimed: Set<string>): Set<string> {
  const dates = new Set<string>();
  for (const key of claimed) {
    const date = key.split(':')[0];
    if (date && date.length === 10) dates.add(date);
  }
  return dates;
}

export const TODAY_KEY = getLocalDateKey;
