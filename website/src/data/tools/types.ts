/**
 * Data model for the military tools, reference and heritage pages.
 *
 * FACT RULES (these replace the "no score tables" rule for /tools/ only, by the
 * founder's decision on 2026-11-18):
 *  - Every number comes from an official source (a .mil order or instruction, DFAS,
 *    eCFR, a service's own published chart). List it in `provenance.sources`.
 *  - Calculators are labelled "unofficial estimate". Never write "official score",
 *    "pass guaranteed" or similar.
 *  - Anything that could not be confirmed goes in `provenance.unverified` (one line
 *    per item, saying exactly what to check) instead of being guessed.
 *  - All prose is written fresh. Nothing is copied from third-party sites.
 */

export type Branch = 'army' | 'marine-corps' | 'navy' | 'air-force' | 'space-force' | 'coast-guard';

export const BRANCHES: { id: Branch; name: string; short: string; member: string }[] = [
  { id: 'army', name: 'U.S. Army', short: 'Army', member: 'Soldier' },
  { id: 'marine-corps', name: 'U.S. Marine Corps', short: 'Marine Corps', member: 'Marine' },
  { id: 'navy', name: 'U.S. Navy', short: 'Navy', member: 'Sailor' },
  { id: 'air-force', name: 'U.S. Air Force', short: 'Air Force', member: 'Airman' },
  { id: 'space-force', name: 'U.S. Space Force', short: 'Space Force', member: 'Guardian' },
  { id: 'coast-guard', name: 'U.S. Coast Guard', short: 'Coast Guard', member: 'Coast Guardsman' },
];

export interface Source {
  label: string;
  /** https only. Prefer the official document (order, instruction, PDF chart). */
  url: string;
}

export interface Provenance {
  /** ISO date the data was last checked against the sources. */
  verified: string;
  sources: Source[];
  /** Plain-language notes on scope, e.g. "Scores as of the 2025 chart revision". */
  notes?: string;
  /** Things a person must confirm before the page is promoted. Empty when fully confirmed. */
  unverified: string[];
}

// ─── Fitness tests ─────────────────────────────────────────────────────────────
export type Sex = 'male' | 'female';

/**
 * Points for one event, for one sex and age range.
 *
 * `points` is a list of [performance, points] pairs. Scoring picks the best row the
 * performance reaches:
 *   better 'higher' (reps, plank seconds, distance): highest row with performance <= value
 *   better 'lower'  (run or row times, in seconds):  lowest row with performance >= value
 * A performance short of every row scores 0.
 */
export interface ScoreBracket {
  sex: Sex | 'any';
  /** Inclusive. Use 17 and 99 for "all ages". */
  ageMin: number;
  ageMax: number;
  points: [number, number][];
}

export interface FitnessEvent {
  /** Stable id, e.g. 'pull-ups'. */
  id: string;
  /** Label shown on the calculator, e.g. 'Pull-ups'. */
  name: string;
  /**
   * 'reps' | 'seconds' (time) | 'meters' | 'pounds' | 'ratio'. Times are entered as mm:ss.
   * A 'ratio' (waist ÷ height) is entered as a decimal and cut to two places before scoring.
   */
  unit: 'reps' | 'seconds' | 'meters' | 'pounds' | 'ratio';
  better: 'higher' | 'lower';
  brackets: ScoreBracket[];
}

/** One scored slot in a test; most slots have one event, some offer alternatives. */
export interface FitnessSlot {
  id: string;
  label: string;
  /** First option is the default. */
  options: FitnessEvent[];
  /** Minimum points for this event to count as passing, if the test has one. */
  minimumPoints?: number;
}

export interface FitnessTest {
  /** Matches the URL segment, e.g. 'pft' for /tools/marine-corps/pft-calculator. */
  id: string;
  branch: Branch;
  /** Full name, e.g. 'Physical Fitness Test'. */
  name: string;
  /** Short name, e.g. 'PFT'. */
  short: string;
  maxPoints: number;
  slots: FitnessSlot[];
  /** Minimum total to pass, by sex/age if it varies. Omit when the test has none. */
  passingTotal?: { sex: Sex | 'any'; ageMin: number; ageMax: number; points: number }[];
  /** Score classes, highest first, e.g. [{ label: '1st Class', min: 235 }]. */
  classes?: { label: string; min: number }[];
  /** How the age brackets are labelled on the official chart, for display. */
  ageGroups: { label: string; ageMin: number; ageMax: number }[];
  /** Whether the chart differs by sex. */
  bySex: boolean;
  provenance: Provenance;
}

// ─── Body composition ───────────────────────────────────────────────────────────
/** Measurements passed to a data file's `lookupBodyFat`, in inches and pounds. */
export interface BodyMeasurements { heightIn: number; waistIn: number; weightLb?: number; neckIn?: number; hipIn?: number }

export interface HeightWeightRow {
  heightIn: number;
  minLb?: number;
  maxLb: number;
}

