/**
 * Rank titles, pay grades and insignia for all six services.
 * Insignia lines are short descriptions in our own words, not official specifications.
 * Senior enlisted advisor billets and five-star grades are separate entries with a note.
 */
import type { Branch, Provenance, Rank } from '../types';

type Cat = Rank['category'];
const r =
  (branch: Branch, category: Cat) =>
  (grade: string, title: string, abbr: string, insignia: string, note?: string): Rank =>
    note ? { branch, grade, title, abbr, category, insignia, note } : { branch, grade, title, abbr, category, insignia };

// Army, Air Force and Space Force share the same commissioned officer insignia.
const officerInsignia = {
  'O-1': 'One gold bar',
  'O-2': 'One silver bar',
  'O-3': 'Two silver bars joined',
  'O-4': 'Gold oak leaf',
  'O-5': 'Silver oak leaf',
  'O-6': 'Silver eagle',
  'O-7': 'One silver star',
  'O-8': 'Two silver stars',
  'O-9': 'Three silver stars',
  'O-10': 'Four silver stars',
} as const;

const generalOfficers = (branch: Branch, abbrs: [string, string, string, string, string, string, string, string, string, string]): Rank[] => {
  const o = r(branch, 'officer');
  const titles = ['Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General', 'Major General', 'Lieutenant General', 'General'];
  return titles.map((t, i) => {
    const g = `O-${i + 1}` as keyof typeof officerInsignia;
    return o(g, t, abbrs[i], officerInsignia[g]);
  });
};

// ─── Army ──────────────────────────────────────────────────────────────────────
const aE = r('army', 'enlisted');
const aW = r('army', 'warrant');
const army: Rank[] = [
  aE('E-1', 'Private', 'PVT', 'No insignia'),
  aE('E-2', 'Private', 'PV2', 'One chevron'),
  aE('E-3', 'Private First Class', 'PFC', 'One chevron above one rocker'),
  aE('E-4', 'Specialist', 'SPC', 'Eagle on a rounded shield', 'Same grade as Corporal but not a noncommissioned officer'),
  aE('E-4', 'Corporal', 'CPL', 'Two chevrons', 'Junior noncommissioned officer; outranks Specialist'),
  aE('E-5', 'Sergeant', 'SGT', 'Three chevrons'),
  aE('E-6', 'Staff Sergeant', 'SSG', 'Three chevrons above one rocker'),
  aE('E-7', 'Sergeant First Class', 'SFC', 'Three chevrons above two rockers'),
  aE('E-8', 'Master Sergeant', 'MSG', 'Three chevrons above three rockers'),
  aE('E-8', 'First Sergeant', '1SG', 'Three chevrons above three rockers with a diamond between', 'Senior enlisted leader of a company, battery or troop'),
  aE('E-9', 'Sergeant Major', 'SGM', 'Three chevrons above three rockers with a star between'),
  aE('E-9', 'Command Sergeant Major', 'CSM', 'Three chevrons above three rockers with a wreathed star between', 'Senior enlisted advisor to a battalion or higher commander'),
  aE('E-9', 'Sergeant Major of the Army', 'SMA', 'Three chevrons above three rockers with the Army eagle between two stars', 'Senior enlisted advisor billet: one Soldier, advises the Army Chief of Staff; flat basic pay'),
  aW('W-1', 'Warrant Officer 1', 'WO1', 'Silver bar with one black square'),
  aW('W-2', 'Chief Warrant Officer 2', 'CW2', 'Silver bar with two black squares'),
  aW('W-3', 'Chief Warrant Officer 3', 'CW3', 'Silver bar with three black squares'),
  aW('W-4', 'Chief Warrant Officer 4', 'CW4', 'Silver bar with four black squares'),
  aW('W-5', 'Chief Warrant Officer 5', 'CW5', 'Silver bar with a black stripe down the middle'),
  ...generalOfficers('army', ['2LT', '1LT', 'CPT', 'MAJ', 'LTC', 'COL', 'BG', 'MG', 'LTG', 'GEN']),
  r('army', 'officer')('O-11', 'General of the Army', 'GA', 'Five silver stars in a ring', 'Historical five-star wartime grade; last held by Omar Bradley (died 1981). Not a current grade.'),
];

