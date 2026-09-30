import { describe, expect, it } from 'vitest';
import { getEmailNotifType } from '@/lib/notifications';

const previous = { priceHistory: [{ price: 100 }, { price: 90 }], isOutOfStock: false, discountRate: 0 };

describe('getEmailNotifType', () => {
  it('flags a new all-time low', () => {
    expect(getEmailNotifType({ currentPrice: 80, discountRate: 0, isOutOfStock: false }, previous)).toBe(
      'LOWEST_PRICE',
    );
  });

  it('flags a restock', () => {
    expect(
      getEmailNotifType(
        { currentPrice: 95, discountRate: 0, isOutOfStock: false },
        { ...previous, isOutOfStock: true },
      ),
    ).toBe('CHANGE_OF_STOCK');
  });

  it('flags crossing the discount threshold only once', () => {
    const scraped = { currentPrice: 95, discountRate: 45, isOutOfStock: false };
    expect(getEmailNotifType(scraped, previous)).toBe('THRESHOLD_MET');
    expect(getEmailNotifType(scraped, { ...previous, discountRate: 45 })).toBeNull();
  });

  it('ignores a zero price from a failed scrape', () => {
    expect(getEmailNotifType({ currentPrice: 0, discountRate: 0, isOutOfStock: false }, previous)).toBeNull();
  });
});
