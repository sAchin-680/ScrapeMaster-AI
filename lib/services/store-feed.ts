import 'server-only';
import type { Offer } from '@/types';
import { swrMap } from '@/lib/cache';
import { loadAndParse } from '@/lib/scraper/load';
import { parseSaleSignals, type SaleSignal } from '@/lib/scraper/sale-signals';
import { amazon, flipkart, type Region, type StoreAdapter } from '@/lib/scraper/stores';
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

async function loadSaleSignals(region: string): Promise<SaleSignal[]> {
  const homes = [
    { adapter: amazon, id: 'amazon', name: 'Amazon', url: AMAZON_HOME[region as Region] },
  ];
  if (region === 'in')
    homes.push({
      adapter: flipkart,
      id: 'flipkart',
      name: 'Flipkart',
      url: 'https://www.flipkart.com/',
    });

  const settled = await Promise.allSettled(
    homes.map((h) => loadAndParse(h.adapter, h.url, (html) => parseSaleSignals(html, h))),
  );
  return settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

/** Store bestsellers and popular lists, refreshed hourly. */
export const trendingFeed = swrMap(60 * 60_000, loadTrending);

/** Sale banners detected on store homepages, refreshed every 30 minutes. */
export const saleSignalFeed = swrMap(30 * 60_000, loadSaleSignals);
