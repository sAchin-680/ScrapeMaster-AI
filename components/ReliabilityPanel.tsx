import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import RelativeTime from '@/components/live/RelativeTime';
import StoreLogo from '@/components/ui/StoreLogo';
import { RELIABILITY_WINDOW, type StoreReliability } from '@/lib/scraper/reliability';
import { cn } from '@/lib/utils';

const STATUS = {
  operational: { label: 'Operational', dot: 'bg-down', text: 'text-down' },
  degraded: {
    label: 'Degraded',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  paused: { label: 'Paused', dot: 'bg-up', text: 'text-up' },
} as const;

const percent = (rate: number | null) =>
  rate === null ? '–' : `${Math.round(rate * 100)}%`;

export function StatusLabel({ status }: { status: StoreReliability['status'] }) {
  const s = STATUS[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', s.text)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

export function RateBar({ rate }: { rate: number | null }) {
  return (
    <span className="h-1.5 w-full overflow-hidden rounded-full bg-line/70" aria-hidden>
      <span
        className={cn(
          'block h-full rounded-full',
          rate !== null && rate >= 0.8
            ? 'bg-down'
            : rate !== null && rate >= 0.5
              ? 'bg-amber-500'
              : 'bg-up',
        )}
        style={{ width: `${Math.round((rate ?? 0) * 100)}%` }}
      />
    </span>
  );
}

export function LastGood({ at }: { at?: string }) {
  return at ? (
    <>
      Last good refresh <RelativeTime date={at} />
    </>
  ) : (
    'No successful refresh yet'
  );
}

/** Compact store reliability summary for the homepage. */
export default function ReliabilityPanel({ stores }: { stores: StoreReliability[] }) {
  if (!stores.length) return null;
  return (
    <section id="reliability" className="container scroll-mt-24 pb-20">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-accent">Data reliability</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              How each store is responding
            </h2>
          </div>
          <Link
            href="/status"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Full status <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stores.slice(0, 6).map((store) => (
            <li
              key={store.store}
              className="flex items-center gap-3 rounded-xl bg-paper px-3 py-3 ring-1 ring-line/60"
            >
              <StoreLogo url={`https://${store.domain}`} name={store.storeName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {store.storeName}
                  </span>
                  <span className="num text-sm font-semibold">
                    {percent(store.successRate)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <RateBar rate={store.successRate} />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted">
                  <span className="truncate">
                    <LastGood at={store.lastSuccessAt} />
                  </span>
                  <StatusLabel status={store.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Success rate over the last {RELIABILITY_WINDOW} requests per page type. A page
          type that fails three times in a row is paused for two hours rather than
          retried.
        </p>
      </div>
    </section>
  );
}
