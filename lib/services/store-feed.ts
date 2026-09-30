import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Offer } from '@/types';
import { swrMap } from '@/lib/cache';
import { withSnapshot, type FeedResult } from '@/lib/services/snapshots';
import { loadAndParse } from '@/lib/scraper/load';
import { parseSaleSignals, type SaleSignal } from '@/lib/scraper/sale-signals';
import { isBrowserConfigured } from '@/lib/scraper/browser';
import {
  amazon,
  flipkart,
  generic,
  type Region,
  type StoreAdapter,
} from '@/lib/scraper/stores';
import { parseAmazonBestsellers } from '@/lib/scraper/stores/amazon';

const AMAZON_HOME: Record<Region, string> = {
  in: 'https://www.amazon.in/',
  us: 'https://www.amazon.com/',
  uk: 'https://www.amazon.co.uk/',
  de: 'https://www.amazon.de/',
};

type Source = {
  adapter: StoreAdapter;
  url: string;
  parse: (html: string, url: string) => Offer[];
};

// Pages that list what is popular right now on each marketplace.
function trendingSources(region: Region): Source[] {
  const sources: Source[] = [
    {
      adapter: amazon,
      url: `${AMAZON_HOME[region]}gp/bestsellers/electronics/`,
      parse: parseAmazonBestsellers,
    },
  ];
  if (region === 'in') {
    for (const q of ['smartphones', 'headphones', 'smart watches']) {
      sources.push({
        adapter: flipkart,
        url: `https://www.flipkart.com/search?q=${encodeURIComponent(q)}&sort=popularity`,
        parse: (html) => flipkart.search!.parse(html, ''),
      });
    }
  }
  return sources;
}

export type TrendingItem = Offer & { source: string; rank?: number };

export async function loadTrending(region: string): Promise<TrendingItem[]> {
  const sources = trendingSources(region as Region);
  const settled = await Promise.allSettled(
    sources.map((s) => loadAndParse(s.adapter, s.url, (html) => s.parse(html, s.url))),
  );
  if (settled.every((r) => r.status === 'rejected'))
    throw new Error('All trending sources failed');
  const lists = settled.map((r, i) => {
    if (r.status === 'rejected')
      console.error('[trending] source failed', sources[i].url, r.reason);
    return r.status === 'fulfilled'
      ? r.value.slice(0, 8).map((o) => ({ ...o, source: sources[i].url }))
      : [];
  });

  // Interleave sources so every store and category is represented.
  const items: TrendingItem[] = [];
  for (let i = 0; i < 8; i++) for (const list of lists) if (list[i]) items.push(list[i]);
  const seen = new Set<string>();
  return items.filter((o) => !seen.has(o.url) && seen.add(o.url)).slice(0, 16);
}

