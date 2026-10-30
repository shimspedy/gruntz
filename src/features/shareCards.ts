import type { MilitaryTestDefinition } from '../data/militaryTests';
import type { Rank } from '../types';

/**
 * What goes on a share card, kept apart from how it is drawn so it can be tested.
 *
 * Cards only ever state what the athlete logged. The test card shows the app's
 * preparation estimate, never an official score or class: Gruntz does not compute
 * official points, and a share card is the worst place to look like it does.
 */

export interface CardRow { label: string; value: string }

export interface TestCardModel {
  kind: 'test';
  eyebrow: string;
  title: string;
  readiness: number;
  rows: CardRow[];
  note: string;
}

export interface MissionCardModel {
  kind: 'rank' | 'level' | 'workout';
  eyebrow: string;
  hero: string;
  sub: string;
  rank: Rank;
  rows: CardRow[];
}

export type ShareCardModel = TestCardModel | MissionCardModel;

/** Rows past this would shrink the type until the card stops reading at a glance. */
export const MAX_TEST_ROWS = 6;

export function formatEventValue(value: number, unit: string): string {
  if (!value) return '–';
  if (unit !== 'seconds') return `${value}`;
  const rounded = Math.round(value);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function eventValue(value: number, unit: string): string {
  if (unit === 'seconds') return formatEventValue(value, unit);
  if (unit === 'pounds') return `${value} lb`;
  if (unit === 'meters') return `${value} m`;
  return `${value}`;
}

export function testCardModel(
  test: Pick<MilitaryTestDefinition, 'name' | 'events'>,
  scores: Record<string, number>,
  readiness: { score: number; entered: number; total: number },
): TestCardModel | null {
  const rows = test.events
    .filter((event) => Number.isFinite(scores[event.id]) && scores[event.id] > 0)
    .slice(0, MAX_TEST_ROWS)
    .map((event) => ({ label: event.shortName || event.name, value: eventValue(scores[event.id], event.unit) }));
  if (!rows.length) return null;
  return {
    kind: 'test',
    eyebrow: test.name,
    title: 'Test prep',
    readiness: Math.max(0, Math.min(100, Math.round(readiness.score))),
    rows,
    note: readiness.entered < readiness.total ? `${readiness.entered} of ${readiness.total} events logged` : 'All events logged',
  };
}

export interface MissionInput {
  title: string;
  xpEarned: number;
  levelBefore: number;
  levelAfter: number;
  rankBefore: Rank;
  rankAfter: Rank;
  streak: number;
  minutes?: number;
  sets?: number;
}

export function missionCardModel(input: MissionInput): MissionCardModel {
  const rows: CardRow[] = [];
  if (input.minutes && input.minutes > 0) rows.push({ label: 'Time', value: `${input.minutes} min` });
  if (input.sets && input.sets > 0) rows.push({ label: 'Sets', value: `${input.sets}` });
  if (input.xpEarned > 0) rows.push({ label: 'XP', value: `+${input.xpEarned}` });
  if (input.streak > 1) rows.push({ label: 'Streak', value: `${input.streak}` });
  const stats = rows.slice(0, 3);
  const title = input.title.trim() || 'Workout';

  if (input.rankAfter !== input.rankBefore) {
    return { kind: 'rank', eyebrow: 'Rank up', hero: input.rankAfter, sub: `Level ${input.levelAfter}`, rank: input.rankAfter, rows: stats };
  }
  if (input.levelAfter > input.levelBefore) {
    return { kind: 'level', eyebrow: 'Level up', hero: `Level ${input.levelAfter}`, sub: `${input.rankAfter} rank`, rank: input.rankAfter, rows: stats };
  }
  return { kind: 'workout', eyebrow: 'Workout complete', hero: title, sub: `${input.rankAfter} · Level ${input.levelAfter}`, rank: input.rankAfter, rows: stats };
}

/** "Oct 30, 2026", uppercased by the card. */
export function cardDate(now: Date = new Date()): string {
  return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
