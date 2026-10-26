import { branchDefaultTest, militaryTests, type TestEventDefinition } from '../data/militaryTests';
import type { Exercise, FitnessTestType, UserProfile, WorkoutDay } from '../types';
import { getLocalDateKey } from '../utils/dateKey';

export type TrainingMode = 'planned' | 'shorter' | 'recovery';
export interface TrainingChoice { date: string; mode: TrainingMode }
export interface TestAttempt {
  id: string;
  testId: FitnessTestType;
  /** Earlier builds retained scores without a date. Never invent a date for them. */
  recordedAt: string | null;
  scores: Record<string, number>;
}
export interface TrainingFocus {
  testId: FitnessTestType;
  eventId: string;
  eventName: string;
  kind: 'run' | 'ruck' | 'swim' | 'strength' | 'core';
  title: string;
  reason: string;
  daysToTest: number | null;
}

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function isTrainingChoice(value: unknown): value is TrainingChoice {
  if (!record(value) || typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
  const date = new Date(`${value.date}T12:00:00`);
  return Number.isFinite(date.getTime()) && getLocalDateKey(date) === value.date && ['planned', 'shorter', 'recovery'].includes(String(value.mode));
}

export function isTestAttempt(value: unknown): value is TestAttempt {
  if (!record(value) || typeof value.id !== 'string' || !value.id || value.id.length > 200 || typeof value.testId !== 'string' || !Object.hasOwn(militaryTests, value.testId)) return false;
  if (value.recordedAt !== null) {
    if (typeof value.recordedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value.recordedAt) || !Number.isFinite(Date.parse(value.recordedAt))) return false;
    if (new Date(value.recordedAt).toISOString().slice(0, 19) !== value.recordedAt.slice(0, 19)) return false;
  }
  if (!record(value.scores) || !Object.keys(value.scores).length) return false;
  const test = militaryTests[value.testId as FitnessTestType];
  return Object.entries(value.scores).every(([key, score]) => test.events.some((event) => event.id === key) && positive(score));
}

export function getTodaysTrainingChoice(choice: TrainingChoice | null | undefined, now = new Date()): TrainingMode {
  return isTrainingChoice(choice) && choice.date === getLocalDateKey(now) ? choice.mode : 'planned';
}

export function testDaysUntil(date: string | null | undefined, now = new Date()): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  if (getLocalDateKey(parsed) !== date) return null;
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
}

/** Rank the athlete's entered events against their own target, not missing data. */
export function getTrainingFocus(
  profile: UserProfile | null | undefined,
  scores: Record<string, number>,
  targets: Record<string, number> = {},
  now = new Date(),
): TrainingFocus | null {
  if (!profile?.goals?.includes('Military Prep')) return null;
  const test = militaryTests[profile.fitness_test_type ?? branchDefaultTest[profile.service_branch ?? 'general']];
  if (!test) return null;
  const ranked = test.events.flatMap((event) => {
    const value = scores[`${test.id}:${event.id}`];
    if (!positive(value)) return [];
    const target = positive(targets[`${test.id}:${event.id}`]) ? targets[`${test.id}:${event.id}`] : event.target;
    const ratio = event.direction === 'higher' ? value / target : target / value;
    return [{ event, ratio }];
  }).sort((a, b) => a.ratio - b.ratio);
  const first = ranked[0];
  if (!first) return null;
  const event = first.event;
  const kind = event.id === 'ruck' ? 'ruck' : /run|mile|movement/.test(event.id) ? 'run' : /plank|core/.test(event.id) ? 'core' : 'strength';
  const daysToTest = testDaysUntil(profile.fitness_test_date, now);
  const schedule = daysToTest != null && daysToTest >= 0
    ? daysToTest === 0 ? 'Your test is today; keep any extra work optional.' : `${daysToTest} ${daysToTest === 1 ? 'day' : 'days'} to your test.`
    : 'Log a retest to see how this gap changes.';
  return {
    testId: test.id, eventId: event.id, eventName: event.shortName, kind,
    title: `${event.shortName} focus`,
    reason: `${event.shortName} is ${first.ratio >= 1 ? 'your closest event to its target' : 'your biggest logged gap to your target'}. ${schedule}`,
    daysToTest,
  };
}

export function getTestTrend(testId: string, event: TestEventDefinition, attempts: TestAttempt[]) {
  const valid = attempts.filter((attempt) => attempt.testId === testId && positive(attempt.scores[event.id]));
  // A retained legacy score is the earliest baseline; dated attempts sort by time.
  const ordered = [...valid].sort((a, b) => (a.recordedAt ? Date.parse(a.recordedAt) : -Infinity) - (b.recordedAt ? Date.parse(b.recordedAt) : -Infinity));
  if (ordered.length < 2) return null;
  const baseline = ordered[0];
  const latest = ordered[ordered.length - 1];
  const delta = latest.scores[event.id] - baseline.scores[event.id];
  return { baseline, latest, delta, improved: event.direction === 'higher' ? delta > 0 : delta < 0, attemptCount: ordered.length };
}

export function nextRetestDate(attempts: TestAttempt[], testId: string, now = new Date()) {
  const dated = attempts.filter((attempt) => attempt.testId === testId && attempt.recordedAt).sort((a, b) => Date.parse(b.recordedAt!) - Date.parse(a.recordedAt!));
  if (!dated.length) return null;
  const due = new Date(dated[0].recordedAt!);
  due.setDate(due.getDate() + 14);
  return { date: getLocalDateKey(due), days: testDaysUntil(getLocalDateKey(due), now) ?? 0 };
}

/** Matching moves are prioritized within the authored session, without adding load. */
export function matchesTrainingFocus(exercise: Exercise, focus: TrainingFocus): boolean {
  const id = `${exercise.id} ${exercise.name}`.toLowerCase();
  if (focus.kind === 'run') return exercise.category === 'running';
  if (focus.kind === 'ruck') return exercise.category === 'rucking';
  if (focus.eventId === 'pushups') return /push.?up/.test(id);
  if (focus.eventId === 'pullups') return /pull.?up|pulldown/.test(id);
  if (focus.eventId === 'deadlift') return /deadlift/.test(id);
  if (focus.eventId === 'ammo_lifts') return /overhead.press|ammo.can.lift/.test(id);
  if (focus.kind === 'core') return exercise.category === 'core';
  return /carry|drag|sprint/.test(id);
}

/** A focused preview uses exactly the same IDs and prescriptions as the live session. */
export function prioritizeWorkout(day: WorkoutDay, focus: TrainingFocus | null, lookup: (id: string) => Exercise | undefined): WorkoutDay {
  if (!focus) return day;
  const matches = (id: string) => { const exercise = lookup(id); return !!exercise && matchesTrainingFocus(exercise, focus); };
  const main = day.sections.filter((section) => section.type !== 'warmup' && section.type !== 'recovery');
  if (!main.some((section) => section.exercises.some(matches))) return day;
  const reordered = [...main].sort((a, b) => Number(b.exercises.some(matches)) - Number(a.exercises.some(matches))).map((section) => ({
    ...section,
    exercises: [...section.exercises].sort((a, b) => Number(matches(b)) - Number(matches(a))),
  }));
  const purpose = `${focus.eventName} work comes first after your warm-up, based on your logged test scores.`;
  return {
    ...day,
    objective: day.objective?.startsWith(purpose) ? day.objective : `${purpose} ${day.objective ?? ''}`.trim(),
    sections: [...day.sections.filter((section) => section.type === 'warmup'), ...reordered, ...day.sections.filter((section) => section.type === 'recovery')],
  };
}
