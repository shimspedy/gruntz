import { gruntzTheme } from './palettes';
import type { ThemeColors } from './palettes';

/** Returns the app's color palette. Single unified theme — no switching. */
export function useColors(): ThemeColors {
  return gruntzTheme;
}
