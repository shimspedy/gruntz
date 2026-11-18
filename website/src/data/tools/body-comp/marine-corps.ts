/**
 * U.S. Marine Corps body composition evaluation, as in force from 1 January 2026.
 *
 * MARADMIN 066/26 (26 Feb 2026) replaced the semiannual height/weight screen with a
 * waist-to-height ratio (WHtR). The process is now two steps:
 *
 *   Step 1  WHtR = waist at the navel / height, both rounded down to the half inch.
 *           Within standards when the waist is at or under the MARADMIN's maximum waist
 *           for that height (the table is exactly waist <= 0.52 x height).
 *   Step 2  Only if Step 1 is exceeded: body fat by the Marine Corps multi-site tape test
 *           (MCO 6110.3A) or bioelectrical impedance (BIA). Meeting the body fat standard
 *           by either method is enough. Body fat limits are unchanged and vary by age.
 *
 * The Marine Corps did NOT adopt the DoD one-site abdominal equation (DoDI 1308.03, 2022);
 * MARADMIN 066/26 keeps the "current multi-site tape test".
 *
 * Unofficial estimate only. MCTIMS is the system of record.
 */
import type { BodyCompStandard, HeightWeightRow, Sex, BodyMeasurements } from '../types';

/** MARADMIN 066/26 para 6: maximum waist (in) for each recorded height (in). */
export const maxWaistByHeight: [heightIn: number, maxWaistIn: number][] = [
  [53, 27.5], [53.5, 27.5], [54, 28.0], [54.5, 28.0], [55, 28.5], [55.5, 28.5], [56, 29.0], [56.5, 29.0],
  [57, 29.5], [57.5, 29.5], [58, 30.0], [58.5, 30.0], [59, 30.5], [59.5, 30.5], [60, 31.0], [60.5, 31.0],
  [61, 31.5], [61.5, 31.5], [62, 32.0], [62.5, 32.5], [63, 32.5], [63.5, 33.0], [64, 33.0], [64.5, 33.5],
  [65, 33.5], [65.5, 34.0], [66, 34.0], [66.5, 34.5], [67, 34.5], [67.5, 35.0], [68, 35.0], [68.5, 35.5],
  [69, 35.5], [69.5, 36.0], [70, 36.0], [70.5, 36.5], [71, 36.5], [71.5, 37.0], [72, 37.0], [72.5, 37.5],
  [73, 37.5], [73.5, 38.0], [74, 38.0], [74.5, 38.5], [75, 39.0], [75.5, 39.0], [76, 39.5], [76.5, 39.5],
  [77, 40.0], [77.5, 40.0], [78, 40.5], [78.5, 40.5], [79, 41.0], [79.5, 41.0], [80, 41.5], [80.5, 41.5],
  [81, 42.0], [81.5, 42.0], [82, 42.5], [82.5, 42.5], [83, 43.0], [83.5, 43.0], [84, 43.5],
];

/** Both WHtR measurements are rounded DOWN to the nearest half inch (MARADMIN 066/26 para 3.d). */
export const whtrRounding = { height: 'half-down', waist: 'half-down' } as const;

/**
 * Tape-test body fat, the DoD multi-site circumference equations that reproduce the
 * MCO 6110.3A Enclosure (4) lookup tables (result rounded to a whole percent).
 *   male:   circumference value = abdomen at navel - neck
 *   female: circumference value = natural waist + hip - neck
 * Height here is the tape-test height, recorded to the nearest half inch.
 * Returns null only for non-positive inputs; the printed tables' height and circumference
 * ranges are not enforced.
 */
export function marineTapeBodyFat(sex: Sex, circumferenceValueIn: number, heightIn: number): number | null {
  if (!(circumferenceValueIn > 0) || !(heightIn > 0)) return null;
  const pct =
    sex === 'male'
      ? 86.01 * Math.log10(circumferenceValueIn) - 70.041 * Math.log10(heightIn) + 36.76
      : 163.205 * Math.log10(circumferenceValueIn) - 97.684 * Math.log10(heightIn) - 78.387;
  return Math.round(pct);
}

/**
 * Former DoD height/weight screening table from MCO 6110.3A Enclosure (3). It stopped being
 * used to judge standards on 1 Jan 2026 (weight is still recorded during 2026 for study only).
 * Kept for reference; the calculator must not screen with it.
 */
