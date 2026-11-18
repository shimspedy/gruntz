import type { Job, Provenance } from '../../types';

/**
 * U.S. Navy enlisted ratings, chief warrant officer designators and officer designators,
 * checked 2026-11-18.
 *
 * Enlisted: the rating chapters listed on the NEOCS Manual Volume I page (NAVPERS 18068F,
 * Change 108, Oct 2026). `field` is the occupational community from Appendix B
 * ("Occupational Communities, Career Fields, and Associated Ratings"). General
 * apprenticeships (AN, CN, FN, HN, SN) and E-9 compression ratings (AB, AF, AV, CB, CU, GS)
 * are not ratings in their own right and are left out.
 *
 * Officer and warrant: NOOCS Manual Volume I, Part A (NAVPERS 15839I, Change 97,
 * Oct 2026). Codes use the manual's "X" for the fourth digit (component/status).
 * Student, in-training, prospective-staff-corps and flag-only designators are left out.
 * Limited Duty Officers are commissioned officers, so they are 'officer'; Chief Warrant
 * Officers (7xxx) are 'warrant'. `field` is the manual's section heading.
 */
const navy = 'navy' as const;

const enlisted = (code: string, title: string, field: string): Job => ({
  branch: navy,
  code,
  title,
  field,
  category: 'enlisted',
});

const officer = (code: string, title: string, field: string): Job => ({
  branch: navy,
  code,
  title,
  field,
  category: 'officer',
});

const warrant = (code: string, title: string, field: string): Job => ({
  branch: navy,
  code,
  title,
  field,
  category: 'warrant',
});

const AVN = 'Aviation';
const EXEC = 'Executive Support';
const IW = 'Information Warfare';
const MED = 'Medical';
const NUC = 'Nuclear';
const SEABEE = 'Seabees';
const SEC = 'Security';
const SPECOPS = 'Special Operations';
const SPECWAR = 'Special Warfare';
const SUB = 'Submarine';
const SUP = 'Supply';
const SURF = 'Surface';
const AI = 'Artificial Intelligence';

