import { tools, toolPath } from './registry';
import { BRANCHES, type Branch, type BodyCompStandard, type FitnessTest } from './types';

/**
 * Every live page under /tools/, /reference/ and /heritage/, worked out at build time
 * from the data files that exist. Hubs, related links and the header read from here, so
 * a page is never linked before its data is in place.
 *
 * Uses import.meta.glob: Astro/Vite only.
 */
const fitness = import.meta.glob<Record<string, unknown>>('./fitness/*.ts', { eager: true });
const body = import.meta.glob<Record<string, unknown>>('./body-comp/*.ts', { eager: true });
const career = import.meta.glob<Record<string, unknown>>('./career/*.ts', { eager: true });
const jobs = import.meta.glob<Record<string, unknown>>('./reference/jobs/*.ts', { eager: true });
const awards = import.meta.glob<Record<string, unknown>>('./reference/awards/*.ts', { eager: true });
const heritage = import.meta.glob<Record<string, unknown>>('./heritage/*.ts', { eager: true });
const reference = import.meta.glob<Record<string, unknown>>('./reference/*.ts', { eager: true });
const ribbonPatterns = (reference['./reference/ribbons.ts']?.ribbonPatterns ?? {}) as Record<string, unknown>;

/** Career calculators with their own hand-built pages, listed once their data export exists. */
const careerPages: { branch: Branch; dataKey: string; name: string; href: string; blurb: string }[] = [
  { branch: 'army', dataKey: 'promotionPoints', name: 'Army promotion points calculator', href: '/tools/army/promotion-points-calculator/', blurb: 'Estimate SGT and SSG promotion points from weapons, AFT, education and awards.' },
  { branch: 'marine-corps', dataKey: 'jepes', name: 'Marine Corps JEPES calculator', href: '/tools/marine-corps/jepes-calculator/', blurb: 'Estimate your PES score for Cpl and Sgt and see how cutting scores work.' },
  { branch: 'marine-corps', dataKey: 'rifleQualification', name: 'Marine Corps rifle qualification', href: '/tools/marine-corps/rifle-qualification-calculator/', blurb: 'Expert, Sharpshooter or Marksman from your destroys and drills.' },
];

export type Group = 'Fitness tests' | 'Body composition' | 'Career and promotion' | 'Reference' | 'Heritage';
export interface CatalogItem { group: Group; branch: Branch | 'all'; name: string; href: string; blurb: string }

const isTest = (v: unknown): v is FitnessTest => !!v && typeof v === 'object' && 'slots' in v && 'ageGroups' in v;
const isStandard = (v: unknown): v is BodyCompStandard => !!v && typeof v === 'object' && 'heightWeight' in v && 'method' in v;
const has = (mods: Record<string, Record<string, unknown>>, file: string, key?: string) =>
  !!mods[file] && (key ? key in mods[file] : Object.keys(mods[file]).length > 0);

export const branchName = (b: Branch | 'all') => (b === 'all' ? 'All branches' : BRANCHES.find((x) => x.id === b)!.name);
export const branchShort = (b: Branch) => BRANCHES.find((x) => x.id === b)!.short;

/** Branch-specific job list labels: MOS, rating, AFSC, SFSC. */
export const jobWord: Record<Branch, { short: string; long: string; plural: string }> = {
  army: { short: 'MOS', long: 'Military Occupational Specialty', plural: 'Army MOS list' },
  'marine-corps': { short: 'MOS', long: 'Military Occupational Specialty', plural: 'Marine Corps MOS list' },
  navy: { short: 'Rating', long: 'enlisted rating', plural: 'Navy ratings list' },
  'air-force': { short: 'AFSC', long: 'Air Force Specialty Code', plural: 'Air Force AFSC list' },
  'space-force': { short: 'SFSC', long: 'Space Force Specialty Code', plural: 'Space Force SFSC list' },
  'coast-guard': { short: 'Rating', long: 'enlisted rating', plural: 'Coast Guard ratings list' },
};