export const retiredHeightWeight: Record<Sex, HeightWeightRow[]> = {
  male: [
    [52, 73, 106], [53, 76, 110], [54, 79, 114], [55, 82, 118], [56, 85, 122], [57, 88, 127], [58, 91, 131],
    [59, 94, 136], [60, 97, 141], [61, 100, 145], [62, 104, 150], [63, 107, 155], [64, 110, 160], [65, 114, 165],
    [66, 117, 170], [67, 121, 175], [68, 125, 180], [69, 128, 186], [70, 132, 191], [71, 136, 197], [72, 140, 202],
    [73, 144, 208], [74, 148, 214], [75, 152, 220], [76, 156, 225], [77, 160, 231], [78, 164, 237], [79, 168, 244],
    [80, 173, 250], [81, 177, 256], [82, 182, 263], [83, 186, 269], [84, 191, 276], [85, 195, 283], [86, 200, 289],
  ].map(([heightIn, minLb, maxLb]) => ({ heightIn, minLb, maxLb })),
  female: [
    [52, 73, 100], [53, 76, 104], [54, 79, 108], [55, 82, 112], [56, 85, 115], [57, 88, 120], [58, 91, 124],
    [59, 94, 129], [60, 97, 133], [61, 100, 137], [62, 104, 142], [63, 107, 146], [64, 110, 151], [65, 114, 156],
    [66, 117, 161], [67, 121, 166], [68, 125, 171], [69, 128, 176], [70, 132, 181], [71, 136, 186], [72, 140, 191],
    [73, 144, 197], [74, 148, 202], [75, 152, 208], [76, 156, 213], [77, 160, 219], [78, 164, 225], [79, 168, 230],
    [80, 173, 236], [81, 177, 242], [82, 182, 248], [83, 186, 255], [84, 191, 261], [85, 195, 267], [86, 200, 274],
  ].map(([heightIn, minLb, maxLb]) => ({ heightIn, minLb, maxLb })),
};

/** Performance allowances (MARADMIN 066/26 para 2.b.2). Both tests must be scored, 1st class, current period. */
export const performanceAllowance = {
  /** 285+ on BOTH PFT and CFT: allowed up to this body fat, whatever the age table says. */
  highScore: { minEachTest: 285, maxPct: { male: 26, female: 36 } as Record<Sex, number> },
  /** 250+ on BOTH: one extra percent on the age-table maximum, never above the highScore caps. */
  plusOne: { minEachTest: 250, extraPct: 1 },
};

