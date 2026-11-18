/**
 * U.S. Marine Corps junior enlisted career data:
 *   (a) Annual Rifle Qualification (ARQ) course and classification, MCO 3574.2M Appendix J
 *   (b) JEPES (Junior Enlisted Performance Evaluation System) PES score, MCO 1616.1 Appendix B
 *       as amended by MARADMIN 046/24
 *   (c) Cpl and Sgt promotion: the JEPES score against monthly MOS cutting scores
 *
 * Unofficial estimate only. MCTFS / MOL hold the official numbers.
 */
import type { Provenance } from '../types';

// ─── (a) Annual Rifle Qualification ──────────────────────────────────────────────

export type RifleClass = 'Expert' | 'Sharpshooter' | 'Marksman' | 'Unqualified';

export interface ArqStage {
  yards: string;
  stage: string;
  roundsPerIteration: number;
  /** Time limit per iteration, seconds. */
  seconds: number;
  positions: string;
  iterations: number;
  rounds: number;
  /** 'destroy' stages count toward the Destroys total; 'drill' stages toward the Drills "yes" count. */
  kind: 'zero' | 'hold' | 'destroy' | 'drill';
}

export interface RifleQualification {
  name: string;
  order: string;
  /** Day 1 (holds) and the scored Day 2/3 course. Day 2 is the pre-evaluation, Day 3 the evaluation. */
  day1: ArqStage[];
  day1Rounds: number;
  evaluation: ArqStage[];
  evaluationRounds: number;
  /** Maximum Destroys (sum of destroy-stage iterations) and drill types scored yes/no. */
  maxDestroys: number;
  drillTypes: string[];
  /**
   * Final classification: find the Destroys band, then read the column for the number of
   * drill types passed (0-3). From the ARQ scorecard, MCO 3574.2M page J-3.
   */
  classification: { destroysMin: number; destroysMax: number; byDrillsPassed: [RifleClass, RifleClass, RifleClass, RifleClass] }[];
  rules: string[];
  provenance: Provenance;
}

