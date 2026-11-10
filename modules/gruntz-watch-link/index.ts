import { requireOptionalNativeModule } from 'expo';

type Subscription = { remove(): void };
type NativeWatchLink = {
  /** `{ supported, paired, installed, reachable }` as JSON. */
  status(): string;
  push(state: string): Promise<void>;
  drainCommands(): string;
  addListener(event: 'onCommands' | 'onStatus', listener: () => void): Subscription;
};

// Absent on Android, web and builds made before the watch link existed: every call is then a no-op.
const native = requireOptionalNativeModule<NativeWatchLink>('GruntzWatchLink');

export interface WatchLinkStatus { supported: boolean; paired: boolean; installed: boolean; reachable: boolean }
const NONE: WatchLinkStatus = { supported: false, paired: false, installed: false, reachable: false };

export function watchLinkStatus(): WatchLinkStatus {
  if (!native) return NONE;
  try {
    const parsed = JSON.parse(native.status()) as Partial<WatchLinkStatus>;
    return { supported: !!parsed.supported, paired: !!parsed.paired, installed: !!parsed.installed, reachable: !!parsed.reachable };
  } catch {
    return NONE;
  }
}

/** Hands the watch the latest state. The newest one always replaces any still in transit. */
export async function pushWatchState(state: object): Promise<void> {
  if (native) await native.push(JSON.stringify(state));
}

/** Commands the watch sent since the last call, unparsed: the caller validates every one. */
export function drainWatchCommands(): unknown {
  if (!native) return [];
  try {
    return JSON.parse(native.drainCommands() || '[]');
  } catch {
    return [];
  }
}

export function onWatchCommands(listener: () => void): Subscription {
  return native?.addListener('onCommands', listener) ?? { remove() {} };
}

export function onWatchStatus(listener: () => void): Subscription {
  return native?.addListener('onStatus', listener) ?? { remove() {} };
}
