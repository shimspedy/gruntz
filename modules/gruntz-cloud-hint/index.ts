import { requireOptionalNativeModule } from 'expo';

type NativeCloudHint = {
  prime(): boolean;
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

// iOS only; absent on Android, web and Expo Go, where every call is a no-op.
const native = requireOptionalNativeModule<NativeCloudHint>('GruntzCloudHint');

export function primeCloudHints(): void {
  try { native?.prime(); } catch { /* iCloud unavailable */ }
}

export function readCloudHint(key: string): string | null {
  try { return native?.get(key) ?? null; } catch { return null; }
}

export function writeCloudHint(key: string, value: string | null): void {
  try {
    if (value === null) native?.remove(key);
    else native?.set(key, value);
  } catch { /* iCloud unavailable */ }
}
