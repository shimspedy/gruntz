export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  card: string;
  cardBorder: string;
  accent: string;
  accentGold: string;
  accentGreen: string;
  accentRed: string;
  accentOrange: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  xpBar: string;
  healthBar: string;
  streakFire: string;
  cyberYellow: string;
  borderGlow: string;
}

export type ThemeId =
  | 'nightOps' | 'desertStorm' | 'arcticRecon' | 'crimsonShadow'
  | 'usArmy' | 'usNavy' | 'usMarines' | 'usAirForce' | 'usCoastGuard' | 'usSpaceForce';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  group: 'tactical' | 'branch';
}

// ── Night Ops — Terminal green military (default) ──
export const nightOps: ThemeColors = {
  background: '#080C08',
  backgroundSecondary: '#0F170F',
  card: '#141E14',
  cardBorder: '#1E3A1E',
  accent: '#00FF41',
  accentGold: '#FFB800',
  accentGreen: '#00FF88',
  accentRed: '#FF003C',
  accentOrange: '#FF8C00',
  textPrimary: '#E0EDE0',
  textSecondary: '#8A9F8A',
  textMuted: '#4A6B4A',
  xpBar: '#00FF41',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',
  cyberYellow: '#F9F002',
  borderGlow: '#3AFF6E',
};

// ── Desert Storm — Tactical amber / sand ──
export const desertStorm: ThemeColors = {
  background: '#0C0A06',
  backgroundSecondary: '#16130C',
  card: '#1E1A10',
  cardBorder: '#3A3420',
  accent: '#FFB800',
  accentGold: '#FFB800',
  accentGreen: '#8BC34A',
  accentRed: '#FF5722',
  accentOrange: '#FF8C00',
  textPrimary: '#EDE8D8',
  textSecondary: '#9F9578',
  textMuted: '#6B6040',
  xpBar: '#FFB800',
  healthBar: '#8BC34A',
  streakFire: '#FF6B35',
  cyberYellow: '#F9F002',
  borderGlow: '#FFD54F',
};

// ── Arctic Recon — Icy cyan / deep navy ──
export const arcticRecon: ThemeColors = {
  background: '#06080C',
  backgroundSecondary: '#0C1017',
  card: '#101825',
  cardBorder: '#1E2A3E',
  accent: '#00D9FF',
  accentGold: '#FFD700',
  accentGreen: '#00FF88',
  accentRed: '#FF003C',
  accentOrange: '#FF8C00',
  textPrimary: '#E0E8F0',
  textSecondary: '#8A9AB0',
  textMuted: '#4A5A70',
  xpBar: '#00D9FF',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',
  cyberYellow: '#F9F002',
  borderGlow: '#3AE8FF',
};

// ── Crimson Shadow — Red ops / dark red-brown ──
export const crimsonShadow: ThemeColors = {
  background: '#0A0608',
  backgroundSecondary: '#140F12',
  card: '#1E1418',
  cardBorder: '#3A1E28',
  accent: '#FF003C',
  accentGold: '#FFB800',
  accentGreen: '#00FF88',
  accentRed: '#FF003C',
  accentOrange: '#FF6B35',
  textPrimary: '#F0E0E4',
  textSecondary: '#B08A95',
  textMuted: '#6B4A55',
  xpBar: '#FF003C',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',
  cyberYellow: '#F9F002',
  borderGlow: '#FF3A6E',
};

// ═══════════════════════════════════════════
// US MILITARY BRANCH THEMES
// ═══════════════════════════════════════════

// ── US Army — Black & Gold ──
export const usArmy: ThemeColors = {
  background: '#08080A',
  backgroundSecondary: '#111114',
  card: '#1A1A1E',
  cardBorder: '#2E2E34',
  accent: '#FFD700',
  accentGold: '#FFD700',
  accentGreen: '#4B5320',
  accentRed: '#FF003C',
  accentOrange: '#FF8C00',
  textPrimary: '#EEEEE8',
  textSecondary: '#9E9E96',
  textMuted: '#5E5E56',
  xpBar: '#FFD700',
  healthBar: '#4B5320',
  streakFire: '#FF6B35',
  cyberYellow: '#FFD700',
  borderGlow: '#FFE44D',
};

// ── US Navy — Navy blue & Gold ──
export const usNavy: ThemeColors = {
  background: '#04060C',
  backgroundSecondary: '#0A0E18',
  card: '#101828',
  cardBorder: '#1E2A42',
  accent: '#FFD700',
  accentGold: '#FFD700',
  accentGreen: '#00FF88',
  accentRed: '#FF003C',
  accentOrange: '#FF8C00',
  textPrimary: '#E0E4F0',
  textSecondary: '#8A90B0',
  textMuted: '#4A5070',
  xpBar: '#FFD700',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',
  cyberYellow: '#FFD700',
  borderGlow: '#FFE44D',
};

