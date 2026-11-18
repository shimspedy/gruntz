/**
 * Semi-centralized promotion points to Sergeant (SGT) and Staff Sergeant (SSG),
 * Regular Army and U.S. Army Reserve, from AR 600-8-19 (6 March 2026, effective 6 April 2026),
 * chapter 3, section V. The Army National Guard runs its own system under chapter 6 and is
 * not modelled here.
 *
 * Tables are transcribed row by row. Ranges are inclusive [low, high, points].
 */
import type { Provenance } from '../types';

export type PromotionGrade = 'SGT' | 'SSG';

export interface PointCategory {
  id: 'military-training' | 'awards' | 'military-education' | 'civilian-education';
  name: string;
  /** Category ceiling by grade being competed for. */
  max: Record<PromotionGrade, number>;
  /** Sub-ceilings that sit inside the category ceiling. */
  parts: { name: string; max: Record<PromotionGrade, number>; rule: string }[];
}

/** One weapons scorecard: [hitsLow, hitsHigh, points], inclusive. Fewer hits than the last row earns 0. */
export interface WeaponsPointTable {
  form: string;
  weapons: string;
  rows: [number, number, number][];
}

export interface ArmyPromotionPoints {
  regulation: string;
  /** Grand total is the sum of the four category ceilings. */
  maxTotal: Record<PromotionGrade, number>;
  categories: PointCategory[];
  weapons: Record<PromotionGrade, WeaponsPointTable[]>;
  /** AFT total to promotion points, same for SGT and SSG: [scoreLow, scoreHigh, points]. Below 300 earns 0. */
  aftPoints: [number, number, number][];
  /** Extra points outside every ceiling. */
  bonuses: { name: string; points: number; rule: string }[];
  rules: string[];
  provenance: Provenance;
}

