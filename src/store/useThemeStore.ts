import { create } from 'zustand';

/**
 * Minimal theme store — kept for API compatibility.
 * The app now uses a single unified theme (Matte Black + Electric Lime).
 * No theme switching needed.
 */
interface ThemeState {
  /** No-op — kept so callers don't break */
  loadPersistedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>(() => ({
  loadPersistedTheme: async () => {
    // Single theme — nothing to load
  },
}));
