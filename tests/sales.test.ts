import { describe, expect, it } from 'vitest';
import { filterSalesFor, getSaleStatus, type Sale } from '@/lib/sales';

const sale = (
  id: string,
  start: string,
  end: string,
  countries: string[] = [],
): Sale => ({
  id,
  name: id,
  store: 'Store',
  countries,
  start,
  end,
  url: 'https://example.com',
  confirmed: true,
  tagline: '',
});

const sales = [
  sale('festival', '2026-09-23T00:00:00+05:30', '2026-10-23T23:59:59+05:30', ['IN']),
  sale('black-friday', '2026-11-27T00:00:00Z', '2026-11-30T23:59:59Z', ['US']),
  sale('global', '2026-10-10T00:00:00Z', '2026-10-12T00:00:00Z'),
  sale('past', '2026-01-01T00:00:00Z', '2026-01-05T00:00:00Z', ['IN']),
];
const now = Date.parse('2026-09-30T12:00:00Z');

describe('sales calendar', () => {
  it('computes live, upcoming and ended', () => {
    expect(getSaleStatus(sales[0], now)).toBe('live');
    expect(getSaleStatus(sales[1], now)).toBe('upcoming');
    expect(getSaleStatus(sales[3], now)).toBe('ended');
  });

  it('filters by country, includes global sales and lists live first', () => {
    expect(filterSalesFor(sales, 'IN', now).map((s) => s.id)).toEqual([
      'festival',
      'global',
    ]);
    expect(filterSalesFor(sales, 'US', now).map((s) => s.id)).toEqual([
      'global',
      'black-friday',
    ]);
  });

  it('drops sales beyond the horizon', () => {
    expect(filterSalesFor(sales, 'US', now, 30).map((s) => s.id)).toEqual(['global']);
  });
});