export const jobs: Job[] = [
  // ─── Enlisted ratings ──────────────────────────────────────────────────────
  // Aviation
  enlisted('ABE', "Aviation Boatswain's Mate (Equipment)", AVN),
  enlisted('ABF', "Aviation Boatswain's Mate (Fuels)", AVN),
  enlisted('ABH', "Aviation Boatswain's Mate (Handling)", AVN),
  enlisted('AC', 'Air Traffic Controller', AVN),
  enlisted('AD', "Aviation Machinist's Mate", AVN),
  enlisted('AE', "Aviation Electrician's Mate", AVN),
  enlisted('AM', 'Aviation Structural Mechanic', AVN),
  enlisted('AME', 'Aviation Structural Mechanic (Safety Equipment)', AVN),
  enlisted('AO', 'Aviation Ordnanceman', AVN),
  enlisted('AS', 'Aviation Support Technician', AVN),
  enlisted('AT', 'Aviation Electronics Technician', AVN),
  enlisted('AWF', 'Naval Aircrewman (Mechanical)', AVN),
  enlisted('AWO', 'Naval Aircrewman (Operator)', AVN),
  enlisted('AWR', 'Naval Aircrewman (Tactical Helicopter)', AVN),
  enlisted('AWS', 'Naval Aircrewman (Helicopter)', AVN),
  enlisted('AWV', 'Naval Aircrewman (Avionics)', AVN),
  enlisted('AZ', 'Aviation Maintenance Administrationman', AVN),
  enlisted('PR', 'Aircrew Survival Equipmentman', AVN),
  // Executive Support
  enlisted('LN', 'Legalman', EXEC),
  enlisted('MC', 'Mass Communication Specialist', EXEC),
  enlisted('MU', 'Musician', EXEC),
  enlisted('NCC', 'Navy Counselor (Counselor)', EXEC),
  enlisted('NCR', 'Navy Counselor (Recruiter)', EXEC),
  enlisted('PS', 'Personnel Specialist', EXEC),
  enlisted('RP', 'Religious Program Specialist', EXEC),
  enlisted('YN', 'Yeoman', EXEC),
  // Information Warfare
  enlisted('CTI', 'Cryptologic Technician (Interpretive)', IW),
  enlisted('CTM', 'Cryptologic Technician (Maintenance)', IW),
  enlisted('CTR', 'Cryptologic Technician (Collection)', IW),
  enlisted('CTT', 'Cryptologic Technician (Technical)', IW),
  enlisted('CWT', 'Cyber Warfare Technician', IW),
  enlisted('IT', 'Information Systems Technician', IW),
  enlisted('AG', "Aerographer's Mate", IW),
  enlisted('IS', 'Intelligence Specialist', IW),
  // Medical
  enlisted('HM', 'Hospital Corpsman', MED),
  // Nuclear
  enlisted('EMN', "Electrician's Mate (Nuclear Power)", NUC),
  enlisted('ETN', 'Electronics Technician (Nuclear Power)', NUC),
  enlisted('MMN', "Machinist's Mate (Nuclear Power)", NUC),
  // Seabees
  enlisted('BU', 'Builder', SEABEE),
  enlisted('CE', 'Construction Electrician', SEABEE),
  enlisted('CM', 'Construction Mechanic', SEABEE),
  enlisted('EA', 'Engineering Aide', SEABEE),
  enlisted('EO', 'Equipment Operator', SEABEE),
  enlisted('SW', 'Steelworker', SEABEE),
  enlisted('UT', 'Utilitiesman', SEABEE),
  // Security
  enlisted('MA', 'Master-at-Arms', SEC),
  // Special Operations
  enlisted('EOD', 'Explosive Ordnance Disposal Technician', SPECOPS),
  enlisted('ND', 'Navy Diver', SPECOPS),
  // Special Warfare
  enlisted('SB', 'Special Warfare Boat Operator', SPECWAR),
  enlisted('SO', 'Special Warfare Operator', SPECWAR),
  // Submarine
  enlisted('MMA', "Machinist's Mate (Submarine Auxiliary)", SUB),
  enlisted('TM', "Torpedoman's Mate", SUB),
  enlisted('CSS', 'Culinary Specialist (Submarine)', SUB),
  enlisted('LSS', 'Logistics Specialist (Submarine)', SUB),
  enlisted('YNS', 'Yeoman (Submarine)', SUB),
  enlisted('ETV', 'Electronics Technician (Submarine, Navigation)', SUB),
  enlisted('FT', 'Fire Control Technician', SUB),
  enlisted('ITE', 'Information Systems Technician (Submarine, Electronic Warfare)', SUB),
  enlisted('ITN', 'Information Systems Technician (Submarine, Network)', SUB),
  enlisted('ITR', 'Information Systems Technician (Submarine, Communications)', SUB),
  enlisted('MT', 'Missile Technician', SUB),
  enlisted('STS', 'Sonar Technician (Submarine)', SUB),
  // Supply
  enlisted('CS', 'Culinary Specialist', SUP),
  enlisted('LS', 'Logistics Specialist', SUP),
  enlisted('RS', 'Retail Services Specialist', SUP),
  // Surface
  enlisted('DC', 'Damage Controlman', SURF),
  enlisted('EM', "Electrician's Mate", SURF),
  enlisted('EN', 'Engineman', SURF),
  enlisted('GSE', 'Gas Turbine Systems Technician (Electrical)', SURF),
  enlisted('GSM', 'Gas Turbine Systems Technician (Mechanical)', SURF),
  enlisted('HT', 'Hull Maintenance Technician', SURF),
  enlisted('MM', "Machinist's Mate", SURF),
  enlisted('MR', 'Machinery Repairman', SURF),
  enlisted('ET', 'Electronics Technician', SURF),
  enlisted('FC', 'Fire Controlman', SURF),
  enlisted('FCA', 'Fire Controlman (Aegis)', SURF),
  enlisted('GM', "Gunner's Mate", SURF),
  enlisted('IC', 'Interior Communications Electrician', SURF),
  enlisted('STG', 'Sonar Technician (Surface)', SURF),
  enlisted('BM', "Boatswain's Mate", SURF),
  enlisted('MN', 'Mineman', SURF),
  enlisted('OS', 'Operations Specialist', SURF),
  enlisted('QM', 'Quartermaster', SURF),
  // Artificial Intelligence
  enlisted('RW', 'Robotics Warfare Specialist', AI),

  // ─── Officer designators ───────────────────────────────────────────────────
  officer('110X', 'Unrestricted Line Officer (Fleet Support)', 'Unrestricted Line'),
  officer('111X', 'Surface Warfare Officer', 'Unrestricted Line'),
  officer('112X', 'Submarine Warfare Officer', 'Unrestricted Line'),
  officer('113X', 'Special Warfare (SEAL) Officer', 'Unrestricted Line'),
  officer('114X', 'Explosive Ordnance Disposal Officer', 'Unrestricted Line'),
  officer('131X', 'Pilot', 'Unrestricted Line (Aviation)'),
  officer('132X', 'Naval Flight Officer', 'Unrestricted Line (Aviation)'),
  officer('120X', 'Human Resources Officer', 'Restricted Line (Human Resources)'),
  officer('121X', 'Nuclear Power School Instructor', 'Restricted Line (Human Resources)'),
  officer('122X', 'Naval Reactors Engineer', 'Restricted Line (Human Resources)'),
  officer('1230', 'Permanent Military Professor', 'Restricted Line (Human Resources)'),
  officer('128X', 'Permanent Professional Recruiter Officer', 'Restricted Line (Human Resources)'),
  officer('144X', 'Engineering Duty Officer', 'Restricted Line (Engineering Duty)'),
  officer('151X', 'Aerospace Engineering Duty Officer (Aerospace Engineering)', 'Restricted Line (Aerospace Engineering Duty)'),
  officer('152X', 'Aerospace Engineering Duty Officer (Aviation Maintenance)', 'Restricted Line (Aerospace Engineering Duty)'),
  officer('154X', 'Aviation Duty Officer', 'Restricted Line (Aerospace Engineering Duty)'),
  officer('165X', 'Public Affairs Officer', 'Restricted Line (Strategic Sealift and Public Affairs)'),
  officer('166X', 'Strategic Sealift Officer', 'Restricted Line (Strategic Sealift and Public Affairs)'),
  officer('168X', 'Special Duty Officer (Reserve Recruiting)', 'Restricted Line (Strategic Sealift and Public Affairs)'),
  officer('171X', 'Foreign Area Officer', 'Restricted Line (Foreign Area Officer)'),
  officer('180X', 'Oceanography Officer', 'Information Warfare Line'),
  officer('181X', 'Cryptologic Warfare Officer', 'Information Warfare Line'),
  officer('182X', 'Communications Systems Warfare Officer', 'Information Warfare Line'),
  officer('183X', 'Intelligence Officer', 'Information Warfare Line'),
  officer('184X', 'Cyber Warfare Engineer', 'Information Warfare Line'),
  officer('187X', 'Maritime Space Officer', 'Information Warfare Line'),
  officer('188X', 'Maritime Cyber Warfare Officer', 'Information Warfare Line'),
  officer('210X', 'Medical Corps Officer', 'Staff Corps'),
  officer('220X', 'Dental Corps Officer', 'Staff Corps'),
  officer('230X', 'Medical Service Corps Officer', 'Staff Corps'),
  officer('250X', "Judge Advocate General's Corps Officer", 'Staff Corps'),
  officer('290X', 'Nurse Corps Officer', 'Staff Corps'),
  officer('310X', 'Supply Corps Officer', 'Staff Corps'),
  officer('410X', 'Chaplain Corps Officer', 'Staff Corps'),
  officer('510X', 'Civil Engineer Corps Officer', 'Staff Corps'),
  officer('611X', 'Limited Duty Officer (Deck, Surface)', 'Limited Duty Officer (Surface)'),
  officer('612X', 'Limited Duty Officer (Operations, Surface)', 'Limited Duty Officer (Surface)'),
  officer('613X', 'Limited Duty Officer (Engineering/Repair, Surface)', 'Limited Duty Officer (Surface)'),
  officer('618X', 'Limited Duty Officer (Combat Systems, Surface)', 'Limited Duty Officer (Surface)'),
  officer('620X', 'Limited Duty Officer (Nuclear Power)', 'Limited Duty Officer (Submarine)'),
  officer('623X', 'Limited Duty Officer (Engineering/Repair, Submarine)', 'Limited Duty Officer (Submarine)'),
  officer('626X', 'Limited Duty Officer (Ordnance, Submarine)', 'Limited Duty Officer (Submarine)'),
  officer('628X', 'Limited Duty Officer (Electronics, Submarine)', 'Limited Duty Officer (Submarine)'),
  officer('629X', 'Limited Duty Officer (Communications, Submarine)', 'Limited Duty Officer (Submarine)'),
  officer('631X', 'Limited Duty Officer (Aviation Deck)', 'Limited Duty Officer (Aviation)'),
  officer('633X', 'Limited Duty Officer (Aviation Maintenance)', 'Limited Duty Officer (Aviation)'),
  officer('636X', 'Limited Duty Officer (Aviation Ordnance)', 'Limited Duty Officer (Aviation)'),
  officer('639X', 'Limited Duty Officer (Air Traffic Control)', 'Limited Duty Officer (Aviation)'),
  officer('641X', 'Limited Duty Officer (Administration)', 'Limited Duty Officer (General)'),
  officer('643X', 'Limited Duty Officer (Bandmaster)', 'Limited Duty Officer (General)'),
  officer('648X', 'Limited Duty Officer (Explosive Ordnance Disposal)', 'Limited Duty Officer (General)'),
  officer('649X', 'Limited Duty Officer (Security)', 'Limited Duty Officer (General)'),
  officer('651X', 'Limited Duty Officer (Supply Corps)', 'Limited Duty Officer (Staff Corps)'),
  officer('653X', 'Limited Duty Officer (Civil Engineer Corps)', 'Limited Duty Officer (Staff Corps)'),
  officer('680X', 'Limited Duty Officer (Meteorology/Oceanography)', 'Limited Duty Officer (Information Warfare)'),

  // ─── Chief warrant officer designators ─────────────────────────────────────
  warrant('711X', 'Boatswain (Surface)', 'Chief Warrant Officer (Surface)'),
  warrant('712X', 'Operations Technician (Surface)', 'Chief Warrant Officer (Surface)'),
  warrant('713X', 'Engineering Technician (Surface)', 'Chief Warrant Officer (Surface)'),
  warrant('715X', 'Special Warfare Technician', 'Chief Warrant Officer (Surface)'),
  warrant('717X', 'Special Warfare Combat Crewman Technician', 'Chief Warrant Officer (Surface)'),
  warrant('718X', 'Combat Systems Technician (Surface)', 'Chief Warrant Officer (Surface)'),
  warrant('720X', 'Diving Officer', 'Chief Warrant Officer (Submarine)'),
  warrant('726X', 'Ordnance Technician (Submarine)', 'Chief Warrant Officer (Submarine)'),
  warrant('728X', 'Acoustic Technician', 'Chief Warrant Officer (Submarine)'),
  warrant('731X', 'Aviation Boatswain', 'Chief Warrant Officer (Aviation)'),
  warrant('732X', 'Aviation Operations Technician', 'Chief Warrant Officer (Aviation)'),
  warrant('733X', 'Aviation Maintenance Technician', 'Chief Warrant Officer (Aviation)'),
  warrant('736X', 'Aviation Ordnance Technician', 'Chief Warrant Officer (Aviation)'),
  warrant('737X', 'Air Vehicle Pilot', 'Chief Warrant Officer (Aviation)'),
  warrant('741X', 'Administration Technician', 'Chief Warrant Officer (General)'),
  warrant('749X', 'Security Technician', 'Chief Warrant Officer (General)'),
  warrant('752X', 'Food Service Warrant', 'Chief Warrant Officer (Staff Corps)'),
  warrant('756X', 'Technical Nurse', 'Chief Warrant Officer (Staff Corps)'),
  warrant('780X', 'Oceanography Warrant Officer', 'Chief Warrant Officer (Information Warfare)'),
  warrant('781X', 'Cryptologic Warfare Technician', 'Chief Warrant Officer (Information Warfare)'),
  warrant('782X', 'Information Systems Technician', 'Chief Warrant Officer (Information Warfare)'),
  warrant('783X', 'Intelligence Technician', 'Chief Warrant Officer (Information Warfare)'),
  warrant('784X', 'Cyber Warrant Officer', 'Chief Warrant Officer (Information Warfare)'),
  warrant('7901', 'Executive Support Technician', 'Chief Warrant Officer (Executive Support)'),
];

