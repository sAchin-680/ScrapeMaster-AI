import EmptyState from '@/components/EmptyState';
import HeroVisual from '@/components/HeroVisual';
import HowItWorks from '@/components/HowItWorks';
import ProductCard from '@/components/ProductCard';
import Searchbar from '@/components/Searchbar';
import Ticker from '@/components/Ticker';
import LiveBadge from '@/components/live/LiveBadge';
import { LiveProvider } from '@/components/live/LiveProvider';
import { getAllProducts, getTrackerStats } from '@/lib/data/products';
import { formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [products, stats] = await Promise.all([getAllProducts(), getTrackerStats()]);

  return (
    <LiveProvider>
      <Ticker products={products} />

      <section id="track" className="relative scroll-mt-24 overflow-hidden">
        <div className="dot-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_left,#000_20%,transparent_70%)]" />
        <div className="container grid items-center gap-14 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex animate-rise flex-col items-start">
            <LiveBadge />
            <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              Prices move.
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">Know first.</span>
                <span className="absolute inset-x-0 bottom-[0.08em] -z-0 h-[0.32em] -rotate-1 bg-accent" aria-hidden />
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              Paste any Amazon link. See its full price history, watch updates stream in live, and get
              an email the second it drops.
            </p>

            <div className="mt-8 w-full max-w-xl">
              <Searchbar />
            </div>

            <dl className="mt-6 flex gap-8 border-t border-line pt-6">
              {[
                ['Products', stats.products],
                ['Snapshots', stats.datapoints],
                ['Watchers', stats.watchers],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow">{label}</dt>
                  <dd className="num mt-1 text-2xl font-semibold">{formatNumber(Number(value))}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise [animation-delay:.15s]">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section id="trending" className="container scroll-mt-24 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Recently tracked</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">On the radar</h2>
          </div>
          {products.length > 0 && (
            <p className="hidden text-sm text-muted sm:block">Updates stream in automatically.</p>
          )}
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} priority={i < 4} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <HowItWorks />
    </LiveProvider>
  );
}
