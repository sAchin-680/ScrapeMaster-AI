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
      className="card group relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgb(var(--ink)/.4)]"
    >
      <div className="relative aspect-square bg-white p-8">
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
          <span className="num absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-ink">
            −{discount}%
          </span>
        )}
        {product.isOutOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-paper">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-line p-4">
        <p className="eyebrow truncate">{product.category}</p>
        <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-medium leading-snug">{product.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-semibold">
              <LivePrice productId={product._id} price={product.currentPrice} currency={product.currency} />
            </p>
            {product.originalPrice > product.currentPrice && (
              <p className="num text-xs text-muted line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </p>
            )}
          </div>
          {history.length > 1 ? (
            <Sparkline values={history} className="h-9 w-24" />
          ) : (
            <ArrowUpRight className="size-5 text-muted transition group-hover:text-ink" aria-hidden />
          )}
        </div>
      </div>
    </Link>
  );
}
