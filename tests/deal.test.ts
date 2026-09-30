import { describe, expect, it } from 'vitest';
import { getDealVerdict } from '@/lib/deal';

const history = [100, 90, 110, 95, 105].map((price) => ({ price }));
const base = {
  lowestPrice: 90,
  highestPrice: 110,
  averagePrice: 100,
  priceHistory: history,
};

describe('getDealVerdict', () => {
  it('calls the all-time low a great deal', () => {
    expect(getDealVerdict({ ...base, currentPrice: 90 })).toMatchObject({
      level: 'great',
      score: 100,
    });
  });

  it('rates below-average prices as good', () => {
    expect(getDealVerdict({ ...base, currentPrice: 95 }).level).toBe('good');
  });

  it('rates typical prices as fair', () => {
    expect(getDealVerdict({ ...base, currentPrice: 101 }).level).toBe('fair');
  });

  it('suggests waiting when above average', () => {
    expect(getDealVerdict({ ...base, currentPrice: 110 })).toMatchObject({
      level: 'wait',
      score: 0,
    });
  });

  it('holds judgement without enough history', () => {
    expect(
      getDealVerdict({ ...base, currentPrice: 95, priceHistory: history.slice(0, 2) })
        .level,
    ).toBe('new');
  });
});
