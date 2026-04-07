import { Rank, AvatarUnlock } from '../types';

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

export const avatarUnlocks: AvatarUnlock[] = [
  { id: 'outfit_recruit', name: 'Basic PT Gear', type: 'outfit', required_rank: 'Recruit', required_level: 1, icon: 'outfit', description: 'Standard issue training gear.' },
  { id: 'outfit_cadet', name: 'Tactical Training Set', type: 'outfit', required_rank: 'Cadet', required_level: 5, icon: 'outfit', description: 'Upgraded tactical training attire.' },
  { id: 'gear_gloves', name: 'Training Gloves', type: 'gear', required_rank: 'Cadet', required_level: 7, icon: 'gear', description: 'Grip-enhanced training gloves.' },
  { id: 'outfit_operator', name: 'Operator Combat Suit', type: 'outfit', required_rank: 'Operator', required_level: 10, icon: 'outfit', description: 'Full operator combat training suit.' },
  { id: 'gear_headband', name: 'Tactical Headband', type: 'gear', required_rank: 'Operator', required_level: 12, icon: 'gear', description: 'Focus-enhancing headband.' },
  { id: 'badge_first_week', name: 'Week 1 Badge', type: 'badge', required_rank: 'Recruit', required_level: 1, icon: 'badge', description: 'Completed the first week of training.' },
  { id: 'badge_streak_7', name: '7-Day Streak Badge', type: 'badge', required_rank: 'Recruit', required_level: 1, icon: 'badge', description: 'Maintained a 7-day training streak.' },
  { id: 'outfit_veteran', name: 'Veteran Warfare Kit', type: 'outfit', required_rank: 'Veteran', required_level: 20, icon: 'outfit', description: 'Battle-worn veteran training kit.' },
  { id: 'outfit_elite', name: 'Elite Stealth Suit', type: 'outfit', required_rank: 'Elite', required_level: 30, icon: 'outfit', description: 'All-black elite stealth suit.' },
  { id: 'gear_watch', name: 'Tactical Watch', type: 'gear', required_rank: 'Elite', required_level: 35, icon: 'gear', description: 'Precision tactical chronometer.' },
  { id: 'outfit_shadow', name: 'Shadow Ops Gear', type: 'outfit', required_rank: 'Shadow', required_level: 40, icon: 'outfit', description: 'Classified shadow operations gear.' },
  { id: 'outfit_apex', name: 'Apex Legendary Armor', type: 'outfit', required_rank: 'Apex', required_level: 50, icon: 'outfit', description: 'Legendary armor for the apex warrior.' },
];

export function getRankInfo(rank: Rank): RankInfo | undefined {
  return ranks.find(r => r.rank === rank);
}

export function getUnlockedAvatarItems(level: number, rank: Rank): AvatarUnlock[] {
  const rankOrder: Rank[] = ['Recruit', 'Cadet', 'Operator', 'Veteran', 'Elite', 'Shadow', 'Apex'];
  const rankIndex = rankOrder.indexOf(rank);
  return avatarUnlocks.filter(u => {
    const requiredRankIndex = rankOrder.indexOf(u.required_rank);
    return requiredRankIndex <= rankIndex && u.required_level <= level;
  });
}
