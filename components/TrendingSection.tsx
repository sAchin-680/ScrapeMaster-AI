import { ExternalLink, TrendingUp } from 'lucide-react';
import TrackButton from '@/components/TrackButton';
import Money from '@/components/ui/Money';
import ProductImage from '@/components/ui/ProductImage';
import StoreLogo from '@/components/ui/StoreLogo';
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
        {items.map((item) => (
          <li key={item.url} className="card flex flex-col gap-3 p-3">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white ring-1 ring-line/60">
              <ProductImage
                src={item.image ?? ''}
                alt={item.title}
                fill
                sizes="(min-width: 1280px) 280px, (min-width: 768px) 33vw, 50vw"
                className="object-contain p-4"
              />
              <StoreLogo
                url={item.url}
                name={item.storeName}
                className="absolute left-2 top-2 size-7 shadow-sm"
              />
            </div>
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">
              {item.title}
            </h3>
            <div className="mt-auto flex items-center justify-between gap-2">
              <Money
                amount={item.price}
                currency={item.currency}
                className="num text-lg font-semibold"
              />
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
              >
                {item.storeName} <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
            <TrackButton url={item.url} label="Track price" />
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