export const rifleQualification: RifleQualification = {
  name: 'Annual Rifle Qualification (ARQ)',
  order: 'MCO 3574.2M, Marine Corps Combat Marksmanship Programs (6 Apr 2022), Appendix J',
  day1: [
    { yards: '100', stage: 'Zero confirmation', roundsPerIteration: 5, seconds: 60, positions: 'Prone', iterations: 3, rounds: 15, kind: 'zero' },
    { yards: '25', stage: 'Failure to stop drill', roundsPerIteration: 3, seconds: 5, positions: 'Standing', iterations: 4, rounds: 12, kind: 'drill' },
    { yards: '25', stage: 'Box drill', roundsPerIteration: 6, seconds: 10, positions: 'Standing', iterations: 2, rounds: 12, kind: 'drill' },
    { yards: '25-15', stage: 'Failure to stop, moving', roundsPerIteration: 3, seconds: 15, positions: 'Standing', iterations: 3, rounds: 9, kind: 'drill' },
    { yards: '25', stage: 'Head shot', roundsPerIteration: 1, seconds: 3, positions: 'Standing', iterations: 3, rounds: 3, kind: 'hold' },
    { yards: '100', stage: 'Holds (barricade)', roundsPerIteration: 5, seconds: 60, positions: 'Standing', iterations: 3, rounds: 15, kind: 'hold' },
    { yards: '100', stage: 'Moving threat engagement (barricade)', roundsPerIteration: 2, seconds: 8, positions: 'Standing x2, kneeling x2, any x2', iterations: 6, rounds: 12, kind: 'hold' },
    { yards: '200', stage: 'Holds (barricade)', roundsPerIteration: 5, seconds: 60, positions: 'Supported', iterations: 3, rounds: 15, kind: 'hold' },
    { yards: '200', stage: 'Moving threat engagement (barricade)', roundsPerIteration: 2, seconds: 8, positions: 'Standing x2, kneeling x2, any x2', iterations: 6, rounds: 12, kind: 'hold' },
    { yards: '300', stage: 'Holds', roundsPerIteration: 5, seconds: 60, positions: 'Supported', iterations: 3, rounds: 15, kind: 'hold' },
    { yards: '500', stage: 'Holds', roundsPerIteration: 5, seconds: 60, positions: 'Supported', iterations: 4, rounds: 20, kind: 'hold' },
  ],
  day1Rounds: 140,
  evaluation: [
    { yards: '500', stage: 'Sustained fire', roundsPerIteration: 5, seconds: 45, positions: 'Prone', iterations: 8, rounds: 40, kind: 'destroy' },
    { yards: '300', stage: 'Controlled pair', roundsPerIteration: 2, seconds: 15, positions: 'Standing, kneeling or prone', iterations: 8, rounds: 16, kind: 'destroy' },
    { yards: '200', stage: 'Controlled pairs (barricade)', roundsPerIteration: 2, seconds: 10, positions: 'Standing or kneeling', iterations: 7, rounds: 14, kind: 'destroy' },
    { yards: '200', stage: 'Moving threat engagement (barricade)', roundsPerIteration: 2, seconds: 8, positions: 'Standing or kneeling', iterations: 7, rounds: 14, kind: 'destroy' },
    { yards: '100', stage: 'Controlled pair (barricade)', roundsPerIteration: 2, seconds: 8, positions: 'Standing or kneeling', iterations: 7, rounds: 14, kind: 'destroy' },
    { yards: '100', stage: 'Moving threat engagement (barricade)', roundsPerIteration: 2, seconds: 8, positions: 'Standing or kneeling', iterations: 7, rounds: 14, kind: 'destroy' },
    { yards: '25', stage: 'Head shot', roundsPerIteration: 1, seconds: 3, positions: 'Standing', iterations: 6, rounds: 6, kind: 'destroy' },
    { yards: '25', stage: 'Failure to stop drill', roundsPerIteration: 3, seconds: 5, positions: 'Standing', iterations: 4, rounds: 12, kind: 'drill' },
    { yards: '25', stage: 'Box drill', roundsPerIteration: 6, seconds: 10, positions: 'Standing', iterations: 4, rounds: 24, kind: 'drill' },
    { yards: '25-15', stage: 'Failure to stop while moving', roundsPerIteration: 3, seconds: 15, positions: 'Standing', iterations: 2, rounds: 6, kind: 'drill' },
  ],
  evaluationRounds: 160,
  maxDestroys: 50,
  drillTypes: ['Failure to stop', 'Box drill', 'Failure to stop while moving'],
  classification: [
    { destroysMin: 0, destroysMax: 14, byDrillsPassed: ['Unqualified', 'Unqualified', 'Unqualified', 'Unqualified'] },
    { destroysMin: 15, destroysMax: 30, byDrillsPassed: ['Unqualified', 'Marksman', 'Marksman', 'Marksman'] },
    { destroysMin: 31, destroysMax: 42, byDrillsPassed: ['Unqualified', 'Marksman', 'Sharpshooter', 'Sharpshooter'] },
    { destroysMin: 43, destroysMax: 50, byDrillsPassed: ['Unqualified', 'Marksman', 'Sharpshooter', 'Expert'] },
  ],
  rules: [
    'The ARQ replaced the old Table 1 / Table 2 aggregate (out of 350) for the annual requirement. Day 1 is unscored practice (holds), Day 2 is a pre-evaluation, Day 3 is the evaluation.',
    'Each destroy-stage iteration scores one Destroy when it hits the scoring zone (slow fire and controlled pairs: at least one round in the head or chest "D" zone; movers: at least one round anywhere on the target; head shot: at least one round in the head). Destroys are added across all seven destroy stages (maximum 50).',
    'A drill iteration earns a D when failure-to-stop has one head hit and two chest hits, or the box drill has one head and two chest hits on both targets. Each of the three drill types is then "yes" if at least one of its iterations earned a D.',
    'Day 2 counts only if the Marine cannot fire on Day 3, and since MARADMIN 123/24 a Marine may keep a pre-qualification score only if it is Expert.',
    'MARADMIN 095/26 (Mar 2026): the ARQ "Drill" target may replace the "Destroy" target, because the Destroy target\'s white suppress zone never counted toward the score; Tables 3-6 moved from an annual to a pre-deployment requirement.',
    'Rifle qualification is a fiscal-year requirement.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      { label: 'MCO 3574.2M, Marine Corps Combat Marksmanship Programs (6 Apr 2022)', url: 'https://www.marines.mil/News/Publications/MCPEL/Electronic-Library-Display/Article/2996982/mco-35742m/' },
      { label: 'MARADMIN 123/24, FY24 Combat Marksmanship Symposium (expert-only pre-qualification)', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/3702890/fy24-combat-marksmanship-symposium-post-symposium-message/' },
      { label: 'MARADMIN 095/26, FY26 Combat Marksmanship Symposium', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4430239/fy26-combat-marksmanship-symposium-cms-post-symposium-message/' },
    ],
    notes:
      'Course tables and the classification matrix are MCO 3574.2M pages J-1 to J-3. MARADMIN 095/26 (Mar 2026) still cites 3574.2M as the current order; the 3574.2N promised in MARADMIN 123/24 was not found on MCPEL.',
    unverified: [
      'The hit rules and the "at least one D per drill type" rule are paraphrased from the printed ARQ scorecard, which is small and rotated in the PDF; re-read page J-3 at full size before showing them as rules on the page.',
      'MCO 3574.2N (announced in MARADMIN 123/24) was not found. If it has been published, re-check the course and matrix.',
      'Entry-level qualification (recruit depots) is being piloted toward ARQ parity by FY29 (MARADMIN 095/26); the old 350-point Table 1/2 bands were not checked against the order and are not included.',
    ],
  },
};

/** Classification from Destroys (0-50) and number of drill types passed (0-3). */
export function arqClassification(destroys: number, drillsPassed: number): RifleClass {
  const d = Math.max(0, Math.min(50, Math.floor(destroys)));
  const y = Math.max(0, Math.min(3, Math.floor(drillsPassed)));
  const row = rifleQualification.classification.find((r) => d >= r.destroysMin && d <= r.destroysMax);
  return row ? row.byDrillsPassed[y] : 'Unqualified';
}

// ─── (b) JEPES ───────────────────────────────────────────────────────────────────

export type JepesRank = 'LCpl and below' | 'Cpl';

export interface JepesPart {
  id: string;
  name: string;
  /** Raw points before the 1.25 multiplier (or before dividing by 3 for command input). */
  maxRaw: number;
  rule: string;
  /** Needs data the Marine cannot compute alone (HQMC peer percentile tables, unit marks, MOL tables). */
  needsOfficialInput: boolean;
}

export interface JepesPillar {
  id: 'warfighting' | 'physical-toughness' | 'mental-agility' | 'command-input' | 'bonus';
  name: string;
  /** Composite ceiling after scaling. */
  max: number;
  /** How raw points become the composite. */
  scale: string;
  parts: JepesPart[];
}

export interface JepesModel {
  name: string;
  appliesTo: string;
  maxScore: number;
  /** MCMAP belt to points, by rank (MCO 1616.1 Appendix B Tables 1 and 2). */
  mcmapPoints: Record<JepesRank, { belt: string; code: string; points: number }[]>;
  pillars: JepesPillar[];
  rules: string[];
  provenance: Provenance;
}

export const jepes: JepesModel = {
  name: 'Junior Enlisted Performance Evaluation System (JEPES) PES score',
  appliesTo: 'Privates through corporals; the score ranks LCpls for Cpl and Cpls for Sgt',
  maxScore: 1000,
  mcmapPoints: {
    'LCpl and below': [
      { belt: 'Unqualified', code: 'MMA', points: 0 },
      { belt: 'Tan', code: 'MMB', points: 33 },
      { belt: 'Grey', code: 'MMC', points: 67 },
      { belt: 'Green', code: 'MMD', points: 100 },
    ],
    Cpl: [
      { belt: 'Unqualified', code: 'MMA', points: 0 },
      { belt: 'Tan', code: 'MMB', points: 16 },
      { belt: 'Grey', code: 'MMC', points: 33 },
      { belt: 'Green', code: 'MMD', points: 50 },
      { belt: 'Green instructor', code: 'MME', points: 66 },
      { belt: 'Brown', code: 'MMF', points: 83 },
      { belt: 'Brown instructor or above', code: 'MMG+', points: 100 },
    ],
  },
  pillars: [
    {
      id: 'warfighting',
      name: 'Warfighting',
      max: 250,
      scale: '(rifle + MCMAP) x 1.25, rounded half up',
      parts: [
        { id: 'rifle', name: 'Rifle score', maxRaw: 100, rule: 'Percentile (0-100) of the rifle score against Marines of the same rank, read from an HQMC table that is updated every year.', needsOfficialInput: true },
        { id: 'mcmap', name: 'MCMAP belt', maxRaw: 100, rule: 'Fixed points per belt, from mcmapPoints for the Marine\'s rank.', needsOfficialInput: false },
      ],
    },
    {
      id: 'physical-toughness',
      name: 'Physical Toughness',
      max: 250,
      scale: '(PFT + CFT) x 1.25, rounded half up',
      parts: [
        { id: 'pft', name: 'PFT score', maxRaw: 100, rule: 'Percentile (0-100) of the PFT score against same-rank peers, from the yearly HQMC table.', needsOfficialInput: true },
        { id: 'cft', name: 'CFT score', maxRaw: 100, rule: 'Percentile (0-100) of the CFT score against same-rank peers, from the yearly HQMC table.', needsOfficialInput: true },
      ],
    },
    {
      id: 'mental-agility',
      name: 'Mental Agility',
      max: 250,
      scale: 'sum of parts (max 200) x 1.25, rounded half up',
      parts: [
        { id: 'mos-quals', name: 'MOS courses and qualifications', maxRaw: 100, rule: 'Points per PMOS qualification from the "JEPES MOS Quals Scoring Table All Ranks" in MOL; counted from 26 Oct 2023.', needsOfficialInput: true },
        { id: 'marinenet', name: 'MarineNet courses (informal PME in grade)', maxRaw: 40, rule: 'Sum of the CEU values of listed MarineNet courses finished since date of rank, capped at 40.', needsOfficialInput: true },
        { id: 'degrees', name: 'Degrees', maxRaw: 20, rule: 'Associate 10, bachelor 20; maximum 20.', needsOfficialInput: false },
        { id: 'self-ed-grade', name: 'Off-duty college courses in grade', maxRaw: 20, rule: '5 points per course passed since date of rank; maximum 20.', needsOfficialInput: false },
        { id: 'self-ed-service', name: 'Off-duty college courses in service', maxRaw: 20, rule: '5 points per course passed between active duty base date and date of rank; maximum 20.', needsOfficialInput: false },
      ],
    },
    {
      id: 'command-input',
      name: 'Command Input',
      max: 250,
      scale: '(MOS/mission x 50 + leadership x 50 + character x 50) / 3, rounded half up',
      parts: [
        { id: 'mos-mission', name: 'MOS / mission accomplishment', maxRaw: 250, rule: 'Average mark in grade on a 0.0-5.0 scale, times 50. "Meets expectations" is 2.0-3.0.', needsOfficialInput: true },
        { id: 'leadership', name: 'Leadership', maxRaw: 250, rule: 'Average mark in grade (0.0-5.0) times 50.', needsOfficialInput: true },
        { id: 'character', name: 'Character', maxRaw: 250, rule: 'Average mark in grade (0.0-5.0) times 50.', needsOfficialInput: true },
      ],
    },
    {
      id: 'bonus',
      name: 'Bonus',
      max: 100,
      scale: 'sum of parts, capped at 100',
      parts: [
        { id: 'di-school', name: 'Drill Instructor School', maxRaw: 50, rule: '50 if completed since the armed forces active duty base date.', needsOfficialInput: false },
        { id: 'recruiter-school', name: 'Recruiter School', maxRaw: 50, rule: '50 if completed since the armed forces active duty base date.', needsOfficialInput: false },
        { id: 'msg-school', name: 'Marine Security Guard School', maxRaw: 50, rule: '50 if completed since the armed forces active duty base date.', needsOfficialInput: false },
        { id: 'combat-instructor', name: 'Combat instructor', maxRaw: 50, rule: '50 if serving as a combat instructor.', needsOfficialInput: false },
        { id: 'mcsf', name: 'Marine Corps Security Forces', maxRaw: 50, rule: '50 if assigned to MCSF.', needsOfficialInput: false },
        { id: 'command-recruiting', name: 'Command recruiting', maxRaw: 100, rule: '20 per referred applicant who enlists or reenlists into the regular component, SMCR or the Marine Corps; maximum 100; does not carry to the next grade.', needsOfficialInput: false },
      ],
    },
  ],
  rules: [
    'PES score = Warfighting + Physical Toughness + Mental Agility + Command Input + Bonus, maximum 1000 (each of the four pillars maximum 250, bonus maximum 100).',
    'Rifle, PFT and CFT points are percentiles against same-rank peers, not the raw score, and HQMC republishes those tables yearly. An estimator must ask for the percentile or use a table it can cite.',
    'Command input marks come from the reporting chain each reporting occasion; only the Marine\'s MOL dashboard shows the true average in grade.',
    'Medical, combat or unit waivers bring forward a previous rifle, PFT or CFT score for the calculation.',
    'The promotion score is the one computed in MCTFS from entries made before the command cutoff date; it can differ from the MOL dashboard.',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      { label: 'MCO 1616.1, Junior Enlisted Performance Evaluation System (25 Nov 2020), Appendix B', url: 'https://www.pendleton.marines.mil/Portals/98/Docs/HS_BN/S-1/MCO-1616.1-JEPES-Manual.pdf' },
      { label: 'MARADMIN 505/20, JEPES implementation', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/2334563/junior-enlisted-performance-evaluation-implementation/' },
      { label: 'MARADMIN 046/24, Updates to the MOS qualifications initiative (Mental Agility weights)', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/3662965/updates-to-the-implementation-of-military-occupational-specialty-qualifications/' },
    ],
    notes:
      'Pillar maths and MCMAP points are MCO 1616.1 Appendix B (pages B-1 to B-7). Mental Agility weights follow MARADMIN 046/24, which replaced the order\'s original split (MarineNet 100, degrees 40, off-duty courses 10 each up to 30). ' +
      'The MCO 1616.1 copy read is the one hosted on pendleton.marines.mil (an official installation site).',
    unverified: [
      'Rifle/PFT/CFT percentile tables (Appendix B Tables 3 and 4) change every year; the 2020 tables in the order are stale and were deliberately not copied. Find the current HQMC tables (MOL) or require the user to enter percentiles.',
      'Under the ARQ, which number MCTFS feeds into the rifle percentile (the order still says a 0-350 rifle score) was not confirmed.',
      'MCO 1616.1 B-6 line 5e says to write 100 when a Marine is NOT in MCSF; this reads as a misprint for 0 and is modelled as 0.',
      'Whether MCO 1616.1 has a later change or replacement after MARADMIN 046/24 (Feb 2024) was not confirmed on MCPEL.',
    ],
  },
};

const roundHalfUp = (n: number) => Math.floor(n + 0.5);

/** Pillar composites from raw inputs. Percentile inputs (rifle, PFT, CFT) must be 0-100. */
export function jepesScore(input: {
  rank: JepesRank;
  riflePct: number;
  pftPct: number;
  cftPct: number;
  mcmapCode: string;
  mosQualPoints: number;
  marineNetCeu: number;
  degree: 'none' | 'associate' | 'bachelor';
  coursesInGrade: number;
  coursesInService: number;
  marks: { mosMission: number; leadership: number; character: number };
  bonusSchools: number;
  recruitingReferrals: number;
}) {
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const mcmap = jepes.mcmapPoints[input.rank].find((b) => b.code === input.mcmapCode)?.points ?? 0;
  const warfighting = clamp(roundHalfUp((clamp(input.riflePct, 0, 100) + mcmap) * 1.25), 0, 250);
  const physical = clamp(roundHalfUp((clamp(input.pftPct, 0, 100) + clamp(input.cftPct, 0, 100)) * 1.25), 0, 250);
  const degree = input.degree === 'bachelor' ? 20 : input.degree === 'associate' ? 10 : 0;
  const mentalRaw =
    clamp(input.mosQualPoints, 0, 100) +
    clamp(input.marineNetCeu, 0, 40) +
    degree +
    clamp(input.coursesInGrade * 5, 0, 20) +
    clamp(input.coursesInService * 5, 0, 20);
  const mental = clamp(roundHalfUp(mentalRaw * 1.25), 0, 250);
  const m = input.marks;
  const command = clamp(roundHalfUp((clamp(m.mosMission, 0, 5) * 50 + clamp(m.leadership, 0, 5) * 50 + clamp(m.character, 0, 5) * 50) / 3), 0, 250);
  const bonus = clamp(clamp(input.bonusSchools, 0, 5) * 50 + clamp(input.recruitingReferrals * 20, 0, 100), 0, 100);
  return { warfighting, physical, mental, command, bonus, total: clamp(warfighting + physical + mental + command + bonus, 0, 1000) };
}

// ─── (c) Cpl and Sgt promotion ───────────────────────────────────────────────────

export interface JuniorPromotion {
  method: string;
  /** Regular promotion minimums (months). */
  minimums: { to: 'PFC' | 'LCpl' | 'Cpl' | 'Sgt'; tigMonths: number; tisMonths: number; note?: string }[];
  cuttingScores: { where: string; schedule: string; closedValue: number; publishedAt: { label: string; url: string } };
  rules: string[];
  provenance: Provenance;
}

export const juniorPromotion: JuniorPromotion = {
  method:
    'Since 1 Feb 2021 the JEPES PES score (0-1000) replaced the old composite score for promotion to Cpl and Sgt. Each month HQMC sets a cutting score per MOS; an eligible LCpl or Cpl whose JEPES score meets or beats it is selected.',
  minimums: [
    { to: 'Sgt', tigMonths: 12, tisMonths: 48, note: 'without reenlistment' },
    { to: 'Sgt', tigMonths: 12, tisMonths: 36, note: 'with reenlistment' },
    { to: 'Cpl', tigMonths: 12, tisMonths: 12 },
    { to: 'LCpl', tigMonths: 8, tisMonths: 9 },
    { to: 'PFC', tigMonths: 6, tisMonths: 6 },
  ],
  cuttingScores: {
    where: 'MCTFS screen JEPA (units only). A score of 9999 means that MOS is closed for the month.',
    schedule:
      'Active duty: parameters and cutting scores change in the third week of each month and a promotion-authority MARADMIN is issued, e.g. MARADMIN 322/26 for 1 Aug 2026 (command cutoff 30 Jun 2026). Reserve: near the end of the second month of each quarter.',
    closedValue: 9999,
    publishedAt: {
      label: 'MARADMINs, search "Active-Duty Corporal and Sergeant Promotion Authority"',
      url: 'https://www.marines.mil/News/Messages/MARADMINS/',
    },
  },
  rules: [
    'The monthly MARADMIN is the promotion authority; the cutting scores themselves are posted in MCTFS, not in the message text.',
    'Only entries dated on or before the command cutoff (about two months before the promotion date) count toward that month\'s score.',
    'Marines must be PME complete (MARADMIN 474/21); a Marine over the cutting score without PME is not selected.',
    'Late entries dated before the cutoff trigger an automatic recompute and remedial promotion if the new score meets a past month\'s cutting score (MARADMIN 559/23).',
  ],
  provenance: {
    verified: '2026-11-18',
    sources: [
      { label: 'Manpower Management: Sergeants and Below Promotions', url: 'https://www.manpower.marines.mil/Divisions/Manpower-Management/Performance-Branch/Promotion-Section/Enlisted-Promotions/Sergeants-and-Below-Promotions/' },
      { label: 'MARADMIN 322/26, August 2026 Active-Duty Cpl and Sgt Promotion Authority', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/4550302/august-2026-active-duty-corporal-and-sergeant-promotion-authority/' },
      { label: 'MARADMIN 505/20, JEPES implementation (PES score replaces composite score)', url: 'https://www.marines.mil/News/Messages/Messages-Display/Article/2334563/junior-enlisted-performance-evaluation-implementation/' },
    ],
    notes: 'TIG/TIS minimums are the regular-promotion columns of the Manpower Management page as read on 2026-11-18.',
    unverified: [
      'A third-party summary claims MARADMIN 222/26 lowers the Sgt time-in-service minimum to 30 months from 1 Oct 2026; not confirmed on marines.mil. Check before showing the Sgt TIS minimum.',
      'The September 2026 promotion-authority MARADMIN link found by search returned 404; the latest message read was August 2026 (322/26).',
      'Actual cutting score values are only in MCTFS and are not published publicly; the page can only link to the monthly MARADMIN.',
    ],
  },
};
