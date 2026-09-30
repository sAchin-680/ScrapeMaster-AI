import { describe, expect, it } from 'vitest';
import { withTimeout } from '@/lib/utils/timeout';

describe('withTimeout', () => {
  it('returns the value when it arrives in time', async () => {
    await expect(withTimeout(Promise.resolve('data'), 50, 'fallback')).resolves.toBe(
      'data',
    );
  });

  it('returns the fallback when too slow or failing', async () => {
    const slow = new Promise((resolve) => setTimeout(() => resolve('late'), 100));
    await expect(withTimeout(slow, 10, 'fallback')).resolves.toBe('fallback');
    await expect(
      withTimeout(Promise.reject(new Error('x')), 50, 'fallback'),
    ).resolves.toBe('fallback');
  });
});
