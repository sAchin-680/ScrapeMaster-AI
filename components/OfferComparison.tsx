import { ExternalLink, Store, Trophy } from 'lucide-react';
import CompareButton from '@/components/CompareButton';
import RelativeTime from '@/components/live/RelativeTime';
import Money from '@/components/ui/Money';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

export default function OfferComparison({ product }: { product: Product }) {
  const offers = product.offers ?? [];
  const best = offers[0];
  const savings = best && best.store !== product.store ? product.currentPrice - best.price : 0;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="offers-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="offers-heading" className="flex items-center gap-2 font-semibold">
            <Store className="size-4 text-accent" aria-hidden /> Best price across stores
          </h2>
          <p className="mt-1 text-xs text-muted">
            {product.offersCheckedAt ? (
              <>
                Compared <RelativeTime date={product.offersCheckedAt} />
              </>
            ) : (
              'Searching other stores for this product…'
            )}
          </p>
        </div>
        <CompareButton productId={product._id} />
      </div>

      {savings > 0 && (
        <p className="mt-4 rounded-lg bg-down/10 px-3 py-2 text-sm text-down">
          Save <Money amount={savings} currency={product.currency} className="font-semibold" /> by buying on{' '}
          {best.storeName}.
        </p>
      )}

      {offers.length > 1 ? (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line">
          {offers.map((offer, i) => (
            <li key={offer.store}>
              <a
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={cn('flex items-center gap-3 px-3 py-3 transition hover:bg-paper sm:px-4', i === 0 && 'bg-accent-soft/40')}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-xs font-semibold ring-1 ring-line">
                  {offer.storeName.slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {offer.storeName}
                    {i === 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-down px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                        <Trophy className="size-3" aria-hidden /> Best
                      </span>
                    )}
                    {offer.store === product.store && <span className="text-xs font-normal text-muted">(this listing)</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">{offer.title}</span>
                </span>
                <Money amount={offer.price} currency={offer.currency} className="num shrink-0 font-semibold" />
                <ExternalLink className="size-4 shrink-0 text-muted" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        product.offersCheckedAt && (
          <p className="mt-4 text-sm text-muted">
            No matching listings found on other supported stores yet. We check again daily.
          </p>
        )
      )}
    </section>
  );
}
