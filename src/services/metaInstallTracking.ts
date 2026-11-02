import { AppState } from 'react-native';
import {
  activateNativeMetaInstallTracking,
  readMetaInstallTrackingState,
  requestNativeMetaTrackingAuthorization,
  setNativeMetaInstallTrackingEnabled,
  type MetaInstallTrackingState,
} from '../../modules/gruntz-meta-events';

const listeners = new Set<() => void>();
let work: Promise<void> = Promise.resolve();
let choiceRevision = 0;
let activatedThisForeground = false;
let lifecycleStarted = false;

export const getMetaInstallTrackingState = readMetaInstallTrackingState;

export function subscribeMetaInstallTracking(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const publish = () => { for (const listener of listeners) listener(); };

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = work.then(operation, operation);
  work = result.then(() => undefined, () => undefined);
  return result;
}

async function activateIfAllowed(): Promise<void> {
  if (activatedThisForeground || AppState.currentState !== 'active') return;
  if (!readMetaInstallTrackingState().enabled) return;
  const revision = choiceRevision;
  const activated = await activateNativeMetaInstallTracking();
  if (revision === choiceRevision) activatedThisForeground = activated;
}

async function requestAndEnable(revision: number): Promise<MetaInstallTrackingState> {
  if (revision !== choiceRevision) return readMetaInstallTrackingState();
  const permission = await requestNativeMetaTrackingAuthorization();
  // A pending system prompt must not undo a subsequent local opt-out or erase.
  if (revision === choiceRevision && permission !== 'not-determined' && permission !== 'unavailable') {
    setNativeMetaInstallTrackingEnabled(permission === 'authorized');
    publish();
    await activateIfAllowed();
  }
  return readMetaInstallTrackingState();
}

export function enableMetaInstallTracking(): Promise<MetaInstallTrackingState> {
  const revision = ++choiceRevision;
  return enqueue(() => requestAndEnable(revision));
}

/** Synchronous native preference barrier, including while an ATT prompt is open. */
export function disableMetaInstallTracking(): void {
  choiceRevision += 1;
  setNativeMetaInstallTrackingEnabled(false);
  activatedThisForeground = false;
  publish();
}

/** Called only after onboarding and normal navigation are ready; never gates access. */
export function startMetaInstallTracking(): () => void {
  if (lifecycleStarted || !readMetaInstallTrackingState().available) return () => undefined;
  lifecycleStarted = true;
  const synchronize = () => {
    const revision = choiceRevision;
    void enqueue(async () => {
      if (!lifecycleStarted || AppState.currentState !== 'active') return;
      const state = readMetaInstallTrackingState();
      publish();
      if (!state.choiceMade) await requestAndEnable(revision);
      else await activateIfAllowed();
    }).catch(() => { /* Measurement must never interrupt training. */ });
  };
  const subscription = AppState.addEventListener('change', (next) => {
    if (next === 'active') synchronize();
    else activatedThisForeground = false;
  });
  synchronize();
  return () => {
    lifecycleStarted = false;
    choiceRevision += 1;
    subscription.remove();
  };
}
