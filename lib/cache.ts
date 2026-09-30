type Entry<T> = { value?: T; at: number; pending?: Promise<T>; failedAt?: number };

// After a failed load, wait this long before trying again.
const RETRY_AFTER_MS = 60_000;

/**
 * In-memory stale-while-revalidate cache. `get` waits for data on a cold
 * start; `peek` never blocks and returns whatever is cached (refreshing it in
 * the background when stale), so layouts can use it without delaying pages.
 */
export function swr<T>(ttlMs: number, load: () => Promise<T>) {
  const entry: Entry<T> = { at: 0 };

  const refresh = () => {
    entry.pending ??= load()
      .then((value) => {
        entry.value = value;
        entry.at = Date.now();
        entry.failedAt = undefined;
        return value;
      })
      .catch((error) => {
        entry.failedAt = Date.now();
        throw error;
      })
      .finally(() => {
        entry.pending = undefined;
      });
    return entry.pending;
  };

  return {
    async get() {
      if (entry.value !== undefined && Date.now() - entry.at < ttlMs) return entry.value;
      const coolingDown = entry.failedAt && Date.now() - entry.failedAt < RETRY_AFTER_MS;
      if (entry.value !== undefined) {
        if (!coolingDown) refresh().catch(() => {});
        return entry.value;
      }
      if (coolingDown) throw new Error('Source unavailable; retrying shortly');
      return refresh();
    },
    peek() {
      const coolingDown = entry.failedAt && Date.now() - entry.failedAt < RETRY_AFTER_MS;
      if (!coolingDown && (entry.value === undefined || Date.now() - entry.at >= ttlMs)) {
        refresh().catch(() => {});
      }
      return entry.value;
    },
  };
}

const registry = ((
  globalThis as unknown as { __swrCaches?: Map<string, unknown> }
).__swrCaches ??= new Map());

/**
 * One SWR cache per key (e.g. per region). Caches live on globalThis under
 * `name`, so separately bundled entry points in the same server process
 * (instrumentation, route handlers, pages) share them.
 */
export function swrMap<T>(
  name: string,
  ttlMs: number,
  load: (key: string) => Promise<T>,
) {
  return (key: string) => {
    const id = `${name}:${key}`;
    let cache = registry.get(id) as ReturnType<typeof swr<T>> | undefined;
    if (!cache) {
      cache = swr(ttlMs, () => load(key));
      registry.set(id, cache);
    }
    return cache;
  };
}
