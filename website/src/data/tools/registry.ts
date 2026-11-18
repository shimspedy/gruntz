import type { Branch } from './types';

/**
 * Copy and SEO for every calculator page. Numbers never live here: anything numeric is
 * read from the data files so the page and the calculator cannot disagree.
 *
 * metaTitle ≤ 60 characters, description ≤ 155 (checked by tests/website-tools.test.cjs).
 */
export interface ToolEntry {
  branch: Branch;
  /** URL segment under /tools/<branch>/. */
  slug: string;
  kind: 'fitness' | 'bodycomp';
  /** For 'fitness': the FitnessTest id in src/data/tools/fitness/<branch>.ts. */
  testId?: string;
  name: string;
  metaTitle: string;
  description: string;
  h1: string;
  lede: string;
  faq: { q: string; a: string }[];
}

const tapeFaq = (who: string) => [
  { q: 'Is this an official body fat result?', a: `No. It is an estimate from the published formula. Only a trained measurer taping you under ${who} procedure, on the scheduled weigh-in, produces a result that counts.` },
  { q: 'Why does the calculator ask for height in whole inches?', a: 'The screening tables list whole inches, and measurers round height before they look it up. Enter your height the way it would be recorded.' },
  { q: 'What happens if I am over the screening weight?', a: 'Being over the table is not a failure on its own. It means your body fat is measured, and the body fat maximum for your age and sex decides the result.' },
];

