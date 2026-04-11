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
  glassBackground: string;
  glassBorder: string;
  glassHighlight: string;
  glassShadow: string;
}

/** Single unified theme — Matte Black + Electric Lime */
export const gruntzTheme: ThemeColors = {
  // Deep matte black base
  background: '#0A0A0A',
  backgroundSecondary: '#141414',
  card: '#1A1A1A',
  cardBorder: '#2A2A2A',

  // Electric lime accent system
  accent: '#AAFF00',
  accentGold: '#FFD700',
  accentGreen: '#00FF88',
  accentRed: '#FF3B5C',
  accentOrange: '#FF8800',

  // Clean text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  // Gamification
  xpBar: '#AAFF00',
  healthBar: '#00FF88',
  streakFire: '#FF6B2C',

  // UI accents
  cyberYellow: '#FFE600',
  borderGlow: '#AAFF00',

  // Liquid glass tokens
  glassBackground: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.2)',
  glassShadow: 'rgba(0,0,0,0.5)',
};
