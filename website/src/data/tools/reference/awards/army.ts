import type { Award, Provenance } from '../../types';

/**
 * U.S. Army awards in order of precedence, highest first.
 *
 * Order: U.S. military decorations (Army and DoD joint), U.S. unit awards, then the POW Medal,
 * Good Conduct Medal, Reserve Components Achievement Medal and the service medals and ribbons,
 * then foreign unit awards and non-U.S. service medals. Ribbon stripes are not included.
 */

type Row = [name: string, type: Award['type']];

const rows: Row[] = [
  // U.S. military decorations (DA Pam 670-1 para 22-5a, Army and DoD awards only; AR 600-8-22 table 3-1)
  ['Medal of Honor', 'decoration'],
  ['Distinguished Service Cross', 'decoration'],
  ['Defense Distinguished Service Medal', 'decoration'],
  ['Distinguished Service Medal', 'decoration'],
  ['Silver Star', 'decoration'],
  ['Defense Superior Service Medal', 'decoration'],
  ['Legion of Merit', 'decoration'],
  ['Distinguished Flying Cross', 'decoration'],
  ["Soldier's Medal", 'decoration'],
  ['Bronze Star Medal', 'decoration'],
  ['Purple Heart', 'decoration'],
  ['Defense Meritorious Service Medal', 'decoration'],
  ['Meritorious Service Medal', 'decoration'],
  ['Air Medal', 'decoration'],
  ['Joint Service Commendation Medal', 'decoration'],
  ['Army Commendation Medal', 'decoration'],
  ['Joint Service Achievement Medal', 'decoration'],
  ['Army Achievement Medal', 'decoration'],

  // U.S. unit awards (DA Pam 670-1 para 22-5b, Army and joint awards only)
  ['Presidential Unit Citation (Army)', 'unit'],
  ['Joint Meritorious Unit Award', 'unit'],
  ['Valorous Unit Award', 'unit'],
  ['Meritorious Unit Commendation (Army)', 'unit'],
  ['Army Superior Unit Award', 'unit'],

  // POW Medal, AGCM and ARCAM (AR 600-8-22 para B-2a)
  ['Prisoner of War Medal', 'service'],
  ['Army Good Conduct Medal', 'service'],
  ['Army Reserve Components Achievement Medal', 'service'],

  // U.S. service medals and ribbons (AR 600-8-22 para B-3a)
  ['World War I Victory Medal', 'campaign'],
  ['Army of Occupation of Germany Medal', 'service'],
  ['American Defense Service Medal', 'service'],
  ["Women's Army Corps Service Medal", 'service'],
  ['American Campaign Medal', 'campaign'],
  ['Asiatic-Pacific Campaign Medal', 'campaign'],
  ['European-African-Middle Eastern Campaign Medal', 'campaign'],
  ['World War II Victory Medal', 'service'],
  ['Army of Occupation Medal', 'service'],
  ['Medal for Humane Action', 'service'],
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
  ['Army Sea Duty Ribbon', 'service'],
  ['Armed Forces Reserve Medal', 'service'],
  ['Army Recruiting Ribbon', 'service'],
  ['Noncommissioned Officer Professional Development Ribbon', 'training'],
  ['Army Service Ribbon', 'training'],
  ['Overseas Service Ribbon', 'service'],
  ['Army Reserve Components Overseas Training Ribbon', 'training'],
  ['Coast Guard Special Operations Service Ribbon', 'service'],

  // Foreign unit awards (DA Pam 670-1 para 22-5h; AR 600-8-22 paras 9-21 to 9-25)
  ['Philippine Republic Presidential Unit Citation', 'foreign'],
  ['Republic of Korea Presidential Unit Citation', 'foreign'],
  ['Vietnam Presidential Unit Citation', 'foreign'],
  ['Republic of Vietnam Gallantry Cross Unit Citation', 'foreign'],
  ['Republic of Vietnam Civil Actions Unit Citation', 'foreign'],

  // Non-U.S. service medals and ribbons (AR 600-8-22 para B-3b)
  ['Philippine Defense Ribbon', 'foreign'],
  ['Philippine Liberation Ribbon', 'foreign'],
  ['Philippine Independence Ribbon', 'foreign'],
  ['United Nations Service Medal', 'foreign'],
  ['Inter-American Defense Board Medal', 'foreign'],
  ['United Nations Medal', 'foreign'],
  ['North Atlantic Treaty Organization Medal', 'foreign'],
  ['Multinational Force and Observers Medal', 'foreign'],
  ['Republic of Vietnam Campaign Medal', 'foreign'],
  ['Kuwait Liberation Medal (Saudi Arabia)', 'foreign'],
  ['Kuwait Liberation Medal (Government of Kuwait)', 'foreign'],
  ['Korean War Service Medal', 'foreign'],
];

export const awards: Award[] = rows.map(([name, type], i) => ({
  branch: 'army',
  order: i + 1,
  name,
  type,
}));

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'AR 600-8-22, Military Awards (11 May 2026): table 3-1 and appendix B',
      url: 'https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN46390-AR_600-8-22-000-WEB-1.pdf',
    },
    {
      label: 'DA Pam 670-1, Guide to the Wear and Appearance of Army Uniforms and Insignia (26 January 2021), para 22-5',
      url: 'https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN30948-PAM_670-1-000-WEB-1.pdf',
    },
    {
      label: 'Army Publishing Directorate: DA Pam 670-1 record',
      url: 'https://armypubs.army.mil/ProductMaps/PubForm/Details.aspx?PUB_ID=1021155',
    },
  ],
  notes:
    'Decorations follow DA Pam 670-1 para 22-5a, keeping only Army and DoD joint decorations; Navy, Air Force, Coast Guard and nonmilitary (federal agency) decorations are left out. ' +
    'Unit awards follow para 22-5b, keeping only Army and joint awards. They are worn apart from personal ribbons, but are listed here after the decorations. ' +
    'POW Medal, AGCM and ARCAM follow AR 600-8-22 para B-2a. Service medals and ribbons follow the 2026 AR 600-8-22 para B-3a, which adds the Army Recruiting Ribbon and lists the World War I Victory and Army of Occupation of Germany medals that the 2021 DA Pam 670-1 omits. ' +
    'Foreign unit awards (DA Pam 670-1 para 22-5h) come before non-U.S. service medals (AR 600-8-22 para B-3b) because both publications list them in that order. Foreign personal decorations are worn in the order received, so none are listed, and fourrageres and the Netherlands Orange Lanyard have no ribbon or precedence. ' +
    'Pre-World War I medals (AR 600-8-22 paras 5-11 to 5-22), the Atomic Veterans Commemorative Service Medal and the NATO Meritorious Service Medal are not on the precedence lists and are left out. ' +
    'The Army has no marksmanship ribbons; marksmanship is shown with badges. ' +
    'Ribbon stripes are left out on purpose. They can be added later from The Institute of Heraldry (tioh.army.mil) ribbon descriptions.',
  unverified: [
    'DA Pam 670-1 is still the 26 January 2021 edition. Check whether an update or Army Directive places the Army Recruiting Ribbon (new in AR 600-8-22, 2026) differently from para B-3a, which puts it between the Armed Forces Reserve Medal and the NCO Professional Development Ribbon.',
    'Name check: AR 600-8-22 (2026) para 2-28 says "Medal of Humane Action", while B-3a abbreviates it and DA Pam 670-1 says "Medal for Humane Action" (used here). Confirm which name to display.',
    'Placement of foreign unit awards relative to non-U.S. service medals is inferred from the order of the DA Pam 670-1 sections. Confirm against AR 670-1 if the page will show a combined wear order.',
  ],
};
