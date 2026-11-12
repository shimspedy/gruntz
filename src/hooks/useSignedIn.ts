import { useSyncExternalStore } from 'react';
import { getSupabase } from '../services/supabaseClient';

/**
 * One auth read and one listener for the whole app. Each consumer used to open its own,
 * so every tab header resolved sign-in separately and started from "unknown" again.
 */
let signedIn: boolean | null = null;
let watching = false;
const listeners = new Set<() => void>();

function publish(next: boolean) {
  if (signedIn === next) return;
  signedIn = next;
  listeners.forEach((listener) => listener());
}

function watch() {
  if (watching) return;
  watching = true;
  const supabase = getSupabase();
  if (!supabase) { publish(false); return; }
  void supabase.auth.getSession().then(({ data }) => publish(!!data.session?.user.id)).catch(() => publish(false));
  supabase.auth.onAuthStateChange((_event, session) => publish(!!session?.user.id));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  watch();
  return () => { listeners.delete(listener); };
}

const snapshot = () => signedIn;

/**
 * Whether this phone has a Gruntz account signed in. Null until known. Accounts are
 * optional: this is what decides whether the social parts of the app are shown at all.
 */
export function useSignedIn(): boolean | null {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
