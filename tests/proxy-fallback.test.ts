import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('axios', () => ({
  default: {
    get,
    isAxiosError: (e: { isAxiosError?: boolean }) => Boolean(e?.isAxiosError),
  },
}));
vi.mock('@/lib/env', () => ({
  env: { BRIGHTDATA_USERNAME: 'user', BRIGHTDATA_PASSWORD: 'expired' },
  isProxyConfigured: true,
}));
vi.mock('@/lib/scraper/throttle', () => ({ throttle: vi.fn() }));

const { fetchHtml } = await import('@/lib/scraper/http');

describe('proxy fallback', () => {
  beforeEach(() => get.mockReset());

  it('retries directly when the proxy rejects credentials, then stays direct', async () => {
    get
      .mockRejectedValueOnce({ isAxiosError: true, response: { status: 407 } })
      .mockResolvedValue({ data: '<html>ok</html>' });

    await expect(fetchHtml('https://93.184.216.34/product')).resolves.toBe(
      '<html>ok</html>',
    );
    expect(get.mock.calls[0][1].proxy).toBeDefined();
    expect(get.mock.calls[1][1].proxy).toBeUndefined();

    await fetchHtml('https://93.184.216.34/other');
    expect(get.mock.calls[2][1].proxy).toBeUndefined();
  });
});
