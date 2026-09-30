import type { Offer, ScrapedProduct } from '@/types';

export type Region = 'us' | 'in' | 'uk' | 'de';

export interface StoreAdapter {
  id: string;
  name: string;
  /** 'browser' for stores that only serve data to real browser engines. */
  fetchMode?: 'http' | 'browser';
  matches(url: URL): boolean;
  /** Canonical URL so tracking params don't create duplicate products. */
  normalize(url: URL): string;
  parse(html: string, url: string): ScrapedProduct;
  /** Optional: search the store for comparable offers. */
  search?: {
    regions: Region[];
    url(query: string, region: Region): string;
    parse(html: string, pageUrl: string): Offer[];
  };
}

export function regionFromCurrency(currency: string): Region {
  if (currency.includes('₹')) return 'in';
  if (currency.includes('£')) return 'uk';
  if (currency.includes('€')) return 'de';
  return 'us';
}
