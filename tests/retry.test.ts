import { describe, expect, it, vi } from 'vitest';
import { backoffDelay, retry } from '@/lib/utils/retry';

const noSleep = () => Promise.resolve();

describe('backoffDelay', () => {
  it('grows exponentially, is capped, and is jittered', () => {
    expect(backoffDelay(0, 1000, 15_000, () => 1)).toBe(1000);
    expect(backoffDelay(3, 1000, 15_000, () => 1)).toBe(8000);
    expect(backoffDelay(10, 1000, 15_000, () => 1)).toBe(15_000);
    expect(backoffDelay(3, 1000, 15_000, () => 0.25)).toBe(2000);
  });
});

describe('retry', () => {
  it('returns the first success', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('flaky')).mockResolvedValue('ok');
    await expect(retry(fn, { sleep: noSleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after the attempt limit', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('down'));
    await expect(retry(fn, { attempts: 3, sleep: noSleep })).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry errors marked permanent', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('robots.txt'));
    await expect(
      retry(fn, { sleep: noSleep, shouldRetry: () => false }),
    ).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('waits the jittered backoff between attempts', async () => {
    const sleep = vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve());
    const fn = vi
      .fn()
      .mockRejectedValueOnce(1)
      .mockRejectedValueOnce(2)
      .mockResolvedValue('ok');
    await retry(fn, { sleep, baseDelayMs: 100, random: () => 0.5 });
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([50, 100]);
  });
});
