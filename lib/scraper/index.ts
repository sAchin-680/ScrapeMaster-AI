import 'server-only';
import axios, { type AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { env, isProxyConfigured } from '@/lib/env';
import type { ScrapedProduct } from '@/types';
import {
  extractCategory,
  extractCurrency,
  extractDescription,
  extractImage,
  extractPrice,
  extractRating,
} from './extract';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

function requestConfig(): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    timeout: 20_000,
    maxRedirects: 5,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml',
    },
  };

  if (isProxyConfigured) {
    const sessionId = Math.floor(Math.random() * 1_000_000);
    config.proxy = {
      protocol: 'http',
      host: 'brd.superproxy.io',
      port: 22225,
      auth: {
        username: `${env.BRIGHTDATA_USERNAME}-session-${sessionId}`,
        password: env.BRIGHTDATA_PASSWORD!,
      },
    };
  }

  return config;
}

export class ScrapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScrapeError';
  }
}

export function parseAmazonProduct(html: string, url: string): ScrapedProduct {
  const $ = cheerio.load(html);

  const title = $('#productTitle').text().trim();
  if (!title) {
    throw new ScrapeError('Could not read the product page. Amazon may have served a captcha.');
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
  const isOutOfStock =
    availability.includes('currently unavailable') || availability.includes('out of stock');

  const current = currentPrice || originalPrice;
  const original = Math.max(originalPrice, current);
  const discountRate = original > 0 ? Math.round(((original - current) / original) * 100) : 0;

  return {
    url,
    title,
    currency: extractCurrency($('.a-price-symbol')),
    image: extractImage($),
    currentPrice: current,
    originalPrice: original,
    discountRate,
    category: extractCategory($),
    description: extractDescription($),
    isOutOfStock,
    ...extractRating($),
  };
}

export async function scrapeAmazonProduct(url: string) {
  try {
    const response = await axios.get<string>(url, requestConfig());
    return parseAmazonProduct(response.data, url);
  } catch (error) {
    if (error instanceof ScrapeError) throw error;
    const message = axios.isAxiosError(error)
      ? `Request failed${error.response ? ` with status ${error.response.status}` : ''}`
      : 'Unexpected scraping error';
    throw new ScrapeError(message);
  }
}
