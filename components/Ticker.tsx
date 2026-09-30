import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { Product } from '@/types';
import Money from '@/components/ui/Money';
import { getPriceChange, truncate } from '@/lib/utils';

function Change({ product }: { product: Product }) {
  const history = product.priceHistory ?? [];
  const previous = history.length > 1 ? history[history.length - 2].price : product.originalPrice;
  const change = getPriceChange(previous, product.currentPrice);
  const Icon = change < 0 ? ArrowDownRight : change > 0 ? ArrowUpRight : Minus;
  const tone = change < 0 ? 'text-down' : change > 0 ? 'text-up' : 'text-muted';

  return (
    <span className={`num inline-flex items-center gap-0.5 text-xs ${tone}`}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(change)}%
    </span>
  );
}

/**
 * Stock-ticker style marquee of recently tracked products. Only shown on
 * devices with hover, where it pauses under the pointer; on touch screens a
 * moving link is too easy to mis-tap.
 */
export default function Ticker({ products }: { products: Product[] }) {
  if (products.length < 3) return null;
  const items = [...products, ...products];

  return (
    <div className="mask-fade-x group hidden overflow-hidden border-b border-line bg-paper [@media(hover:hover)]:block" aria-label="Recently tracked prices">
      <ul className="flex w-max animate-ticker gap-10 py-2 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] group-active:[animation-play-state:paused] motion-reduce:animate-none">
        {items.map((product, i) => (
          <li key={`${product._id}-${i}`} aria-hidden={i >= products.length}>
            <Link
              href={`/products/${product._id}`}
              tabIndex={i >= products.length ? -1 : undefined}
              className="flex items-center gap-3 whitespace-nowrap text-sm transition hover:opacity-70"
            >
              <span className="text-muted">{truncate(product.title, 28)}</span>
              <Money amount={product.currentPrice} currency={product.currency} className="num font-medium" />
              <Change product={product} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
