import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createDurableFileStorage } from './durableFileStorage';

/**
 * Storage for a store whose saved state can outgrow Android's AsyncStorage.
 *
 * Android's AsyncStorage is SQLite with a row that cannot be read back past about
 * 2 MB and a 6 MB database. A store that keeps history crosses that in ordinary use,
 * and from then on it fails to load at launch. On Android such a store lives in two
 * revision files instead, and its old AsyncStorage row is moved across on first read.
 * iOS keeps AsyncStorage, which is already file-backed there and has no such limit.
 *
 * @param fileStem the files are `<documents>/<fileStem>-0.json` and `-1.json`
 * @param what how error messages name the data, e.g. "activity history"
 */
export function createAndroidFileStorage(key: string, fileStem: string, what: string) {
  if (Platform?.OS !== 'android') return AsyncStorage;
  const slotFile = async (slot: number) => {
    const fs = await import('expo-file-system/legacy');
    if (!fs.documentDirectory) throw new Error('File storage is unavailable on this device.');
    return { fs, path: `${fs.documentDirectory}${fileStem}-${slot}.json` };
  };
  return createDurableFileStorage(key, AsyncStorage, {
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
  }, what);
}
