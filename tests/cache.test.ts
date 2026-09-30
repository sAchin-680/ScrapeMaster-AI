import { describe, expect, it, vi } from 'vitest';
import { swr, swrMap } from '@/lib/cache';

describe('swr cache', () => {
  it('loads once, serves cached values and refreshes when stale', async () => {
    let n = 0;
    const load = vi.fn(async () => ++n);
    const cache = swr(20, load);

    expect(cache.peek()).toBeUndefined();
    expect(await cache.get()).toBe(1);
    expect(await cache.get()).toBe(1);
    expect(load).toHaveBeenCalledTimes(1);

    await new Promise((r) => setTimeout(r, 30));
    expect(await cache.get()).toBe(1); // stale value served immediately
    await new Promise((r) => setTimeout(r, 5));
    expect(cache.peek()).toBe(2);
  });

  it('shares keyed caches across callers via the global registry', async () => {
    const load = vi.fn(async (key: string) => key.toUpperCase());
    const a = swrMap('test-shared', 1000, load);
    const b = swrMap('test-shared', 1000, load);
    expect(await a('in').get()).toBe('IN');
    expect(await b('in').get()).toBe('IN');
    expect(load).toHaveBeenCalledTimes(1);
  });
});
