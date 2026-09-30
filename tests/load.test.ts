import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrapeError } from '@/lib/scraper/errors';

const fetchHtml = vi.fn();
const renderHtml = vi.fn();
const browser = { configured: true };

vi.mock('@/lib/scraper/http', () => ({ fetchHtml, assertPublicURL: vi.fn() }));
vi.mock('@/lib/scraper/browser', () => ({
  renderHtml,
  get isBrowserConfigured() {
    return browser.configured;
  },
}));

const { loadAndParse } = await import('@/lib/scraper/load');
const httpStore = {
  id: 'amazon',
  name: 'Amazon',
  matches: () => true,
  normalize: String,
  parse: vi.fn(),
};
const browserStore = { ...httpStore, id: 'flipkart', fetchMode: 'browser' as const };
const parse = (html: string) => {
  if (html.includes('captcha')) throw new ScrapeError('captcha');
  return html;
};

describe('loadAndParse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    browser.configured = true;
  });

  it('uses plain HTTP when it parses', async () => {
    fetchHtml.mockResolvedValue('<ok>');
    await expect(loadAndParse(httpStore, 'https://s.example', parse)).resolves.toBe(
      '<ok>',
    );
    expect(renderHtml).not.toHaveBeenCalled();
  });

  it('falls back to the browser when HTTP returns a bot check', async () => {
    fetchHtml.mockResolvedValue('captcha');
    renderHtml.mockResolvedValue('<rendered>');
    await expect(loadAndParse(httpStore, 'https://s.example', parse)).resolves.toBe(
      '<rendered>',
    );
  });

  it('does not fall back when no browser is configured', async () => {
    browser.configured = false;
    fetchHtml.mockResolvedValue('captcha');
    await expect(loadAndParse(httpStore, 'https://s.example', parse)).rejects.toThrow(
      'captcha',
    );
  });

  it('always renders browser-only stores', async () => {
    renderHtml.mockResolvedValue('<rendered>');
    await expect(loadAndParse(browserStore, 'https://s.example', parse)).resolves.toBe(
      '<rendered>',
    );
    expect(fetchHtml).not.toHaveBeenCalled();
  });
});
