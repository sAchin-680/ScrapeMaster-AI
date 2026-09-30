/**
 * Fetch the live store feeds (deals, bestsellers, sale banners) and save them
 * as snapshots in the database the site reads from. Run it from a network the
 * stores don't block, e.g. a home connection, to keep hosted deployments
 * stocked when their own requests are blocked.
 *
 *   MONGODB_URI=... npm run feeds:refresh            # India (default)
 *   MONGODB_URI=... npm run feeds:refresh -- us uk   # other marketplaces
 */
import mongoose from 'mongoose';
import { writeSnapshot } from '@/lib/services/snapshots';
import { loadDeals, loadSaleSignals, loadTrending } from '@/lib/services/store-feed';

const regions = process.argv.slice(2).length ? process.argv.slice(2) : ['in'];

const feeds = [
  { name: 'deals', load: loadDeals, count: (d: unknown[]) => d.length },
  { name: 'trending', load: loadTrending, count: (d: unknown[]) => d.length },
  {
    name: 'sale-signals',
    load: loadSaleSignals,
    count: (d: { signals: unknown[] }) => d.signals.length,
  },
] as const;

let failures = 0;
for (const region of regions) {
  for (const feed of feeds) {
    const started = Date.now();
    try {
      const data = await feed.load(region);
      const count = feed.count(data as never);
      if (!count && feed.name !== 'sale-signals') throw new Error('no results');
      await writeSnapshot(`${feed.name}:${region}`, data);
      console.log(`✓ ${feed.name}:${region}  ${count} items  ${Date.now() - started}ms`);
    } catch (error) {
      failures++;
      console.error(`✗ ${feed.name}:${region}  ${(error as Error).message}`);
    }
  }
}

await mongoose.disconnect();
process.exit(failures ? 1 : 0);