export function catalog(): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const t of tools) {
    const live = t.kind === 'fitness'
      ? Object.values(fitness[`./fitness/${t.branch}.ts`] ?? {}).some((v) => isTest(v) && v.id === t.testId)
      : Object.values(body[`./body-comp/${t.branch}.ts`] ?? {}).some(isStandard);
    if (live) items.push({ group: t.kind === 'fitness' ? 'Fitness tests' : 'Body composition', branch: t.branch, name: t.name, href: toolPath(t), blurb: t.lede.split('. ')[0] + '.' });
  }
  for (const b of BRANCHES) {
    for (const page of careerPages.filter((c) => c.branch === b.id && has(career, `./career/${b.id}.ts`, c.dataKey))) {
      items.push({ group: 'Career and promotion', branch: b.id, name: page.name, href: page.href, blurb: page.blurb });
    }
    if (((jobs[`./reference/jobs/${b.id}.ts`]?.jobs ?? []) as unknown[]).length) items.push({ group: 'Career and promotion', branch: b.id, name: jobWord[b.id].plural, href: `/reference/jobs/${b.id}/`, blurb: `Every current ${jobWord[b.id].long} by career field.` });
    const awardList = (awards[`./reference/awards/${b.id}.ts`]?.awards ?? []) as { name: string; stripes?: unknown[] }[];
    const hasRack = awardList.some((a) => a.stripes?.length || a.name in ribbonPatterns);
    if (awardList.length) items.push({ group: 'Reference', branch: b.id, name: hasRack ? `${b.short} ribbon rack builder` : `${b.short} medals and ribbons`, href: `/reference/awards/${b.id}/`, blurb: hasRack ? 'Build your rack in order of precedence, with devices, and download it.' : 'Medals and ribbons in order of precedence.' });
    if (has(heritage, `./heritage/${b.id}.ts`, 'heritage')) items.push({ group: 'Heritage', branch: b.id, name: `${b.short} history`, href: `/heritage/${b.id}/`, blurb: 'Founding, key moments, leaders, notable members and equipment.' });
  }
  if (has(reference, './reference/ranks.ts', 'ranks')) items.push({ group: 'Career and promotion', branch: 'all', name: 'Military ranks', href: '/reference/ranks/', blurb: 'Every rank and pay grade in all six branches, with insignia.' });
  if (has(reference, './reference/pay.ts')) items.push({ group: 'Career and promotion', branch: 'all', name: 'Military pay chart', href: '/reference/military-pay-chart/', blurb: 'Monthly basic pay by grade and years of service.' });
  if (has(reference, './reference/phonetic.ts', 'phonetic')) items.push({ group: 'Reference', branch: 'all', name: 'Military phonetic alphabet', href: '/reference/phonetic-alphabet/', blurb: 'Alpha to Zulu, numbers and common radio prowords.' });
  if (has(reference, './reference/installations.ts', 'installations')) items.push({ group: 'Reference', branch: 'all', name: 'Military bases', href: '/reference/military-bases/', blurb: 'Major installations for every branch, by state and country.' });
  return items;
}

export const GROUPS: Group[] = ['Fitness tests', 'Body composition', 'Career and promotion', 'Reference', 'Heritage'];

/**
 * Every live path under /tools/, /reference/ and /heritage/: catalog items plus the
 * per-branch rank and base pages and the branch hubs. Used to drop related links to
 * pages whose data has not landed yet.
 */
export function livePaths(): Set<string> {
  const items = catalog();
  const paths = new Set<string>(['/tools/', ...items.map((i) => i.href)]);
  const ranks = (reference['./reference/ranks.ts']?.ranks ?? []) as { branch: string }[];
  const bases = (reference['./reference/installations.ts']?.installations ?? []) as { branch: string }[];
  for (const b of BRANCHES) {
    if (items.some((i) => i.branch === b.id)) paths.add(`/tools/${b.id}/`);
    if (ranks.some((r) => r.branch === b.id)) paths.add(`/reference/ranks/${b.id}/`);
    if (bases.some((r) => r.branch === b.id)) paths.add(`/reference/military-bases/${b.id}/`);
  }
  return paths;
}
