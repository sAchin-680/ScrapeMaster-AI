import { describe, expect, it } from 'vitest';
import {
  appendPrice,
  getAveragePrice,
  getHighestPrice,
  getLowestPrice,
  getPriceChange,
  MAX_HISTORY_ENTRIES,
} from '@/lib/utils/price';

const history = [{ price: 100 }, { price: 80 }, { price: 120 }];

describe('price stats', () => {
  it('computes highest, lowest and average', () => {
    expect(getHighestPrice(history)).toBe(120);
    expect(getLowestPrice(history)).toBe(80);
    expect(getAveragePrice(history)).toBe(100);
  });

  it('returns 0 for empty history instead of throwing', () => {
    expect(getHighestPrice([])).toBe(0);
    expect(getLowestPrice([])).toBe(0);
    expect(getAveragePrice([])).toBe(0);
  });

  it('computes percentage change', () => {
    expect(getPriceChange(100, 75)).toBe(-25);
    expect(getPriceChange(0, 50)).toBe(0);
  });

  it('caps stored history length', () => {
    const long = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i) => ({ price: i }));
    const next = appendPrice(long, 999);
    expect(next).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(next.at(-1)?.price).toBe(999);
    expect(next[0].price).toBe(1);
  });
});
