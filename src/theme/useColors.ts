import { useThemeStore } from '../store/useThemeStore';
import { palettes } from './palettes';
import type { ThemeColors } from './palettes';

export function useColors(): ThemeColors {
  const themeId = useThemeStore((s) => s.themeId);
  return palettes[themeId];
}
