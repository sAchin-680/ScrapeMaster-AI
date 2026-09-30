import * as cheerio from 'cheerio';
import type { Offer } from '@/types';
import { extractPrice, parsePrice } from '../extract';
import { ScrapeError } from '../errors';
import { extractStructured } from '../structured';
import type { StoreAdapter } from './types';

// Flipkart ships obfuscated class names that change periodically; keep current and legacy ones.
const SELECTORS = {
  title: 'h1 span.VU-ZEz, h1 span.B_NuCI, h1._6EBuvT span, h1',
  price: 'div.Nx9bqj.CxhGGd, div._30jeq3._16Jk6d, div.Nx9bqj',
  mrp: 'div.yRaY8j.A6\\+E6v, div._3I9_wc._2p6lqe, div.yRaY8j',
  image: 'img.DByuf4, img._396cs4, img._2r_T1I',
  rating: 'div.XQDdHH, div._3LWZlK',
  reviews: 'span.Wphh3N, span._2_R_DZ',
  soldOut: 'div.Z8JjpR, div._16FRp0',
  breadcrumbs: 'div.r2CdBx a, div._1MR4o5 a',
  highlights: 'li._7eSDEz, li._21Ahn-',
};

export function parseFlipkartProduct(html: string, url: string) {
  const $ = cheerio.load(html);
  const data = extractStructured($);

  const title =
    $(SELECTORS.title).first().text().replace(/\s+/g, ' ').trim() || data.title;
  if (!title)
    throw new ScrapeError(
      'Could not read the Flipkart page. It may be blocked or unavailable.',
    );

  const current = extractPrice($(SELECTORS.price)) || data.price || 0;
  const mrp = extractPrice($(SELECTORS.mrp)) || data.originalPrice || current;
  const original = Math.max(mrp, current);
  const crumbs = $(SELECTORS.breadcrumbs)
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((c) => c && c.toLowerCase() !== 'home');
  const highlights = $(SELECTORS.highlights)
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  return {
    url,
    store: 'flipkart',
    storeName: 'Flipkart',
    title,
    currency: '₹',
    image: $(SELECTORS.image).first().attr('src') || data.image || '',
    currentPrice: current,
    originalPrice: original,
    discountRate: original > 0 ? Math.round(((original - current) / original) * 100) : 0,
    category: crumbs.at(-2) || data.category || 'General',
    description: highlights.join('\n') || data.description || '',
    isOutOfStock: $(SELECTORS.soldOut).length > 0 || data.inStock === false,
    stars: parseFloat($(SELECTORS.rating).first().text()) || data.stars || 0,
    reviewsCount:
      Math.round(parsePrice($(SELECTORS.reviews).first().text())) ||
      data.reviewsCount ||
      0,
  };
}

const pidOf = (href: string) => {
  const url = new URL(href, 'https://www.flipkart.com');
  return url.searchParams.get('pid') ?? url.pathname;
};

const PRICE_TEXT = /^₹\s?[\d,]+(\.\d{1,2})?$/;

/**
 * Parse search results by structure rather than class names, which Flipkart
 * rotates often: for each product link, climb to the largest ancestor that
 * still contains only that product, then read its title and first price.
 */
export function parseFlipkartSearch(html: string): Offer[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const offers: Offer[] = [];

  $('a[href*="/p/"]').each((_, anchor) => {
    const href = $(anchor).attr('href');
    if (!href) return;
    const pid = pidOf(href);
    if (seen.has(pid)) return;

    let card = $(anchor);
    for (let depth = 0; depth < 8; depth++) {
      const parent = card.parent();
      if (!parent.length) break;
      const pids = new Set(
        parent
          .find('a[href*="/p/"]')
          .map((_, a) => pidOf($(a).attr('href') ?? ''))
          .get(),
      );
      if (pids.size > 1) break;
      card = parent;
    }

    const prices = card
      .find('*')
      .filter(
        (_, node) =>
          $(node).children().length === 0 && PRICE_TEXT.test($(node).text().trim()),
      )
      .map((_, node) => parsePrice($(node).text()))
      .get();
    const title = (
      card.find('img[alt]').first().attr('alt') ||
      $(anchor).attr('title') ||
      $(anchor).text()
    )
      .replace(/\s+/g, ' ')
      .trim();
    if (!prices.length || !title) return;

    seen.add(pid);
    const url = new URL(href, 'https://www.flipkart.com');
    url.search = url.searchParams.get('pid') ? `?pid=${url.searchParams.get('pid')}` : '';
    offers.push({
      store: 'flipkart',
      storeName: 'Flipkart',
      title,
      url: url.toString(),
      price: prices[0],
      currency: '₹',
      image: card
        .find('img')
        .map((_, img) => $(img).attr('src') ?? '')
        .get()
        .find((src) => /^https?:\/\//.test(src) && !/placeholder/i.test(src)),
    });
  });

  return offers;
}

export const flipkart: StoreAdapter = {
  id: 'flipkart',
  name: 'Flipkart',
  // Plain HTTP requests receive an empty app shell without product data.
  fetchMode: 'browser',
  matches: (url) => /(^|\.)flipkart\.com$/i.test(url.hostname),
  normalize(url) {
    const pid = url.searchParams.get('pid');
    return `https://www.flipkart.com${url.pathname}${pid ? `?pid=${pid}` : ''}`;
  },
  parse: parseFlipkartProduct,
  search: {
    regions: ['in'],
    url: (query) => `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
    parse: parseFlipkartSearch,
  },
};
