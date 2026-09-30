/**
 * Refresh everything that comes from the stores and save it to the database
 * the site reads from:
 *
 *   1. Store feeds (deals, bestsellers, sale banners) as snapshots.
 *   2. Tracked product prices, stalest first, sending any price-drop alerts.
 *
 * Run it from a network the stores don't block (a home connection or a CI
 * runner). Open pages pick up new prices through the live stream.
 *
 *   MONGODB_URI=... npm run feeds:refresh                 # India, feeds + products
 *   MONGODB_URI=... npm run feeds:refresh -- us uk        # other marketplaces
 *   MONGODB_URI=... npm run feeds:refresh -- --no-products
 */
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';
import { refreshProduct } from '@/lib/services/refresh';
import { writeSnapshot } from '@/lib/services/snapshots';
import { loadDeals, loadSaleSignals, loadTrending } from '@/lib/services/store-feed';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const regions = args.filter((a) => !a.startsWith('--'));
if (!regions.length) regions.push('in');

// Keep a run comfortably inside a CI step's time slot.
const PRODUCT_BUDGET_MS = 8 * 60_000;

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

if (!flags.has('--no-products')) {
  await connectDB();
  const started = Date.now();
  const ids = (
    await ProductModel.find({}).select('_id').sort({ updatedAt: 1 }).lean()
  ).map((p) => String(p._id));

  let updated = 0;
  let checked = 0;
  for (const id of ids) {
    if (Date.now() - started > PRODUCT_BUDGET_MS) break;
    checked++;
    try {
      const result = await refreshProduct(id);
      if (result.status === 'updated') updated++;
    } catch (error) {
      console.error(`✗ product ${id}  ${(error as Error).message}`);
    }
  }
  console.log(
    `✓ products  ${updated}/${checked} updated  ${ids.length - checked} left  ${Date.now() - started}ms`,
  );
  // Individual products failing (e.g. a delisted page) is normal; only fail the
  // run if nothing at all could be refreshed.
  if (checked && !updated) failures++;
}

await mongoose.disconnect();
process.exit(failures ? 1 : 0);
