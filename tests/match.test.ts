import { describe, expect, it } from 'vitest';
import { searchQuery, titleSimilarity } from '@/lib/scraper/match';
import { MATCH_THRESHOLD } from '@/lib/scraper/compare';
import { parseAmazonSearch } from '@/lib/scraper/stores/amazon';

describe('titleSimilarity', () => {
  const source = 'Apple iPhone 15 (128 GB) - Black';

  it('matches the same product across stores', () => {
    expect(titleSimilarity(source, 'Apple iPhone 15 (Black, 128 GB)')).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
  });

  it('rejects a different capacity or model', () => {
    expect(titleSimilarity(source, 'Apple iPhone 15 (Black, 256 GB)')).toBeLessThan(
      titleSimilarity(source, 'Apple iPhone 15 (Black, 128 GB)'),
    );
    expect(titleSimilarity(source, 'Samsung Galaxy S24 Ultra')).toBeLessThan(MATCH_THRESHOLD);
  });

  it('builds a short search query', () => {
    expect(searchQuery('Sony WH-1000XM5 Wireless Headphones (Black) | Industry leading ANC')).toBe(
      'Sony WH 1000XM5 Wireless Headphones',
    );
  });
});

describe('parseAmazonSearch', () => {
  it('skips sponsored results', () => {
    const html = `
      <div data-component-type="s-search-result" data-asin="B0CHX1W1XY">
        <h2><span>Apple iPhone 15 (128 GB) - Black</span></h2>
        <span class="a-price"><span class="a-offscreen">₹69,900</span><span class="a-price-symbol">₹</span></span>
      </div>
      <div data-component-type="s-search-result" data-asin="B0SPONSORED">
        <span class="puis-sponsored-label-text">Sponsored</span>
        <h2><span>Case</span></h2><span class="a-price"><span class="a-offscreen">₹299</span></span>
      </div>`;
    const offers = parseAmazonSearch(html, 'https://www.amazon.in/s?k=iphone');
    expect(offers).toEqual([
      expect.objectContaining({ url: 'https://www.amazon.in/dp/B0CHX1W1XY', price: 69900, currency: '₹' }),
    ]);
  });
});
