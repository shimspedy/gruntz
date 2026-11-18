import type { Provenance } from '../types';

/**
 * Stripe patterns of U.S. military service ribbons, for drawing a ribbon rack as flat SVG.
 *
 * Keys are award names copied exactly from reference/awards/*.ts so the rack builder can
 * join on `name`. Where two award files spell the same ribbon differently (e.g. "Silver Star"
 * and "Silver Star Medal"), both spellings point at the same pattern.
 *
 * Every stripe width comes from The Institute of Heraldry (TIOH) description of that ribbon,
 * converted to 1/32 inch (a standard ribbon is 1 3/8 in = 44 units). A width marked
 * "derived" was blank on the TIOH page (a lost fraction character) and is the only value that
 * makes the stated stripes total 1 3/8 inch. Devices (stars, frames, palms) are not stripes and
 * are not drawn; `source` says when a ribbon carries one.
 */

export interface RibbonPattern {
  /** Stripes left edge → right edge as [hex color, width in 1/32 inch]. A standard ribbon is 1 3/8 in = 44 units. */
  stripes: [string, number][];
  /** Official description used, short, e.g. 'TIOH: Navy and Marine Corps Achievement Medal'. */
  source: string;
}

/**
 * TIOH cable color number → hex. Hex values are screen approximations of the cable
 * colors, not official values.
 */
export const CABLE = {
  '67101': '#FFFFFF', // White
  '67103': '#FFC82E', // Air Force Yellow
  '67104': '#FFC72C', // Golden Yellow
  '67105': '#C9A227', // Old Gold
  '67107': '#F2C447', // Goldenlight
  '67108': '#FFD100', // Yellow
  '67109': '#F39A27', // Golden Orange
  '67110': '#FF7F00', // Orange
  '67111': '#D3202F', // Scarlet
  '67112': '#9E1B32', // Crimson
  '67113': '#8E2C23', // Brick Red
  '67115': '#4B2A73', // Purple
  '67117': '#4F8FD6', // Bluebird
  '67118': '#1F3F94', // Ultramarine Blue
  '67119': '#2F6EBA', // Brittany Blue
  '67121': '#00727F', // Teal Blue
  '67124': '#0B2A5B', // Flag Blue / National Flag Blue
  '67127': '#5C6B3A', // Mosstone Green
  '67128': '#009A49', // Emerald
  '67129': '#00843D', // Green
  '67133': '#5B5A33', // Olive Drab
  '67136': '#6B3E26', // Brown
  '67138': '#111111', // Black
  '67142': '#D9BC8C', // Chamois
  '67156': '#B22234', // Old Glory Red
  '67157': '#A3192E', // Soldier Red
  '67161': '#5B2C82', // Imperial Purple
  '67165': '#5BA4D9', // Grotto Blue
  '67172': '#3A6FB0', // Oriental Blue
  '67175': '#0C3B7F', // Imperial Blue
  '67178': '#2B2F6B', // Old Glory Blue
  '67179': '#1B2A4A', // Navy Blue
  '67188': '#2E6B30', // Primitive Green
  '67189': '#00A04A', // Irish Green
  '67190': '#2D6E5E', // Myrtle Green
  '67191': '#29523A', // Jungle Green
  '67196': '#7A4A2A', // Spicebrown
} as const;

/** Colors TIOH names on a ribbon without giving any cable number for that name. */
export const NAMED = {
  hunterGreen: '#355E3B',
  bottleGreen: '#006A4E',
  emeraldGreen: '#009A49',
} as const;

const C = CABLE;
const W = C['67101'];
const GY = C['67104'];
const SC = C['67111'];
const CR = C['67112'];
const BB = C['67117'];
const UB = C['67118'];
const OGR = C['67156'];
const OGB = C['67178'];
const BK = C['67138'];
const GR = C['67129'];
const MG = C['67190'];
const CH = C['67142'];
const GL = C['67107'];