export const tools: ToolEntry[] = [
  // ─── Fitness tests ────────────────────────────────────────────────────────────
  {
    branch: 'marine-corps', slug: 'pft-calculator', kind: 'fitness', testId: 'pft', name: 'Marine Corps PFT calculator',
    metaTitle: 'USMC PFT Calculator: Score Your Marine Corps PFT',
    description: 'Free Marine Corps PFT calculator. Enter pull-ups or push-ups, plank and run or row time to estimate your score and class from the current chart.',
    h1: 'Marine Corps PFT calculator',
    lede: 'Enter your results to estimate your Physical Fitness Test score and class from the published chart. The full chart for every age group is below.',
    faq: [
      { q: 'How is the Marine Corps PFT scored?', a: 'Each of the three events earns points from a chart that depends on your age group and sex. The three event scores add up to your total, and the total decides your class.' },
      { q: 'Can I do push-ups instead of pull-ups?', a: 'Yes, push-ups are an approved alternative, but they score lower at the top of the chart than pull-ups. Pick the event in the calculator to compare.' },
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published chart. Only the score recorded by your unit counts.' },
    ],
  },
  {
    branch: 'marine-corps', slug: 'cft-calculator', kind: 'fitness', testId: 'cft', name: 'Marine Corps CFT calculator',
    metaTitle: 'USMC CFT Calculator: Score Your Combat Fitness Test',
    description: 'Free Marine Corps CFT calculator. Enter your movement to contact, ammo can lift and maneuver under fire results to estimate your score and class.',
    h1: 'Marine Corps CFT calculator',
    lede: 'Estimate your Combat Fitness Test score from your three event results. The full chart for every age group is below.',
    faq: [
      { q: 'What events are in the CFT?', a: 'Movement to Contact (a timed 880-yard sprint), Ammunition Can Lifts (reps in two minutes) and Maneuver Under Fire (a timed course of crawls, carries, throws and sprints).' },
      { q: 'How do I enter my times?', a: 'Type minutes and seconds with a colon, for example 3:05.' },
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published chart. Only the score recorded by your unit counts.' },
    ],
  },
  {
    branch: 'army', slug: 'aft-calculator', kind: 'fitness', testId: 'aft', name: 'Army AFT calculator',
    metaTitle: 'Army AFT Calculator: Army Fitness Test Score',
    description: 'Free Army Fitness Test (AFT) calculator. Enter deadlift, push-ups, sprint-drag-carry, plank and 2-mile run to estimate your points by age and sex.',
    h1: 'Army Fitness Test (AFT) calculator',
    lede: 'Estimate your AFT points for each event and your total from the published scoring scales. The full scales are below.',
    faq: [
      { q: 'How many points do I need to pass the AFT?', a: 'Every soldier needs a minimum in each event, and a minimum total that depends on whether you are held to the combat or the general standard. The calculator applies both.' },
      { q: 'What is the difference between the combat and general standard?', a: 'Combat MOS soldiers are scored on a sex-neutral scale. Everyone else is scored on scales by age and sex.' },
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published scales. Only the score your unit records counts.' },
    ],
  },
  {
    branch: 'army', slug: 'aft-combat-calculator', kind: 'fitness', testId: 'aft-combat', name: 'Army AFT combat standard calculator',
    metaTitle: 'Army AFT Combat Standard Calculator',
    description: 'Free calculator for the Army Fitness Test combat standard, the sex-neutral scale for combat MOS soldiers. Estimate event points and your total.',
    h1: 'Army AFT combat standard calculator',
    lede: 'Estimate your score on the sex-neutral AFT combat standard used for combat MOS soldiers.',
    faq: [
      { q: 'Who is held to the AFT combat standard?', a: 'Soldiers in the combat MOSs the Army lists for the sex-neutral standard. Check the current list with your unit.' },
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published scales. Only the score your unit records counts.' },
    ],
  },
  {
    branch: 'navy', slug: 'prt-calculator', kind: 'fitness', testId: 'prt', name: 'Navy PRT calculator',
    metaTitle: 'Navy PRT Calculator: Physical Readiness Test Score',
    description: 'Free Navy PRT calculator. Enter push-ups, forearm plank and your 1.5-mile run or cardio option to estimate your score and category.',
    h1: 'Navy PRT calculator',
    lede: 'Estimate your Physical Readiness Test score and performance category from the published charts, including the cardio alternatives.',
    faq: [
      { q: 'Which cardio events can I choose?', a: 'The 1.5-mile run is the default. The approved alternatives that have their own charts are listed in the cardio menu of the calculator.' },
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published charts. Only the score your command records counts.' },
    ],
  },
  {
    branch: 'air-force', slug: 'pfa-calculator', kind: 'fitness', testId: 'pfa', name: 'Air Force PFA calculator',
    metaTitle: 'Air Force PFA Calculator: Fitness Assessment Score',
    description: 'Free Air Force PFA calculator. Enter your strength, core and cardio results to estimate component points and your composite from the current charts.',
    h1: 'Air Force fitness assessment calculator',
    lede: 'Estimate your Physical Fitness Assessment component points and composite score from the current charts.',
    faq: [
      { q: 'Which exercise options can I use?', a: 'Each component offers the approved options listed in the calculator. Pick the one you will test with to see its chart.' },
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published charts. Only the result recorded by your fitness assessment cell counts.' },
    ],
  },
  {
    branch: 'space-force', slug: 'pft-calculator', kind: 'fitness', testId: 'pft', name: 'Space Force fitness calculator',
    metaTitle: 'Space Force PT Test Calculator',
    description: 'Free Space Force fitness test calculator. Enter your results to estimate component points from the current published charts.',
    h1: 'Space Force fitness test calculator',
    lede: 'Estimate your Space Force fitness test points from the current published charts.',
    faq: [
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published charts. Only your recorded result counts.' },
    ],
  },
  {
    branch: 'coast-guard', slug: 'pft-calculator', kind: 'fitness', testId: 'pft', name: 'Coast Guard fitness calculator',
    metaTitle: 'Coast Guard PT Test Calculator',
    description: 'Free Coast Guard fitness test calculator. Enter your results to estimate your points from the current published charts.',
    h1: 'Coast Guard fitness test calculator',
    lede: 'Estimate your Coast Guard fitness test points from the current published charts.',
    faq: [
      { q: 'Is the score from this calculator official?', a: 'No. It is an estimate from the published charts. Only your recorded result counts.' },
    ],
  },

  // ─── Body composition ──────────────────────────────────────────────────────────
  {
    branch: 'marine-corps', slug: 'body-fat-calculator', kind: 'bodycomp', name: 'Marine Corps body composition',
    metaTitle: 'USMC Body Composition Calculator: Waist-to-Height',
    description: 'The Marine Corps replaced the height and weight table with a waist-to-height ratio in 2026. Check your ratio, then the tape test if you need it.',
    h1: 'Marine Corps body composition calculator',
    lede: 'Since January 2026 the Marine Corps screens with a waist-to-height ratio instead of the height and weight table. If you are over it, the tape test decides. This calculator does both.',
    faq: [
      { q: 'Does the Marine Corps still use the height and weight table?', a: 'No. Since 1 January 2026 the waist-to-height ratio is the screen. Weight is still recorded, but it does not decide whether you meet the standard.' },
      { q: 'What waist-to-height ratio do Marines need?', a: 'A ratio of 0.52 or lower, the same for men and women. Above that, your body fat is measured with the tape test and compared with the maximum for your age.' },
      { q: 'Do high PFT and CFT scores help?', a: 'Yes. Scoring 285 or more on both tests allows up to 26% body fat for men and 36% for women, and 250 or more on both adds one percent to your age maximum.' },
      { q: 'Is this an official result?', a: 'No. It is an estimate. Only the measurement taken under Marine Corps procedure counts.' },
    ],
  },
  {
    branch: 'army', slug: 'body-fat-calculator', kind: 'bodycomp', name: 'Army body composition (waist-to-height)',
    metaTitle: 'Army Body Composition Calculator: Waist-to-Height',
    description: 'The Army replaced the height/weight tables and tape test with a waist-to-height ratio in 2026. Check your ratio against the current ABCP standard.',
    h1: 'Army body composition calculator',
    lede: 'The Army now checks body composition with a waist-to-height ratio instead of the height and weight tables and the tape test. Check yours against the standard.',
    faq: [
      { q: 'Does the Army still use height and weight tables or the tape test?', a: 'No. A 2026 Army directive replaced the height/weight screening tables and the one-site tape test with a waist-to-height ratio for every Soldier.' },
      { q: 'How is the Army waist-to-height ratio worked out?', a: 'Waist divided by height. The result is kept to three decimal places by cutting off, not rounding, so 0.5499 counts as 0.549.' },
      { q: 'Does a high AFT score exempt me?', a: 'No. The earlier exemption for a high AFT score was rescinded, so every Soldier is measured.' },
      { q: 'Is this an official result?', a: 'No. It is an estimate. Only the measurement taken by your unit counts.' },
    ],
  },
  {
    branch: 'navy', slug: 'body-fat-calculator', kind: 'bodycomp', name: 'Navy body composition assessment',
    metaTitle: 'Navy BCA Calculator: Waist-to-Height and Body Fat',
    description: 'Navy Body Composition Assessment calculator. Check your waist-to-height ratio, then your body fat from the official table if you need it.',
    h1: 'Navy body composition assessment calculator',
    lede: 'The Navy BCA starts with your waist-to-height ratio. If that is too high, your body fat is read from the official table. This calculator does both steps.',
    faq: [
      { q: 'Does the Navy still use height and weight tables?', a: 'No. The height/weight screen was dropped. Every Sailor starts with the waist-to-height ratio.' },
      { q: 'What happens if my waist-to-height ratio is too high?', a: 'Your body fat is read from the official table using your height minus waist and your weight, and compared with the maximum for your sex.' },
      { q: 'How are height and waist rounded?', a: 'Height is rounded up to the nearest half inch and waist is rounded down to the nearest half inch, as the Navy guide states. The calculator applies both.' },
      { q: 'Is this an official result?', a: 'No. It is an estimate. Only the measurement taken by your command fitness leaders counts.' },
    ],
  },
  {
    branch: 'air-force', slug: 'body-composition-calculator', kind: 'bodycomp', name: 'Air Force body composition',
    metaTitle: 'Air Force Waist-to-Height Ratio Calculator',
    description: 'Air Force body composition calculator. Work out your waist-to-height ratio and compare it with the current standard.',
    h1: 'Air Force body composition calculator',
    lede: 'Work out your waist-to-height ratio and compare it with the current Air Force standard.',
    faq: [
      { q: 'How is waist-to-height ratio measured?', a: 'Your waist measurement divided by your height, both in inches. The fitness assessment cell measures both on test day.' },
      { q: 'Is this an official result?', a: 'No. It is an estimate. Only the measurement taken on test day counts.' },
    ],
  },
  {
    branch: 'space-force', slug: 'body-composition-calculator', kind: 'bodycomp', name: 'Space Force body composition',
    metaTitle: 'Space Force Body Composition Calculator',
    description: 'Space Force body composition calculator. Check the current standard and estimate your result before your assessment.',
    h1: 'Space Force body composition calculator',
    lede: 'Check your body composition against the current Space Force standard.',
    faq: [{ q: 'Is this an official result?', a: 'No. It is an estimate. Only your recorded measurement counts.' }],
  },
  {
    branch: 'coast-guard', slug: 'body-fat-calculator', kind: 'bodycomp', name: 'Coast Guard weight and body fat',
    metaTitle: 'Coast Guard Weight Standards + Body Fat Calculator',
    description: 'Coast Guard weight and body fat calculator. Check the screening weight for your height and estimate body fat against the maximum.',
    h1: 'Coast Guard weight and body fat calculator',
    lede: 'Check the Coast Guard screening weight for your height, then estimate your body fat.',
    faq: tapeFaq('Coast Guard'),
  },
];

export const toolPath = (t: Pick<ToolEntry, 'branch' | 'slug'>) => `/tools/${t.branch}/${t.slug}/`;
