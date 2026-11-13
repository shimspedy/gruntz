import { usePlanLibraryStore } from '../store/usePlanLibraryStore';
import { useProgramStore } from '../store/useProgramStore';
import { syncAthleteProfile } from './athletes';
import { planFollowerCounts, recordPlanFollow } from './planFollows';
import { getSupabase } from './supabaseClient';
import { syncPushToken } from './teamPush';

/** The plan this athlete is on: a library plan wins over a built-in program. */
export function followedPlanId(libraryPlanId: string | null, programId: string | null): string | null {
  return libraryPlanId ?? (programId ? `program-${programId}` : null);
}

const currentPlan = () => followedPlanId(usePlanLibraryStore.getState().activePlanId, useProgramStore.getState().selectedProgram);

let started = false;

/**
 * Keeps the account's social side in step with this phone: the push token (only while
 * team notifications are on), the public card (only while discoverable or following
 * someone) and the plan being followed. All of it is best effort and signed-in only.
 */
export function initializeSocial() {
  if (started) return;
  const supabase = getSupabase();
  if (!supabase) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session?.user.id || (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN')) return;
    // Outside the auth callback: Supabase calls made inside it can deadlock its lock.
    setTimeout(() => {
      void syncPushToken();
      void syncAthleteProfile();
      void recordPlanFollow(currentPlan());
      void planFollowerCounts();
    }, 0);
  });
  let last = currentPlan();
  const changed = () => {
    const next = currentPlan();
    if (next === last) return;
    last = next;
    void recordPlanFollow(next);
  };
  usePlanLibraryStore.subscribe(changed);
  useProgramStore.subscribe(changed);
}
