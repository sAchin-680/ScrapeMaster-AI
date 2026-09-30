import { describe, expect, it } from 'vitest';
import { parsePrice } from '@/lib/scraper/extract';
import { parseAmazonProduct, ScrapeError } from '@/lib/scraper';

describe('parsePrice', () => {
  it.each([
    ['$1,299.99', 1299.99],
    ['₹ 54,999', 54999],
    ['1.299,00 €', 1299],
    ['499.00499.00', 499],
    ['', 0],
  ])('parses %s', (raw, expected) => expect(parsePrice(raw)).toBe(expected));
});

const html = `
<html><body>
  <span id="productTitle"> Wireless Headphones </span>
  <div class="priceToPay"><span class="a-offscreen">$248.00</span></div>
  <div class="basisPrice"><span class="a-offscreen">$359.99</span></div>
  <span class="a-price-symbol">$</span>
  <div id="availability"><span>In Stock</span></div>
  <img id="landingImage" data-a-dynamic-image='{"https://m.media-amazon.com/a.jpg":[100,100],"https://m.media-amazon.com/b.jpg":[500,500]}' />
  <span id="acrPopover" title="4.6 out of 5 stars"></span>
  <span id="acrCustomerReviewText">12,345 ratings</span>
  <div id="wayfinding-breadcrumbs_feature_div"><ul><li><a>Electronics</a></li><li><a>Headphones</a></li></ul></div>
  <div id="feature-bullets"><span class="a-list-item">Noise cancelling</span><span class="a-list-item">30h battery</span></div>
</body></html>`;

describe('parseAmazonProduct', () => {
  it('extracts product fields', () => {
    const product = parseAmazonProduct(html, 'https://www.amazon.com/dp/B0000TEST0');
    expect(product).toMatchObject({
      title: 'Wireless Headphones',
      currentPrice: 248,
      originalPrice: 359.99,
      discountRate: 31,
      currency: '$',
      image: 'https://m.media-amazon.com/b.jpg',
      stars: 4.6,
      reviewsCount: 12345,
      category: 'Headphones',
      isOutOfStock: false,
      description: 'Noise cancelling\n30h battery',
    });
  });

  it('throws a ScrapeError when the page has no title (captcha)', () => {
    expect(() => parseAmazonProduct('<html></html>', 'x')).toThrow(ScrapeError);
  });
});
