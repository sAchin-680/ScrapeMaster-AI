import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import LivePrice from '@/components/live/LivePrice';
import Sparkline from '@/components/ui/Sparkline';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const history = (product.priceHistory ?? []).map((p) => p.price);
  const discount = product.discountRate > 0 ? product.discountRate : 0;

  return (
    <Link
      href={`/products/${product._id}`}
      className="card group relative flex flex-col overflow-hidden p-3 transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-indigo-950/5"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white ring-1 ring-line/60">
        {product.image && (
          <Image
            src={product.image}
            alt={product.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105"
          />
        )}
        {discount > 0 && (
          <span className="num absolute left-2 top-2 rounded-md bg-down px-2 py-0.5 text-xs font-medium text-white">
            −{discount}%
          </span>
        )}
        {product.isOutOfStock && (
          <span className="absolute right-2 top-2 rounded-md bg-ink/80 px-2 py-0.5 text-xs font-medium text-paper backdrop-blur">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1 pb-1 pt-3">
        <p className="eyebrow truncate">{product.category}</p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug">{product.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">
              <LivePrice productId={product._id} price={product.currentPrice} currency={product.currency} />
            </p>
            {product.originalPrice > product.currentPrice && (
              <p className="num text-xs text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </p>
            )}
          </div>
          {history.length > 1 ? (
            <Sparkline values={history} className="h-8 w-20" />
          ) : (
            <ArrowUpRight className="size-5 text-muted transition group-hover:text-ink" aria-hidden />
          )}
        </div>
      </div>
    </Link>
  );
}
