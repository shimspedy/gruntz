import type { BodyCompStandard, FitnessEvent, FitnessTest, ScoreBracket, Sex } from './types';

/**
 * Scoring and body-composition math, kept free of UI so it can be tested against the
 * official charts. Every result is an unofficial estimate.
 */

/** "18:30" → 1110, "1:02:05" → 3725, "45" → 45. Null when it is not a time. */
export function parseTime(text: string): number | null {
  const parts = text.trim().split(':');
  if (!parts.length || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.length > 1 && nums.slice(1).some((n) => n >= 60)) return null;
  return nums.reduce((total, n) => total * 60 + n, 0);
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}

export function bracketFor(event: FitnessEvent, sex: Sex, age: number): ScoreBracket | undefined {
  return event.brackets.find((b) => (b.sex === 'any' || b.sex === sex) && age >= b.ageMin && age <= b.ageMax);
}

/** Points for one performance. 0 when it is short of every row or no bracket applies. */
export function pointsFor(event: FitnessEvent, sex: Sex, age: number, value: number): number {
  const bracket = bracketFor(event, sex, age);
  if (!bracket || !Number.isFinite(value)) return 0;
  let best = 0;
  for (const [performance, points] of bracket.points) {
    const reached = event.better === 'higher' ? value >= performance : value <= performance;
    if (reached && points > best) best = points;
  }
  return best;
}

/** The performance needed for the maximum points in this bracket. */
export function maxPerformance(event: FitnessEvent, sex: Sex, age: number): number | null {
  const bracket = bracketFor(event, sex, age);
  if (!bracket?.points.length) return null;
  const top = Math.max(...bracket.points.map(([, p]) => p));
  const rows = bracket.points.filter(([, p]) => p === top).map(([v]) => v);
  return event.better === 'higher' ? Math.min(...rows) : Math.max(...rows);
}

/** The performance needed for the slot's minimum points, if it has one. */
export function minimumPerformance(event: FitnessEvent, sex: Sex, age: number, minimumPoints: number): number | null {
  const bracket = bracketFor(event, sex, age);
  if (!bracket) return null;
  const rows = bracket.points.filter(([, p]) => p >= minimumPoints).map(([v]) => v);
  if (!rows.length) return null;
  return event.better === 'higher' ? Math.min(...rows) : Math.max(...rows);
}

export type SlotResult = { slotId: string; eventId: string; points: number; meetsMinimum: boolean | null };
export type TestResult = {
  slots: SlotResult[];
  total: number;
  passing: boolean | null;
  className: string | null;
};

/** Scores a whole test. `entries` maps slot id to the chosen event id and the performance. */
export function scoreTest(test: FitnessTest, sex: Sex, age: number, entries: Record<string, { eventId: string; value: number | null }>): TestResult {
  const slots = test.slots.map((slot): SlotResult => {
    const entry = entries[slot.id];
    const event = slot.options.find((o) => o.id === entry?.eventId) ?? slot.options[0];
    const points = entry?.value == null ? 0 : pointsFor(event, sex, age, entry.value);
    return { slotId: slot.id, eventId: event.id, points, meetsMinimum: slot.minimumPoints == null ? null : points >= slot.minimumPoints };
  });
  const total = slots.reduce((sum, s) => sum + s.points, 0);
  const passLine = test.passingTotal?.find((p) => (p.sex === 'any' || p.sex === sex) && age >= p.ageMin && age <= p.ageMax);
  const minimumsMet = slots.every((s) => s.meetsMinimum !== false);
  const passing = passLine ? total >= passLine.points && minimumsMet : slots.some((s) => s.meetsMinimum !== null) ? minimumsMet : null;
  const className = test.classes?.find((c) => total >= c.min)?.label ?? null;
  return { slots, total, passing, className };
}

// ─── Body composition ───────────────────────────────────────────────────────────

const log10 = Math.log10;

/**
 * Body fat percent by the published DoD methods. Inputs in inches and pounds.
 *
 * one-site (DoDI 1308.03, 2022): men  -26.97 - 0.12·weight + 1.99·abdomen
 *                                women -9.15 - 0.015·weight + 1.27·abdomen
 * multi-site (DoDI 1308.03, 2002 to 2022):
 *   men   86.010·log10(abdomen − neck) − 70.041·log10(height) + 36.76
 *   women 163.205·log10(waist + hip − neck) − 97.684·log10(height) − 78.387
 */
export function bodyFatPercent(
  method: BodyCompStandard['method'],
  sex: Sex,
  m: { heightIn: number; weightLb?: number; abdomenIn?: number; neckIn?: number; waistIn?: number; hipIn?: number },
): number | null {
  if (method === 'dod-one-site') {
    if (!m.weightLb || !m.abdomenIn) return null;
    const pct = sex === 'male' ? -26.97 - 0.12 * m.weightLb + 1.99 * m.abdomenIn : -9.15 - 0.015 * m.weightLb + 1.27 * m.abdomenIn;
    return Math.max(0, Math.round(pct));
  }
  if (method === 'dod-multi-site') {
    if (!m.neckIn || !m.heightIn) return null;
    if (sex === 'male') {
      if (!m.abdomenIn || m.abdomenIn <= m.neckIn) return null;
      return Math.max(0, Math.round(86.01 * log10(m.abdomenIn - m.neckIn) - 70.041 * log10(m.heightIn) + 36.76));
    }
    if (!m.waistIn || !m.hipIn || m.waistIn + m.hipIn <= m.neckIn) return null;
    return Math.max(0, Math.round(163.205 * log10(m.waistIn + m.hipIn - m.neckIn) - 97.684 * log10(m.heightIn) - 78.387));
  }
  return null;
}

type RatioRule = NonNullable<BodyCompStandard['waistToHeightRule']>;
const DEFAULT_RULE: RatioRule = { decimals: 2, truncate: false, strictlyBelow: false };

/** Waist ÷ height, kept to the published number of decimals (cut off or rounded). */
export function waistToHeight(waistIn: number, heightIn: number, rule: RatioRule = DEFAULT_RULE): number | null {
  if (!(waistIn > 0) || !(heightIn > 0)) return null;
  const f = 10 ** rule.decimals;
  // The small epsilon keeps 0.55 from becoming 0.5499999 in floating point before it is cut off.
  const raw = (waistIn / heightIn) * f;
  return (rule.truncate ? Math.floor(raw + 1e-9) : Math.round(raw)) / f;
}

/** Whether a ratio meets the standard's cutoff under its published comparison. */
export function meetsRatio(ratio: number, standard: BodyCompStandard): boolean | null {
  if (standard.waistToHeightMax == null) return null;
  const rule = standard.waistToHeightRule ?? DEFAULT_RULE;
  return rule.strictlyBelow ? ratio < standard.waistToHeightMax : ratio <= standard.waistToHeightMax;
}

/** The screening table's maximum weight for this height, or null if the height is off the chart. */
export function maxWeightFor(standard: BodyCompStandard, sex: Sex, age: number, heightIn: number): { minLb?: number; maxLb: number } | null {
  const table = standard.heightWeight.find((t) => t.sex === sex && age >= t.ageMin && age <= t.ageMax);
  const row = table?.rows.find((r) => r.heightIn === Math.round(heightIn));
  return row ? { minLb: row.minLb, maxLb: row.maxLb } : null;
}

export function maxBodyFat(standard: BodyCompStandard, sex: Sex, age: number): number | null {
  return standard.bodyFatMax.find((b) => b.sex === sex && age >= b.ageMin && age <= b.ageMax)?.maxPct ?? null;
}
