import Link from 'next/link';
import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import Money from '@/components/ui/Money';
import ProductImage from '@/components/ui/ProductImage';
import StoreLogo from '@/components/ui/StoreLogo';
import { formatNumber } from '@/lib/utils';

type Props = {
  href: string;
  /** External links open the store in a new tab. */
  external?: boolean;
  image?: string;
  title: string;
  store: { name: string; url: string };
  category?: string;
  price: ReactNode;
  currency: string;
  currentPrice: number;
  originalPrice?: number;
  stars?: number;
  reviews?: number;
  /** Overlaid on the image, bottom-left (deal verdict, bestseller rank). */
  badge?: ReactNode;
  /** Extra line under the price, e.g. a cheaper store. */
  note?: ReactNode;
  /** Right side of the price row, e.g. a sparkline. */
  aside?: ReactNode;
  /** Rendered below the card link, e.g. action buttons. */
  actions?: ReactNode;
  outOfStock?: boolean;
  priority?: boolean;
};

/** Shared product card used by tracked products and live store listings. */
export default function ProductTile(props: Props) {
  const {
    href,
    external,
    image,
    title,
    store,
    category,
    price,
    currency,
    currentPrice,
    originalPrice = 0,
    stars = 0,
    reviews = 0,
    badge,
    note,
    aside,
    actions,
    outOfStock,
    priority,
  } = props;
  const savings = originalPrice > currentPrice ? originalPrice - currentPrice : 0;
  const discount = savings ? Math.round((savings / originalPrice) * 100) : 0;
  const linkProps = external
    ? { target: '_blank', rel: 'noopener noreferrer nofollow' }
    : {};

  return (
    <article className="lift group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-2 hover:border-accent/30">
      <Link
        href={href}
        {...linkProps}
        className="flex flex-1 flex-col rounded-xl focus-visible:ring-offset-surface"
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
          <ProductImage
            src={image ?? ''}
            alt={title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 290px, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-5 mix-blend-multiply group-hover:scale-[1.04]"
          />
          <StoreLogo
            url={store.url}
            name={store.name}
            className="absolute left-2 top-2 size-7 shadow-sm ring-black/5"
          />
          {discount > 0 && (
            <span className="num absolute right-2 top-2 rounded-full bg-down px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              −{discount}%
            </span>
          )}
          {outOfStock && (
            <span className="absolute inset-x-2 bottom-2 rounded-md bg-neutral-900/80 py-1 text-center text-xs font-medium text-white backdrop-blur">
              Out of stock
            </span>
          )}
          {!outOfStock && badge && (
            <div className="absolute bottom-2 left-2">{badge}</div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-1.5 pb-1.5 pt-3">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">
            {store.name}
            {category && (
              <span className="font-normal normal-case tracking-normal">
                {' '}
                · {category}
              </span>
            )}
          </p>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug transition-colors group-hover:text-accent">
            {title}
          </h3>
          {stars > 0 && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
              <span className="num font-medium text-ink">{stars.toFixed(1)}</span>
              {reviews > 0 && <span>({formatNumber(reviews)})</span>}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-tight">{price}</div>
              {savings > 0 && (
                <p className="num flex flex-wrap items-baseline gap-x-1.5 text-xs">
                  <Money
                    amount={originalPrice}
                    currency={currency}
                    className="text-muted line-through"
                  />
                  <span className="font-medium text-down">
                    Save <Money amount={savings} currency={currency} />
                  </span>
                </p>
              )}
            </div>
            {aside}
          </div>
          {note}
        </div>
      </Link>
      {actions && <div className="px-1.5 pb-1.5 pt-1">{actions}</div>}
    </article>
  );
}
