import type { BodyCompStandard } from '../types';

/*
  U.S. Space Force body composition assessment (BCA), SPFMAN 36-2905 chapter 9
  (26 September 2025, incorporating Change 3 of 24 April 2026).

  The Space Force has its own standard in its own manual. The numbers match the Air Force
  (waist-to-height under 0.55, body fat limits of 26% / 36%), but unlike the Air Force the ratio
  is NOT scored for points: it is a separate pass/fail check, done twice a year.
*/

export const standard: BodyCompStandard = {
  branch: 'space-force',
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
        'Tier 1: waist / height, truncated to two decimals. Tier 2 tape fallback: circumference value = abdomen minus neck, read against height in the Space Force body fat table (published in MyFitness and MyFSS, not in the manual). A lab-grade method such as DEXA is used first where available.',
    },
    {
      sex: 'female',
      expression:
        'Tier 1: waist / height, truncated to two decimals. Tier 2 tape fallback: circumference value = waist plus hips/buttocks minus neck, read against height in the Space Force body fat table (published in MyFitness and MyFSS, not in the manual). A lab-grade method such as DEXA is used first where available.',
    },
  ],
  waistToHeightMax: 0.55,
  waistToHeightRule: { decimals: 2, truncate: true, strictlyBelow: true },
  notes: [
    'The standard is a waist-to-height ratio below 0.55. The ratio is truncated to two decimals: 39.5 in waist and 72 in height give 0.5486, recorded as 0.54.',
    'Categories: 0.49 or lower is Fit to Fight, 0.50-0.54 Health Maintenance, 0.55 or higher Health Concern.',
    'A ratio of 0.55 or higher leads to a body fat check: lab-grade (for example DEXA) where available, otherwise a 2-3 site tape method by a member of the same sex.',
    'Body fat must not exceed 26.0% for men or 36.0% for women. Above that is "Does Not Meet Standard" and leads to the Body Composition Improvement Program.',
    'Body composition is checked twice a year, every six months, for every Guardian, separately from the HPA and not scored in it.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      {
        label: 'SPFMAN 36-2905, Human Performance and Readiness, 26 Sep 2025, incorporating Change 3 (24 Apr 2026) (PDF)',
        url: 'https://static.e-publishing.af.mil/production/1/sf_s1/publication/spfman36-2905/spfman36-2905.pdf',
      },
      {
        label: 'SPFGM2026-36-02: Continuous Fitness Assessment within the Holistic Health Approach, 5 Feb 2026 (PDF)',
        url: 'https://static.e-publishing.af.mil/production/1/sf_s1/publication/spfgm2026-36-02/spfgm2026-36-02.pdf',
      },
    ],
    notes:
      'From SPFMAN 36-2905 paras 3.2.4, 9.2, 9.3 and Figure 9.1, and SPFGM2026-36-02 para 2.1.6. The body fat lookup table is held in MyFitness/MyFSS and is not published, so no lookupBodyFat is exported.',
    unverified: [
      'Figure 9.1 prints the ranges as "< 0.49", "0.50 - 0.54" and "> 0.55"; we read them as 0.49 or lower, 0.50-0.54 and 0.55 or higher, consistent with para 9.2 ("equal to or greater than 0.55 exceed the standard").',
      'Female tape sites: the manual describes summing two measurements and subtracting the neck; the site names were read as waist and hips/buttocks from the Attachment 7 instructions. Confirm the exact sites in SPFMAN 36-2905 Attachment 7.',
      'The Space Force body fat lookup table (MyFitness/MyFSS) was not available; obtain it before estimating Tier 2 body fat.',
    ],
  },
};
