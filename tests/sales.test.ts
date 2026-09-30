import { describe, expect, it } from 'vitest';
import { getSaleStatus, getSalesFor, SALES } from '@/lib/sales';

const at = (iso: string) => Date.parse(iso);

describe('sales calendar', () => {
  it('computes live, upcoming and ended', () => {
    const sale = SALES[0];
    expect(getSaleStatus(sale, Date.parse(sale.start) - 1)).toBe('upcoming');
    expect(getSaleStatus(sale, Date.parse(sale.start) + 1)).toBe('live');
    expect(getSaleStatus(sale, Date.parse(sale.end) + 1)).toBe('ended');
  });

  it('filters by country and lists live sales first', () => {
    const sales = getSalesFor('IN', at('2026-09-30T12:00:00+05:30'));
    expect(sales.every((s) => s.countries === 'all' || s.countries.includes('IN'))).toBe(
      true,
    );
    expect(sales[0].status).toBe('live');
    expect(sales.some((s) => s.name === 'Black Friday')).toBe(false);
  });

  it('drops ended sales and those beyond the horizon', () => {
    const sales = getSalesFor('US', at('2026-12-15T00:00:00Z'), 30);
    expect(sales).toHaveLength(0);
  });
});
