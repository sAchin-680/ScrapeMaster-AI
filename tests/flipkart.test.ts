import { describe, expect, it } from 'vitest';
import {
  flipkart,
  parseFlipkartProduct,
  parseFlipkartSearch,
} from '@/lib/scraper/stores/flipkart';

const product = `
<html><body>
  <div class="r2CdBx"><a>Home</a><a>Mobiles</a><a>Apple iPhones</a><a>iPhone 15</a></div>
  <h1><span class="VU-ZEz">Apple iPhone 15 (Black, 128 GB)</span></h1>
  <div class="Nx9bqj CxhGGd">₹65,999</div>
  <div class="yRaY8j A6+E6v">₹79,900</div>
  <img class="DByuf4" src="https://rukminim2.flixcart.com/image/iphone.jpg" />
  <div class="XQDdHH">4.6</div>
  <span class="Wphh3N">2,31,450 Ratings</span>
  <ul><li class="_7eSDEz">128 GB ROM</li><li class="_7eSDEz">48MP Camera</li></ul>
</body></html>`;

const search = `
<div data-id="MOBGTAGPTB3VS24W">
  <a href="/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W&lid=x&marketplace=FLIPKART">
    <img src="https://rukminim2.flixcart.com/a.jpg" alt="Apple iPhone 15" />
    <div class="KzDlHZ">Apple iPhone 15 (Black, 128 GB)</div>
    <div class="Nx9bqj">₹65,999</div>
  </a>
</div>
<div data-id="ADS"><div class="KzDlHZ">No link</div></div>`;

describe('flipkart adapter', () => {
  it('parses a product page', () => {
    expect(
      parseFlipkartProduct(product, 'https://www.flipkart.com/x/p/itm1'),
    ).toMatchObject({
      store: 'flipkart',
      title: 'Apple iPhone 15 (Black, 128 GB)',
      currency: '₹',
      currentPrice: 65999,
      originalPrice: 79900,
      discountRate: 17,
      stars: 4.6,
      reviewsCount: 231450,
      category: 'Apple iPhones',
      description: '128 GB ROM\n48MP Camera',
    });
  });

  it('parses search results and strips tracking params', () => {
    const offers = parseFlipkartSearch(search);
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      price: 65999,
      url: 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W',
    });
  });

  it('normalizes product URLs to path + pid', () => {
    const url = new URL('https://dl.flipkart.com/s/x/p/itm1?pid=ABC&lid=1&affid=me');
    expect(flipkart.matches(url)).toBe(true);
    expect(flipkart.normalize(url)).toBe('https://www.flipkart.com/s/x/p/itm1?pid=ABC');
  });
});

describe('flipkart search parsing is class-agnostic', () => {
  it('reads cards with unknown class names', () => {
    const html = `
      <div class="zz1"><div class="zz2">
        <a class="q9" href="/apple-iphone-15-green-128-gb/p/itm235cd318bde73?pid=MOBGTAGPYYWZRUJX&lid=L1">
          <img alt="Apple iPhone 15 (Green, 128 GB)" src="https://rukminim2.flixcart.com/g.jpg" />
        </a>
        <div class="r1"><div class="r2">₹59,900</div><div class="r3">₹69,900</div></div>
      </div></div>
      <div class="zz1"><div class="zz2">
        <a href="/apple-iphone-15-pink-128-gb/p/itm7579ed94ca647?pid=MOBGTAGPNMZA5PU5"><img alt="Apple iPhone 15 (Pink, 128 GB)" /></a>
        <a href="/apple-iphone-15-pink-128-gb/p/itm7579ed94ca647?pid=MOBGTAGPNMZA5PU5&ref=x">Apple iPhone 15 (Pink, 128 GB)</a>
        <span>₹61,499</span>
      </div></div>`;
    const offers = parseFlipkartSearch(html);
    expect(offers.map((o) => [o.title, o.price])).toEqual([
      ['Apple iPhone 15 (Green, 128 GB)', 59900],
      ['Apple iPhone 15 (Pink, 128 GB)', 61499],
    ]);
    expect(offers[0].url).toBe(
      'https://www.flipkart.com/apple-iphone-15-green-128-gb/p/itm235cd318bde73?pid=MOBGTAGPYYWZRUJX',
    );
  });
});
