import { Flame } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';

export default function DealsSection({ deals }: { deals: Product[] }) {
  if (!deals.length) return null;

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
        <p className="max-w-sm text-sm text-muted">
          Picked from real price history: products at their lowest price or well below
          their usual price.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
        {deals.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
