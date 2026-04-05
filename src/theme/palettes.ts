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

export type ThemeId = 'nightOps' | 'desertStorm' | 'arcticRecon' | 'crimsonShadow';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
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

export const palettes: Record<ThemeId, ThemeColors> = {
  nightOps,
  desertStorm,
  arcticRecon,
  crimsonShadow,
};

export const themeMetas: ThemeMeta[] = [
  { id: 'nightOps', name: 'Night Ops', icon: '🌿', description: 'Terminal green' },
  { id: 'desertStorm', name: 'Desert Storm', icon: '🏜️', description: 'Tactical amber' },
  { id: 'arcticRecon', name: 'Arctic Recon', icon: '🧊', description: 'Icy cyan' },
  { id: 'crimsonShadow', name: 'Crimson Shadow', icon: '🔴', description: 'Blood red ops' },
];
