// Shared with reset/restore without loading HealthKit or waiting on native reads.
let suspended = 0;
let generation = 0;
const imports = new Set<Promise<boolean>>();

export const healthSyncGeneration = () => generation;
export const healthSyncAllowed = () => suspended === 0;

export function trackHealthImportWrite(write: Promise<boolean>): Promise<boolean> {
  imports.add(write);
  void write.finally(() => imports.delete(write)).catch(() => undefined);
  return write;
}

/** Invalidate native reads and drain only imports that have already started writing. */
export async function suspendHealthSyncForDataChange(): Promise<() => void> {
  suspended++;
  generation++;
  await Promise.allSettled([...imports]);
  let resumed = false;
  return () => { if (!resumed) { resumed = true; suspended--; } };
}
