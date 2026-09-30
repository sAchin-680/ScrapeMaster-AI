import { describe, expect, it } from 'vitest';
import { isValidAmazonProductURL, normalizeAmazonURL } from '@/lib/utils/url';

describe('isValidAmazonProductURL', () => {
  it.each([
    'https://www.amazon.com/dp/B0CHX1W1XY',
    'https://www.amazon.in/Apple-iPhone-15/dp/B0CHX1W1XY/ref=sr_1_1?keywords=iphone',
    'https://amazon.co.uk/gp/product/B08N5WRWNW',
  ])('accepts %s', (url) => expect(isValidAmazonProductURL(url)).toBe(true));

  it.each([
    'not a url',
    'https://www.amazon.com/',
    'https://amazon.evil.com/dp/B0CHX1W1XY',
    'https://notamazon.com/dp/B0CHX1W1XY',
    'ftp://www.amazon.com/dp/B0CHX1W1XY',
  ])('rejects %s', (url) => expect(isValidAmazonProductURL(url)).toBe(false));
});

describe('normalizeAmazonURL', () => {
  it('strips slugs and tracking params down to the ASIN', () => {
    expect(
      normalizeAmazonURL('https://www.Amazon.in/Apple-iPhone-15/dp/b0chx1w1xy/ref=sr_1_1?tag=abc'),
    ).toBe('https://www.amazon.in/dp/B0CHX1W1XY');
  });
});
