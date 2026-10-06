import { describe, expect, it } from 'vitest';
import { HealthRegistry } from '@/lib/scraper/health';
import { formatRunTable, runFailed, summarizeRun } from '@/lib/scraper/run-report';

const src = (store: string, kind: string) => ({
  source: `${store}:${kind}`,
  store,
  storeName: store[0].toUpperCase() + store.slice(1),
  kind,
});

describe('run report', () => {
  it('rolls sources up per store with an outcome', () => {
    const reg = new HealthRegistry();
    reg.record(src('amazon', 'search'), false);
    reg.record(src('amazon', 'bestsellers'), true);
    reg.record(src('flipkart', 'search'), true);
    reg.record(src('croma.com', 'homepage'), false);
    const rows = summarizeRun(reg);
    expect(rows.map((r) => [r.store, r.attempts, r.outcome])).toEqual([
      ['amazon', 2, 'partial'],
      ['croma.com', 1, 'failed'],
      ['flipkart', 1, 'ok'],
    ]);
  });

  it('fails only when most stores fail', () => {
    const reg = new HealthRegistry();
    reg.record(src('amazon', 'search'), false);
    reg.record(src('flipkart', 'search'), true);
    reg.record(src('myntra', 'homepage'), true);
    expect(runFailed(summarizeRun(reg))).toBe(false);

    reg.record(src('croma', 'homepage'), false);
    reg.record(src('nykaa', 'homepage'), false);
    expect(runFailed(summarizeRun(reg))).toBe(true);
  });

  it('counts circuit-skipped stores as failed and shows paused sources', () => {
    const reg = new HealthRegistry();
    for (let i = 0; i < 3; i++) reg.record(src('amazon', 'product'), false);
    expect(() => reg.assertCanAttempt('amazon:product')).toThrow();
    const rows = summarizeRun(reg);
    expect(rows[0].paused).toEqual(['product']);
    expect(formatRunTable(rows)).toContain('paused: product');
    expect(runFailed(rows)).toBe(true);
  });
});
