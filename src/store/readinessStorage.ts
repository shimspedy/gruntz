import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createDurableFileStorage } from './durableFileStorage';

export const READINESS_STORAGE_KEY = '@gruntz_readiness';

async function slotFile(slot: number) {
  const fs = await import('expo-file-system/legacy');
  if (!fs.documentDirectory) throw new Error('Activity storage is unavailable on this device.');
  return { fs, path: `${fs.documentDirectory}gruntz-activity-history-${slot}.json` };
}

/** iOS keeps its existing file-backed AsyncStorage; Android bypasses SQLite for route history. */
export const readinessStorage = Platform?.OS === 'android'
  ? createDurableFileStorage(READINESS_STORAGE_KEY, AsyncStorage, {
    read: async (slot) => {
      const { fs, path } = await slotFile(slot);
      if (!(await fs.getInfoAsync(path)).exists) return null;
      return fs.readAsStringAsync(path);
    },
    write: async (slot, value) => {
      const { fs, path } = await slotFile(slot);
      await fs.writeAsStringAsync(path, value);
    },
    remove: async (slot) => {
      const { fs, path } = await slotFile(slot);
      await fs.deleteAsync(path, { idempotent: true });
    },
  }) : AsyncStorage;
