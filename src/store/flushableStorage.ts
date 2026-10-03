interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Track the actual native write so a completed recording is not cleared before its history is durable. */
export function createFlushableStorage(base: Storage, canWrite: () => boolean = () => true) {
  let latest: { key: string; value: string; promise: Promise<void> } | null = null;
  const inFlight = new Set<Promise<void>>();
  const storage: Storage = {
    getItem: (key) => base.getItem(key),
    removeItem: (key) => base.removeItem(key),
    setItem: (key, value) => {
      if (!canWrite()) return Promise.resolve();
      const promise = base.setItem(key, value);
      latest = { key, value, promise };
      inFlight.add(promise);
      // Zustand's synchronous actions cannot await persistence; retain failures
      // for flush while preventing an unhandled native-storage rejection.
      void promise.then(() => inFlight.delete(promise), () => inFlight.delete(promise));
      return promise;
    },
  };
  const flush = async () => {
    while (latest) {
      const write = latest;
      await Promise.allSettled([...inFlight]);
      try {
        await write.promise;
      } catch (error) {
        if (latest !== write) continue;
        // A retry after disk/network recovery must work even when the activity ID
        // has already been added in memory and its duplicate action is a no-op.
        if (!canWrite()) throw error;
        await storage.setItem(write.key, write.value);
        continue;
      }
      if (latest === write) return;
    }
  };
  return { storage, flush };
}
