import type { Award, Provenance } from '../../types';

/**
 * U.S. Navy awards in order of precedence as worn on the Navy uniform, checked 2026-11-18.
 *
 * Order follows the MyNavy HR "Navy Awards Precedence Chart" (U.S. Navy Uniform
 * Regulations, NAVPERS 15665J), which shows the awards most likely to be worn today.
 * Two awards missing from that chart are placed by Uniform Regulations article 5308
 * (campaign and service awards in order of precedence): the Navy Occupation Service Medal
 * (after the Navy Expeditionary Medal) and the Inherent Resolve Campaign Medal (after the
 * Iraq Campaign Medal).
 *
 * Not listed: non-military (civilian agency) decorations, which are worn in order of date
 * of acceptance rather than a fixed precedence (article 5307); Vietnam personal foreign
 * decorations and other foreign personal decorations, worn in order of receipt (5309.1);
 * Marine Corps-only awards; Merchant Marine awards; marksmanship badges (5310), which are
 * worn below the ribbons rather than in the ribbon order.
 *
 * `stripes` is omitted for every award: ribbon colors and widths were not checked against
 * The Institute of Heraldry.
 */
const n = 'navy' as const;

const names: [string, Award['type']][] = [
  // Military decorations (article 5305)
  ['Medal of Honor', 'decoration'],
  ['Navy Cross', 'decoration'],
  ['Defense Distinguished Service Medal', 'decoration'],
  ['Distinguished Service Medal', 'decoration'],
  ['Silver Star Medal', 'decoration'],
  ['Defense Superior Service Medal', 'decoration'],
  ['Legion of Merit', 'decoration'],
  ['Distinguished Flying Cross', 'decoration'],
  ['Navy and Marine Corps Medal', 'decoration'],
  ['Bronze Star Medal', 'decoration'],
  ['Purple Heart', 'decoration'],
  ['Defense Meritorious Service Medal', 'decoration'],
  ['Meritorious Service Medal', 'decoration'],
  ['Air Medal', 'decoration'],
  ['Joint Service Commendation Medal', 'decoration'],
  ['Navy and Marine Corps Commendation Medal', 'decoration'],
  ['Joint Service Achievement Medal', 'decoration'],
  ['Navy and Marine Corps Achievement Medal', 'decoration'],
  ['Combat Action Ribbon', 'decoration'],
  // Unit awards (article 5306)
  ['Presidential Unit Citation', 'unit'],
  ['Joint Meritorious Unit Award', 'unit'],
  ['Navy Unit Commendation', 'unit'],
  ['Meritorious Unit Commendation', 'unit'],
  ['Navy "E" Ribbon', 'unit'],
  // Campaign and service awards (article 5308)
  ['Prisoner of War Medal', 'service'],
  ['Navy Good Conduct Medal', 'service'],
  ['Navy Reserve Meritorious Service Medal', 'service'],
  ['Navy Fleet Marine Force Ribbon', 'service'],
  ['Navy Expeditionary Medal', 'campaign'],
  ['Navy Occupation Service Medal', 'campaign'],
  ['National Defense Service Medal', 'service'],
  ['Korean Service Medal', 'campaign'],
  ['Antarctica Service Medal', 'service'],
  ['Armed Forces Expeditionary Medal', 'campaign'],
  ['Vietnam Service Medal', 'campaign'],
  ['Southwest Asia Service Medal', 'campaign'],
  ['Kosovo Campaign Medal', 'campaign'],
  ['Afghanistan Campaign Medal', 'campaign'],
  ['Iraq Campaign Medal', 'campaign'],
  ['Inherent Resolve Campaign Medal', 'campaign'],
  ['Global War on Terrorism Expeditionary Medal', 'campaign'],
  ['Global War on Terrorism Service Medal', 'service'],
  ['Korea Defense Service Medal', 'service'],
  ['Armed Forces Service Medal', 'service'],
  ['Humanitarian Service Medal', 'service'],
  ['Military Outstanding Volunteer Service Medal', 'service'],
  ['Sea Service Deployment Ribbon', 'service'],
  ['Navy Arctic Service Ribbon', 'service'],
  ['Navy Reserve Sea Service Ribbon', 'service'],
  ['Navy and Marine Corps Overseas Service Ribbon', 'service'],
  ['Navy Recruiting Service Ribbon', 'service'],
  ['Navy Recruit Training Service Ribbon', 'training'],
  ['Navy Ceremonial Guard Service Ribbon', 'service'],
  ['Navy Basic Military Training Honor Graduate Ribbon', 'training'],
  ['Armed Forces Reserve Medal', 'service'],
  ['Navy Reserve Medal', 'service'],
  // Foreign unit awards, non-U.S. service awards, foreign service awards (article 5309)
  ['Philippine Republic Presidential Unit Citation', 'foreign'],
  ['Republic of Korea Presidential Unit Citation', 'foreign'],
  ['Republic of Vietnam Presidential Unit Citation', 'foreign'],
  ['Republic of Vietnam Gallantry Cross Unit Citation', 'foreign'],
  ['Republic of Vietnam Civil Actions Unit Citation', 'foreign'],
  ['United Nations Service Medal', 'foreign'],
  ['United Nations Medal', 'foreign'],
  ['NATO Medal', 'foreign'],
  ['Multinational Force and Observers Medal', 'foreign'],
  ['Inter-American Defense Board Medal', 'foreign'],
  ['Republic of Vietnam Campaign Medal', 'foreign'],
  ['Kuwait Liberation Medal (Kingdom of Saudi Arabia)', 'foreign'],
  ['Kuwait Liberation Medal (Kuwait)', 'foreign'],
  // Marksmanship ribbons (article 5310)
  ['Navy Rifle Marksmanship Ribbon', 'marksmanship'],
  ['Navy Pistol Marksmanship Ribbon', 'marksmanship'],
];

