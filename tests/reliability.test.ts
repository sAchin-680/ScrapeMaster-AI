import { describe, expect, it } from 'vitest';
import type { SourceHealth } from '@/lib/scraper/health';
import { summarizeReliability } from '@/lib/scraper/reliability';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

const source = (over: Partial<SourceHealth>): SourceHealth => ({
  source: 'amazon:search',
  store: 'amazon',
  storeName: 'Amazon',
  kind: 'search',
  recent: [true, true, true, true],
  consecutiveFailures: 0,
  lastSuccessAt: ago(10),
  ...over,
});

describe('summarizeReliability', () => {
  it('weights the success rate by checks across page kinds', () => {
    const [amazon] = summarizeReliability(
      [
        source({ recent: [true, true, true, false] }),
        source({
          source: 'amazon:product',
          kind: 'product',
          recent: [true, true, true, true, true, true],
          lastSuccessAt: ago(5),
        }),
      ],
      NOW,
    );
    expect(amazon.successRate).toBeCloseTo(0.9);
    expect(amazon.checks).toBe(10);
    expect(amazon.lastSuccessAt).toBe(ago(5));
    expect(amazon.status).toBe('operational');
    expect(amazon.domain).toBe('amazon.in');
    expect(amazon.sources.map((s) => s.kind)).toEqual(['product', 'search']);
  });

  it('marks a store degraded when a page kind is paused or the rate is low', () => {
    const rows = summarizeReliability(
      [
        source({}),
        source({
          source: 'amazon:product',
          kind: 'product',
          recent: [false, false, false],
          lastFailureAt: ago(1),
          openUntil: new Date(NOW + 60 * 60_000).toISOString(),
        }),
        source({
          source: 'myntra.com:homepage',
          store: 'myntra.com',
          storeName: 'Myntra',
          kind: 'homepage',
          recent: [true, false, false],
        }),
      ],
      NOW,
    );
    expect(rows.map((r) => [r.storeName, r.status])).toEqual([
      ['Amazon', 'degraded'],
      ['Myntra', 'degraded'],
    ]);
    expect(rows[0].sources.find((s) => s.kind === 'product')?.state).toBe('open');
  });

  it('marks a store paused when every page kind is paused', () => {
    const [row] = summarizeReliability(
      [source({ recent: [false], openUntil: new Date(NOW + 1000).toISOString() })],
      NOW,
    );
    expect(row.status).toBe('paused');
  });

  it('leaves out sources with no outcomes or not checked for a week', () => {
    expect(
      summarizeReliability(
        [source({ recent: [] }), source({ lastSuccessAt: ago(8 * 24 * 60) })],
        NOW,
      ),
    ).toEqual([]);
  });
});
