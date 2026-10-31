import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Where the Supabase session (including its refresh token) lives: the Keychain /
 * Keystore rather than plain app storage, and never in a device backup.
 *
 * A session is larger than SecureStore is comfortable holding in one item, so it is
 * split into chunks. Sessions saved by older builds in AsyncStorage are moved across
 * on first read, so nobody is signed out by the change. If the secure store fails,
 * the session falls back to AsyncStorage rather than signing the athlete out.
 */
const CHUNK = 1800;
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
const countKey = (key: string) => `${key}.chunks`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;
const secureAvailable = Platform.OS === 'ios' || Platform.OS === 'android';
// The Keychain outlives an uninstall; app storage does not. This marker lives in app
// storage, so a reinstall still starts signed out, as it did before. Not `@gruntz`-
// prefixed, so erasing training data does not sign the athlete out either.
const installMarker = (key: string) => `gruntz.secure-session.${key}`;

async function readSecure(key: string): Promise<string | null> {
  if ((await AsyncStorage.getItem(installMarker(key))) == null) {
    await removeSecure(key);
    return null;
  }
  const count = Number(await SecureStore.getItemAsync(countKey(key), OPTIONS));
  if (!Number.isInteger(count) || count <= 0) return null;
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(chunkKey(key, i), OPTIONS);
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join('');
}

async function removeSecure(key: string): Promise<void> {
  const count = Number(await SecureStore.getItemAsync(countKey(key), OPTIONS));
  await SecureStore.deleteItemAsync(countKey(key), OPTIONS);
  if (Number.isInteger(count)) {
    for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(chunkKey(key, i), OPTIONS);
  }
}

async function writeSecure(key: string, value: string): Promise<void> {
  await removeSecure(key);
  const count = Math.max(1, Math.ceil(value.length / CHUNK));
  for (let i = 0; i < count; i += 1) {
    await SecureStore.setItemAsync(chunkKey(key, i), value.slice(i * CHUNK, (i + 1) * CHUNK), OPTIONS);
  }
  // Written last, so a half-written session is never read back as whole.
  await SecureStore.setItemAsync(countKey(key), String(count), OPTIONS);
  await AsyncStorage.setItem(installMarker(key), '1');
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!secureAvailable) return AsyncStorage.getItem(key);
    try {
      const stored = await readSecure(key);
      if (stored != null) return stored;
      const legacy = await AsyncStorage.getItem(key);
      if (legacy != null) {
        await writeSecure(key, legacy);
        await AsyncStorage.removeItem(key);
      }
      return legacy;
    } catch (error) {
      if (__DEV__) console.warn('[auth] secure session read failed', error);
      return AsyncStorage.getItem(key);
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (!secureAvailable) return AsyncStorage.setItem(key, value);
    try {
      await writeSecure(key, value);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      if (__DEV__) console.warn('[auth] secure session write failed', error);
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.multiRemove([key, installMarker(key)]);
    if (!secureAvailable) return;
    try {
      await removeSecure(key);
    } catch (error) {
      if (__DEV__) console.warn('[auth] secure session remove failed', error);
    }
  },
};
