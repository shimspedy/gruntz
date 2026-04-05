import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeId } from '../theme/palettes';

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  loadPersistedTheme: () => Promise<void>;
}

const STORAGE_KEY = '@gruntz_theme';

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: 'nightOps',

  setTheme: (id) => {
    set({ themeId: id });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  },

  loadPersistedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && ['nightOps', 'desertStorm', 'arcticRecon', 'crimsonShadow'].includes(saved)) {
        set({ themeId: saved as ThemeId });
      }
    } catch {
      // Use default
    }
  },
}));