// ─── Marine Corps ──────────────────────────────────────────────────────────────
const mE = r('marine-corps', 'enlisted');
const mW = r('marine-corps', 'warrant');
const marines: Rank[] = [
  mE('E-1', 'Private', 'Pvt', 'No insignia'),
  mE('E-2', 'Private First Class', 'PFC', 'One chevron'),
  mE('E-3', 'Lance Corporal', 'LCpl', 'One chevron above crossed rifles'),
  mE('E-4', 'Corporal', 'Cpl', 'Two chevrons above crossed rifles'),
  mE('E-5', 'Sergeant', 'Sgt', 'Three chevrons above crossed rifles'),
  mE('E-6', 'Staff Sergeant', 'SSgt', 'Three chevrons, crossed rifles, one rocker'),
  mE('E-7', 'Gunnery Sergeant', 'GySgt', 'Three chevrons, crossed rifles, two rockers'),
  mE('E-8', 'Master Sergeant', 'MSgt', 'Three chevrons, crossed rifles, three rockers', 'Technical track at E-8'),
  mE('E-8', 'First Sergeant', '1stSgt', 'Three chevrons above three rockers with a diamond between', 'Command track at E-8; senior enlisted Marine in a company'),
  mE('E-9', 'Master Gunnery Sergeant', 'MGySgt', 'Three chevrons above four rockers with a bursting bomb between', 'Technical track at E-9'),
  mE('E-9', 'Sergeant Major', 'SgtMaj', 'Three chevrons above four rockers with a star between', 'Command track at E-9; outranks Master Gunnery Sergeant'),
  mE('E-9', 'Sergeant Major of the Marine Corps', 'SMMC', 'Three chevrons above four rockers with the eagle, globe and anchor between two stars', 'Senior enlisted advisor billet: one Marine, advises the Commandant; flat basic pay'),
  mW('W-1', 'Warrant Officer', 'WO', 'Gold bar with scarlet enamel blocks'),
  mW('W-2', 'Chief Warrant Officer 2', 'CWO2', 'Gold bar with more scarlet enamel blocks'),
  mW('W-3', 'Chief Warrant Officer 3', 'CWO3', 'Silver bar with scarlet enamel blocks'),
  mW('W-4', 'Chief Warrant Officer 4', 'CWO4', 'Silver bar with more scarlet enamel blocks'),
  mW('W-5', 'Chief Warrant Officer 5', 'CWO5', 'Silver bar with a scarlet stripe down the middle'),
  ...generalOfficers('marine-corps', ['2ndLt', '1stLt', 'Capt', 'Maj', 'LtCol', 'Col', 'BGen', 'MajGen', 'LtGen', 'Gen']),
];

