import type { Metadata } from 'next';
import DealsSection from '@/components/DealsSection';
import HashScroll from '@/components/HashScroll';
import HeroVisual from '@/components/HeroVisual';
import HowItWorks from '@/components/HowItWorks';
import SalesSection from '@/components/SalesSection';
import TrendingSection from '@/components/TrendingSection';
import { Suspense, type ComponentProps } from 'react';
import type { Region } from '@/lib/scraper/stores';
import ProductCard from '@/components/ProductCard';
import Searchbar from '@/components/Searchbar';
import Ticker from '@/components/Ticker';
import LiveBadge from '@/components/live/LiveBadge';
import { LiveProvider } from '@/components/live/LiveProvider';
import { getAllProducts, getTopDeals, getTrackerStats } from '@/lib/data/products';
import { getActiveSales } from '@/lib/data/sales';
import { filterSalesFor } from '@/lib/sales';
import { CURRENCIES, getCountry, regionForCountry } from '@/lib/locale';
import { saleSignalFeed } from '@/lib/services/store-feed';
import { FEED_TIMEOUT_MS, withTimeout } from '@/lib/utils/timeout';
import { getPreferences } from '@/lib/preferences';
import { formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { alternates: { canonical: '/' } };
// Room for streamed store data; Vercel Hobby defaults to 10 seconds.
export const maxDuration = 60;

/** Streams in once store homepages have been checked for sale banners. */
async function LiveSales({
  region,
  ...props
}: Omit<ComponentProps<typeof SalesSection>, 'signals' | 'checked'> & {
  region: Region;
}) {
  const feed = await withTimeout(saleSignalFeed(region).get(), FEED_TIMEOUT_MS, null);
  return (
    <SalesSection
      {...props}
      signals={feed?.data.signals ?? []}
      checked={feed?.data.checked ?? []}
    />
  );
}

export default async function Home() {
  const preferences = await getPreferences();
  const country = getCountry(preferences.country);
  const local = CURRENCIES[country.currency].symbol.trim();

  const [allProducts, stats, localDeals, activeSales] = await Promise.all([
    getAllProducts(),
    getTrackerStats(),
    getTopDeals(local),
    getActiveSales(),
  ]);
  const sales = filterSalesFor(activeSales, country.code);
  const region = regionForCountry(country.code);
  const deals = localDeals.length ? localDeals : await getTopDeals(null);

  // Feature the best current deal, else the product with the most recorded history.
  const spotlight =
    deals[0] ??
    [...allProducts].sort(
      (a, b) => (b.priceHistory?.length ?? 0) - (a.priceHistory?.length ?? 0),
    )[0] ??
    null;

  // Products sold in the viewer's country come first; skip ones already shown as deals.
  const dealIds = new Set(deals.map((d) => d._id));
  const products = allProducts
    .filter((p) => !dealIds.has(p._id))
    .sort(
      (a, b) => Number(b.currency.trim() === local) - Number(a.currency.trim() === local),
    );

  return (
    <LiveProvider>
      <HashScroll />
      <Ticker products={products} />

      <section
        id="track"
        className="relative scroll-mt-24 overflow-hidden border-b border-line bg-surface"
      >
        <div
          className="dot-grid absolute inset-0 -z-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_30%,transparent_100%)]"
          aria-hidden
        />
        <div className="container relative grid items-center gap-16 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div className="flex animate-rise flex-col items-start">
            <LiveBadge />
            <h1 className="mt-6 text-[clamp(2.4rem,5.5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Track prices on any store.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                Buy at the right time.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Search a product to compare live prices on Amazon, Flipkart and more, or
              paste a link from any shop. Get the full price history and an email the
              moment it drops.
            </p>

            <div className="mt-8 w-full max-w-xl">
              <Searchbar />
            </div>

            <dl className="mt-8 grid w-full max-w-xl grid-cols-3 divide-x divide-line rounded-xl border border-line bg-paper/60">
              {[
                ['Products tracked', stats.products],
                ['Price snapshots', stats.datapoints],
                ['Active watchers', stats.watchers],
              ].map(([label, value]) => (
                <div key={label} className="px-4 py-3">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="num mt-0.5 text-xl font-semibold">
                    {formatNumber(Number(value))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise pb-6 [animation-delay:.15s]">
            <HeroVisual product={spotlight} />
          </div>
        </div>
      </section>

      {/* Section order follows the navbar: Track, Deals, Sales, Trending, How it works. */}
      <DealsSection tracked={deals} region={region} />

      <div id="sales" className="scroll-mt-24">
        <Suspense fallback={null}>
          <LiveSales country={country} sales={sales} region={region} />
        </Suspense>
      </div>

      <TrendingSection region={region} />

      {/* Only shown once something is tracked; an empty box helps no one. */}
      {products.length > 0 && (
        <section id="tracked" className="container scroll-mt-24 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-accent">
                {country.flag} Price-tracked in {country.name}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Recently tracked
              </h2>
            </div>
            <p className="hidden text-sm text-muted sm:block">
              Prices re-checked every 30 minutes and updated live.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <div key={product._id} className="reveal">
                <ProductCard product={product} priority={i < 4} />
              </div>
            ))}
          </div>
        </section>
      )}

      <HowItWorks />
    </LiveProvider>
  );
}
