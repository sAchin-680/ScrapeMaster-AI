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
    const feed = withSnapshot('deals', async () => ['a'], isEmpty, storage);
    await expect(feed('in')).resolves.toMatchObject({ data: ['a'], stale: false });
    expect(storage.save).toHaveBeenCalledWith('deals:in', ['a']);
  });

  it('serves the last snapshot when the stores fail', async () => {
    const storage = memory({ data: ['cached'], updatedAt: '2026-09-30T08:00:00.000Z' });
    const feed = withSnapshot(
      'deals',
      async () => Promise.reject(new Error('blocked')),
      isEmpty,
      storage,
    );
    await expect(feed('in')).resolves.toEqual({
      data: ['cached'],
      updatedAt: '2026-09-30T08:00:00.000Z',
      stale: true,
    });
  });

  it('never overwrites a good snapshot with an empty result', async () => {
    const storage = memory({ data: ['cached'], updatedAt: '2026-09-30T08:00:00.000Z' });
    const feed = withSnapshot('deals', async () => [], isEmpty, storage);
    await expect(feed('in')).resolves.toMatchObject({ data: ['cached'], stale: true });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('fails when there is neither live data nor a snapshot', async () => {
    const feed = withSnapshot(
      'deals',
      async () => Promise.reject(new Error('blocked')),
      isEmpty,
      memory(),
    );
    await expect(feed('in')).rejects.toThrow('blocked');
  });
});