export const awards: Award[] = names.map(([name, type], i) => ({
  branch: n,
  order: i + 1,
  name,
  type,
}));

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'MyNavy HR: Navy Awards Precedence Chart (U.S. Navy Uniform Regulations, NAVPERS 15665J)',
      url: 'https://www.mynavyhr.navy.mil/References/US-Navy-Uniforms/Uniform-Regulations/Navy-Awards-Precedence/',
    },
    {
      label: 'U.S. Navy Uniform Regulations, Chapter 5, Articles 5301-5319 (Awards), incl. 5304-5310 precedence lists',
      url: 'https://www.mynavyhr.navy.mil/References/US-Navy-Uniforms/Uniform-Regulations/Chapter-5/5301-Awards/',
    },
  ],
  notes:
    'Order is the MyNavy HR precedence chart, with the Navy Occupation Service Medal and Inherent Resolve Campaign Medal ' +
    'inserted where Uniform Regulations article 5308 places them. Names follow the chart, using current "Navy Reserve" wording ' +
    '(article 5308 still says "Naval Reserve"). Civilian-agency decorations, foreign personal decorations (worn in order of receipt), ' +
    'Marine Corps-only awards, Merchant Marine awards and marksmanship badges are not listed. No ribbon stripes are given. ' +
    'SECNAV M-1650.1 (Navy and Marine Corps Awards Manual) could not be opened (manpower.marines.mil returned 403); the ' +
    'Uniform Regulations defer to it for precedence.',
  unverified: [
    'Coast Guard Special Operations Service Ribbon: article 5308 places it after the Navy Ceremonial Guard Service Ribbon and before the Armed Forces Reserve Medal, but the precedence chart puts the Navy Basic Military Training Honor Graduate Ribbon in that gap and omits the Coast Guard ribbon. Their relative order is not stated, so it is left out. Check SECNAV M-1650.1.',
    'Navy Basic Military Training Honor Graduate Ribbon appears on the precedence chart but not in article 5308; its position (after Ceremonial Guard, before Armed Forces Reserve Medal) is taken from the chart only.',
    'The precedence chart labels the recruit training award "Navy Recruit Training Service Medal"; article 5308 calls it "Navy Recruit Training Service Ribbon", which is used here.',
    'Ribbon stripes (colors and widths) are not filled. Take them from The Institute of Heraldry (tioh.army.mil) ribbon descriptions if wanted.',
    'Cross-check the whole order against SECNAV M-1650.1 (Aug 2019, still cited by 2026 NAVADMINs) before promoting the page.',
  ],
};