// ── US Marines — Scarlet & Gold ──
export const usMarines: ThemeColors = {
  background: '#0A0606',
  backgroundSecondary: '#160E0E',
  card: '#201414',
  cardBorder: '#3C2020',
  accent: '#CC0000',
  accentGold: '#FFD700',
  accentGreen: '#00CC66',
  accentRed: '#CC0000',
  accentOrange: '#FF6B35',
  textPrimary: '#F0E4E4',
  textSecondary: '#B08888',
  textMuted: '#6B4848',
  xpBar: '#CC0000',
  healthBar: '#00CC66',
  streakFire: '#FF6B35',
  cyberYellow: '#FFD700',
  borderGlow: '#FF3333',
};

// ── US Air Force — Ultramarine blue & Silver ──
export const usAirForce: ThemeColors = {
  background: '#06080E',
  backgroundSecondary: '#0C1018',
  card: '#121A2A',
  cardBorder: '#1E2C48',
  accent: '#00308F',
  accentGold: '#C0C0C0',
  accentGreen: '#00CC88',
  accentRed: '#FF003C',
  accentOrange: '#FF8C00',
  textPrimary: '#E0E6F2',
  textSecondary: '#8894B8',
  textMuted: '#485878',
  xpBar: '#4169E1',
  healthBar: '#00CC88',
  streakFire: '#FF6B35',
  cyberYellow: '#C0C0C0',
  borderGlow: '#6688FF',
};

// ── US Coast Guard — Racing stripe blue & Orange ──
export const usCoastGuard: ThemeColors = {
  background: '#06080C',
  backgroundSecondary: '#0C1016',
  card: '#101824',
  cardBorder: '#1E2A3C',
  accent: '#FF6600',
  accentGold: '#FF6600',
  accentGreen: '#00CC88',
  accentRed: '#FF003C',
  accentOrange: '#FF6600',
  textPrimary: '#E4E8F0',
  textSecondary: '#8A94B0',
  textMuted: '#4A5470',
  xpBar: '#FF6600',
  healthBar: '#00CC88',
  streakFire: '#FF6B35',
  cyberYellow: '#FF9933',
  borderGlow: '#FF8833',
};

// ── US Space Force — Deep space blue & Silver ──
export const usSpaceForce: ThemeColors = {
  background: '#040610',
  backgroundSecondary: '#0A0E1C',
  card: '#10162A',
  cardBorder: '#1C2644',
  accent: '#C0C0C0',
  accentGold: '#C0C0C0',
  accentGreen: '#00FF88',
  accentRed: '#FF003C',
  accentOrange: '#FF8C00',
  textPrimary: '#E4E8F4',
  textSecondary: '#8890B4',
  textMuted: '#484E74',
  xpBar: '#C0C0C0',
  healthBar: '#00FF88',
  streakFire: '#FF6B35',
  cyberYellow: '#E0E0E0',
  borderGlow: '#D4D4F0',
};

export const palettes: Record<ThemeId, ThemeColors> = {
  nightOps,
  desertStorm,
  arcticRecon,
  crimsonShadow,
  usArmy,
  usNavy,
  usMarines,
  usAirForce,
  usCoastGuard,
  usSpaceForce,
};

export const themeMetas: ThemeMeta[] = [
  // Tactical themes
  { id: 'nightOps', name: 'Night Ops', icon: '🌿', description: 'Terminal green', group: 'tactical' },
  { id: 'desertStorm', name: 'Desert Storm', icon: '🏜️', description: 'Tactical amber', group: 'tactical' },
  { id: 'arcticRecon', name: 'Arctic Recon', icon: '🧊', description: 'Icy cyan', group: 'tactical' },
  { id: 'crimsonShadow', name: 'Crimson Shadow', icon: '🔴', description: 'Blood red ops', group: 'tactical' },
  // US Military branch themes
  { id: 'usArmy', name: 'Army', icon: '⭐', description: 'Black & gold', group: 'branch' },
  { id: 'usNavy', name: 'Navy', icon: '⚓', description: 'Navy & gold', group: 'branch' },
  { id: 'usMarines', name: 'Marines', icon: '🦅', description: 'Scarlet & gold', group: 'branch' },
  { id: 'usAirForce', name: 'Air Force', icon: '✈️', description: 'Blue & silver', group: 'branch' },
  { id: 'usCoastGuard', name: 'Coast Guard', icon: '🚢', description: 'Blue & orange', group: 'branch' },
  { id: 'usSpaceForce', name: 'Space Force', icon: '🚀', description: 'Dark blue & silver', group: 'branch' },
];