// ─── Navy ──────────────────────────────────────────────────────────────────────
const nE = r('navy', 'enlisted');
const nW = r('navy', 'warrant');
const nO = r('navy', 'officer');
const navy: Rank[] = [
  nE('E-1', 'Seaman Recruit', 'SR', 'One diagonal stripe', 'Also Fireman, Airman, Constructionman and Hospitalman Recruit by apprenticeship'),
  nE('E-2', 'Seaman Apprentice', 'SA', 'Two diagonal stripes', 'Also FA, AA, CA, HA by apprenticeship'),
  nE('E-3', 'Seaman', 'SN', 'Three diagonal stripes', 'Also FN, AN, CN, HN by apprenticeship'),
  nE('E-4', 'Petty Officer Third Class', 'PO3', 'Eagle and rating badge above one chevron', 'Abbreviation in practice is the rating plus 3, e.g. BM3'),
  nE('E-5', 'Petty Officer Second Class', 'PO2', 'Eagle and rating badge above two chevrons'),
  nE('E-6', 'Petty Officer First Class', 'PO1', 'Eagle and rating badge above three chevrons'),
  nE('E-7', 'Chief Petty Officer', 'CPO', 'Fouled anchor with "USN" (collar)'),
  nE('E-8', 'Senior Chief Petty Officer', 'SCPO', 'Fouled anchor with one star (collar)'),
  nE('E-9', 'Master Chief Petty Officer', 'MCPO', 'Fouled anchor with two stars (collar)'),
  nE('E-9', 'Command Master Chief Petty Officer', 'CMDCM', 'Fouled anchor with two stars and a command star (collar)', 'Senior enlisted leader of a ship, squadron or command'),
  nE('E-9', 'Fleet / Force Master Chief Petty Officer', 'FLTCM/FORCM', 'Fouled anchor with three stars (collar)', 'Senior enlisted leader of a fleet or force'),
  nE('E-9', 'Master Chief Petty Officer of the Navy', 'MCPON', 'Fouled anchor with three stars (collar)', 'Senior enlisted advisor billet: one Sailor, advises the Chief of Naval Operations; flat basic pay'),
  nW('W-1', 'Warrant Officer 1', 'WO1', 'Gold bar with blue enamel breaks', 'Used only for the cyber warrant officer program'),
  nW('W-2', 'Chief Warrant Officer 2', 'CWO2', 'Gold bar with blue enamel breaks'),
  nW('W-3', 'Chief Warrant Officer 3', 'CWO3', 'Silver bar with blue enamel breaks'),
  nW('W-4', 'Chief Warrant Officer 4', 'CWO4', 'Silver bar with blue enamel breaks'),
  nW('W-5', 'Chief Warrant Officer 5', 'CWO5', 'Silver bar with a blue stripe down the middle'),
  nO('O-1', 'Ensign', 'ENS', 'One gold bar'),
  nO('O-2', 'Lieutenant (junior grade)', 'LTJG', 'One silver bar'),
  nO('O-3', 'Lieutenant', 'LT', 'Two silver bars joined'),
  nO('O-4', 'Lieutenant Commander', 'LCDR', 'Gold oak leaf'),
  nO('O-5', 'Commander', 'CDR', 'Silver oak leaf'),
  nO('O-6', 'Captain', 'CAPT', 'Silver eagle'),
  nO('O-7', 'Rear Admiral (lower half)', 'RDML', 'One silver star'),
  nO('O-8', 'Rear Admiral', 'RADM', 'Two silver stars'),
  nO('O-9', 'Vice Admiral', 'VADM', 'Three silver stars'),
  nO('O-10', 'Admiral', 'ADM', 'Four silver stars'),
  nO('O-11', 'Fleet Admiral', 'FADM', 'Five silver stars in a ring', 'Historical five-star wartime grade; none held since 1981. Not a current grade.'),
];

// ─── Air Force ─────────────────────────────────────────────────────────────────
const fE = r('air-force', 'enlisted');
const fW = r('air-force', 'warrant');
const airForce: Rank[] = [
  fE('E-1', 'Airman Basic', 'AB', 'No insignia'),
  fE('E-2', 'Airman', 'Amn', 'One stripe around a star'),
  fE('E-3', 'Airman First Class', 'A1C', 'Two stripes around a star'),
  fE('E-4', 'Senior Airman', 'SrA', 'Three stripes around a star'),
  fE('E-5', 'Staff Sergeant', 'SSgt', 'Four stripes around a star'),
  fE('E-6', 'Technical Sergeant', 'TSgt', 'Five stripes around a star'),
  fE('E-7', 'Master Sergeant', 'MSgt', 'Five stripes below a star, one stripe above'),
  fE('E-8', 'Senior Master Sergeant', 'SMSgt', 'Five stripes below a star, two stripes above'),
  fE('E-9', 'Chief Master Sergeant', 'CMSgt', 'Five stripes below a star, three stripes above'),
  fE('E-9', 'Command Chief Master Sergeant', 'CCM', 'Chief stripes with a wreathed star in the center', 'Senior enlisted leader of a wing or higher command'),
  fE('E-9', 'Chief Master Sergeant of the Air Force', 'CMSAF', 'Chief stripes with the Air Force coat of arms in a wreath', 'Senior enlisted advisor billet: one Airman, advises the Chief of Staff; flat basic pay'),
  fW('W-1', 'Warrant Officer 1', 'WO1', 'Warrant officer bar (Air Force design)', 'Reintroduced in 2024 for cyber and IT career fields (17W, 17Y)'),
  fW('W-2', 'Chief Warrant Officer 2', 'CWO2', 'Warrant officer bar (Air Force design)', 'Reintroduced in 2024 for cyber and IT career fields'),
  fW('W-3', 'Chief Warrant Officer 3', 'CWO3', 'Warrant officer bar (Air Force design)', 'Authorized by policy; not yet reached by the first cohort'),
  fW('W-4', 'Chief Warrant Officer 4', 'CWO4', 'Warrant officer bar (Air Force design)', 'Authorized by policy; not yet reached by the first cohort'),
  fW('W-5', 'Chief Warrant Officer 5', 'CWO5', 'Warrant officer bar (Air Force design)', 'Authorized by policy; not yet reached by the first cohort'),
  ...generalOfficers('air-force', ['2d Lt', '1st Lt', 'Capt', 'Maj', 'Lt Col', 'Col', 'Brig Gen', 'Maj Gen', 'Lt Gen', 'Gen']),
  r('air-force', 'officer')('O-11', 'General of the Air Force', 'GAF', 'Five silver stars in a ring', 'Historical; held only by Henry "Hap" Arnold. Not a current grade.'),
];

