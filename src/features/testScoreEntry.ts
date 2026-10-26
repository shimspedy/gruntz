import type { TestEventDefinition } from '../data/militaryTests';

export interface TestScoreDraft { current: string; target: string }

export function hasTestScoreChanges(scores: Record<string, number>, saved: Record<string, number> = {}) {
  const keys = Object.keys(scores);
  return keys.length > 0 && (keys.length !== Object.keys(saved).length || keys.some((key) => scores[key] !== saved[key]));
}

/** A blank field means no measurement; malformed nonempty input must never become a score. */
export function parseTestScoreValue(text: string, unit: TestEventDefinition['unit']): number | null {
  const clean = text.trim().replace(',', '.');
  let value = 0;
  if (unit === 'seconds' && /^\d+:\d{1,2}$/.test(clean)) {
    const [minutes, seconds] = clean.split(':').map(Number);
    if (seconds >= 60) return null;
    value = minutes * 60 + seconds;
  } else if (/^\d+(?:\.\d+)?$/.test(clean)) value = Number(clean);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Target preferences can be changed without inventing a dated test attempt. */
export function prepareTestScoreEntry(events: TestEventDefinition[], draft: Record<string, TestScoreDraft>) {
  const scores: Record<string, number> = {};
  const targets: Record<string, number> = {};
  for (const event of events) {
    const fields = draft[event.id] ?? { current: '', target: '' };
    const current = parseTestScoreValue(fields.current, event.unit);
    const target = parseTestScoreValue(fields.target, event.unit);
    if (fields.current.trim() && current === null) return { scores, targets, error: `Enter a valid score for ${event.shortName}` };
    if (fields.target.trim() && target === null) return { scores, targets, error: `Enter a valid target for ${event.shortName}` };
    if (current !== null) scores[event.id] = current;
    targets[event.id] = target ?? event.target;
  }
  return { scores, targets, error: null };
}
