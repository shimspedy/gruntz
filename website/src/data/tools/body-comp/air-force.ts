import type { BodyCompStandard, Source } from '../types';

/*
  U.S. Air Force body composition, as scored in the Physical Fitness Readiness Assessment (PFRA)
  under AFMAN 36-2905 (24 March 2026) and the AFPC PFRA scoring charts (effective 1 March 2026).

  Tier 1 is the waist-to-height ratio (WHtR). It is age and sex neutral and worth 20 of the
  PFRA's 100 points (see `whtrPoints`). Tier 2 is a body fat assessment, used only when the
  ratio is 0.55 or higher AND the Airman does not meet standards on the composite PFRA.
*/

const SOURCES: Source[] = [
  {
    label: 'AFMAN 36-2905, Air Force Physical Fitness Readiness Program, 24 March 2026 (PDF)',
    url: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/afman36-2905/dafman36-2905.pdf',
  },
  {
    label: 'AFPC: PFRA Scoring Charts, waist-to-height table (effective 1 Mar 2026) (PDF)',
    url: 'https://www.afpc.af.mil/Portals/70/documents/FITNESS/Tab%202.%20PFRA%20Scoring%20Charts,%20cao%2017%20Mar%2026.pdf',
  },
  { label: 'Air Force Personnel Center: Fitness Program', url: 'https://www.afpc.af.mil/Career-Management/Fitness-Program/' },
];

/**
 * PFRA waist-to-height points, the same for every age and both sexes.
 * [ratio, points]: lower is better. A truncated ratio at or below the value earns the points;
 * 0.49 or lower earns 20, and 0.60 or higher earns 0.
 */
export const whtrPoints: [number, number][] = [
  [0.49, 20],
  [0.5, 19],
  [0.51, 18],
  [0.52, 17],
  [0.53, 16],
  [0.54, 15],
  [0.55, 12.5],
  [0.56, 10],
  [0.57, 7.5],
  [0.58, 5],
  [0.59, 2.5],
];

/** Risk bands printed on the AFPC chart (ratio after truncation to two decimals). */
export const whtrRiskBands: { label: string; max: number | null }[] = [
  { label: 'Low risk', max: 0.49 },
  { label: 'Moderate risk', max: 0.54 },
  { label: 'High risk', max: null },
];

export const standard: BodyCompStandard = {
  branch: 'air-force',
  heightWeight: [],
  bodyFatMax: [
    { sex: 'male', ageMin: 17, ageMax: 99, maxPct: 26 },
    { sex: 'female', ageMin: 17, ageMax: 99, maxPct: 36 },
  ],
  method: 'waist-to-height',
  formula: [
    {
      sex: 'male',
      expression:
        'Tier 1: waist / height, truncated to two decimals. Tier 2 tape fallback: circumference value = abdomen at the navel (rounded down to 1/4 in) minus neck (rounded up to 1/4 in); body fat % is read from AFMAN 36-2905 Table A9.1 by circumference value and height. The manual publishes a lookup table, not an equation.',
    },
    {
      sex: 'female',
      expression:
        'Tier 1: waist / height, truncated to two decimals. Tier 2 tape fallback: circumference value = natural waist plus buttocks (each rounded down to 1/4 in) minus neck (rounded up to 1/4 in); body fat % is read from AFMAN 36-2905 Table A10.1 by circumference value and height. The manual publishes a lookup table, not an equation.',
    },
  ],
  waistToHeightMax: 0.55,
  waistToHeightRule: { decimals: 2, truncate: true, strictlyBelow: true },
  notes: [
    'The ratio is waist divided by height, truncated (not rounded) to two decimals. The manual\'s own example: 39.5 in waist and 72 in height give 0.5486, recorded as 0.54.',
    'Waist-to-height is a scored PFRA component worth 20 points, from 20 at 0.49 or lower down to 2.5 at 0.59 and 0 at 0.60 or higher. It has no component minimum, so a low ratio score alone does not fail the PFRA.',
    'A ratio of 0.55 or higher is High risk. If the Airman also fails the composite PFRA, a Tier 2 body fat assessment is required.',
    'Tier 2 standard: under 26% body fat for men and under 36% for women. It is pass/fail: a pass makes body composition an exempt component; a fail makes the PFRA Unsatisfactory.',
    'Tier 2 uses an InBody 770 bioimpedance scale where available, otherwise the 2-3 site tape method in AFMAN 36-2905 Attachment 8, measured by a member of the same sex.',
    'Airmen may take the body composition measurement on its own, at least one and no more than five duty days before the exercise components. They cannot be ordered to do both the same day.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: SOURCES,
    notes:
      'Waist-to-height points and risk bands from the AFPC PFRA scoring chart (effective 1 March 2026). Truncation rule, Tier 2 trigger, body fat limits and tape sites from AFMAN 36-2905 (24 March 2026), paras 3.1.1, 3.1.2.1, 3.7.2, 3.15.4.2, Table 3.2 and Attachment 8. ' +
      'The Tier 2 tape tables (Attachments 9 and 10) are long height-by-circumference grids and are not transcribed here, so no lookupBodyFat is exported and bodyFatAfterRatio is left unset.',
    unverified: [
      'Body fat limit wording: AFMAN 36-2905 Table 3.2 prints "< 26%" (male) and "< 36%" (female), so exactly 26.0% / 36.0% may fail. maxPct is stored as 26 / 36; confirm how a reading of exactly 26.0% or 36.0% is treated.',
      'Risk band edges: the AFPC chart labels Low, Moderate and High risk by colour band. We read Low as 0.49 or lower, Moderate as 0.50-0.54 and High as 0.55 or higher, which matches the 0.55 High-risk trigger in AFMAN 36-2905 para 3.1.1. Confirm the 0.49/0.50 edge on the chart.',
      'Tier 2 tape tables (AFMAN 36-2905 Attachments 9 and 10) are not transcribed. Transcribe them from the PDF if the calculator should estimate Tier 2 body fat.',
    ],
  },
};