// ─── Space Force ───────────────────────────────────────────────────────────────
const sE = r('space-force', 'enlisted');
const spaceForce: Rank[] = [
  sE('E-1', 'Specialist 1', 'Spc1', 'No insignia'),
  sE('E-2', 'Specialist 2', 'Spc2', 'Space Force junior enlisted insignia'),
  sE('E-3', 'Specialist 3', 'Spc3', 'Space Force junior enlisted insignia'),
  sE('E-4', 'Specialist 4', 'Spc4', 'Space Force junior enlisted insignia'),
  sE('E-5', 'Sergeant', 'Sgt', 'Space Force NCO insignia'),
  sE('E-6', 'Technical Sergeant', 'TSgt', 'Space Force NCO insignia'),
  sE('E-7', 'Master Sergeant', 'MSgt', 'Space Force senior NCO insignia'),
  sE('E-8', 'Senior Master Sergeant', 'SMSgt', 'Space Force senior NCO insignia'),
  sE('E-9', 'Chief Master Sergeant', 'CMSgt', 'Space Force senior NCO insignia'),
  sE('E-9', 'Chief Master Sergeant of the Space Force', 'CMSSF', 'Space Force senior NCO insignia (billet variant)', 'Senior enlisted advisor billet: one Guardian, advises the Chief of Space Operations; flat basic pay'),
  ...generalOfficers('space-force', ['2nd Lt', '1st Lt', 'Capt', 'Maj', 'Lt Col', 'Col', 'Brig Gen', 'Maj Gen', 'Lt Gen', 'Gen']),
];

// ─── Coast Guard ───────────────────────────────────────────────────────────────
const cE = r('coast-guard', 'enlisted');
const cW = r('coast-guard', 'warrant');
const cO = r('coast-guard', 'officer');
const coastGuard: Rank[] = [
  cE('E-1', 'Seaman Recruit', 'SR', 'One diagonal stripe', 'Also Fireman and Airman Recruit by apprenticeship'),
  cE('E-2', 'Seaman Apprentice', 'SA', 'Two diagonal stripes'),
  cE('E-3', 'Seaman', 'SN', 'Three diagonal stripes'),
  cE('E-4', 'Petty Officer Third Class', 'PO3', 'Eagle and rating badge above one chevron, with the Coast Guard shield'),
  cE('E-5', 'Petty Officer Second Class', 'PO2', 'Eagle and rating badge above two chevrons, with the Coast Guard shield'),
  cE('E-6', 'Petty Officer First Class', 'PO1', 'Eagle and rating badge above three chevrons, with the Coast Guard shield'),
  cE('E-7', 'Chief Petty Officer', 'CPO', 'Fouled anchor with the Coast Guard shield (collar)'),
  cE('E-8', 'Senior Chief Petty Officer', 'SCPO', 'Fouled anchor with shield and one star (collar)'),
  cE('E-9', 'Master Chief Petty Officer', 'MCPO', 'Fouled anchor with shield and two stars (collar)'),
  cE('E-9', 'Command Master Chief Petty Officer', 'CMC', 'Fouled anchor with shield, two stars and a command star (collar)', 'Senior enlisted leader of a sector, district or area'),
  cE('E-9', 'Master Chief Petty Officer of the Coast Guard', 'MCPOCG', 'Fouled anchor with shield and three stars (collar)', 'Senior enlisted advisor billet: one Coast Guardsman, advises the Commandant; flat basic pay'),
  cW('W-2', 'Chief Warrant Officer 2', 'CWO2', 'Gold bar with blue enamel breaks', 'The Coast Guard does not use W-1 or W-5'),
  cW('W-3', 'Chief Warrant Officer 3', 'CWO3', 'Silver bar with blue enamel breaks'),
  cW('W-4', 'Chief Warrant Officer 4', 'CWO4', 'Silver bar with blue enamel breaks'),
  cO('O-1', 'Ensign', 'ENS', 'One gold bar'),
  cO('O-2', 'Lieutenant (junior grade)', 'LTJG', 'One silver bar'),
  cO('O-3', 'Lieutenant', 'LT', 'Two silver bars joined'),
  cO('O-4', 'Lieutenant Commander', 'LCDR', 'Gold oak leaf'),
  cO('O-5', 'Commander', 'CDR', 'Silver oak leaf'),
  cO('O-6', 'Captain', 'CAPT', 'Silver eagle'),
  cO('O-7', 'Rear Admiral (lower half)', 'RDML', 'One silver star'),
  cO('O-8', 'Rear Admiral', 'RADM', 'Two silver stars'),
  cO('O-9', 'Vice Admiral', 'VADM', 'Three silver stars'),
  cO('O-10', 'Admiral', 'ADM', 'Four silver stars'),
];

