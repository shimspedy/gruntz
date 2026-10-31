import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useChromePrefs } from '../store/useUiStore';

/** Big enough for the 112pt avatar on a 3x screen, small enough to never matter on disk. */
const PHOTO_SIZE = 512;
const PHOTO_PREFIX = 'profile-photo-';

export type PhotoSource = 'camera' | 'library';
export type PhotoOutcome = 'saved' | 'cancelled' | 'denied' | 'unavailable' | 'failed';

/** The legacy file API, loaded on use: the module is native and this screen is not always reached. */
async function documents() {
  const fs = await import('expo-file-system/legacy');
  if (!fs.documentDirectory) throw new Error('Photo storage is unavailable on this device.');
  return { fs, directory: fs.documentDirectory };
}

/** Where the current photo lives, or null when there is none. */
export function profilePhotoUri(): string | null {
  const file = useChromePrefs.getState().profilePhotoFile;
  return file ? `${documentDirectoryCache ?? ''}${file}` : null;
}

// Filled on first use so `profilePhotoUri` can stay synchronous for rendering.
let documentDirectoryCache: string | null = null;
export async function loadProfilePhotoLocation(): Promise<string | null> {
  try {
    const { fs, directory } = await documents();
    documentDirectoryCache = directory;
    const file = useChromePrefs.getState().profilePhotoFile;
    if (!file) return null;
    // A restored backup or a reinstall can name a file that is no longer there.
    const info = await fs.getInfoAsync(`${directory}${file}`);
    if (!info.exists) { useChromePrefs.getState().setProfilePhotoFile(null); return null; }
    return `${directory}${file}`;
  } catch {
    return null;
  }
}

async function permitted(source: PhotoSource): Promise<boolean> {
  const current = source === 'camera' ? await ImagePicker.getCameraPermissionsAsync() : await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  return asked.granted;
}

/**
 * Picks or takes a photo, crops it square, scales it down and keeps it in the app's
 * documents folder. Each photo gets a new file name so the image cache never shows
 * the previous one; the old file is removed once the new one is in place.
 */
export async function changeProfilePhoto(source: PhotoSource): Promise<PhotoOutcome> {
  try {
    if (!await permitted(source)) return 'denied';
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9, exif: false };
    const picked = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled || !picked.assets[0]?.uri) return 'cancelled';
    const asset = picked.assets[0];
    // The crop sheet can be skipped on some Android pickers; resizing to a square
    // keeps the avatar honest either way.
    const side = Math.min(asset.width || PHOTO_SIZE, asset.height || PHOTO_SIZE, PHOTO_SIZE);
    const shrunk = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: side, height: side } }], {
      compress: 0.85, format: ImageManipulator.SaveFormat.JPEG,
    });
    const { fs, directory } = await documents();
    documentDirectoryCache = directory;
    const previous = useChromePrefs.getState().profilePhotoFile;
    const next = `${PHOTO_PREFIX}${Date.now()}.jpg`;
    await fs.copyAsync({ from: shrunk.uri, to: `${directory}${next}` });
    useChromePrefs.getState().setProfilePhotoFile(next);
    if (previous && previous !== next) await fs.deleteAsync(`${directory}${previous}`, { idempotent: true }).catch(() => undefined);
    await fs.deleteAsync(shrunk.uri, { idempotent: true }).catch(() => undefined);
    return 'saved';
  } catch (error) {
    if (__DEV__) console.warn('[profilePhoto] change failed', error);
    return error instanceof Error && /unavailable/i.test(error.message) ? 'unavailable' : 'failed';
  }
}

/**
 * Keeps a photo fetched from the account as this phone's photo. Returns its file
 * name, or null when a photo was set on this phone in the meantime.
 */
export async function saveDownloadedProfilePhoto(bytes: ArrayBuffer): Promise<string | null> {
  if (useChromePrefs.getState().profilePhotoFile) return null;
  const { directory } = await documents();
  documentDirectoryCache = directory;
  const next = `${PHOTO_PREFIX}${Date.now()}.jpg`;
  const { File } = await import('expo-file-system');
  new File(`${directory}${next}`).write(new Uint8Array(bytes));
  if (useChromePrefs.getState().profilePhotoFile) return null;
  useChromePrefs.getState().setProfilePhotoFile(next);
  return next;
}

/** Back to the initial. Removing the file after forgetting it means a failed delete costs disk, never a stale avatar. */
export async function removeProfilePhoto(): Promise<void> {
  const previous = useChromePrefs.getState().profilePhotoFile;
  useChromePrefs.getState().setProfilePhotoFile(null);
  if (!previous) return;
  try {
    const { fs, directory } = await documents();
    await fs.deleteAsync(`${directory}${previous}`, { idempotent: true });
  } catch { /* Nothing points at it any more. */ }
}

/** Every photo file this app has ever written, for "delete all data". */
export async function deleteAllProfilePhotos(): Promise<void> {
  try {
    const { fs, directory } = await documents();
    const names = await fs.readDirectoryAsync(directory);
    await Promise.all(names.filter((name) => name.startsWith(PHOTO_PREFIX)).map((name) => fs.deleteAsync(`${directory}${name}`, { idempotent: true }).catch(() => undefined)));
  } catch { /* The folder itself is gone or unreadable; nothing to remove. */ }
}
