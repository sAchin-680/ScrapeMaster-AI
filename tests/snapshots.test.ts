import { describe, expect, it, vi } from 'vitest';
import { withSnapshot } from '@/lib/services/snapshots';

const isEmpty = (list: string[]) => !list.length;

function memory(initial?: { data: string[]; updatedAt: string }) {
  let stored = initial ?? null;
  return {
    save: vi.fn(async (_id: string, data: unknown) => {
      stored = { data: data as string[], updatedAt: '2026-09-30T10:00:00.000Z' };
    }),
    load: vi.fn(async () => stored),
  };
}

describe('withSnapshot', () => {
  it('returns fresh data and saves it', async () => {
    const storage = memory();
    const feed = withSnapshot('deals', async () => ['a'], isEmpty, { storage });
    await expect(feed('in')).resolves.toMatchObject({ data: ['a'], stale: false });
    expect(storage.save).toHaveBeenCalledWith('deals:in', ['a']);
  });

  it('serves the last snapshot when the stores fail', async () => {
    const storage = memory({ data: ['cached'], updatedAt: '2026-09-30T08:00:00.000Z' });
    const feed = withSnapshot(
      'deals',
      async () => Promise.reject(new Error('blocked')),
      isEmpty,
      { storage },
    );
    await expect(feed('in')).resolves.toEqual({
      data: ['cached'],
      updatedAt: '2026-09-30T08:00:00.000Z',
      stale: true,
    });
  });

  it('never overwrites a good snapshot with an empty result', async () => {
    const storage = memory({ data: ['cached'], updatedAt: '2026-09-30T08:00:00.000Z' });
    const feed = withSnapshot('deals', async () => [], isEmpty, { storage });
    await expect(feed('in')).resolves.toMatchObject({ data: ['cached'], stale: true });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('fails when there is neither live data nor a snapshot', async () => {
    const feed = withSnapshot(
      'deals',
      async () => Promise.reject(new Error('blocked')),
      isEmpty,
      { storage: memory() },
    );
    await expect(feed('in')).rejects.toThrow('blocked');
  });

  it('ignores snapshots older than the maximum age', async () => {
    const old = new Date(Date.now() - 13 * 60 * 60_000).toISOString();
    const storage = memory({ data: ['old'], updatedAt: old });
    const feed = withSnapshot('sales', async () => [], isEmpty, {
      storage,
      maxAgeMs: 12 * 60 * 60_000,
    });
    await expect(feed('in')).rejects.toThrow('no data');
  });

  it('serves a recent snapshot without fetching live when preferred', async () => {
    const recent = new Date(Date.now() - 10 * 60_000).toISOString();
    const storage = memory({ data: ['from job'], updatedAt: recent });
    const live = vi.fn(async () => ['live']);
    const feed = withSnapshot('deals', live, isEmpty, {
      storage,
      preferWithinMs: 45 * 60_000,
    });
    await expect(feed('in')).resolves.toEqual({
      data: ['from job'],
      updatedAt: recent,
      stale: false,
    });
    expect(live).not.toHaveBeenCalled();
  });

  it('fetches live when the preferred snapshot is too old', async () => {
    const old = new Date(Date.now() - 60 * 60_000).toISOString();
    const storage = memory({ data: ['from job'], updatedAt: old });
    const feed = withSnapshot('deals', async () => ['live'], isEmpty, {
      storage,
      preferWithinMs: 45 * 60_000,
    });
    await expect(feed('in')).resolves.toMatchObject({ data: ['live'], stale: false });
  });
});
