import { Crown, ExternalLink, TrendingUp } from 'lucide-react';
import TrackButton from '@/components/TrackButton';
import Money from '@/components/ui/Money';
import ProductTile from '@/components/ui/ProductTile';
import type { Region } from '@/lib/scraper/stores';
import { trendingFeed } from '@/lib/services/store-feed';

/** Live bestsellers and most popular products straight from the stores. */
export default async function TrendingSection({ region }: { region: Region }) {
  const items = await trendingFeed(region)
    .get()
    .catch(() => []);
  if (!items.length) return null;
  const stores = [...new Set(items.map((i) => i.storeName))];

  return (
    <section
      id="trending"
      className="container scroll-mt-24 pt-16"
      aria-labelledby="trending-heading"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            <TrendingUp className="size-4" aria-hidden /> Trending now
          </p>
          <h2
            id="trending-heading"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Bestsellers on {stores.join(' & ')}
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted">
          Live from the stores&apos; bestseller and popularity rankings, updated hourly.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item, i) => (
          <li key={item.url} className="reveal">
            <ProductTile
              href={item.url}
              external
              image={item.image}
              title={item.title}
              store={{ name: item.storeName, url: item.url }}
              currency={item.currency}
              currentPrice={item.price}
              priority={i < 4}
              price={
                <Money amount={item.price} currency={item.currency} className="num" />
              }
              badge={
                item.rank && item.rank <= 10 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-neutral-900 shadow-sm">
                    <Crown className="size-3" aria-hidden />#{item.rank} Bestseller
                  </span>
                ) : undefined
              }
              aside={
                <ExternalLink
                  className="mb-1 size-4 shrink-0 text-muted transition group-hover:text-accent"
                  aria-hidden
                />
              }
              actions={<TrackButton url={item.url} label="Track price" variant="soft" />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TrendingSkeleton() {
  return (
    <div
      className="container pt-16"
      aria-busy="true"
      aria-label="Loading trending products"
    >
      <div className="skeleton h-5 w-32" />
      <div className="skeleton mt-3 h-9 w-72" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
