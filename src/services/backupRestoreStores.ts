import { isTrackedSession } from '../features/activityHistory';

type RestorableStore = {
  getState: () => Record<string, unknown>;
  getInitialState: () => Record<string, unknown>;
  setState: (state: Record<string, unknown>, replace: true) => void;
  persist: {
    getOptions: () => {
          name: string; version?: number; storage?: unknown;
          migrate?: (state: unknown, version: number) => unknown;
          merge?: (state: unknown, initial: Record<string, unknown>) => Record<string, unknown>;
        };
    setOptions: (options: { storage: unknown }) => void;
    clearStorage: () => void | Promise<void>;
  };
};

/** Load stores only for an explicit restore; ordinary backups read disk directly. */
async function storesForRestore() {
  const [user, log, notes, readiness, plan, program, routines, challenges, session] = await Promise.all([
    import('../store/useUserStore'), import('../store/useExerciseLogStore'),
    import('../store/useExerciseNotesStore'), import('../store/useReadinessStore'),
    import('../store/usePlanLibraryStore'), import('../store/useProgramStore'),
    import('../store/useRoutineStore'), import('../store/useChallengeStore'),
    import('../store/useSessionStore'),
  ]);
  return [user.useUserStore, log.useExerciseLogStore, notes.useExerciseNotesStore,
    readiness.useReadinessStore, plan.usePlanLibraryStore, program.useProgramStore,
    routines.useRoutineStore, challenges.useChallengeStore, session.useSessionStore];
}

/** Prepare every store before writing anything. Uses each store's existing migration. */
export async function prepareStoreRestore(values: Record<string, string>): Promise<() => Promise<void>> {
  const stores = await storesForRestore();
  const [{ flushUserPersistence }, { flushReadinessPersistence, routeMigrationSettled }] = await Promise.all([
    import('../store/useUserStore'), import('../store/useReadinessStore'),
  ]);
  // A route migration still writing would recreate routes of the history being replaced.
  await routeMigrationSettled?.();
  // Completed activity writes must settle before the backup replaces their keys.
  await Promise.all([flushUserPersistence(), flushReadinessPersistence()]);
  const updates: { target: RestorableStore; options: ReturnType<RestorableStore['persist']['getOptions']>; next: Record<string, unknown>; previous: Record<string, unknown> }[] = [];
  for (const store of stores) {
    // The structural type keeps each store's own state/actions intact.
    const target = store as unknown as RestorableStore;
    const options = target.persist.getOptions();
    const initial = { ...target.getInitialState() };
    if ('hasHydrated' in initial) initial.hasHydrated = true;
    let next = initial;
    const raw = values[options.name];
    if (raw) {
      const parsed = JSON.parse(raw) as { state: Record<string, unknown>; version?: number };
      const version = parsed.version ?? 0;
      if (version > (options.version ?? 0)) throw new Error('Update Gruntz before restoring this backup.');
      let persisted: unknown = parsed.state;
      if (version !== (options.version ?? 0)) {
        if (!options.migrate) throw new Error('This backup uses an unsupported storage version.');
        persisted = await options.migrate(parsed.state, version);
      }
      // Never allow a payload to replace store actions or transient hydration flags.
      const state = Object.fromEntries(Object.entries(persisted as Record<string, unknown>)
        .filter(([key]) => key in initial && typeof initial[key] !== 'function'
          && key !== 'hasHydrated' && key !== 'hydrationFailed'));
      if (options.name === '@gruntz_readiness' && state.trackedSessions !== undefined
        && (!Array.isArray(state.trackedSessions) || state.trackedSessions.some((activity: unknown) => !isTrackedSession(activity)))) {
        throw new Error('That backup contains invalid activity history or GPS routes.');
      }
      next = options.merge ? options.merge(state, initial) : { ...initial, ...state };
    }
    updates.push({ target, options, next, previous: target.getState() });
  }
  return async () => {
    // Cancel the session store's delayed write before replacing its live state.
    // Otherwise its one-second timer can resurrect the pre-restore workout.
    await stores.at(-1)!.persist.clearStorage();
    // Disk has already been committed. Suppress the duplicate asynchronous writes
    // triggered by setState, including writes from other stores' subscriptions.
    for (const { target } of updates) {
      target.persist.setOptions({ storage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined } });
    }
    try {
      for (const { target, next } of updates) target.setState(next, true);
    } catch (error) {
      for (const { target, previous } of updates) target.setState(previous, true);
      throw error;
    } finally {
      for (const { target, options } of updates) target.persist.setOptions({ storage: options.storage });
    }
    const { cancelRestDone, clearWorkoutProgress } = await import('./notifications');
    await Promise.allSettled([cancelRestDone(), clearWorkoutProgress()]);
  };
}
