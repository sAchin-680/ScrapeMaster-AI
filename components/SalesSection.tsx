import { ArrowUpRight, CalendarClock, Radio } from 'lucide-react';
import Countdown from '@/components/ui/Countdown';
import type { Country } from '@/lib/locale';
import type { SaleStatus, Sale } from '@/lib/sales';
import { cn } from '@/lib/utils';

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

type Props = { country: Country; sales: (Sale & { status: SaleStatus })[] };

export default function SalesSection({ country, sales: all }: Props) {
  const sales = all.slice(0, 3);
  if (!sales.length) return null;

  return (
    <section
      id="sales"
      className="container scroll-mt-24 py-16"
      aria-labelledby="sales-heading"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">{country.flag} Sale calendar</p>
          <h2 id="sales-heading" className="mt-2 text-3xl font-semibold tracking-tight">
            Big sales, live & upcoming
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted">
          Track products before the sale starts. Prices often rise just before a sale, and
          the history chart shows it.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {sales.map((sale) => {
          const live = sale.status === 'live';
          return (
            <article
              key={sale.id}
              className={cn(
                'card relative flex flex-col gap-4 overflow-hidden p-5',
                live && 'border-accent/40 ring-1 ring-accent/20',
              )}
            >
              {live && (
                <div
                  className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/10 to-transparent"
                  aria-hidden
                />
              )}
              <div className="relative flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-muted">{sale.store}</span>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-up px-2 py-0.5 text-xs font-semibold text-white">
                    <Radio className="size-3 animate-pulse" aria-hidden /> Live now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                    <CalendarClock className="size-3" aria-hidden /> Upcoming
                  </span>
                )}
              </div>

              <div className="relative">
                <h3 className="text-lg font-semibold">{sale.name}</h3>
                <p className="mt-1 text-sm text-muted">{sale.tagline}</p>
              </div>

              <div className="relative mt-auto rounded-lg bg-paper px-3 py-2.5 ring-1 ring-line/60">
                <p className="text-xs text-muted">{live ? 'Ends in' : 'Starts in'}</p>
                <Countdown
                  to={live ? sale.end : sale.start}
                  className="mt-0.5 block text-lg font-semibold"
                />
              </div>

              <div className="relative flex items-center justify-between gap-3 text-xs text-muted">
                <span>
                  {dateFormat.format(new Date(sale.start))} –{' '}
                  {dateFormat.format(new Date(sale.end))}
                  {!sale.confirmed && ' · expected'}
                </span>
                <a
                  href={sale.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent"
                >
                  {live ? 'Shop sale' : 'Preview'}{' '}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
