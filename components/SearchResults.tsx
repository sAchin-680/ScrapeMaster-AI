import { ExternalLink, Trophy } from 'lucide-react';
import TrackButton from '@/components/TrackButton';
import Money from '@/components/ui/Money';
import ProductImage from '@/components/ui/ProductImage';
import StoreLogo from '@/components/ui/StoreLogo';
import type { Region } from '@/lib/scraper/stores';
import { searchStores } from '@/lib/scraper/search';
import { cn } from '@/lib/utils';

export default async function SearchResults({
  query,
  region,
}: {
  query: string;
  region: Region;
}) {
  const { results, failedStores } = await searchStores(query, region);

  return (
    <>
      {failedStores.length > 0 && (
        <p className="mb-6 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          Could not reach {failedStores.join(', ')} right now. Showing results from the
          other stores.
        </p>
      )}

      {results.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No matching products found</h2>
          <p className="mt-2 text-sm text-muted">
            Try a shorter name, a model number, or paste a product link.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <li
              key={result.best.url}
              className="reveal card flex flex-col gap-4 p-4 transition-colors duration-300 hover:border-accent/30"
            >
              <div className="flex gap-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-white">
                  <ProductImage
                    src={result.image ?? ''}
                    alt={result.title}
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-3 text-sm font-medium leading-snug">
                    {result.title}
                  </h3>
                  <p className="mt-2 text-xs text-muted">
                    Best price on{' '}
                    <span className="font-medium text-ink">{result.best.storeName}</span>
                  </p>
                  <Money
                    amount={result.best.price}
                    currency={result.best.currency}
                    className="num text-xl font-semibold"
                  />
                </div>
              </div>

              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line text-sm">
                {result.offers.map((offer) => (
                  <li key={offer.store}>
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 transition hover:bg-paper',
                        offer.price === result.best.price &&
                          result.offers.length > 1 &&
                          'bg-accent-soft/40',
                      )}
                    >
                      <StoreLogo
                        url={offer.url}
                        name={offer.storeName}
                        className="size-7"
                      />
                      <span className="flex-1 font-medium">{offer.storeName}</span>
                      {offer.price === result.best.price && result.offers.length > 1 && (
                        <Trophy
                          className="size-3.5 text-down"
                          aria-label="Lowest price"
                        />
                      )}
                      <Money
                        amount={offer.price}
                        currency={offer.currency}
                        className="num font-semibold"
                      />
                      <ExternalLink className="size-3.5 text-muted" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <TrackButton url={result.best.url} label="Track price & alerts" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
