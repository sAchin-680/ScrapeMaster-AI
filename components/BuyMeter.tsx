import DealBadge from '@/components/DealBadge';
import type { DealVerdict } from '@/lib/deal';

/** "Should you buy now?" gauge from the product's own price range. */
export default function BuyMeter({ verdict }: { verdict: DealVerdict }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="buy-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="buy-heading" className="font-semibold">
          Should you buy now?
        </h2>
        <DealBadge verdict={verdict} />
      </div>
      <p className="mt-1 text-sm text-muted">{verdict.reason}</p>

      {verdict.level !== 'new' && (
        <div className="mt-5">
          <div
            className="relative h-2 rounded-full bg-gradient-to-r from-up/70 via-amber-400/70 to-down/80"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={verdict.score}
            aria-label="Deal score"
          >
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink shadow"
              style={{ left: `${verdict.score}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>Highest price</span>
            <span>Lowest price</span>
          </div>
        </div>
      )}
    </section>
  );
}
