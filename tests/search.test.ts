import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Offer } from '@/types';

const offer = (store: string, title: string, price: number): Offer => ({
  store,
  storeName: store === 'amazon' ? 'Amazon' : 'Flipkart',
  title,
  url: `https://${store}.example/${encodeURIComponent(title)}`,
  price,
  currency: '₹',
});

const pages: Record<string, Offer[] | Error> = {};

vi.mock('@/lib/scraper/load', () => ({
  loadAndParse: vi.fn(async (adapter: { id: string }) => {
    const result = pages[adapter.id];
    if (result instanceof Error) throw result;
    return result ?? [];
  }),
}));

// Flipkart search runs through its Affiliate API, which needs credentials.
vi.mock('@/lib/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/env')>()),
  isFlipkartAffiliateConfigured: true,
}));

const { searchStores } = await import('@/lib/scraper/search');

describe('searchStores', () => {
  beforeEach(() => {
    for (const key of Object.keys(pages)) delete pages[key];
  });

  it('groups the same product across stores and picks the cheapest', async () => {
    pages.amazon = [
      offer(
        'amazon',
        'Logitech MX Master 3S Bluetooth Edition Wireless Mouse, Ultra-fast Scrolling',
        8495,
      ),
      offer('amazon', 'Silicone Case compatible with Logitech MX Master 3S', 499),
    ];
    pages.flipkart = [
      offer('flipkart', 'Logitech MX Master 3s Ergonomic Optical Mouse', 7995),
    ];

    const { results, failedStores } = await searchStores('logitech mx master 3s', 'in');
    expect(failedStores).toEqual([]);
    expect(results).toHaveLength(1);
    expect(results[0].offers.map((o) => o.store)).toEqual(['flipkart', 'amazon']);
    expect(results[0].best.price).toBe(7995);
  });

  it('reports stores that fail and keeps the others', async () => {
    pages.amazon = [
      offer('amazon', 'JBL Flip 6 Wireless Portable Bluetooth Speaker', 8846),
    ];
    pages.flipkart = new Error('blocked');

    const { results, failedStores } = await searchStores('jbl flip 6', 'in');
    expect(failedStores).toEqual(['Flipkart']);
    expect(results[0].best.store).toBe('amazon');
  });

  it('only searches stores that serve the region', async () => {
    pages.amazon = [offer('amazon', 'Sony WH-1000XM5 Headphones', 348)];
    pages.flipkart = [offer('flipkart', 'Sony WH-1000XM5 Headphones', 300)];

    const { results } = await searchStores('sony wh-1000xm5', 'us');
    expect(results.flatMap((r) => r.offers.map((o) => o.store))).toEqual(['amazon']);
  });
});
