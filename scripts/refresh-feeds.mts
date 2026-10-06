/**
 * Refresh everything that comes from the stores and save it to the database
 * the site reads from:
 *
 *   1. Store feeds (deals, bestsellers, sale banners) as snapshots.
 *   2. Tracked product prices, stalest first, sending any price-drop alerts.
 *   3. A few popular products added to tracking.
 *
 * Every store request goes through per-source circuit breakers and retries
 * (see lib/scraper/load.ts). Health is persisted between runs, a per-store
 * summary is printed at the end, and the run only fails when most stores
 * failed outright: one blocked store must not turn the whole job red.
 *
 *   MONGODB_URI=... npm run feeds:refresh                 # India, feeds + products
 *   MONGODB_URI=... npm run feeds:refresh -- us uk        # other marketplaces
 *   MONGODB_URI=... npm run feeds:refresh -- --no-products
 */
import { appendFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { CircuitOpenError } from '@/lib/scraper/health';
import { formatRunTable, runFailed, summarizeRun } from '@/lib/scraper/run-report';
import { refreshProduct, staleProductIds } from '@/lib/services/refresh';
import { writeSnapshot } from '@/lib/services/snapshots';
import { loadHealthRegistry, saveSourceHealth } from '@/lib/services/source-health';
import { loadDeals, loadSaleSignals, loadTrending } from '@/lib/services/store-feed';
import { isTracked, trackProduct } from '@/lib/services/track';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const regions = args.filter((a) => !a.startsWith('--'));
if (!regions.length) regions.push('in');

// Keep a run comfortably inside the CI step's time slot.
const PRODUCT_BUDGET_MS = 8 * 60_000;
// Popular products tracked automatically: a few per run, up to a fixed catalog size.
const NEW_PER_RUN = 6;
const MAX_AUTO_CATALOG = 60;

const feeds = [
  { name: 'deals', load: loadDeals, count: (d: unknown[]) => d.length },
  { name: 'trending', load: loadTrending, count: (d: unknown[]) => d.length },
  {
    name: 'sale-signals',
    load: loadSaleSignals,
    count: (d: { signals: unknown[] }) => d.signals.length,
  },
] as const;

const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const registry = await loadHealthRegistry();
// Top deals and bestsellers, candidates for automatic tracking.
const popular: string[] = [];

// 1. Store feeds. A feed with no data keeps its previous snapshot.
for (const region of regions) {
  for (const feed of feeds) {
    const started = Date.now();
    try {
      const data = await feed.load(region);
      const count = feed.count(data as never);
      if (!count && feed.name !== 'sale-signals') {
        console.log(
          `– ${feed.name}:${region}  no data this run, keeping the last snapshot`,
        );
        continue;
      }
      await writeSnapshot(`${feed.name}:${region}`, data);
      if (Array.isArray(data)) popular.push(...data.slice(0, 6).map((item) => item.url));
      console.log(`✓ ${feed.name}:${region}  ${count} items  ${Date.now() - started}ms`);
    } catch (error) {
      console.log(`– ${feed.name}:${region}  ${message(error)}`);
    }
  }
}

// 2. Tracked prices, stalest first. Paused stores are skipped without a request.
if (!flags.has('--no-products')) {
  const started = Date.now();
  const ids = await staleProductIds();
  const tally = { updated: 0, failed: 0, skipped: 0 };

  for (const id of ids) {
    if (Date.now() - started > PRODUCT_BUDGET_MS) break;
    try {
      const result = await refreshProduct(id);
      if (result.status === 'updated') tally.updated++;
    } catch (error) {
      if (error instanceof CircuitOpenError) tally.skipped++;
      else tally.failed++;
    }
  }
  const left = ids.length - tally.updated - tally.failed - tally.skipped;
  console.log(
    `• products  ${tally.updated} updated, ${tally.failed} failed, ${tally.skipped} skipped (store paused), ${left} left  ${Date.now() - started}ms`,
  );

  // 3. Grow a catalog of popular products so price histories build up from
  // real data. A few per run keeps requests polite; the cap bounds the job.
  if (!flags.has('--no-popular') && ids.length < MAX_AUTO_CATALOG) {
    let added = 0;
    for (const url of popular) {
      if (added >= NEW_PER_RUN || ids.length + added >= MAX_AUTO_CATALOG) break;
      try {
        if (await isTracked(url)) continue;
        await trackProduct(url);
        added++;
      } catch {
        // Recorded in store health; the next run tries other candidates.
      }
    }
    console.log(`• popular  ${added} newly tracked`);
  }
}

// Persist health so open circuits and success rates carry over between runs.
await saveSourceHealth(registry);

const rows = summarizeRun(registry);
const table = formatRunTable(rows);
const failed = runFailed(rows);
console.log(`\nPer-store summary\n\n${table}\n`);
console.log(
  failed
    ? '✗ Most stores failed this run.'
    : '✓ Run healthy: individual store failures are recorded, not fatal.',
);

// Show the same table on the GitHub Actions run page.
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `### Store refresh\n\n\`\`\`\n${table}\n\`\`\`\n\n${failed ? '❌ Most stores failed.' : '✅ Healthy run.'}\n`,
  );
}

await mongoose.disconnect();
process.exit(failed ? 1 : 0);
