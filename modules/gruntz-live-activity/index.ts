import { requireOptionalNativeModule } from 'expo';

type NativeLiveActivity = {
  isSupported(): boolean;
  sync(payload: string): Promise<void>;
  end(): Promise<void>;
  drainLoggedSets(): string;
};

// Absent on Android, web, older iOS and Expo Go: every call below is then a no-op.
const native = requireOptionalNativeModule<NativeLiveActivity>('GruntzLiveActivity');

export function liveActivitySupported(): boolean {
  try {
    return !!native?.isSupported();
  } catch {
    return false;
  }
}

export async function syncNativeLiveActivity(payload: object): Promise<void> {
  if (native) await native.sync(JSON.stringify(payload));
}

export async function endNativeLiveActivity(): Promise<void> {
  if (native) await native.end();
}

/** Sets logged from the Lock Screen or Dynamic Island since the last call. */
export function drainNativeLoggedSets(): { exKey: string; setId: string; at: number }[] {
  if (!native) return [];
  try {
    const parsed: unknown = JSON.parse(native.drainLoggedSets() || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is { exKey: string; setId: string; at: number } =>
      !!e && typeof e.exKey === 'string' && typeof e.setId === 'string' && typeof e.at === 'number' && Number.isFinite(e.at));
  } catch {
    return [];
  }
}
