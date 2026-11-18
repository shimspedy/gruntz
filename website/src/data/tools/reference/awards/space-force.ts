import type { Award, Provenance } from '../../types';

/**
 * U.S. Space Force awards in order of precedence, following SPFI 36-2903 (14 Aug 2025),
 * Table A3.1, "Ribbons Order of Precedence".
 *
 * That table also lists awards that only the Army, Navy, Marine Corps, Coast Guard or
 * Merchant Marine present. A Guardian wears those in the listed positions if they hold
 * them, but they are left out here. The table's category rows ("United States Nonmilitary
 * Decorations", "Foreign Decorations", "Foreign Service Medals") are also left out.
 * Every award kept here stays in the table's relative order. Ribbon stripes are omitted.
 */
type Row = [name: string, type: Award['type']];

const ROWS: Row[] = [
  // Personal decorations
  ['Medal of Honor', 'decoration'],
  ['Air Force Cross', 'decoration'],
  ['Defense Distinguished Service Medal', 'decoration'],
  ['Air Force Distinguished Service Medal', 'decoration'],
  ['Silver Star', 'decoration'],
  ['Defense Superior Service Medal', 'decoration'],
  ['Legion of Merit', 'decoration'],
  ['Distinguished Flying Cross', 'decoration'],
  ["Airman's Medal", 'decoration'],
  ['Bronze Star Medal', 'decoration'],
  ['Purple Heart', 'decoration'],
  ['Defense Meritorious Service Medal', 'decoration'],
  ['Meritorious Service Medal', 'decoration'],
  ['Air Medal', 'decoration'],
  ['Aerial Achievement Medal', 'decoration'],
  ['Joint Service Commendation Medal', 'decoration'],
  ['Air and Space Commendation Medal', 'decoration'],
  ['Joint Service Achievement Medal', 'decoration'],
  ['Air and Space Achievement Medal', 'decoration'],
  ['Combat Action Medal', 'decoration'],

  // Unit awards
  ['Distinguished/Presidential Unit Citation', 'unit'],
  ['Joint Meritorious Unit Award', 'unit'],
  ['Gallant Unit Citation', 'unit'],
  ['Meritorious Unit Award', 'unit'],
  ['Air and Space Outstanding Unit Award', 'unit'],
  ['Air and Space Organizational Excellence Award', 'unit'],

  // Service medals and ribbons, campaign medals
  ['Prisoner of War Medal', 'service'],
  ['Combat Readiness Medal', 'service'],
  ['Space Force Good Conduct Medal', 'service'],
  ['Air Force Good Conduct Medal', 'service'],
  ['Air Reserve Forces Meritorious Service Medal', 'service'],
  ['Outstanding Airman of the Year Ribbon', 'service'],
  ['Air and Space Recognition Ribbon', 'service'],
  ['China Service Medal', 'campaign'],
  ['American Defense Service Medal', 'service'],
  ['American Campaign Medal', 'campaign'],
  ['European-African-Middle Eastern Campaign Medal', 'campaign'],
  ['Asiatic-Pacific Campaign Medal', 'campaign'],
  ['World War II Victory Medal', 'campaign'],
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
  ['Korean Defense Service Medal', 'service'],
  ['Armed Forces Service Medal', 'service'],
  ['Humanitarian Service Medal', 'service'],
  ['Military Outstanding Volunteer Service Medal', 'service'],
  ['Remote Combat Effects Campaign Medal', 'campaign'],
  ['Air and Space Campaign Medal', 'campaign'],
  ['Nuclear Deterrence Operations Service Medal', 'service'],
  ['Air and Space Overseas Ribbon - Short Tour', 'service'],
  ['Air and Space Overseas Ribbon - Long Tour', 'service'],
  ['Air and Space Expeditionary Service Ribbon', 'service'],
  ['Air and Space Longevity Service Award', 'service'],
  ['Developmental Special Duty Ribbon', 'service'],
  ['Air Force Basic Military Training Instructor Ribbon', 'service'],
  ['Air Force Recruiter Ribbon', 'service'],
  ['Armed Forces Reserve Medal', 'service'],

  // Training ribbons and marksmanship
  ['USAF NCO PME Graduate Ribbon', 'training'],
  ['Basic Military Training Honor Graduate Ribbon', 'training'],
  ['Small Arms Expert Marksmanship Ribbon', 'marksmanship'],
  ['Air and Space Training Ribbon', 'training'],

  // Foreign and international awards
  ['Philippine Defense Ribbon', 'foreign'],
  ['Philippine Liberation Medal', 'foreign'],
  ['Philippine Independence Medal', 'foreign'],
  ['Philippine Presidential Unit Citation', 'foreign'],
  ['Republic of Korea Presidential Unit Citation', 'foreign'],
  ['Vietnam Gallantry Cross', 'foreign'],
  ['Vietnam Presidential Unit Citation', 'foreign'],
  ['Vietnam Wound Medal', 'foreign'],
  ['RVN Armed Forces Honor Medal', 'foreign'],
  ['Vietnam Gallantry Cross Unit Citation', 'foreign'],
  ['Vietnam Civil Actions Unit Citation', 'foreign'],
  ['United Nations Service Medal', 'foreign'],
  ['United Nations Medal', 'foreign'],
  ['NATO Meritorious Service Medal', 'foreign'],
  ['NATO Medal for Yugoslavia', 'foreign'],
  ['NATO Medal for Kosovo', 'foreign'],
  ['Article 5 NATO Medal - Eagle Assist', 'foreign'],
  ['Article 5 NATO Medal - Active Endeavour', 'foreign'],
  ['Non Article 5 NATO Medal - Balkans', 'foreign'],
  ['Non Article 5 NATO Medal - International Security Assistance Force', 'foreign'],
  ['Multinational Force and Observers Medal', 'foreign'],
  ['Inter-American Defense Board Medal', 'foreign'],
  ['Republic of Vietnam Campaign Medal', 'foreign'],
  ['Kuwait Liberation Medal (Kingdom of Saudi Arabia)', 'foreign'],
  ['Kuwait Liberation Medal (Government of Kuwait)', 'foreign'],
  ['Republic of Korea War Service Ribbon', 'foreign'],
];

