import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { RoutePoint } from '../types/activity';

/**
 * GPS routes live outside the readiness store: one stored item per activity,
 * loaded on demand. The store keeps only a summary with a `routePoints` count,
 * so booting and unrelated settings writes never parse or re-serialise routes.
 */
export const ROUTE_KEY_PREFIX = '@gruntz_route:';
const ROUTE_DIRECTORY = 'gruntz-routes/';
const TEMPORARY_SUFFIX = '.tmp';
const CACHE_LIMIT = 12;

/** Where one route item lives. `name` is a storage key (iOS) or a file name (Android). */
export interface RouteBackend {
  name(id: string): string;
  read(name: string): Promise<string | null>;
  write(name: string, value: string): Promise<void>;
  remove(names: string[]): Promise<void>;
  list(): Promise<string[]>;
  clear(): Promise<void>;
}

function hash(text: string, seed: number): string {
  let value = seed;
  for (let index = 0; index < text.length; index++) value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  return (value >>> 0).toString(16).padStart(8, '0');
}

/** A file name that is always valid; the item itself records which activity owns it. */
export function routeFileName(id: string): string {
  let encoded: string | null = null;
  // A lone surrogate cannot be percent-encoded; such an ID gets a hashed name instead.
  try { encoded = encodeURIComponent(id).replace(/[!'()*.~]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`); } catch { /* hashed below */ }
  return encoded !== null && encoded.length <= 180
    ? `r-${encoded}.json`
    : `h-${hash(id, 2166136261)}${hash(id, 3339675911)}-${id.length}.json`;
}

/** iOS stores large AsyncStorage values in their own files, so one key per route is safe there. */
const asyncStorageBackend: RouteBackend = {
  name: (id) => `${ROUTE_KEY_PREFIX}${id}`,
  read: (name) => AsyncStorage.getItem(name),
  write: (name, value) => AsyncStorage.setItem(name, value),
  remove: async (names) => { if (names.length) await AsyncStorage.multiRemove(names); },
  list: async () => (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(ROUTE_KEY_PREFIX)),
  clear: async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(ROUTE_KEY_PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  },
};

async function routeDirectory() {
  const fs = await import('expo-file-system/legacy');
  if (!fs.documentDirectory) throw new Error('Activity storage is unavailable on this device.');
  return { fs, directory: `${fs.documentDirectory}${ROUTE_DIRECTORY}` };
}

/**
 * Android's SQLite-backed AsyncStorage caps both a row (about 2 MB) and the whole
 * database (6 MB by default), which a handful of long routes would exhaust. Routes
 * are plain files there, like the readiness history itself.
 */
const fileBackend: RouteBackend = {
  name: routeFileName,
  read: async (name) => {
    const { fs, directory } = await routeDirectory();
    if (!(await fs.getInfoAsync(`${directory}${name}`)).exists) return null;
    return fs.readAsStringAsync(`${directory}${name}`);
  },
  write: async (name, value) => {
    const { fs, directory } = await routeDirectory();
    await fs.makeDirectoryAsync(directory, { intermediates: true });
    // A process death mid-write must not leave a torn file under the real name.
    const temporary = `${directory}${name}${TEMPORARY_SUFFIX}`;
    await fs.writeAsStringAsync(temporary, value);
    if (await fs.readAsStringAsync(temporary) !== value) throw new Error('This route could not be saved completely. Please retry.');
    await fs.moveAsync({ from: temporary, to: `${directory}${name}` });
  },
  remove: async (names) => {
    const { fs, directory } = await routeDirectory();
    for (const name of names) await fs.deleteAsync(`${directory}${name}`, { idempotent: true });
  },
  list: async () => {
    const { fs, directory } = await routeDirectory();
    if (!(await fs.getInfoAsync(directory)).exists) return [];
    return fs.readDirectoryAsync(directory);
  },
  clear: async () => {
    const { fs, directory } = await routeDirectory();
    await fs.deleteAsync(directory, { idempotent: true });
  },
};

const serialize = (id: string, route: RoutePoint[]) => JSON.stringify({ v: 1, id, points: route });

/** Null for an item that is torn, foreign or not a route; never throws. */
function deserialize(id: string, raw: string): RoutePoint[] | null {
  try {
    const value = JSON.parse(raw);
    return value?.v === 1 && value.id === id && Array.isArray(value.points) ? value.points as RoutePoint[] : null;
  } catch { return null; }
}

export function createRouteStore(backend: RouteBackend) {
  const cache = new Map<string, RoutePoint[]>();
  const loading = new Map<string, Promise<RoutePoint[] | null>>();
  let queue: Promise<unknown> = Promise.resolve();
  // Writes, deletions and pruning never interleave.
  const exclusive = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = queue.then(operation, operation);
    queue = next.catch(() => undefined);
    return next;
  };
  const remember = (id: string, route: RoutePoint[]) => {
    cache.delete(id);
    cache.set(id, route);
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  };
  const forget = (id: string) => { cache.delete(id); loading.delete(id); };

  /** Returns the value this write replaced, or `undefined` when the item was already identical. */
  const writeRaw = async (id: string, next: string): Promise<string | null | undefined> => {
    const name = backend.name(id);
    const prior = await backend.read(name);
    if (prior === next) return undefined;
    if (prior !== null) {
      // A different activity owning this name means a file-name collision; never overwrite it.
      let owner: unknown;
      try { owner = JSON.parse(prior)?.id; } catch { owner = id; }
      if (typeof owner === 'string' && owner !== id) throw new Error('This route could not be saved. Please retry.');
    }
    await backend.write(name, next);
    if (await backend.read(name) !== next) throw new Error('This route could not be saved completely. Please retry.');
    return prior;
  };

  const store = {
    /** Resolves only once the exact points are durably stored and read back. Safe to repeat. */
    saveRoute(id: string, route: RoutePoint[]): Promise<void> {
      return exclusive(async () => {
        forget(id);
        await writeRaw(id, serialize(id, route));
        remember(id, route);
      });
    },

    /** Null when the item is missing or unreadable. Rejects only when storage itself fails. */
    loadRoute(id: string): Promise<RoutePoint[] | null> {
      const cached = cache.get(id);
      if (cached) { remember(id, cached); return Promise.resolve(cached); }
      const pending = loading.get(id);
      if (pending) return pending;
      const request: Promise<RoutePoint[] | null> = backend.read(backend.name(id)).then((raw) => {
        const route = raw === null ? null : deserialize(id, raw);
        // A save or deletion that happened meanwhile wins over this older read.
        if (loading.get(id) !== request) return route;
        loading.delete(id);
        if (route) remember(id, route);
        return route;
      }, (error) => {
        if (loading.get(id) === request) loading.delete(id);
        throw error;
      });
      loading.set(id, request);
      return request;
    },

    /** The route if it is already in memory; never touches storage. */
    cachedRoute: (id: string): RoutePoint[] | undefined => cache.get(id),

    removeRoute(id: string): Promise<void> {
      return exclusive(async () => {
        forget(id);
        await backend.remove([backend.name(id)]);
      });
    },

    /** Deletes every route item that does not belong to one of `keepIds`. */
    pruneRoutes(keepIds: Iterable<string>): Promise<void> {
      return exclusive(async () => {
        const ids = new Set(keepIds);
        const keep = new Set([...ids].map((id) => backend.name(id)));
        const orphans = (await backend.list()).filter((name) => !keep.has(name));
        for (const id of [...cache.keys()]) if (!ids.has(id)) cache.delete(id);
        for (const id of [...loading.keys()]) if (!ids.has(id)) loading.delete(id);
        await backend.remove(orphans);
      });
    },

    clearRoutes(): Promise<void> {
      return exclusive(async () => {
        cache.clear();
        loading.clear();
        await backend.clear();
      });
    },

    /**
     * Writes a batch of routes without deleting anything, for a restore that may
     * still fail. `rollback` puts every item it touched back exactly as it was.
     */
    stageRoutes(routes: [string, RoutePoint[]][]): Promise<{ rollback: () => Promise<void> }> {
      return exclusive(async () => {
        const journal: [string, string | null][] = [];
        const undo = async () => {
          for (const [id, prior] of journal.splice(0).reverse()) {
            forget(id);
            if (prior === null) await backend.remove([backend.name(id)]);
            else await backend.write(backend.name(id), prior);
          }
        };
        try {
          for (const [id, route] of routes) {
            forget(id);
            const prior = await writeRaw(id, serialize(id, route));
            if (prior !== undefined) journal.push([id, prior]);
          }
        } catch (error) {
          await undo().catch(() => undefined);
          throw error;
        }
        return { rollback: () => exclusive(undo) };
      });
    },
  };
  return store;
}

const routes = createRouteStore(Platform?.OS === 'android' ? fileBackend : asyncStorageBackend);
export const { saveRoute, loadRoute, cachedRoute, removeRoute, pruneRoutes, clearRoutes, stageRoutes } = routes;

/** What the UI needs to know about one activity's route. */
export type ActivityRouteState = {
  /** `none`: nothing was recorded. `missing`: a route was recorded but its item cannot be read. */
  status: 'none' | 'loading' | 'ready' | 'missing';
  route: RoutePoint[];
};
type RouteOwner = { id: string; routePoints?: number };

const NO_POINTS: RoutePoint[] = [];
const NONE: ActivityRouteState = { status: 'none', route: NO_POINTS };
const LOADING: ActivityRouteState = { status: 'loading', route: NO_POINTS };
const MISSING: ActivityRouteState = { status: 'missing', route: NO_POINTS };

/** A route still stored inline by an older build, until migration has moved it out. */
export function inlineRoute(session: unknown): RoutePoint[] | undefined {
  const route = (session as { route?: unknown } | null | undefined)?.route;
  return Array.isArray(route) ? route as RoutePoint[] : undefined;
}

/** Synchronous answer from memory; `loading` means storage has to be read. */
export function activityRouteNow(session: RouteOwner | null | undefined): ActivityRouteState {
  if (!session) return NONE;
  const inline = inlineRoute(session);
  if (inline) return inline.length ? { status: 'ready', route: inline } : NONE;
  if (!session.routePoints) return NONE;
  const cached = cachedRoute(session.id);
  return cached ? { status: 'ready', route: cached } : LOADING;
}

/** Never rejects: an activity whose route cannot be read still has its summary. */
export async function loadActivityRoute(session: RouteOwner | null | undefined): Promise<ActivityRouteState> {
  const now = activityRouteNow(session);
  if (now.status !== 'loading' || !session) return now;
  try {
    const route = await loadRoute(session.id);
    return route?.length ? { status: 'ready', route } : MISSING;
  } catch { return MISSING; }
}
