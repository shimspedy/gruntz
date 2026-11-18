/**
 * Portraits for Medal of Honor recipients, keyed by `${branch}|${name}` exactly as in
 * reference/honorees/*.ts. Only files whose Wikimedia Commons record marks them public
 * domain (U.S. government works) are listed; each keeps its credit and file page link.
 * Recipients without an entry show their rank insignia instead.
 */
export interface HonoreePhoto { src: string; credit: string; creditUrl: string }
export const honoreePhotos: Record<string, HonoreePhoto> = {};
export const honoreePhoto = (branch: string, name: string): HonoreePhoto | null => honoreePhotos[`${branch}|${name}`] ?? null;
