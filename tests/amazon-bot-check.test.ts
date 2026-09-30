import { describe, expect, it } from 'vitest';
import { ScrapeError } from '@/lib/scraper/errors';
import { parseAmazonBestsellers, parseAmazonSearch } from '@/lib/scraper/stores/amazon';

const captcha = `
  <html><head><title>Amazon.in</title></head><body>
    <h4>Enter the characters you see below</h4>
    <form method="get" action="/errors/validateCaptcha"><input name="field-keywords" /></form>
  </body></html>`;

describe('Amazon bot check', () => {
  it('raises instead of returning no search results, so callers can retry in a browser', () => {
    expect(() => parseAmazonSearch(captcha, 'https://www.amazon.in/s?k=x')).toThrow(
      ScrapeError,
    );
  });

  it('raises for bestseller pages too', () => {
    expect(() =>
      parseAmazonBestsellers(captcha, 'https://www.amazon.in/gp/bestsellers/'),
    ).toThrow(ScrapeError);
  });

  it('still returns an empty list for a genuine page with no results', () => {
    expect(
      parseAmazonSearch(
        '<html><body><h1>No results</h1></body></html>',
        'https://www.amazon.in/s',
      ),
    ).toEqual([]);
  });
});
