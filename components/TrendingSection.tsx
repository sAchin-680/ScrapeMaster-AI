import { Suspense } from 'react';
import { Crown, ExternalLink, TrendingUp } from 'lucide-react';
import TrackButton from '@/components/TrackButton';
import RelativeTime from '@/components/live/RelativeTime';
import Money from '@/components/ui/Money';
import ProductTile from '@/components/ui/ProductTile';
import { SEARCHABLE_STORES } from '@/lib/locale';
import type { Region } from '@/lib/scraper/stores';
import { trendingFeed } from '@/lib/services/store-feed';
import { FEED_TIMEOUT_MS, withTimeout } from '@/lib/utils/timeout';

/** Bestsellers straight from the stores; renders nothing when unavailable. */
async function TrendingContent({ region }: { region: Region }) {
  const feed = await withTimeout(trendingFeed(region).get(), FEED_TIMEOUT_MS, null);
  const items = feed?.data ?? [];
  if (!feed || !items.length) return null;

  return (
    <section className="container pt-16" aria-labelledby="trending-heading">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            <TrendingUp className="size-4" aria-hidden /> Trending now
          </p>
          <h2
            id="trending-heading"
            className="mt-2 text-3xl font-semibold tracking-tight"
          >
            Bestsellers on {SEARCHABLE_STORES[region].join(' & ')}
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted">
          {feed.stale ? (
            <>
              From the stores&apos; bestseller rankings,{' '}
              <RelativeTime date={feed.updatedAt} />.
            </>
          ) : (
            <>
              Live from the stores&apos; bestseller and popularity rankings, updated
              hourly.
            </>
          )}
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

export default function TrendingSection({ region }: { region: Region }) {
  // The anchor always exists so the navbar link works while content streams.
  return (
    <div id="trending" className="scroll-mt-24">
      <Suspense fallback={null}>
        <TrendingContent region={region} />
      </Suspense>
    </div>
  );
}