export interface BodyCompStandard {
  branch: Branch;
  /** Height/weight screening table. Max weight may vary by age: give one table per age range if so. */
  heightWeight: { sex: Sex; ageMin: number; ageMax: number; rows: HeightWeightRow[] }[];
  /** Maximum body fat percent allowed. */
  bodyFatMax: { sex: Sex; ageMin: number; ageMax: number; maxPct: number }[];
  /**
   * How body fat is estimated when the screening table is exceeded.
   * 'dod-one-site': %BF from abdomen circumference and weight (DoDI 1308.03, 2022 onward).
   * 'dod-multi-site': neck/abdomen (men) or neck/waist/hip (women) with height, log formula.
   * 'waist-to-height': ratio screen (Air Force/Space Force style).
   */
  method: 'dod-one-site' | 'dod-multi-site' | 'waist-to-height';
  /** Formula coefficients exactly as published, documented in prose for display. */
  formula: { sex: Sex; expression: string }[];
  /** For 'waist-to-height': the passing cutoff, e.g. 0.55. */
  waistToHeightMax?: number;
  /**
   * For 'waist-to-height': how the published rule rounds and compares. Defaults to two
   * decimals, rounded, passing at or under the cutoff.
   */
  waistToHeightRule?: { decimals: number; truncate: boolean; strictlyBelow: boolean };
  /** How measurements are rounded before use, when the service specifies it (e.g. Navy: height up, waist down, to the half inch). */
  measureRounding?: { height: 'half-up' | 'half-down' | 'none'; waist: 'half-down' | 'none' };
  /**
   * Set when a failed waist-to-height check is followed by a body fat check. Lists the
   * extra measurements that check needs, by sex. The data file then exports
   * `lookupBodyFat(sex, m: BodyMeasurements): number | null`, given the rounded height and waist.
   */
  bodyFatAfterRatio?: Record<Sex, ('weight' | 'neck' | 'hip')[]>;
  /** Plain-language notes: exemptions (e.g. by fitness score), retests, etc. */
  notes: string[];
  provenance: Provenance;
}

// ─── Reference and heritage ─────────────────────────────────────────────────────
export interface Rank {
  branch: Branch;
  /** 'E-1' … 'E-9', 'W-1' … 'W-5', 'O-1' … 'O-10'. */
  grade: string;
  title: string;
  abbr: string;
  category: 'enlisted' | 'warrant' | 'officer';
  /** One line describing the insignia, in our own words. */
  insignia: string;
  /** Optional note, e.g. 'Senior enlisted advisor billet'. */
  note?: string;
}

export interface PayTable {
  /** Calendar year, e.g. 2026. */
  year: number;
  effective: string;
  /** Monthly basic pay in dollars. Keys are years of service breakpoints: 'under2', '2', '3', '4', '6', ... '40'. */
  rows: { grade: string; pay: Record<string, number | null> }[];
  provenance: Provenance;
}

export interface Job {
  branch: Branch;
  /** MOS, rating, AFSC or SFSC code. */
  code: string;
  title: string;
  /** Career field or occupational field, e.g. 'Infantry'. */
  field: string;
  category: 'enlisted' | 'officer' | 'warrant';
}

export interface Installation {
  name: string;
  branch: Branch | 'joint';
  city: string;
  state: string;
  /** One line on what is there, in our own words. */
  summary: string;
}

export interface Award {
  branch: Branch | 'all';
  /** Precedence order within the branch, 1 is highest. */
  order: number;
  name: string;
  type: 'decoration' | 'unit' | 'campaign' | 'service' | 'training' | 'foreign' | 'marksmanship';
  /**
   * Ribbon stripes from the left edge to the right edge, as [color hex, width in 1/32 inch];
   * a ribbon is 44 units wide. Usually joined from `reference/ribbons.ts` by name. Omit if
   * not confirmed.
   */
  stripes?: [string, number][];
}

export interface HeritageEvent { year: number; text: string }
export interface Leader { name: string; from: number; to: number | null; note?: string }
export interface NotablePerson { name: string; years: string; knownFor: string }
export interface Equipment { name: string; category: 'aircraft' | 'vehicle' | 'weapon' | 'vessel' | 'spacecraft'; role: string }

export interface Heritage {
  branch: Branch;
  founded: string;
  motto: string;
  /** Two or three sentences, original wording. */
  overview: string;
  timeline: HeritageEvent[];
  leaders: { title: string; list: Leader[] };
  notable: NotablePerson[];
  equipment: Equipment[];
  provenance: Provenance;
}

// ─── Rank detail pages ──────────────────────────────────────────────────────────
/**
 * The written content for one rank's own page (/reference/ranks/<branch>/<slug>/).
 * Joined to `Rank` by branch + abbr. Everything is original prose from official sources.
 */
export interface RankDetail {
  branch: Branch;
  /** Must equal the matching Rank.abbr exactly. */
  abbr: string;
  /** URL segment, from the title: 'gunnery-sergeant', 'chief-warrant-officer-3'. */
  slug: string;
  /** Two or three sentences: what this rank is and what a person holding it does. */
  summary: string;
  /** Four to six concrete duties or typical billets. */
  role: string[];
  /** How a person reaches this rank: time in grade/service, boards, schools, selection. */
  promotion: string;
  /** Two to four short paragraphs on the history of the rank and its insignia, with dates. */
  history: string[];
  /** Three questions people search for, answered plainly. */
  faq: { q: string; a: string }[];
  sources: Source[];
  /** Anything not confirmed, in one line each. */
  unverified: string[];
}

/**
 * A Medal of Honor recipient shown on a rank's page: someone who held that rank at the
 * time of the action. Stories are original, short and drawn from the official citation.
 */
export interface Honoree {
  branch: Branch;
  /** Rank.abbr of the rank held at the time of the action (join key). */
  abbr: string;
  name: string;
  /** Rank title exactly as the citation gives it, e.g. 'Corporal' or 'Private First Class'. */
  rankAtAction: string;
  /** e.g. 'Vietnam War', 'World War II', 'Operation Iraqi Freedom'. */
  conflict: string;
  /** Year of the action. */
  year: number;
  /** Two or three plain sentences in our own words: what happened and why it mattered. */
  story: string;
  /** True when the medal was awarded after the recipient's death. */
  posthumous: boolean;
  /** Official source for this recipient (cmohs.org recipient page, or a .mil page). */
  source: { label: string; url: string };
}
