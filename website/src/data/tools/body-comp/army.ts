/**
 * Army Body Composition Program (ABCP) standard as of November 2026.
 *
 * Army Directive 2026-13 made the waist-to-height ratio (WHtR) the Army's only body
 * composition measure. It ended the AR 600-9 height/weight screening tables, the one-site
 * abdominal tape test (AD 2023-11) and the high-AFT-score exemption (AD 2025-17). So the
 * height/weight table and body fat maximums are deliberately empty: publishing them would
 * tell Soldiers they can pass on a standard the Army no longer uses.
 */
import type { BodyCompStandard } from '../types';

export const standard: BodyCompStandard = {
  branch: 'army',
  heightWeight: [],
  bodyFatMax: [],
  method: 'waist-to-height',
  formula: [
    { sex: 'male', expression: 'WHtR = waist circumference at the navel (inches) / height (inches)' },
    { sex: 'female', expression: 'WHtR = waist circumference at the navel (inches) / height (inches)' },
  ],
  /** Pass is strictly below this value: 0.549 passes, 0.550 does not. */
  waistToHeightMax: 0.55,
  // AD 2026-13: kept to three decimals by cutting off, and it must be below 0.55.
  waistToHeightRule: { decimals: 3, truncate: true, strictlyBelow: true },
  notes: [
    'The standard is a ratio below 0.55. A ratio of exactly 0.55 or higher does not meet it.',
    'The ratio is kept to three decimal places and is cut off, not rounded: 0.5499 counts as 0.549 and passes.',
    'The same standard applies to men and women of every age.',
    'Every Soldier is measured at least twice per calendar year, and a commander can order a measurement at any time.',
    'If the first measurement does not meet the standard, a different team re-measures on the same duty day before any action is taken.',
    'Soldiers at 0.55 or above are flagged and enrolled in the ABCP until they meet the standard. Monthly progress checks were dropped.',
    'No other method, including the tape test, can be used to challenge a WHtR result.',
    'No AFT score exempts a Soldier. The earlier exemption for 465+ on the AFT (AD 2025-17) was rescinded.',
    'Units must leave at least 7 days between an AFT or CFT and a WHtR measurement, unless operations require otherwise.',
    'Existing medical exemptions for pregnant and postpartum Soldiers still apply.',
    'No Soldier is to be separated for failing WHtR until the Army finishes a 180-day review and issues further guidance.',
    'The height/weight screening tables and the one-site abdominal tape equation are no longer used, and DA Form 5501 was rescinded.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      { label: 'Army Directive 2026-13, Army Body Composition Program and Standards (PDF)', url: 'https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN47030-ARMY_DIR_2026-13-000-WEB-1.pdf' },
      { label: 'U.S. Army: ABCP and standards FAQ (PDF)', url: 'https://www.army.mil/e2/downloads/rv7/tyf/ABCP_FAQ.pdf' },
    ],
    notes:
      'AD 2026-13 says it takes effect immediately on publication. The army.mil FAQ gives 7 July 2026 as the effective date. AR 600-9 (16 July 2019) is still the listed regulation and is due to be revised within two years of the directive.',
    unverified: [
      'The army.mil FAQ names the policy "Army Directive 2026-06", but the armypubs PDF is titled Army Directive 2026-13. We cite 2026-13. Confirm the number on the armypubs directives list.',
      'The signature date is not in the extracted directive text. The FAQ effective date of 7 July 2026 is used. Confirm on armypubs.',
      'The 180-day review could change the 0.55 cutoff or add rules. Check for a follow-on directive before each release.',
    ],
  },
};
