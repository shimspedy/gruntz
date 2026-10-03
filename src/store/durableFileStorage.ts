interface LegacyStorage {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}

export interface StorageSlots {
  read(slot: number): Promise<string | null>;
  write(slot: number, value: string): Promise<void>;
  remove(slot: number): Promise<void>;
}

type Revision = { format: 1; revision: number; payload: string | null; checksum: string; slot: number };

// Detect torn or truncated files without requiring a native crypto dependency.
function checksum(value: string | null, revision: number): string {
  const text = `${revision}:${value ?? '\u0000deleted'}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}

function validPayload(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      && parsed.state !== null && typeof parsed.state === 'object' && !Array.isArray(parsed.state)
      && (parsed.version === undefined || (Number.isInteger(parsed.version) && parsed.version >= 0));
  } catch { return false; }
}

function parse(raw: string | null, slot: number): Revision | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.format !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 1
      || (value.payload !== null && (typeof value.payload !== 'string' || !validPayload(value.payload)))
      || value.checksum !== checksum(value.payload, value.revision)) return null;
    return { ...value, slot };
  } catch { return null; }
}

/**
 * Two complete revisions avoid Android SQLite's row/database limits. The previous
 * intact revision remains readable if a process dies in the middle of a write.
 */
export function createDurableFileStorage(key: string, legacy: LegacyStorage, files: StorageSlots) {
  let queue: Promise<unknown> = Promise.resolve();
  const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = queue.then(operation, operation);
    queue = next.catch(() => undefined);
    return next;
  };
  const checkKey = (requested: string) => { if (requested !== key) throw new Error('Unexpected activity storage key.'); };
  const revisions = async () => {
    // Do not mistake an I/O error for an empty history and overwrite it.
    const raw = await Promise.all([files.read(0), files.read(1)]);
    const valid = raw.map(parse).filter((value): value is Revision => value !== null).sort((a, b) => b.revision - a.revision);
    return { current: valid[0] ?? null, occupied: raw.some((value) => value !== null) };
  };
  const write = async (payload: string | null, current: Revision | null): Promise<Revision> => {
    const slot = current ? 1 - current.slot : 0;
    const revision = (current?.revision ?? 0) + 1;
    if (!Number.isSafeInteger(revision)) throw new Error('Activity storage revision limit reached.');
    const next: Revision = { format: 1, revision, payload, checksum: checksum(payload, revision), slot };
    await files.write(slot, JSON.stringify(next));
    const saved = parse(await files.read(slot), slot);
    if (!saved || saved.revision !== revision || saved.payload !== payload) throw new Error('Activity history could not be saved completely. Please retry.');
    return saved;
  };
  const read = async (): Promise<Revision | null> => {
    const { current, occupied } = await revisions();
    if (current) return current;
    const old = await legacy.getItem(key);
    if (old !== null) {
      if (!validPayload(old)) throw new Error('Saved activity history is unreadable. Your existing data has been kept.');
      const migrated = await write(old, null);
      // Remove the SQLite copy only after the new file has been reread successfully.
      await legacy.removeItem(key);
      return migrated;
    }
    if (occupied) throw new Error('Saved activity history is unreadable. Your existing files have been kept.');
    return null;
  };
  return {
    getItem(requested: string): Promise<string | null> {
      checkKey(requested);
      return serialize(async () => (await read())?.payload ?? null);
    },
    setItem(requested: string, payload: string): Promise<void> {
      checkKey(requested);
      return serialize(async () => {
        if (!validPayload(payload)) throw new Error('Activity history is not a complete store payload.');
        await write(payload, await read());
        await legacy.removeItem(key);
      });
    },
    removeItem(requested: string): Promise<void> {
      checkKey(requested);
      return serialize(async () => {
        const { current } = await revisions();
        // A durable tombstone prevents old data resurfacing if deletion is interrupted.
        const deleted = await write(null, current);
        await legacy.removeItem(key);
        await files.remove(1 - deleted.slot);
        await files.remove(deleted.slot);
      });
    },
  };
}