const T = 'TIOH';
/** One third of 1/8 inch, for TIOH's "1/8 inch triparted" blue-white-red stripes. */
const TRI = 4 / 3;

const medalOfHonor: RibbonPattern = {
  stripes: [[BB, 44]],
  source: `${T}: Medal of Honor (Army). Bluebird 67117 service ribbon; its five White stars in an "M" are not drawn`,
};
const silverStar: RibbonPattern = {
  stripes: [[UB, 3], [W, 1.5], [UB, 7], [W, 7], [OGR, 7], [W, 7], [UB, 7], [W, 1.5], [UB, 3]],
  source: `${T}: Silver Star`,
};
const purpleHeart: RibbonPattern = {
  stripes: [[W, 4], [C['67115'], 36], [W, 4]],
  source: `${T}: Purple Heart`,
};
const aerialAchievement: RibbonPattern = {
  stripes: [[C['67124'], 4], [GY, 4], [BB, 28], [GY, 4], [C['67124'], 4]],
  source: `${T}: Air Force Aerial Achievement Medal`,
};
const koreaDefense: RibbonPattern = {
  stripes: [[GR, 8], [W, 2], [GR, 3], [GY, 2], [GR, 3], [UB, 8], [GR, 3], [GY, 2], [GR, 3], [W, 2], [GR, 8]],
  source: `${T}: Korea Defense Service Medal`,
};
const philippinePuc: RibbonPattern = {
  stripes: [[UB, 16], [W, 12], [OGR, 16]],
  source: `${T}: Philippine Presidential Unit Citation. Worn in a gold frame (not drawn)`,
};
const koreaPuc: RibbonPattern = {
  stripes: [
    [NAMED.hunterGreen, 6.5], [W, 0.5], [OGR, 0.5], [W, 0.5], [OGR, 0.5], [W, 0.5], [NAMED.hunterGreen, 0.5],
    [W, 25],
    [NAMED.hunterGreen, 0.5], [W, 0.5], [OGR, 0.5], [W, 0.5], [OGR, 0.5], [W, 0.5], [NAMED.hunterGreen, 6.5],
  ],
  source: `${T}: Republic of Korea Presidential Unit Citation. Centered taeguk and gold frame not drawn`,
};
const vietnamPuc: RibbonPattern = {
  stripes: [[GY, 14], [OGR, 4], [GY, 2], [OGR, 4], [GY, 2], [OGR, 4], [GY, 14]],
  source: `${T}: Republic of Vietnam Presidential Unit Citation. Worn in a gold frame (not drawn)`,
};
const civilActions: RibbonPattern = {
  stripes: [
    [NAMED.bottleGreen, 3], [SC, 6], [NAMED.bottleGreen, 11.5], [SC, 0.5], [NAMED.bottleGreen, 2],
    [SC, 0.5], [NAMED.bottleGreen, 11.5], [SC, 6], [NAMED.bottleGreen, 3],
  ],
  source: `${T}: Vietnam Civil Actions Unit Citation. Palm and gold frame not drawn`,
};

