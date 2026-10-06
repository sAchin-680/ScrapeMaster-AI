import { beforeEach, describe, expect, it, vi } from 'vitest';

const snapshots = new Map<string, { data: unknown; updatedAt: string }>();
vi.mock('@/lib/services/snapshots', () => ({
  loadSnapshot: vi.fn(async (key: string) => snapshots.get(key) ?? null),
}));

const { dealsFeed, saleSignalFeed } = await import('@/lib/services/store-feed');
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

describe('page-facing store feeds read snapshots only', () => {
  beforeEach(() => snapshots.clear());

  it('serves a recent snapshot as fresh', async () => {
    snapshots.set('deals:us', { data: [{ url: 'a' }], updatedAt: minutesAgo(10) });
    await expect(dealsFeed('us').get()).resolves.toMatchObject({
      stale: false,
      data: [{ url: 'a' }],
    });
  });

  it('marks data older than the refresh window as stale', async () => {
    snapshots.set('deals:uk', { data: [{ url: 'a' }], updatedAt: minutesAgo(90) });
    await expect(dealsFeed('uk').get()).resolves.toMatchObject({ stale: true });
  });

  it('hides sale banners once they are half a day old', async () => {
    snapshots.set('sale-signals:de', {
      data: { signals: [{ text: 'Sale' }], checked: [{ ok: true }] },
      updatedAt: minutesAgo(13 * 60),
    });
    await expect(saleSignalFeed('de').get()).rejects.toThrow('too old');
  });

  it('fails cleanly when the job has not saved anything yet', async () => {
    await expect(dealsFeed('in').get()).rejects.toThrow('No deals snapshot');
  });
});
