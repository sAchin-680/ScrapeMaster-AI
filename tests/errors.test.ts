import { describe, expect, it } from 'vitest';
import { isTransient, kindForStatus, ScrapeError } from '@/lib/scraper/errors';

describe('scrape error kinds', () => {
  it('maps HTTP statuses', () => {
    expect(kindForStatus(429)).toBe('rate-limited');
    expect(kindForStatus(403)).toBe('blocked');
    expect(kindForStatus(404)).toBe('not-found');
    expect(kindForStatus(502)).toBe('unavailable');
    expect(kindForStatus(undefined)).toBe('unavailable');
  });

  it('retries only failures a later attempt could fix', () => {
    for (const kind of ['blocked', 'rate-limited', 'unavailable', 'timeout'] as const) {
      expect(isTransient(new ScrapeError('x', kind))).toBe(true);
    }
    for (const kind of ['not-found', 'disallowed', 'parse', 'unsupported'] as const) {
      expect(isTransient(new ScrapeError('x', kind))).toBe(false);
    }
    expect(isTransient(new Error('socket hang up'))).toBe(true);
  });
});