export const ribbonPatterns: Record<string, RibbonPattern> = {
  // ─── Personal decorations ──────────────────────────────────────────────────
  'Medal of Honor': medalOfHonor,
  'Distinguished Service Cross': {
    stripes: [[OGR, 4], [W, 2], [C['67175'], 32], [W, 2], [OGR, 4]],
    source: `${T}: Distinguished Service Cross`,
  },
  'Defense Distinguished Service Medal': {
    stripes: [[BB, 12], [GY, 8], [SC, 4], [GY, 8], [BB, 12]],
    source: `${T}: Defense Distinguished Service Medal`,
  },
  'Silver Star': silverStar,
  'Silver Star Medal': silverStar,
  'Defense Superior Service Medal': {
    stripes: [[GY, 6], [BB, 8], [W, 6], [SC, 4], [W, 6], [BB, 8], [GY, 6]],
    source: `${T}: Defense Superior Service Medal`,
  },
  'Legion of Merit': {
    stripes: [[W, 2], [CR, 40], [W, 2]],
    source: `${T}: Legion of Merit (Legionnaire; same service ribbon for all degrees)`,
  },
  "Soldier's Medal": {
    // 3/8 in blue each side; the 5/8 in center is 13 equal stripes, 7 White and 6 Red, White at both ends.
    stripes: [
      [UB, 12],
      ...Array.from({ length: 13 }, (_, i): [string, number] => [i % 2 === 0 ? W : OGR, 20 / 13]),
      [UB, 12],
    ],
    source: `${T}: Soldier's Medal (center is 13 equal White and Old Glory Red stripes)`,
  },
  "Airman's Medal": {
    stripes: [
      [C['67119'], 9],
      ...Array.from({ length: 13 }, (_, i): [string, number] => [i % 2 === 0 ? C['67103'] : UB, 2]),
      [C['67119'], 9],
    ],
    source: `${T}: Airman's Medal`,
  },
  'Bronze Star Medal': {
    stripes: [[W, 1], [SC, 18], [W, 1], [UB, 4], [W, 1], [SC, 18], [W, 1]],
    source: `${T}: Bronze Star Medal`,
  },
  'Purple Heart': purpleHeart,
  'Purple Heart Medal': purpleHeart,
  'Defense Meritorious Service Medal': {
    stripes: [[W, 2], [CR, 8], [W, 7], [BB, 2], [W, 2], [BB, 2], [W, 2], [BB, 2], [W, 7], [CR, 8], [W, 2]],
    source: `${T}: Defense Meritorious Service Medal`,
  },
  'Meritorious Service Medal': {
    stripes: [[CR, 4], [W, 8], [CR, 20], [W, 8], [CR, 4]],
    source: `${T}: Meritorious Service Medal`,
  },
  'Air Medal': {
    stripes: [[UB, 4], [C['67109'], 8], [UB, 20], [C['67109'], 8], [UB, 4]],
    source: `${T}: Air Medal`,
  },
  'Air Force Aerial Achievement Medal': aerialAchievement,
  'Aerial Achievement Medal': aerialAchievement,
  'Joint Service Commendation Medal': {
    stripes: [[BB, 8], [W, 4], [MG, 3], [W, 4], [MG, 6], [W, 4], [MG, 3], [W, 4], [BB, 8]],
    source: `${T}: Joint Service Commendation Medal`,
  },
  'Army Commendation Medal': {
    stripes: [
      [W, 3], [MG, 12.5], [W, 1], [MG, 2], [W, 1], [MG, 2], [W, 1],
      [MG, 2], [W, 1], [MG, 2], [W, 1], [MG, 12.5], [W, 3],
    ],
    source: `${T}: Army Commendation Medal`,
  },
  'Navy and Marine Corps Commendation Medal': {
    // Myrtle green field; a 1/4 in White stripe set 1/8 in inside each edge.
    stripes: [[MG, 4], [W, 8], [MG, 20], [W, 8], [MG, 4]],
    source: `${T}: Navy and Marine Corps Commendation Medal (center green width is the remainder of 1 3/8 in)`,
  },
  'Army Achievement Medal': {
    stripes: [[GR, 4], [W, 2], [GR, 4], [W, 2], [UB, 9], [W, 2], [UB, 9], [W, 2], [GR, 4], [W, 2], [GR, 4]],
    source: `${T}: Army Achievement Medal`,
  },

  // ─── Unit awards (frames not drawn) ────────────────────────────────────────
  'Presidential Unit Citation (Army)': {
    stripes: [[UB, 44]],
    source: `${T}: Army Presidential Unit Citation. Ultramarine Blue 67118 in a gold frame with laurel leaves (frame not drawn)`,
  },
  'Joint Meritorious Unit Award': {
    stripes: [[BB, 6], [GY, 4], [BB, 6], [W, 4], [CR, 4], [W, 4], [BB, 6], [GY, 4], [BB, 6]],
    source: `${T}: Joint Meritorious Unit Award. Gold frame with laurel leaves (frame not drawn)`,
  },
  'Valorous Unit Award': {
    stripes: [[OGR, 12], [UB, 2], [W, 0.5], [UB, 3], [W, 3], [OGR, 3], [W, 3], [UB, 3], [W, 0.5], [UB, 2], [OGR, 12]],
    source: `${T}: Army Valorous Unit Award. Gold frame with laurel leaves (frame not drawn)`,
  },
  'Meritorious Unit Commendation (Army)': {
    stripes: [[SC, 44]],
    source: `${T}: Army Meritorious Unit Commendation. Scarlet 67111 in a gold frame with laurel leaves (frame not drawn)`,
  },
  'Army Superior Unit Award': {
    stripes: [[SC, 17], [C['67103'], 1], [GR, 8], [C['67103'], 1], [SC, 17]],
    source: `${T}: Army Superior Unit Award. Gold frame with laurel leaves (frame not drawn)`,
  },

  // ─── Service and campaign ──────────────────────────────────────────────────
  'Prisoner of War Medal': {
    stripes: [[OGR, 2], [W, 3], [OGB, 2], [W, 4], [BK, 22], [W, 4], [OGB, 2], [W, 3], [OGR, 2]],
    source: `${T}: Prisoner of War Medal`,
  },
  'Army Good Conduct Medal': {
    stripes: [
      [C['67157'], 2], [W, 2], [C['67157'], 2], [W, 2], [C['67157'], 2], [W, 2],
      [C['67157'], 20],
      [W, 2], [C['67157'], 2], [W, 2], [C['67157'], 2], [W, 2], [C['67157'], 2],
    ],
    source: `${T}: Army Good Conduct Medal`,
  },
  'Army Reserve Components Achievement Medal': {
    stripes: [[C['67105'], 10], [UB, 4], [W, 2], [SC, 12], [W, 2], [UB, 4], [C['67105'], 10]],
    source: `${T}: Army Reserve Components Achievement Medal`,
  },
  'Army of Occupation of Germany Medal': {
    stripes: [[UB, 2], [SC, 2], [W, 6], [BK, 24], [W, 6], [SC, 2], [UB, 2]],
    source: `${T}: Army Occupation of Germany - World War I (Black center width derived)`,
  },
  'American Defense Service Medal': {
    stripes: [[GY, 6], [OGB, TRI], [W, TRI], [SC, TRI], [GY, 24], [SC, TRI], [W, TRI], [OGB, TRI], [GY, 6]],
    source: `${T}: American Defense Service Medal (center Golden Yellow width derived)`,
  },
  "Women's Army Corps Service Medal": {
    stripes: [[C['67105'], 4], [C['67127'], 36], [C['67105'], 4]],
    source: `${T}: Women's Army Corps Service Medal`,
  },
  'American Campaign Medal': {
    stripes: [
      [C['67172'], 6], [W, 2], [BK, 2], [SC, 2], [W, 2], [C['67172'], 6],
      [OGB, TRI], [W, TRI], [SC, TRI],
      [C['67172'], 6], [W, 2], [SC, 2], [BK, 2], [W, 2], [C['67172'], 6],
    ],
    source: `${T}: American Campaign Medal`,
  },
  'Asiatic-Pacific Campaign Medal': {
    stripes: [
      [C['67108'], 6], [W, 2], [SC, 2], [W, 2], [C['67108'], 8],
      [OGB, TRI], [W, TRI], [SC, TRI],
      [C['67108'], 8], [W, 2], [SC, 2], [W, 2], [C['67108'], 6],
    ],
    source: `${T}: Asiatic-Pacific Campaign Medal (the two inner Yellow widths derived)`,
  },
  'European-African-Middle Eastern Campaign Medal': {
    stripes: [
      [C['67136'], 6], [C['67189'], 2], [W, 2], [SC, 2], [C['67189'], 8],
      [OGB, TRI], [W, TRI], [SC, TRI],
      [C['67189'], 8], [W, 2], [BK, 2], [W, 2], [C['67136'], 6],
    ],
    source: `${T}: European-African-Middle Eastern Campaign Medal (the two inner Irish Green widths derived)`,
  },
  'Medal for Humane Action': {
    stripes: [[BK, 9], [W, 2], [C['67121'], 9], [W, 1.5], [SC, 1], [W, 1.5], [C['67121'], 9], [W, 2], [BK, 9]],
    source: `${T}: Medal for Humane Action`,
  },
  'National Defense Service Medal': {
    stripes: [[SC, 14], [W, 1], [OGB, 1], [W, 1], [SC, 1], [GY, 8], [SC, 1], [W, 1], [OGB, 1], [W, 1], [SC, 14]],
    source: `${T}: National Defense Service Medal (center Golden Yellow width derived)`,
  },
  'Korean Service Medal': {
    stripes: [[W, 1], [BB, 19], [W, 4], [BB, 19], [W, 1]],
    source: `${T}: Korean Service Medal`,
  },
  'Armed Forces Expeditionary Medal': {
    stripes: [
      [GR, 3], [GY, 3], [C['67196'], 3], [BK, 3], [BB, 7],
      [UB, 2], [W, 2], [SC, 2],
      [BB, 7], [BK, 3], [C['67196'], 3], [GY, 3], [GR, 3],
    ],
    source: `${T}: Armed Forces Expeditionary Medal`,
  },
  'Vietnam Service Medal': {
    stripes: [
      [C['67188'], 4], [C['67103'], 10], [OGR, 2], [C['67103'], 5], [OGR, 2],
      [C['67103'], 5], [OGR, 2], [C['67103'], 10], [C['67188'], 4],
    ],
    source: `${T}: Vietnam Service Medal`,
  },
  'Southwest Asia Service Medal': {
    stripes: [
      [BK, 2], [CH, 4], [OGB, 2], [W, 2], [OGR, 2], [CH, 6], [MG, 3], [BK, 2],
      [MG, 3], [CH, 6], [OGR, 2], [W, 2], [OGB, 2], [CH, 4], [BK, 2],
    ],
    source: `${T}: Southwest Asia Service Medal`,
  },
  'Kosovo Campaign Medal': {
    stripes: [[OGB, 16], [SC, 3.5], [W, 5], [OGB, 3.5], [SC, 16]],
    source: `${T}: Kosovo Campaign Medal`,
  },
  'Afghanistan Campaign Medal': {
    stripes: [
      [C['67128'], 2.5], [SC, 6], [BK, 4], [W, 7], [SC, 1], [W, 1], [OGB, 1],
      [W, 1], [SC, 1], [W, 7], [BK, 4], [SC, 6], [C['67128'], 2.5],
    ],
    source: `${T}: Afghanistan Campaign Medal`,
  },
  'Iraq Campaign Medal': {
    stripes: [[SC, 5], [W, 2], [GR, 1], [W, 2], [BK, 5], [CH, 14], [BK, 5], [W, 2], [GR, 1], [W, 2], [SC, 5]],
    source: `${T}: Iraq Campaign Medal`,
  },
  'Global War on Terrorism Expeditionary Medal': {
    stripes: [
      [BB, 5], [OGB, 3], [W, 2], [OGB, 3], [BB, 2], [GY, 2], [BB, 2], [SC, 6],
      [BB, 2], [GY, 2], [BB, 2], [OGB, 3], [W, 2], [OGB, 3], [BB, 5],
    ],
    source: `${T}: Global War on Terrorism Expeditionary Medal`,
  },
  'Global War on Terrorism Service Medal': {
    stripes: [[OGB, 5], [GY, 4], [SC, 4], [OGB, 2], [W, 2], [OGB, 10], [W, 2], [OGB, 2], [SC, 4], [GY, 4], [OGB, 5]],
    source: `${T}: Global War on Terrorism Service Medal`,
  },
  'Korea Defense Service Medal': koreaDefense,
  'Korean Defense Service Medal': koreaDefense,
  'Armed Forces Service Medal': {
    stripes: [
      [GL, 2], [C['67191'], 4], [GR, 4], [C['67127'], 4], [GL, 4], [BB, 8],
      [GL, 4], [C['67127'], 4], [GR, 4], [C['67191'], 4], [GL, 2],
    ],
    source: `${T}: Armed Forces Service Medal`,
  },
  'Humanitarian Service Medal': {
    stripes: [[C['67161'], 6], [W, 2], [BB, 10], [C['67124'], 8], [BB, 10], [W, 2], [C['67161'], 6]],
    source: `${T}: Humanitarian Service Medal`,
  },
  'Military Outstanding Volunteer Service Medal': {
    stripes: [[BB, 4], [GL, 4], [BB, 6], [GR, 2], [GL, 5], [GR, 2], [GL, 5], [GR, 2], [BB, 6], [GL, 4], [BB, 4]],
    source: `${T}: Military Outstanding Volunteer Service Medal`,
  },
  'Mexican Border Defense Medal': {
    stripes: [[NAMED.emeraldGreen, 14], [GY, 16], [NAMED.emeraldGreen, 14]],
    source: `${T}: Mexican Border Defense Medal (Emerald Green, Golden Yellow)`,
  },
  'Armed Forces Reserve Medal': {
    stripes: [
      [BB, 2], [CH, 1], [BB, 2], [CH, 1], [BB, 2], [CH, 12], [BB, 4],
      [CH, 12], [BB, 2], [CH, 1], [BB, 2], [CH, 1], [BB, 2],
    ],
    source: `${T}: Armed Forces Reserve Medal`,
  },

  // ─── Army ribbons ──────────────────────────────────────────────────────────
  'Army Sea Duty Ribbon': {
    stripes: [
      [C['67179'], 3], [SC, 5], [C['67105'], 5], [C['67121'], 3], [C['67165'], 4], [C['67157'], 1.5], [C['67105'], 1],
      [C['67157'], 1.5], [C['67165'], 4], [C['67121'], 3], [C['67105'], 5], [SC, 5], [C['67179'], 3],
    ],
    source: `${T}: Army Sea Duty Ribbon`,
  },
  'Noncommissioned Officer Professional Development Ribbon': {
    stripes: [[GR, 6], [C['67108'], 4], [GR, 6], [C['67108'], 2], [C['67124'], 8], [C['67108'], 2], [GR, 6], [C['67108'], 4], [GR, 6]],
    source: `${T}: NCO Professional Development Ribbon`,
  },
  'Army Service Ribbon': {
    stripes: [[SC, 7], [C['67110'], 5], [GY, 3], [C['67128'], 4], [UB, 6], [C['67128'], 4], [GY, 3], [C['67110'], 5], [SC, 7]],
    source: `${T}: Army Service Ribbon (center Ultramarine Blue width derived)`,
  },
  'Overseas Service Ribbon': {
    stripes: [[C['67124'], 6], [C['67165'], 10], [GY, 2], [C['67113'], 8], [GY, 2], [C['67165'], 10], [C['67124'], 6]],
    source: `${T}: Overseas Service Ribbon`,
  },

  // ─── Foreign unit awards (frames not drawn) ────────────────────────────────
  'Philippine Presidential Unit Citation': philippinePuc,
  'Philippine Republic Presidential Unit Citation': philippinePuc,
  'Republic of Korea Presidential Unit Citation': koreaPuc,
  'Korean Presidential Unit Citation': koreaPuc,
  'Vietnam Presidential Unit Citation': vietnamPuc,
  'Republic of Vietnam Presidential Unit Citation': vietnamPuc,
  'Vietnam Civil Actions Unit Citation': civilActions,
  'Republic of Vietnam Civil Actions Unit Citation': civilActions,
  'Republic of Vietnam Meritorious Unit Citation (Civil Actions Color)': civilActions,
};

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'The Institute of Heraldry: Decorations and Medals catalog (personal decorations, service medals, unit awards)',
      url: 'https://tioh.army.mil/Catalog/HeraldryList.aspx?CategoryId=5&grp=4&menu=Decorations%20and%20Medals',
    },
    {
      label: 'The Institute of Heraldry: unit award pages (e.g. Joint Meritorious Unit Award)',
      url: 'https://tioh.army.mil/Catalog/Heraldry.aspx?HeraldryId=15476&CategoryId=4&grp=4',
    },
  ],
  notes:
    'Every pattern is read from that ribbon\'s TIOH award page (Catalog/Heraldry.aspx?HeraldryId=…). Hex values approximate the TIOH cable colors (CABLE map) and are not official. ' +
    'Where a TIOH page names a color without its cable number (e.g. "Bluebird" on the DoD medals, "teal blue" on the Medal for Humane Action, the foreign unit citations), the cable number TIOH gives that same color name on its other pages is used. ' +
    'Hunter Green, Bottle Green and Emerald Green carry no cable number anywhere on TIOH and use the NAMED map. ' +
    'Widths marked "derived" in `source` were blank on the TIOH page (a lost fraction character) and are the single value that makes the listed stripes total 1 3/8 in: American Defense Service, Asiatic-Pacific, European-African-Middle Eastern, National Defense Service, Army Occupation of Germany (WWI) and the Army Service Ribbon. ' +
    '"1/8 inch triparted" blue-white-red stripes are split into three equal 4/3-unit stripes; the Soldier\'s Medal center is 13 equal stripes of 20/13 units, as TIOH states. ' +
    'Frames (unit awards), stars (Medal of Honor), the taeguk (ROK PUC) and palms are devices and are not drawn. ' +
    'Keys follow the award files, which spell some ribbons two ways; both spellings share one pattern. ' +
    'Badges (Marine Corps marksmanship and competition badges) have no ribbon and are not listed.',
  unverified: [
    '"Distinguished Service Medal": the Army list means the Army DSM, the Navy and Marine Corps lists mean the Navy DSM, so one key cannot hold both. TIOH gives the Army DSM fully (5/16 Scarlet, 1/16 Ultramarine Blue, 5/8 White, 1/16 Ultramarine Blue, 5/16 Scarlet); the Navy DSM page gives only Navy Blue with a 1/4 in Lemon Yellow center and no cable for Lemon Yellow. Rename one of the award entries (e.g. "Navy Distinguished Service Medal") and then add both.',
    'Same name clash: "Presidential Unit Citation" and "Meritorious Unit Commendation" in the Navy and Marine Corps lists are the Navy awards, which TIOH does not describe. Take them from SECNAV M-1650.1.',
    'TIOH page has widths that do not add to 1 3/8 in: Distinguished Flying Cross (stripes total 1 11/32 in); Navy and Marine Corps Medal (three 7/16 in stripes = 1 5/16 in). Check the MIL-DTL-11589 ribbon spec or the service manual.',
    'TIOH width lost and not derivable: Army of Occupation Medal (Black and Scarlet both blank, must total 1 in); Marine Corps Good Conduct Medal (center dark blue width blank, red field width not given).',
    'TIOH gives colors but no widths: Navy Cross, Joint Service Achievement Medal, Navy and Marine Corps Achievement Medal, Navy Good Conduct Medal, Navy Expeditionary Medal, Air Force Cross, Air Force Distinguished Service Medal, Air Force Commendation / Air and Space Commendation Medal, Air Force Achievement / Air and Space Achievement Medal, Air Force Combat Action Medal / Combat Action Medal, Combat Readiness Medal, Air Force Good Conduct Medal, Space Force Good Conduct Medal, Nuclear Deterrence Operations Service Medal, Remote Combat Effects Campaign Medal, Inherent Resolve Campaign Medal.',
    'TIOH describes a graded or rainbow pattern without stripe widths: World War I Victory Medal, World War II Victory Medal (outer 3/8 in rainbows), Antarctica Service Medal.',
    'Vietnam Gallantry Cross Unit Citation (all three spellings, incl. "Republic of Vietnam Meritorious Unit Citation (Gallantry Cross Color)"): TIOH gives 3/8 Red, 5/8 Golden Yellow, 3/8 Red but not the widths of the 16 red strands on the yellow; left out rather than drawn without them.',
    'Army Reserve Components Overseas Training Ribbon: TIOH says it is mounted with horizontal stripes (3/32 in Old Glory Red center, 3/64 in White each side, rest Ultramarine Blue), which this vertical-stripe model cannot draw.',
    'Not on the TIOH catalog pages read (take from SECNAV M-1650.1, DAFMAN 36-2806 or AR 600-8-22 and the MIL-DTL-11589 ribbon specs): Combat Action Ribbon, Navy Unit Commendation, Navy "E" Ribbon, Navy Reserve Meritorious Service Medal, Navy Fleet Marine Force Ribbon, Navy Occupation Service Medal, China Service Medal, Marine Corps Expeditionary Medal (page has no ribbon text), Selected Marine Corps Reserve Medal, Sea Service Deployment Ribbon, Navy Arctic Service Ribbon, Navy Reserve Sea Service Ribbon, Navy and Marine Corps Overseas Service Ribbon, the Navy and Marine Corps recruiting, recruit training, ceremonial guard, honor graduate, drill instructor, security guard, combat instructor and reserve ribbons, Navy Reserve Medal, Navy Rifle and Pistol Marksmanship Ribbons, Army Recruiting Ribbon, Coast Guard Special Operations Service Ribbon.',
    'Department of the Air Force unit awards and ribbons not on TIOH: Distinguished/Presidential Unit Citation, Gallant Unit Citation, Meritorious Unit Award, Air and Space Outstanding Unit Award, Air and Space Organizational Excellence Award, Air Reserve Forces Meritorious Service Medal, Outstanding Airman of the Year Ribbon, Air and Space Recognition Ribbon, Air and Space Campaign Medal, Air and Space Overseas Ribbon (Short and Long Tour), Air and Space Expeditionary Service Ribbon, Air and Space Longevity Service Award, Developmental Special Duty Ribbon, BMT Instructor, Recruiter, NCO PME Graduate, BMT Honor Graduate, Small Arms Expert Marksmanship and Air and Space Training Ribbons. Take from DAFMAN 36-2806 (blocked to scripted fetches).',
    'Foreign and international awards not on the TIOH pages read: Philippine Defense, Liberation and Independence ribbons/medals, United Nations Service Medal, United Nations Medal, NATO medals (all variants), Multinational Force and Observers Medal, Inter-American Defense Board Medal, Republic of Vietnam Campaign Medal, Vietnam Gallantry Cross, Vietnam Wound Medal, RVN Armed Forces Honor Medal, both Kuwait Liberation Medals (all spellings), Korean War Service Medal / Republic of Korea War Service Medal / Ribbon.',
    'Medal of Honor: the pattern is from the Army page (Bluebird 67117); the Navy and Air Force pages do not describe a service ribbon. Confirm all three share it.',
    'Mexican Border Defense Medal: TIOH says "Emerald Green" with no cable number; confirm it is Emerald 67128.',
  ],
};
