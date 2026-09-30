import 'server-only';
import type { Offer } from '@/types';
import { swrMap } from '@/lib/cache';
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

async function loadTrending(region: string): Promise<TrendingItem[]> {
  const sources = trendingSources(region as Region);
  const settled = await Promise.allSettled(
    sources.map((s) => loadAndParse(s.adapter, s.url, (html) => s.parse(html, s.url))),
  );
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

async function loadSaleSignals(region: string): Promise<SaleFeed> {
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

/** Store bestsellers and popular lists, refreshed hourly. */
export const trendingFeed = swrMap('trending', 60 * 60_000, loadTrending);

/** Sale banners detected on store homepages, refreshed every 30 minutes. */
export const saleSignalFeed = swrMap('sale-signals', 30 * 60_000, loadSaleSignals);
