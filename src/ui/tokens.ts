import { Easing } from 'react-native-reanimated';

/**
 * Gruntz design tokens.
 *
 * One dark canvas, one grey family (neutral, slightly cool), one accent (signal blue).
 * White is the primary action colour; blue marks progress, links and active state.
 */
export const color = {
  bg: '#000000',
  bgRaised: '#111113',
  surface: '#1C1C1E',
  surfaceHigh: '#262628',
  surfacePressed: '#2C2C2E',
  line: '#2A2A2C',
  lineStrong: '#3A3A3C',

  text: '#FFFFFF',
  textSecondary: '#A1A1A6',
  textTertiary: '#6E6E73',
  textQuaternary: '#48484A',

  accent: '#2D8CFF',
  accentPressed: '#1F7AEB',
  accentSoft: 'rgba(45,140,255,0.16)',
  accentDeep: '#16325C',
  accentGlow: 'rgba(45,140,255,0.45)',

  ctaDisabled: '#8E8E93',
  onCta: '#000000',

  danger: '#FF453A',
  success: '#30D158',
  flame: '#FF6A1F',
  flameDeep: '#FFB21F',

  scrim: 'rgba(0,0,0,0.62)',

  // Full-bleed story colours used by onboarding interstitials.
  storyCrimson: '#C70B3E',
  storyBlue: '#1F46E0',
  storySky: '#2F8FF2',
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  hero: 32,
  pill: 999,
} as const;

/** 4pt grid. `gutter` is the screen edge inset. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  gutter: 20,
} as const;

export const font = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  heavy: 'DMSans_800ExtraBold',
  black: 'DMSans_900Black',
  italic: 'DMSans_600SemiBold_Italic',
} as const;

/** Motion vocabulary — every animation in the app picks from here. */
export const motion = {
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeInOut: Easing.bezier(0.65, 0, 0.35, 1),
  fast: 160,
  base: 240,
  slow: 380,
  stagger: 55,
  settle: { duration: 420, dampingRatio: 1 } as const,
  sheet: { duration: 380, dampingRatio: 0.86 } as const,
  bouncy: { duration: 500, dampingRatio: 0.62 } as const,
  press: { duration: 140, dampingRatio: 1 } as const,
} as const;

export const layout = {
  tabBarHeight: 58,
  ctaHeight: 56,
  rowHeight: 60,
  headerHeight: 52,
  /** Collapsed workout bar above the tabs. */
  miniBar: 64,
  /** Floating challenge pill plus its bottom gap. */
  pillBlock: 92,
} as const;