export const standard: BodyCompStandard = {
  branch: 'marine-corps',
  // Height/weight no longer decides standards (MARADMIN 066/26). See retiredHeightWeight above.
  heightWeight: [],
  bodyFatMax: [
    { sex: 'male', ageMin: 17, ageMax: 25, maxPct: 18 },
    { sex: 'male', ageMin: 26, ageMax: 35, maxPct: 19 },
    { sex: 'male', ageMin: 36, ageMax: 45, maxPct: 20 },
    { sex: 'male', ageMin: 46, ageMax: 99, maxPct: 21 },
    { sex: 'female', ageMin: 17, ageMax: 25, maxPct: 26 },
    { sex: 'female', ageMin: 26, ageMax: 35, maxPct: 27 },
    { sex: 'female', ageMin: 36, ageMax: 45, maxPct: 28 },
    { sex: 'female', ageMin: 46, ageMax: 99, maxPct: 29 },
  ],
  method: 'waist-to-height',
  waistToHeightMax: 0.52,
  // The published height/max-waist table passes a ratio of exactly 0.52 (e.g. 62.5 in / 32.5 in),
  // and MCTIMS flags only values that exceed 0.52000.
  waistToHeightRule: { decimals: 5, truncate: true, strictlyBelow: false },
  // Height is also rounded DOWN to the half inch for WHtR; the shared type cannot express that,
  // so use `whtrRounding` from this file.
  measureRounding: { height: 'half-down', waist: 'half-down' },
  // Failing the ratio leads to the tape test: men abdomen − neck, women waist + hip − neck.
  bodyFatAfterRatio: { male: ['neck'], female: ['neck', 'hip'] },
  formula: [
    {
      sex: 'male',
      expression:
        'Step 1: WHtR = waist at navel / height, each rounded down to the half inch; within standards at 0.52 or lower (equivalently, waist at or under the MARADMIN 066/26 maximum for that height). ' +
        'Step 2 if over: tape test, circumference value = abdomen - neck (abdomen rounded down, neck rounded up, to the half inch); ' +
        '%BF = 86.010 x log10(abdomen - neck) - 70.041 x log10(height) + 36.76, rounded to a whole percent, or a BIA reading. Meet the age limit by either method.',
    },
    {
      sex: 'female',
      expression:
        'Step 1: WHtR = waist at navel / height, each rounded down to the half inch; within standards at 0.52 or lower. ' +
        'Step 2 if over: tape test, circumference value = natural waist + hip - neck (waist and hip rounded down, neck rounded up, to the half inch); ' +
        '%BF = 163.205 x log10(waist + hip - neck) - 97.684 x log10(height) - 78.387, rounded to a whole percent, or a BIA reading. Meet the age limit by either method.',
    },
  ],
  notes: [
    'WHtR is a health-risk screen, not a body fat measurement. The standard is the same for men and women.',
    'Waist is measured at the navel, parallel to the deck, with a self-tensioning tape, by an evaluator of the same sex; measured twice, the lower reading kept, rounded down to the half inch.',
    'Over the WHtR limit: body fat by the multi-site tape test or BIA. With a BIA device on hand the Marine picks which goes first; failing the first means the other is also done. Failing both means assignment to the Body Composition Program (BCP). BIA will fully replace the tape once fielded.',
    'A Marine scoring 285 or more on both the PFT and CFT may carry up to 26% (men) or 36% (women) body fat; above that they go to BCP regardless of scores.',
    'A Marine scoring 250 or more on both tests gets one extra percent on the age-table limit, never above 26% / 36%.',
    'Both allowances need a 1st class PFT and CFT in the current semiannual period (no medical, partial or deployment waivers). If body composition is done before that period\'s tests, the prior calendar year\'s 1st class scores are used.',
    'Evaluated twice a year for active and reserve components. Pregnancy and post-partum are the only exemptions from the evaluation itself (MARADMIN 358/26).',
    'Weight is still taken and recorded through 2026 for study, but it does not decide standards.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      {
        label: 'MARADMIN 066/26, Change 1: WHtR standard and maximum waist table (26 Feb 2026)',
        url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4414762/change-1-to-the-advance-notification-of-changes-to-the-marine-corps-physical-fi/',
      },
      {
        label: 'MARADMIN 358/26, Recording body composition data in MCTIMS (7 Aug 2026)',
        url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4566548/guidance-for-the-recording-of-body-composition-data-in-the-marine-corps-trainin/',
      },
      {
        label: 'MARADMIN 613/25, Advance notification of PFT and body composition changes (18 Dec 2025)',
        url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4363582/advance-notification-of-changes-to-the-marine-corps-physical-fitness-test-and-b/',
      },
      {
        label: 'MCO 6110.3A W/ADMIN CH-4, Body Composition and Military Appearance Program (28 May 2025)',
        url: 'https://www.marines.mil/News/Publications/MCPEL/Electronic-Library-Display/Article/2863863/mco-61103a-wadmin-ch-4/',
      },
    ],
    notes:
      'Body fat limits are from MCO 6110.3A Enclosure (3), "Maximum Body Fat Percentage Table by Age Group", which MARADMIN 066/26 says is unchanged. ' +
      'Every row of the MARADMIN 066/26 maximum-waist table was checked: each equals the largest half inch at or under 0.52 x height. ' +
      'The order prints the tape test only as lookup tables (Enclosure 4). The DoD multi-site equations given here reproduced every table cell sampled (13 cells across both sexes and the full range), rounded to the nearest whole percent; they are the standard DoD formulas, not text printed in MCO 6110.3A. ' +
      'The retired height/weight table is Enclosure (3), page 3-1.',
    unverified: [
      'MARADMIN 066/26 para 6 says the standard is "<0.52", but its own table (and MCTIMS per MARADMIN 358/26) passes exactly 0.52. The data follows the table; confirm with TECOM Human Performance Branch if the page states the rule in words.',
      'The multi-site equations were checked against 13 cells of the MCO 6110.3A Enclosure (4) tables, not every cell, and against no official copy of DoDI 1308.3 (2002). Either transcribe the full lookup tables or confirm the coefficients before promoting.',
      'BIA readings cannot be estimated from tape inputs; the calculator can only model the tape path.',
      'The printed tape tables cover limited height and circumference ranges that were not transcribed; the equation is not bounded here.',
      'The 285 / 250 allowances in MARADMIN 066/26 refer to the SECWAR memo of 18 Dec 2025; confirm no later MARADMIN changed them (none found through MARADMIN 358/26).',
    ],
  },
};

/** The generic step the calculator calls after a failed ratio: the MCO 6110.3A tape test. */
export function lookupBodyFat(sex: Sex, m: BodyMeasurements): number | null {
  if (!m.neckIn) return null;
  if (sex === 'female' && !m.hipIn) return null;
  const value = sex === 'male' ? m.waistIn - m.neckIn : m.waistIn + (m.hipIn ?? 0) - m.neckIn;
  return value > 0 ? marineTapeBodyFat(sex, value, m.heightIn) : null;
}
