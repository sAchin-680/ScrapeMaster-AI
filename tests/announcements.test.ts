import { describe, expect, it } from 'vitest';
import { buildAnnouncements } from '@/lib/announcements';

describe('buildAnnouncements', () => {
  it('returns nothing without live data', () => {
    expect(buildAnnouncements([], { drops: [], waves: [] })).toEqual([]);
  });

  it('orders sales, store waves, then product drops', () => {
    const items = buildAnnouncements(
      [
        {
          id: 's1',
          name: 'Big Sale',
          store: 'Flipkart',
          countries: [],
          start: '',
          end: '',
          url: '',
          confirmed: true,
          tagline: '',
          status: 'live',
        },
      ],
      {
        waves: [{ storeName: 'Amazon', dropped: 4, tracked: 6 }],
        drops: [
          {
            id: 'p1',
            title: 'Headphones',
            storeName: 'Amazon',
            currency: '₹',
            from: 100,
            to: 80,
            percent: 20,
          },
        ],
      },
    );
    expect(items.map((i) => i.id)).toEqual(['sale-s1', 'wave-Amazon', 'drop-p1-80']);
    expect(items[2].text).toContain('dropped 20%');
  });
});