export const awards: Award[] = ROWS.map(
  ([name, type], i): Award => ({ branch: 'space-force', order: i + 1, name, type }),
);

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'SPFI 36-2903, Dress and Personal Appearance of United States Space Force Personnel (14 Aug 2025), Table A3.1 and notes',
      url: 'https://static.e-publishing.af.mil/production/1/ussf/publication/spfi36-2903/spfi36-2903.pdf',
    },
    {
      label: 'AFPC, Decorations and Ribbons (Department of the Air Force chart)',
      url: 'https://www.afpc.af.mil/Career-Management/Decorations-and-Ribbons/',
    },
  ],
  notes:
    'Order follows SPFI 36-2903 Table A3.1, read across each row from left to right. ' +
    'The table names the second decoration "Distinguished Service Medal". Its Note 1 says the Air Force Distinguished Service Medal is worn ahead of the Army, Navy and Coast Guard versions, so it is listed here by that full name. ' +
    'Left out because only another service presents them: the Distinguished Service Cross (Army), Navy Cross, Coast Guard Cross, Soldier\'s Medal, Navy-Marine Corps Medal and Coast Guard Medal. Also the Army, Navy and Coast Guard commendation and achievement medals, the Navy Presidential Unit Citation, the Army Valorous Unit Award, and the Navy and Coast Guard unit and meritorious unit commendations. Also the Army Meritorious Unit Commendation, the Navy "E" Ribbon, the Army, Navy, Marine Corps and Coast Guard good conduct medals, and the reserve medals of other services. Also the Women\'s Army Corps Service Medal, Army Occupation Medal, Army Overseas Service Ribbon, Sea Service Deployment Ribbon, the Coast Guard service and marksmanship ribbons, the Army NCO Professional Development Ribbon, the Navy marksmanship ribbons, the Army Service Ribbon, the Coast Guard Reserve Honor Graduate Ribbon, and the Merchant Marine awards. ' +
    'The SPFI table shows only one Department of the Air Force marksmanship ribbon, the Small Arms Expert Marksmanship Ribbon. ' +
    'The Air Force Cross, Airman\'s Medal and Air Force-only ribbons appear because the SPFI table includes them for Guardians who earned them. ' +
    'Ribbon stripes are omitted: no Institute of Heraldry ribbon specification was read for this file.',
  unverified: [
    'Space Force-specific personal decorations (for example a Space Force Commendation or Achievement Medal): none appear in SPFI 36-2903 (Aug 2025) or on the AFPC chart, which show the shared Air and Space Commendation and Achievement Medals. Check DAFMAN 36-2806 and DAFI 36-2803 (Jan 2026) for any Space Force-only decoration created after Aug 2025, and add it in its stated precedence.',
    'Confirm against the current DAFMAN 36-2806 precedence table that nothing changed after SPFI 36-2903 was published on 14 Aug 2025. AFPC\'s chart currently matches it for the Department of the Air Force awards.',
    'The "type" for borderline items (e.g. Prisoner of War Medal, Combat Readiness Medal, Remote Combat Effects Campaign Medal, Outstanding Airman of the Year Ribbon) is our grouping. The SPFI table does not group awards by type.',
    'Ribbon stripes: add only after reading each ribbon\'s Institute of Heraldry (tioh.army.mil) specification.',
  ],
};