/** Store homepages checked for sale banners, per marketplace. */
const SALE_SOURCES: Record<Region, { id: string; name: string; url: string }[]> = {
  in: [
    { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.in/' },
    { id: 'flipkart', name: 'Flipkart', url: 'https://www.flipkart.com/' },
    { id: 'myntra.com', name: 'Myntra', url: 'https://www.myntra.com/' },
    { id: 'ajio.com', name: 'AJIO', url: 'https://www.ajio.com/' },
    { id: 'croma.com', name: 'Croma', url: 'https://www.croma.com/' },
    {
      id: 'reliancedigital.in',
      name: 'Reliance Digital',
      url: 'https://www.reliancedigital.in/',
    },
    { id: 'tatacliq.com', name: 'Tata CLiQ', url: 'https://www.tatacliq.com/' },
    { id: 'nykaa.com', name: 'Nykaa', url: 'https://www.nykaa.com/' },
  ],
  us: [
    { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com/' },
    { id: 'walmart.com', name: 'Walmart', url: 'https://www.walmart.com/' },
    { id: 'bestbuy.com', name: 'Best Buy', url: 'https://www.bestbuy.com/' },
    { id: 'target.com', name: 'Target', url: 'https://www.target.com/' },
  ],
  uk: [
    { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.co.uk/' },
    { id: 'currys.co.uk', name: 'Currys', url: 'https://www.currys.co.uk/' },
    { id: 'argos.co.uk', name: 'Argos', url: 'https://www.argos.co.uk/' },
  ],
  de: [
    { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.de/' },
    { id: 'mediamarkt.de', name: 'MediaMarkt', url: 'https://www.mediamarkt.de/' },
    { id: 'otto.de', name: 'OTTO', url: 'https://www.otto.de/' },
  ],
};

export type SaleFeed = {
  signals: SaleSignal[];
  /** Every store checked, so the UI can show which have no sale right now. */
  checked: { id: string; name: string; url: string; ok: boolean }[];
};

export async function loadSaleSignals(region: string): Promise<SaleFeed> {
  const sources = SALE_SOURCES[region as Region] ?? SALE_SOURCES.in;
  // Homepages render banners with JavaScript, so use the browser when available.
  const homepage = {
    ...generic,
    fetchMode: isBrowserConfigured ? ('browser' as const) : ('http' as const),
  };

  const settled = await Promise.allSettled(
    sources.map((source) =>
      loadAndParse(homepage, source.url, (html) => parseSaleSignals(html, source), {
        // Promotional banners load late; give them time and scroll into view.
        settleMs: 3_500,
        scroll: true,
      }),
    ),
  );
  if (settled.every((r) => r.status === 'rejected'))
    throw new Error('All store homepages failed');
  const detectedAt = new Date().toISOString();

  return {
    signals: settled.flatMap((r) =>
      r.status === 'fulfilled'
        ? r.value.map((signal) => ({ ...signal, detectedAt }))
        : [],
    ),
    checked: sources.map((source, i) => {
      const result = settled[i];
      if (result.status === 'rejected')
        console.error('[sales] homepage failed', source.url, result.reason);
      return { ...source, ok: result.status === 'fulfilled' };
    }),
  };
}

const DEAL_CATEGORIES: Record<Region, string[]> = {
  in: [
    'smartphones',
    'wireless earbuds',
    'smartwatch',
    'laptops',
    'bluetooth speakers',
    'air fryer',
  ],
  us: ['headphones', 'smartwatch', 'laptops', 'tablets', 'kitchen appliances'],
  uk: ['headphones', 'smartwatch', 'laptops', 'kitchen appliances'],
  de: ['kopfhörer', 'smartwatch', 'laptop', 'küchengeräte'],
};
const MIN_DISCOUNT = 0.2;
// Bigger "discounts" are almost always an inflated MRP, not a real saving.
const MAX_PLAUSIBLE_DISCOUNT = 0.7;

export type DealItem = Offer & { discount: number };

/**
 * Biggest discounts right now: store search results where the selling price
 * is well below the list price the store itself shows.
 */
export async function loadDeals(region: string): Promise<DealItem[]> {
  const categories = DEAL_CATEGORIES[region as Region] ?? DEAL_CATEGORIES.in;
  const settled = await Promise.allSettled(
    categories.map((q) => {
      const url = amazon.search!.url(q, region as Region);
      return loadAndParse(amazon, url, (html) => amazon.search!.parse(html, url));
    }),
  );

  if (settled.every((r) => r.status === 'rejected'))
    throw new Error('All deal sources failed');
  const lists = settled.map((r) =>
    r.status === 'fulfilled'
      ? r.value
          .filter(
            (o) =>
              o.originalPrice &&
              o.price <= o.originalPrice * (1 - MIN_DISCOUNT) &&
              o.price >= o.originalPrice * (1 - MAX_PLAUSIBLE_DISCOUNT),
          )
          .map((o) => ({
            ...o,
            discount: Math.round((1 - o.price / o.originalPrice!) * 100),
          }))
          .sort((a, b) => b.discount - a.discount)
          .slice(0, 3)
      : [],
  );

  // Take the best few per category so one category can't fill the grid.
  const seen = new Set<string>();
  return lists
    .flat()
    .filter((o) => !seen.has(o.url) && seen.add(o.url))
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 12);
}

/**
 * Persist a feed in Next's data cache, which is shared across all server
 * instances on Vercel (in-memory caches are per instance). Failed loads throw
 * and are never stored. The in-memory SWR layer on top serves repeat hits
 * without a cache round-trip.
 */
function shared<T>(
  name: string,
  revalidateSeconds: number,
  load: (key: string) => Promise<T>,
) {
  return (key: string) =>
    unstable_cache(() => load(key), ['store-feed', name, key], {
      revalidate: revalidateSeconds,
      tags: [`store-feed:${name}`],
    })();
}

// The scheduled refresh job saves snapshots every 30 minutes. Anything it
// saved within this window is served as-is instead of scraping from the
// hosting provider, where stores often block requests.
const JOB_FRESH_MS = 45 * 60_000;

// Pages re-fetch every 60 seconds, so a new snapshot is visible within a minute.
const FEED_CACHE_MS = 60_000;

// In-memory cache per server instance, kept short so new data appears quickly.
const ttl = (freshMs: number) => (result: FeedResult<unknown>) =>
  result.stale ? Math.min(freshMs, 60_000) : freshMs;

/** Live store discounts, refreshed hourly. */
export const dealsFeed = swrMap(
  'deals',
  ttl(FEED_CACHE_MS),
  withSnapshot('deals', shared('deals', 3600, loadDeals), (deals) => !deals.length, {
    preferWithinMs: JOB_FRESH_MS,
  }),
);

/** Store bestsellers and popular lists, refreshed hourly. */
export const trendingFeed = swrMap(
  'trending',
  ttl(FEED_CACHE_MS),
  withSnapshot(
    'trending',
    shared('trending', 3600, loadTrending),
    (items) => !items.length,
    {
      preferWithinMs: JOB_FRESH_MS,
    },
  ),
);

/** Sale banners detected on store homepages, refreshed every 30 minutes. */
export const saleSignalFeed = swrMap(
  'sale-signals',
  ttl(FEED_CACHE_MS),
  withSnapshot(
    'sale-signals',
    shared('sale-signals', 1800, loadSaleSignals),
    // Without a browser, homepages often omit their JavaScript-rendered
    // banners, so "no banners" falls back to a recent snapshot that had some.
    (feed) => !feed.signals.length,
    { maxAgeMs: 12 * 60 * 60_000, preferWithinMs: JOB_FRESH_MS },
  ),
);