export const provenance: Provenance = {
  verified: '2026-11-18',
  sources: [
    {
      label: 'MyNavy HR: NEOCS Manual Vol I (NAVPERS 18068F), rating chapter list, Change 108 (Oct 2026)',
      url: 'https://www.mynavyhr.navy.mil/References/NEOCS-Manual/NEOCS-Vol-I/',
    },
    {
      label: 'NAVPERS 18068F Vol I, Appendix B: Occupational Communities, Career Fields, and Associated Ratings (Change 98/99, Jul 2024)',
      url: 'https://www.mynavyhr.navy.mil/Portals/55/Reference/NEOCS/Vol1/07-APPENDIX_B_CH_99_Jul24.pdf',
    },
    {
      label: 'NAVPERS 18068F Vol I, Summary of Changes, Change 108 (Oct 2026): no rating establishments or disestablishments',
      url: 'https://www.mynavyhr.navy.mil/Portals/55/Reference/NEOCS/Vol1/03_Summary_of_Changes_CH_108_Oct26_508.pdf',
    },
    {
      label: 'MyNavy HR: NOOCS Manual Vol I (NAVPERS 15839I)',
      url: 'https://www.mynavyhr.navy.mil/References/NOOCS-Manual/NOOCS-VOL-1/',
    },
    {
      label: 'NAVPERS 15839I Vol I, Part A: Billet and Officer Designator Codes, Change 97 (Oct 2026)',
      url: 'https://www.mynavyhr.navy.mil/Portals/55/Reference/NOOCS/Vol1/Manual_I_97_PTA_DESIG_Oct26_508.pdf',
    },
  ],
  notes:
    'Enlisted: 84 ratings from the Oct 2026 NEOCS Vol I chapter list, grouped by the 13 occupational communities in Appendix B. ' +
    'General apprenticeships (AN, CN, FN, HN, SN) and E-9 compression ratings (AB, AF, AV, CB, CU, GS) are not listed. ' +
    'Officer and warrant: designators from NOOCS Vol I Part A (Oct 2026); "X" is the fourth digit, which marks component/status ' +
    '(e.g. 0 Regular Navy, 5 Navy Reserve). Left out on purpose: training/student designators (116X-119X, 137X, 139X, 146X, 316X), ' +
    'prospective staff corps students (190X-199X), flag-only designators (150X, 186X, 270X), 130X (aviation designation terminated), ' +
    'and designators the manual marks as disestablished, suspended or closing: 632X (NAVADMIN 126/19), 681X (NAVADMIN 128/22), ' +
    '682X (NAVADMIN 145/22), 683X (NAVADMIN 070/18), 740X (NAVADMIN 124/13), 753X (NAVADMIN 230/14). ' +
    'Executive Support CWO is listed in Part A as both 7901 (W2-W4) and 7904 (W1-W2); only 7901 is listed here.',
  unverified: [
    'CWT (Cyber Warfare Technician) is a current NEOCS Vol I chapter but is not in Appendix B (Jul 2024), which still lists CTN under Information Warfare / Cyber. Its field is set to Information Warfare by that cyber grouping; confirm against the next Appendix B revision.',
    'Appendix B (Jul 2024) lists ETR under Submarine / Technical, but there is no ETR chapter in the Oct 2026 NEOCS Vol I list, so ETR is left out. Confirm ETR is no longer a separate rating.',
    'ITR title: the NEOCS Vol I page link reads "Communication Network" while the Oct 2026 Summary of Changes reads "Information Systems Technicians, Submarines, Communications". The Summary of Changes wording is used; confirm on the ITR chapter cover page.',
    'MC title: the NEOCS Vol I page link reads "Mass Communications Specialist"; navy.com and common Navy usage give "Mass Communication Specialist", which is used here. Confirm on the MC chapter cover page.',
    'Enlisted titles were taken from the NEOCS Vol I chapter link text, lightly normalised (e.g. "Nuclear Power" in parentheses). Rating chapter cover pages were not opened one by one.',
    'Officer titles are short names written from the Part A "Officer Description" column (e.g. 131X "qualified for duty involving flying ... as a pilot" is listed as "Pilot"). Confirm the wording is acceptable for display.',
  ],
};
