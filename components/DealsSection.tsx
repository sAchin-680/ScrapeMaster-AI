import { Suspense } from 'react';
import { Flame, ShieldCheck } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import TrackButton from '@/components/TrackButton';
import Money from '@/components/ui/Money';
import ProductTile from '@/components/ui/ProductTile';
import type { Region } from '@/lib/scraper/stores';
import { dealsFeed } from '@/lib/services/store-feed';
import { FEED_TIMEOUT_MS, withTimeout } from '@/lib/utils/timeout';
import type { Product } from '@/types';

function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4"
      aria-busy="true"
      aria-label="Loading deals"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
      ))}
    </div>
  );
}

/** Live discounts from store listings, measured against the store's own MRP. */
async function StoreDeals({ region }: { region: Region }) {
  // Time-boxed so slow stores can't hold the page past the function limit;
  // loading continues in the background and fills the cache.
  const deals = await withTimeout(dealsFeed(region).get(), FEED_TIMEOUT_MS, []);
  if (!deals.length) {
    return (
      <p className="text-sm text-muted">
        No big store discounts found right now. Check back soon.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {deals.map((deal) => (
        <li key={deal.url} className="reveal">
          <ProductTile
            href={deal.url}
            external
            image={deal.image}
            title={deal.title}
            store={{ name: deal.storeName, url: deal.url }}
            currency={deal.currency}
            currentPrice={deal.price}
            originalPrice={deal.originalPrice}
            price={<Money amount={deal.price} currency={deal.currency} className="num" />}
            actions={<TrackButton url={deal.url} label="Track price" variant="soft" />}
          />
        </li>
      ))}
    </ul>
  );
}

type Props = {
  /** Tracked products at or near their lowest recorded price. */
  tracked: Product[];
  region: Region;
};

export default function DealsSection({ tracked, region }: Props) {
  return (
    <section
      id="deals"
      className="container scroll-mt-24 pt-16"
      aria-labelledby="deals-heading"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-up">
            <Flame className="size-4" aria-hidden /> Deals right now
          </p>
          <h2 id="deals-heading" className="mt-2 text-3xl font-semibold tracking-tight">
            Smart buys today
          </h2>
        </div>
        <p className="flex max-w-sm items-start gap-2 text-sm text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-down" aria-hidden />
          Real discounts against the store&apos;s own list price. Listings claiming 70%+
          off are skipped as likely inflated MRPs.
        </p>
      </div>

      {tracked.length > 0 && (
        <div className="mb-10">
          <h3 className="mb-4 text-sm font-semibold">At their lowest tracked price</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {tracked.map((product) => (
              <div key={product._id} className="reveal">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="mb-4 text-sm font-semibold">Biggest discounts on stores</h3>
      <Suspense fallback={<GridSkeleton />}>
        <StoreDeals region={region} />
      </Suspense>
    </section>
  );
}
