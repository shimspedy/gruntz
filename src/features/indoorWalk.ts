import { KM_PER_MILE } from '../utils/units';

/** A typed treadmill distance is capped here; anything beyond it is a typing slip. */
export const MAX_INDOOR_MILES = 100;

type RecordedWalk = { distanceMiles: number; durationMs: number; caloriesEstimate: number };
type WalkNumbers = Pick<RecordedWalk, 'distanceMiles' | 'caloriesEstimate'> & { paceMinPerMile: number | null };

/**
 * The numbers to save for an indoor walk once the athlete has typed what the treadmill showed.
 *
 * A treadmill measures its belt; steps only estimate it. What was typed wins, and pace
 * and the calorie estimate follow the corrected distance. Returns nothing to change when
 * the field is blank, unreadable, or agrees with the recording to the hundredth.
 */
export function correctedIndoorWalk(recorded: RecordedWalk, typedDistance: string, metric: boolean, bodyWeightLbs: number): Partial<WalkNumbers> {
  if (typedDistance.trim() === '') return {};
  const typed = Number(typedDistance.replace(',', '.'));
  if (!Number.isFinite(typed) || typed < 0) return {};
  const miles = Math.min(MAX_INDOOR_MILES, metric ? typed / KM_PER_MILE : typed);
  if (Math.abs(miles - recorded.distanceMiles) < 0.005) return {};
  const rounded = Math.round(miles * 100) / 100;
  return {
    distanceMiles: rounded,
    paceMinPerMile: rounded > 0.05 ? Math.round((recorded.durationMs / 60000 / rounded) * 10) / 10 : null,
    caloriesEstimate: recorded.distanceMiles > 0
      ? Math.round(recorded.caloriesEstimate * (rounded / recorded.distanceMiles))
      : Math.round(rounded * (bodyWeightLbs / 1.9)),
  };
}
