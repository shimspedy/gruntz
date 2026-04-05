import { TextStyle, PixelRatio } from 'react-native';
import { colors } from './colors';

/**
 * Maximum font scale multiplier — prevents extreme Dynamic Type
 * from breaking layouts while still respecting user accessibility.
 * Apple HIG recommends supporting up to ~1.35× for most UI.
 */
export const MAX_FONT_MULTIPLIER = 1.35;

/** Scale a base font size by the system Dynamic Type setting, capped at MAX_FONT_MULTIPLIER */
export function scaledFontSize(base: number): number {
  const scale = Math.min(PixelRatio.getFontScale(), MAX_FONT_MULTIPLIER);
  return Math.round(base * scale);
}

export const typography: Record<string, TextStyle> = {
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subheading: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 16, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 13, fontWeight: '400', color: colors.textMuted },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1 },
};
