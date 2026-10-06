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
      'blocked',
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

/** Amazon's bot check: a captcha form instead of the requested page. */
export function isAmazonBotCheck($: cheerio.CheerioAPI) {
  return (
    $('form[action*="validateCaptcha"]').length > 0 ||
    /robot check|enter the characters you see below/i.test($('title, h4').text())
  );
}

export function parseAmazonSearch(html: string, pageUrl: string): Offer[] {
  const $ = cheerio.load(html);
  const origin = new URL(pageUrl).origin;
  // Raise instead of returning nothing so callers can retry in a real browser.
  if (isAmazonBotCheck($)) throw new ScrapeError('Amazon served a bot check', 'blocked');

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
      const listPrice = parsePrice(
        item.find('.a-price.a-text-price .a-offscreen').first().text(),
      );
      if (!asin || !title || !price || item.find('.puis-sponsored-label-text').length)
        return [];
      return [
        {
          store: 'amazon',
          storeName: 'Amazon',
          title,
          url: `${origin}/dp/${asin}`,
          price,
          originalPrice: listPrice > price ? listPrice : undefined,
          currency: item.find('.a-price-symbol').first().text().trim() || '$',
          image: item.find('img.s-image').attr('src'),
        },
      ];
    });
}

/** Ranked items from an Amazon Best Sellers page, read by structure. */
export function parseAmazonBestsellers(
  html: string,
  pageUrl: string,
): (Offer & { rank: number })[] {
  const $ = cheerio.load(html);
  if (isAmazonBotCheck($)) throw new ScrapeError('Amazon served a bot check', 'blocked');
  const origin = new URL(pageUrl).origin;

  return $('[id^="gridItemRoot"]')
    .toArray()
    .flatMap((el, index) => {
      const item = $(el);
      const href = item.find('a[href*="/dp/"]').first().attr('href') ?? '';
      const asin = href.match(/\/dp\/([A-Z0-9]{10})/i)?.[1];
      const title = item.find('img[alt]').first().attr('alt')?.trim();
      const priceText = item
        .find('*')
        .filter(
          (_, n) =>
            $(n).children().length === 0 &&
            /^₹\s?[\d,]+(\.\d+)?$/.test($(n).text().trim()),
        )
        .first()
        .text();
      const price = parsePrice(priceText);
      if (!asin || !title || !price) return [];
      const rank =
        Number(item.find('.zg-bdg-text').text().replace(/\D/g, '')) || index + 1;
      return [
        {
          store: 'amazon',
          storeName: 'Amazon',
          title,
          url: `${origin}/dp/${asin}`,
          price,
          currency: '₹',
          image: item.find('img').first().attr('src'),
          rank,
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
