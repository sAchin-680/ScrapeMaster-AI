import * as cheerio from 'cheerio';
import type { Offer } from '@/types';
import {
  extractCategory,
  extractCurrency,
  extractDescription,
  extractImage,
  extractPrice,
  extractRating,
  parsePrice,
} from '../extract';
import { ScrapeError } from '../errors';
import type { Region, StoreAdapter } from './types';

const HOST =
  /(^|\.)amazon\.(com|in|co\.uk|de|fr|it|es|ca|com\.au|co\.jp|com\.mx|com\.br|nl|se|pl|sg|ae|sa)$/i;
const ASIN = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i;
const DOMAINS: Record<Region, string> = {
  us: 'www.amazon.com',
  in: 'www.amazon.in',
  uk: 'www.amazon.co.uk',
  de: 'www.amazon.de',
};

export function parseAmazonProduct(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = $('#productTitle').text().trim();
  if (!title) {
    throw new ScrapeError(
      'Could not read the product page. The store may have served a captcha.',
    );
  }

  const currentPrice = extractPrice(
    $('.priceToPay .a-offscreen'),
    $('.priceToPay span.a-price-whole'),
    $('#corePrice_feature_div .a-offscreen'),
    $('#priceblock_dealprice'),
    $('#priceblock_ourprice'),
    $('.a-price .a-offscreen'),
  );
  const originalPrice = extractPrice(
    $('.basisPrice .a-offscreen'),
    $('.a-price.a-text-price span.a-offscreen'),
    $('#listPrice'),
    $('#priceblock_ourprice'),
  );

  const availability = $('#availability span').text().trim().toLowerCase();
  const current = currentPrice || originalPrice;
  const original = Math.max(originalPrice, current);

  return {
    url,
    store: 'amazon',
    storeName: 'Amazon',
    title,
    currency: extractCurrency($('.a-price-symbol')),
    image: extractImage($),
    currentPrice: current,
    originalPrice: original,
    discountRate: original > 0 ? Math.round(((original - current) / original) * 100) : 0,
    category: extractCategory($),
    description: extractDescription($),
    isOutOfStock:
      availability.includes('currently unavailable') ||
      availability.includes('out of stock'),
    ...extractRating($),
  };
}

export function parseAmazonSearch(html: string, pageUrl: string): Offer[] {
  const $ = cheerio.load(html);
  const origin = new URL(pageUrl).origin;

  return $('[data-component-type="s-search-result"][data-asin]')
    .toArray()
    .flatMap((el) => {
      const item = $(el);
      const asin = item.attr('data-asin');
      // Brand and title can sit in separate elements; join text nodes with spaces.
      const title = item
        .find('h2')
        .find('*')
        .addBack()
        .contents()
        .filter((_, node) => node.type === 'text')
        .map((_, node) => $(node).text().trim())
        .get()
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ');
      const price = parsePrice(item.find('.a-price .a-offscreen').first().text());
      if (!asin || !title || !price || item.find('.puis-sponsored-label-text').length)
        return [];
      return [
        {
          store: 'amazon',
          storeName: 'Amazon',
          title,
          url: `${origin}/dp/${asin}`,
          price,
          currency: item.find('.a-price-symbol').first().text().trim() || '$',
          image: item.find('img.s-image').attr('src'),
        },
      ];
    });
}

export const amazon: StoreAdapter = {
  id: 'amazon',
  name: 'Amazon',
  matches: (url) => HOST.test(url.hostname),
  normalize(url) {
    const asin = url.pathname.match(ASIN)?.[1];
    return asin
      ? `https://${url.hostname.toLowerCase()}/dp/${asin.toUpperCase()}`
      : url.toString();
  },
  parse: parseAmazonProduct,
  search: {
    regions: ['us', 'in', 'uk', 'de'],
    url: (query, region) => `https://${DOMAINS[region]}/s?k=${encodeURIComponent(query)}`,
    parse: parseAmazonSearch,
  },
};