export const promotionPoints: ArmyPromotionPoints = {
  regulation: 'AR 600-8-19, Enlisted Promotions and Demotions (6 March 2026)',
  maxTotal: { SGT: 800, SSG: 800 },
  categories: [
    {
      id: 'military-training',
      name: 'Military training (weapons qualification and fitness test)',
      max: { SGT: 280, SSG: 230 },
      parts: [
        { name: 'Weapons qualification', max: { SGT: 160, SSG: 110 }, rule: 'Most recent qualification with the primary weapon assigned in DTMS. Scores older than 24 months earn nothing, and no designated primary weapon means zero.' },
        { name: 'Army Fitness Test', max: { SGT: 120, SSG: 120 }, rule: 'Last record AFT, converted with the AFT table. Every required event must be passed to earn any points.' },
      ],
    },
    {
      id: 'awards',
      name: 'Awards, decorations and achievements',
      max: { SGT: 145, SSG: 165 },
      parts: [
        { name: 'Certificates of Achievement (DA Form 2442)', max: { SGT: 20, SSG: 20 }, rule: '5 points each.' },
      ],
    },
    {
      id: 'military-education',
      name: 'Military education',
      max: { SGT: 240, SSG: 245 },
      parts: [
        { name: 'Resident military training', max: { SGT: 110, SSG: 115 }, rule: '4 points per week (40 training hours) of ATRRS-listed courses; Ranger, Special Forces and Sapper qualification courses earn 40.' },
        { name: 'Computer-based (nonresident) training', max: { SGT: 90, SSG: 90 }, rule: '1 point per 5 hours, whole courses only.' },
      ],
    },
    {
      id: 'civilian-education',
      name: 'Civilian education',
      max: { SGT: 135, SSG: 160 },
      parts: [
        { name: 'College credit', max: { SGT: 135, SSG: 160 }, rule: '2 points per semester hour from an accredited school (CLEP and DSST credit counts the same way).' },
        { name: 'Degree completed while serving', max: { SGT: 20, SSG: 20 }, rule: '20 points; for SSG the degree must be finished while a SGT.' },
        { name: 'Technical certifications', max: { SGT: 50, SSG: 50 }, rule: '10 points each, up to five.' },
        { name: 'Defense Language Proficiency Test', max: { SGT: 25, SSG: 25 }, rule: '25 points for 1/1 (listening/reading) or 1 on the oral test, within the last year.' },
      ],
    },
  ],
  weapons: {
    SGT: [
    { form: 'DA Form 7801 / DA Form 7822', weapons: 'M16 / M4 / M249 (rifle, carbine, automatic rifle)', rows: [[40, 40, 160], [39, 39, 153], [38, 38, 145], [37, 37, 138], [36, 36, 130], [35, 35, 123], [34, 34, 115], [33, 33, 108], [32, 32, 100], [31, 31, 93], [30, 30, 85], [29, 29, 78], [28, 28, 70], [27, 27, 63], [26, 26, 55], [25, 25, 48], [24, 24, 40], [23, 23, 33]] },
    { form: 'DA Form 7814', weapons: 'M9 / M17 / M18 pistol', rows: [[30, 30, 160], [29, 29, 146], [28, 28, 132], [27, 27, 118], [26, 26, 104], [25, 25, 90], [24, 24, 76], [23, 23, 62], [22, 22, 48], [21, 21, 33]] },
    { form: 'DA Form 7821', weapons: 'M9 / M17 / M18 pistol (validation)', rows: [[40, 40, 160], [39, 39, 152], [38, 38, 144], [37, 37, 136], [36, 36, 128], [35, 35, 120], [34, 34, 112], [33, 33, 104], [32, 32, 96], [31, 31, 88], [30, 30, 80], [29, 29, 72], [28, 28, 64], [27, 27, 56], [26, 26, 48], [25, 25, 40], [24, 24, 33]] },
    { form: 'DA Form 7811', weapons: 'M107 / M110 / M2010 sniper', rows: [[200, 200, 160], [198, 199, 153], [196, 197, 146], [193, 195, 139], [190, 192, 132], [187, 189, 125], [184, 186, 119], [181, 183, 112], [178, 180, 105], [175, 177, 98], [172, 174, 91], [169, 171, 85], [165, 168, 78], [161, 164, 71], [157, 160, 64], [153, 156, 57], [149, 152, 50], [145, 148, 44], [141, 144, 38], [139, 140, 33]] },
    { form: 'DA Form 7820-1', weapons: 'Law enforcement day pistol', rows: [[50, 50, 160], [49, 49, 152], [48, 48, 144], [47, 47, 135], [46, 46, 127], [45, 45, 119], [44, 44, 110], [43, 43, 102], [42, 42, 94], [41, 41, 85], [40, 40, 77], [39, 39, 69], [38, 38, 60], [37, 37, 52], [36, 36, 43], [35, 35, 33]] },
    ],
    SSG: [
    { form: 'DA Form 7801 / DA Form 7822', weapons: 'M16 / M4 / M249 (rifle, carbine, automatic rifle)', rows: [[40, 40, 110], [39, 39, 107], [38, 38, 104], [37, 37, 101], [36, 36, 98], [35, 35, 91], [34, 34, 84], [33, 33, 77], [32, 32, 70], [31, 31, 63], [30, 30, 56], [29, 29, 52], [28, 28, 48], [27, 27, 44], [26, 26, 40], [25, 25, 36], [24, 24, 32], [23, 23, 28]] },
    { form: 'DA Form 7814', weapons: 'M9 / M17 / M18 pistol', rows: [[30, 30, 110], [29, 29, 101], [28, 28, 92], [27, 27, 83], [26, 26, 74], [25, 25, 65], [24, 24, 56], [23, 23, 47], [22, 22, 38], [21, 21, 28]] },
    { form: 'DA Form 7821', weapons: 'M9 / M17 / M18 pistol (validation)', rows: [[40, 40, 110], [39, 39, 104], [38, 38, 99], [37, 37, 93], [36, 36, 88], [35, 35, 82], [34, 34, 77], [33, 33, 71], [32, 32, 65], [31, 31, 60], [30, 30, 55], [29, 29, 50], [28, 28, 46], [27, 27, 41], [26, 26, 37], [25, 25, 32], [24, 24, 28]] },
    { form: 'DA Form 7811', weapons: 'M107 / M110 / M2010 sniper', rows: [[200, 200, 110], [198, 199, 107], [196, 197, 102], [193, 195, 97], [190, 192, 92], [187, 189, 87], [184, 186, 82], [181, 183, 77], [178, 180, 72], [175, 177, 67], [172, 174, 62], [169, 171, 58], [165, 168, 54], [161, 164, 50], [157, 160, 46], [153, 156, 42], [149, 152, 38], [145, 148, 34], [141, 144, 30], [139, 140, 28]] },
    { form: 'DA Form 7820-1', weapons: 'Law enforcement day pistol', rows: [[50, 50, 110], [49, 49, 105], [48, 48, 100], [47, 47, 95], [46, 46, 88], [45, 45, 83], [44, 44, 76], [43, 43, 71], [42, 42, 64], [41, 41, 59], [40, 40, 52], [39, 39, 48], [38, 38, 42], [37, 37, 38], [36, 36, 32], [35, 35, 28]] },
    ],
  },
  aftPoints: [[500, 500, 120], [495, 499, 117], [490, 494, 114], [485, 489, 111], [480, 484, 108], [475, 479, 105], [470, 474, 102], [465, 469, 99], [460, 464, 96], [455, 459, 93], [450, 454, 90], [445, 449, 87], [440, 444, 84], [435, 439, 81], [430, 434, 78], [425, 429, 75], [420, 424, 72], [415, 419, 69], [410, 414, 66], [405, 409, 63], [400, 404, 60], [395, 399, 57], [390, 394, 54], [385, 389, 51], [380, 384, 48], [375, 379, 45], [370, 374, 42], [365, 369, 39], [360, 364, 36], [355, 359, 33], [350, 354, 30], [345, 349, 27], [340, 344, 24], [335, 339, 21], [330, 334, 18], [325, 329, 15], [320, 324, 12], [315, 319, 9], [310, 314, 6], [305, 309, 3], [300, 304, 1]],
  bonuses: [
    { name: 'Airborne advantage: parachutist in a paid parachute position', points: 20, rule: 'Added on top of the ceilings.' },
    { name: 'Airborne advantage: jumpmaster (ASI 5W) in a paid parachute position', points: 40, rule: 'Added on top of the ceilings.' },
  ],
  rules: [
    'Points are calculated automatically from the personnel record each month; fixes recorded late count from a later promotion month.',
    'Graduating BLC (for SGT) or ALC (for SSG) adds 150 points (para 3-17a), plus 20 for the commandant\'s list or 40 for distinguished honor or leadership graduate.',
    'Permanent profile: 60 points for each waived AFT event or passed alternate aerobic event, and the actual score for each event taken.',
    'Temporary profile: the last record AFT counts if it is no more than one year old (two years for pregnancy or postpartum, with a commander memorandum past one year).',
    'The last record AFT is used even if an earlier one within 12 months was higher.',
    'MOS 31D special agents are scored on hits from an internal practical pistol card: 90-100, 80-89 and 70-79 hits earn 160, 100 and 40 points for SGT, or 110, 75 and 50 for SSG.',
    'Higher badges in the same family (parachute, EOD, recruiter, diver, aviation, free fall, special operations diver, technician) replace the lower badge\'s points rather than adding to them.',
    'HQDA sets SGT and SSG cutoff scores monthly by MOS (RA and USAR AGR); an MOS with no requirement gets a cutoff of 798 (para 5-4d(1)(a)).',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      { label: 'AR 600-8-19, Enlisted Promotions and Demotions, 6 March 2026 (PDF)', url: 'https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN43646-AR_600-8-19-000-WEB-1.pdf' },
      { label: 'Army Publishing Directorate: AR 600-8-19 product page', url: 'https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=1030986' },
    ],
    notes:
      'Paras 3-15 to 3-18 and tables 3-2, 3-3 and 3-4. The four category ceilings add up to 800 for both grades. The award and badge point lists (tables 3-5 and 3-6) are not included here.',
    unverified: [
      'The 800-point total is our sum of the four published category ceilings; the regulation text we read does not print "800" as a single number.',
      'How the 150 BLC/ALC points sit against the 240/245 military education ceiling is not spelled out next to the ceiling; para 3-17a says they are added to existing points. Confirm before a calculator caps them.',
      'Monthly cutoff scores come from HRC and change every month; they are not modelled.',
    ],
  },
};
