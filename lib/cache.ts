type Entry<T> = { value?: T; at: number; pending?: Promise<T> };

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
        return value;
      })
      .finally(() => {
        entry.pending = undefined;
      });
    return entry.pending;
  };

  return {
    async get() {
      if (entry.value !== undefined && Date.now() - entry.at < ttlMs) return entry.value;
      if (entry.value !== undefined) {
        refresh().catch(() => {});
        return entry.value;
      }
      return refresh();
    },
    peek() {
      if (entry.value === undefined || Date.now() - entry.at >= ttlMs)
        refresh().catch(() => {});
      return entry.value;
    },
  };
}

/** One SWR cache per key (e.g. per region). */
export function swrMap<T>(ttlMs: number, load: (key: string) => Promise<T>) {
  const caches = new Map<string, ReturnType<typeof swr<T>>>();
  return (key: string) => {
    let cache = caches.get(key);
    if (!cache) {
      cache = swr(ttlMs, () => load(key));
      caches.set(key, cache);
    }
    return cache;
  };
}