export const ranks: Rank[] = [...army, ...marines, ...navy, ...airForce, ...spaceForce, ...coastGuard];

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    { label: 'Department of War, U.S. Military Rank Insignia', url: 'https://www.war.gov/Resources/Insignias/' },
    { label: 'DoD Armed Forces Ranks chart, enlisted (March 2025)', url: 'https://media.defense.gov/2025/Mar/06/2003659895/-1/-1/1/ARMED%20FORCES%20RANKS%20ENLISTED.PDF' },
    { label: 'DFAS Basic Pay: Enlisted, note 2 (senior enlisted advisor billets)', url: 'https://www.dfas.mil/Military-Members/payentitlements/Pay-Tables/Basic-Pay/EM/' },
    { label: 'Space Force releases service-specific rank names', url: 'https://www.spaceforce.mil/News/Article/2487814/space-force-releases-service-specific-rank-names/' },
    { label: 'Air Force to re-introduce warrant officer rank', url: 'https://www.af.mil/News/Article-Display/Article/3676887/air-force-to-re-introduce-warrant-officer-rank-other-major-changes/' },
    { label: 'AFGM 2026-36-2033, Air Force warrant officer guidance (W-1 by warrant, W-2 to W-5 by commission)', url: 'https://static.e-publishing.af.mil/production/1/af_a1/publication/afgm2026-36-2033/afgm2026-36-2033.pdf' },
    { label: 'SPFI 36-2903, Space Force dress and personal appearance', url: 'https://static.e-publishing.af.mil/production/1/ussf/publication/spfi36-2903/spfi36-2903.pdf' },
  ],
  notes:
    'Grades and titles current as of November 2026. Space Force has no warrant officers. The Air Force reintroduced warrant officers in 2024 for cyber and IT fields. ' +
    'The Coast Guard uses W-2 to W-4 only. Navy W-1 exists only for the cyber warrant program. O-11 five-star entries are historical and noted as such. ' +
    'The joint Senior Enlisted Advisor to the Chairman (SEAC) is an E-9 billet held by a member of any service and is not listed per branch.',
  unverified: [
    'Space Force enlisted insignia: the service-specific designs in SPFI 36-2903 were not read; the insignia lines for Spc2 through CMSSF are generic placeholders. Describe each from the SPFI figures.',
    'Air Force warrant officer insignia: the design was not confirmed (AFGM 2026-36-2033 says it is worn like lieutenant bars). Also confirm which W-grades are currently filled.',
    'Marine, Navy and Coast Guard warrant bar insignia: number of enamel blocks/breaks per grade was not checked against the uniform regulations; lines are kept general.',
    'Navy and Coast Guard E-9 billet collar devices (CMDCM, FLTCM/FORCM, MCPON, CMC, MCPOCG): confirm star and device counts against NAVPERS 15665 and the CG Uniform Regulations.',
    'Air Force Command Chief and CMSAF insignia details: confirm against DAFI 36-2903.',
  ],
};
