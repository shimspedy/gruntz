import type { Provenance } from '../types';

/*
  U.S. Space Force fitness requirements as of late 2026.

  The Space Force did not drop testing. Under SPFMAN 36-2905 (26 September 2025, incorporating
  Change 3 of 24 April 2026) every Guardian takes a scored Human Performance Assessment (HPA)
  twice a year, and SPFGM2026-36-02 (5 February 2026) confirms that this applies to Guardians in
  the Continuous Fitness Assessment (wearables) study too.

  The HPA is scored out of 100, but the Space Force keeps its age/sex point charts in myFitness
  and does not publish them in the manual or on spaceforce.mil. Its weights (60/20/20) differ
  from the Air Force PFRA (50/15/15 plus 20 for waist-to-height), so the Air Force charts cannot
  be reused. No points table is given here on purpose.
*/

export interface SpaceForceComponent {
  id: 'cardio' | 'strength' | 'endurance';
  label: string;
  maxPoints: number;
  /** Exercise options as listed in SPFMAN 36-2905 para 3.2. */
  options: string[];
  /** The manual requires a minimum in every component; the values live in the myFitness charts. */
  hasMinimum: true;
}

export interface SpaceForceProgram {
  branch: 'space-force';
  name: string;
  short: string;
  maxPoints: number;
  components: SpaceForceComponent[];
  passingComposite: number;
  /** Categories when every component is assessed. */
  categories: { label: string; min: number; max: number }[];
  /** Categories when one or more components are exempt. */
  partialCategories: { label: string; min: number; max: number }[];
  /** Times per year. */
  testsPerYear: number;
  rules: string[];
  /** 2 km walk: pass/fail cardio option for Guardians medically barred from the run and HAMR. Max time in seconds. */
  walkStandards: { sex: 'male' | 'female'; ageMin: number; ageMax: number; maxSeconds: number }[];
  /** True once the service publishes age/sex point charts that a calculator could use. */
  pointChartsPublished: boolean;
  provenance: Provenance;
}

export const standards: SpaceForceProgram = {
  branch: 'space-force',
  name: 'Human Performance Assessment',
  short: 'HPA',
  maxPoints: 100,
  components: [
    {
      id: 'cardio',
      label: 'Cardiorespiratory fitness',
      maxPoints: 60,
      options: ['2-mile run', '20 m HAMR shuttle', '2 km walk (pass/fail, only if not medically cleared to run)'],
      hasMinimum: true,
    },
    {
      id: 'strength',
      label: 'Muscular strength',
      maxPoints: 20,
      options: ['Push-ups (1 minute)', 'Hand-release push-ups (2 minutes)'],
      hasMinimum: true,
    },
    {
      id: 'endurance',
      label: 'Muscular endurance',
      maxPoints: 20,
      options: ['Sit-ups (1 minute)', 'Cross-leg reverse crunch (2 minutes)', 'Forearm plank (timed)'],
      hasMinimum: true,
    },
  ],
  passingComposite: 75,
  categories: [
    { label: 'Fit to Fight', min: 90, max: 100 },
    { label: 'Health Maintenance', min: 75, max: 89.9 },
    { label: 'Health Concern', min: 0, max: 74.9 },
  ],
  partialCategories: [
    { label: 'Passing', min: 75, max: 100 },
    { label: 'Health Concern', min: 0, max: 74.9 },
  ],
  testsPerYear: 2,
  rules: [
    'A Guardian must reach the minimum in each component and a composite of 75 or more out of 100. Missing any component minimum is Health Concern whatever the total.',
    'Every Guardian takes two HPAs a year. The 2-mile run must be the cardio event in at least one of the two.',
    'Body composition is not part of the HPA score. It is checked separately, twice a year, by waist-to-height ratio (see body-comp/space-force.ts).',
    'A score below 75 places the Guardian in the Fitness Improvement Program, whether or not they take part in the wearables study.',
    'Guardians in the Continuous Fitness Assessment (CFA PRIME) wearables study still take the HPA twice a year. An HPA taken to qualify for the study must use the 2-mile run.',
    'An HPA can be taken as a diagnostic (non-attributional) test if all components are done together before the 16th of the due month, up to three diagnostics in 365 days.',
    'The 2 km walk earns no points and cannot lead to Fit to Fight or Health Maintenance; the composite is then worked out from the other components as if cardio were exempt.',
  ],
  walkStandards: [
    { sex: 'male', ageMin: 17, ageMax: 29, maxSeconds: 16 * 60 + 16 },
    { sex: 'male', ageMin: 30, ageMax: 39, maxSeconds: 16 * 60 + 18 },
    { sex: 'male', ageMin: 40, ageMax: 49, maxSeconds: 16 * 60 + 23 },
    { sex: 'male', ageMin: 50, ageMax: 59, maxSeconds: 16 * 60 + 40 },
    { sex: 'male', ageMin: 60, ageMax: 99, maxSeconds: 16 * 60 + 58 },
    { sex: 'female', ageMin: 17, ageMax: 29, maxSeconds: 17 * 60 + 22 },
    { sex: 'female', ageMin: 30, ageMax: 39, maxSeconds: 17 * 60 + 28 },
    { sex: 'female', ageMin: 40, ageMax: 49, maxSeconds: 17 * 60 + 49 },
    { sex: 'female', ageMin: 50, ageMax: 59, maxSeconds: 18 * 60 + 11 },
    { sex: 'female', ageMin: 60, ageMax: 99, maxSeconds: 18 * 60 + 53 },
  ],
  pointChartsPublished: false,
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
      {
        label: 'U.S. Space Force: further guidance on physical fitness',
        url: 'https://www.spaceforce.mil/News/Article-Display/Article/4371955/space-force-publishes-further-guidance-on-physical-fitness/',
      },
    ],
    notes:
      'Component weights (60/20/20), the 75 composite, categories, the run-once-a-year rule and walk times are from SPFMAN 36-2905 Change 3, paras 3.1, 3.2, 3.6 and 3.7 and Table 3.1. ' +
      'Twice-yearly HPAs for all Guardians, including wearables-study participants, are from SPFGM2026-36-02 para 2.1.5. ' +
      'The point charts are kept in myFitness and are not published, so this file has no scoring table and the site should not offer an HPA points calculator.',
    unverified: [
      'HPA point charts (per age and sex, per exercise) and the component minimums: not published on spaceforce.mil or in SPFMAN 36-2905. Obtain the official chart from the Space Force (myFitness) before building any HPA calculator.',
      'Age groups used by the HPA charts: unknown for the same reason. Walk standards use the manual\'s groups (under 30, 30-39, 40-49, 50-59, 60+).',
      'SPFGM2026-36-02 says it lapses after one year (February 2027) unless replaced. Re-check in early 2027.',
      'Composite rounding at category edges (e.g. 89.95): the manual gives 75-89.9 and 90-100 without saying how in-between values are handled.',
    ],
  },
};
