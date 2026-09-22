import { Rank } from '../types';

export interface RankInfo {
  rank: Rank;
  minLevel: number;
  maxLevel: number;
  title: string;
  description: string;
  icon: string;
}

export const ranks: RankInfo[] = [
  { rank: 'Recruit', minLevel: 1, maxLevel: 4, title: 'Recruit', description: 'Just getting started. Prove yourself.', icon: 'rank' },
  { rank: 'Cadet', minLevel: 5, maxLevel: 9, title: 'Cadet', description: 'You\'ve earned your place. Keep pushing.', icon: 'rank' },
  { rank: 'Operator', minLevel: 10, maxLevel: 19, title: 'Operator', description: 'Combat ready. Serious discipline.', icon: 'rank' },
  { rank: 'Veteran', minLevel: 20, maxLevel: 29, title: 'Veteran', description: 'Battle-tested. Respected.', icon: 'rank' },
  { rank: 'Elite', minLevel: 30, maxLevel: 39, title: 'Elite', description: 'Top tier. Few make it here.', icon: 'rank' },
  { rank: 'Shadow', minLevel: 40, maxLevel: 49, title: 'Shadow', description: 'Silent. Deadly. Unstoppable.', icon: 'rank' },
  { rank: 'Apex', minLevel: 50, maxLevel: 999, title: 'Apex', description: 'The pinnacle. Legendary status.', icon: 'rank' },
];

/**
 * Civilian names for the same ladder. The progression is the app's spine, but its
 * military framing only belongs to people who chose Military Prep — everyone else
 * gets the same tiers in plain training language.
 */
const CIVILIAN: Record<Rank, { title: string; description: string }> = {
  Recruit: { title: 'Beginner', description: 'Just getting started. Build the habit.' },
  Cadet: { title: 'Novice', description: 'You have earned your place. Keep pushing.' },
  Operator: { title: 'Intermediate', description: 'Training is a routine now. Serious discipline.' },
  Veteran: { title: 'Advanced', description: 'Proven work behind you. Well earned.' },
  Elite: { title: 'Elite', description: 'Top tier. Few make it here.' },
  Shadow: { title: 'Master', description: 'Relentless. Consistent. Hard to match.' },
  Apex: { title: 'Apex', description: 'The pinnacle. Best in class.' },
};

export function getRankInfo(rank: Rank): RankInfo | undefined {
  return ranks.find(r => r.rank === rank);
}

/** Display name for a rank, in the language that fits the athlete. */
export function rankTitle(rank: Rank, military: boolean): string {
  return military ? rank : CIVILIAN[rank].title;
}

export function rankDescription(rank: Rank, military: boolean): string {
  return military ? (getRankInfo(rank)?.description ?? '') : CIVILIAN[rank].description;
}
