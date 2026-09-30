import { describe, expect, it } from 'vitest';
import { throttle } from '@/lib/scraper/throttle';

describe('throttle', () => {
  it('spaces requests to the same host and not across hosts', async () => {
    const start = Date.now();
    await Promise.all([
      throttle('https://a.example/1', 50),
      throttle('https://a.example/2', 50),
      throttle('https://b.example/1', 50),
    ]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
    expect(elapsed).toBeLessThan(150);
  });
});
