import { requireOptionalNativeModule } from 'expo';

export type MetaTrackingPermission = 'not-determined' | 'authorized' | 'denied' | 'restricted' | 'unavailable';
export interface MetaInstallTrackingState {
  available: boolean;
  choiceMade: boolean;
  enabled: boolean;
  permission: MetaTrackingPermission;
}

type NativeMetaEvents = {
  getState(): MetaInstallTrackingState;
  setEnabled(enabled: boolean): MetaInstallTrackingState;
  requestAuthorization(): Promise<MetaTrackingPermission>;
  activate(): Promise<boolean>;
};

// Reading our native preferences/ATT status does not initialize the Meta SDK.
// Unsupported platforms and Expo Go do not ask permission or send measurement.
const native = requireOptionalNativeModule<NativeMetaEvents>('GruntzMetaEvents');
const unavailable: MetaInstallTrackingState = {
  available: false, choiceMade: false, enabled: false, permission: 'unavailable',
};

export function readMetaInstallTrackingState(): MetaInstallTrackingState {
  try { return native?.getState() ?? unavailable; } catch { return unavailable; }
}

export function setNativeMetaInstallTrackingEnabled(enabled: boolean): MetaInstallTrackingState {
  try { return native?.setEnabled(enabled) ?? unavailable; } catch { return unavailable; }
}

export async function requestNativeMetaTrackingAuthorization(): Promise<MetaTrackingPermission> {
  return native?.requestAuthorization() ?? 'unavailable';
}

export async function activateNativeMetaInstallTracking(): Promise<boolean> {
  return native?.activate() ?? false;
}
