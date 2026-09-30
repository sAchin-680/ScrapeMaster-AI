import Link from 'next/link';
import {
  ArrowUpRight,
  BellRing,
  CalendarClock,
  LineChart,
  Radar,
  Search,
} from 'lucide-react';
import RelativeTime from '@/components/live/RelativeTime';
import Countdown from '@/components/ui/Countdown';
import StoreLogo from '@/components/ui/StoreLogo';
import type { Country } from '@/lib/locale';
import type { Sale, SaleStatus } from '@/lib/sales';
import type { SaleSignal } from '@/lib/scraper/sale-signals';
import { cn } from '@/lib/utils';

const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

type Props = {
  country: Country;
  sales: (Sale & { status: SaleStatus })[];
  /** Banners detected live on store homepages. */
  signals: SaleSignal[];
  /** Every homepage checked, including stores with no sale right now. */
  checked: { id: string; name: string; url: string; ok: boolean }[];
};

const steps = [
  { icon: Search, text: 'Track what you plan to buy now, before the sale starts.' },
  {
    icon: LineChart,
    text: 'Check the history chart: many prices rise just before a sale.',
  },
  { icon: BellRing, text: 'Get an email the moment it truly drops.' },
];

function StatusPill({ live }: { live: boolean }) {
  return live ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-up/10 px-2.5 py-1 text-xs font-semibold text-up">
      <span className="relative flex size-1.5">
        <span className="absolute inset-0 animate-ping rounded-full bg-up/70" />
        <span className="relative size-1.5 rounded-full bg-up" />
      </span>
      Live now
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
      <CalendarClock className="size-3" aria-hidden /> Coming soon
    </span>
  );
}

/** One card per store, listing every event its homepage currently promotes. */
function StoreSales({ signals }: { signals: SaleSignal[] }) {
  const store = signals[0];
  const live = signals.some((s) => s.status === 'live');

  return (
    <article className="reveal card flex flex-col gap-4 p-5">
      <header className="flex items-center gap-3">
        <StoreLogo
          url={store.url}
          name={store.storeName}
          className="size-11 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{store.storeName}</h3>
          <p className="text-xs text-muted">
            {store.detectedAt ? (
              <>
                Homepage checked <RelativeTime date={store.detectedAt} />
              </>
            ) : (
              'From the store homepage'
            )}
          </p>
        </div>
        <StatusPill live={live} />
      </header>

      <ul className="flex flex-col gap-2">
        {signals.map((signal) => (
          <li
            key={signal.text}
            className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line/60"
          >
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                signal.status === 'live' ? 'bg-up' : 'bg-accent',
              )}
              aria-hidden
            />
            <span className="flex-1 text-sm font-medium">{signal.text}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {signal.status === 'live' ? 'Live' : 'Soon'}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={store.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="btn-ghost mt-auto w-full"
      >
        Open {store.storeName} offers <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </article>
  );
}

function CalendarSale({ sale }: { sale: Sale & { status: SaleStatus } }) {
  const live = sale.status === 'live';
  return (
    <article className="reveal card flex flex-col gap-4 p-5">
      <header className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">{sale.store}</span>
        <StatusPill live={live} />
      </header>
      <div>
        <h3 className="text-lg font-semibold">{sale.name}</h3>
        {sale.tagline && <p className="mt-1 text-sm text-muted">{sale.tagline}</p>}
      </div>
      <div className="rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line/60">
        <p className="text-xs text-muted">{live ? 'Ends in' : 'Starts in'}</p>
        <Countdown
          to={live ? sale.end : sale.start}
          className="mt-0.5 block text-lg font-semibold"
        />
      </div>
      <footer className="mt-auto flex items-center justify-between gap-3 text-xs text-muted">
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
      </footer>
    </article>
  );
}

export default function SalesSection({ country, sales, signals, checked }: Props) {
  if (!sales.length && !signals.length) return null;
  const quiet = checked.filter((c) => c.ok && !signals.some((s) => s.store === c.id));

  const byStore = new Map<string, SaleSignal[]>();
  for (const signal of signals)
    byStore.set(signal.store, [...(byStore.get(signal.store) ?? []), signal]);
  // Stores with something live right now come first.
  const stores = [...byStore.values()].sort(
    (a, b) =>
      Number(b.some((s) => s.status === 'live')) -
      Number(a.some((s) => s.status === 'live')),
  );

  return (
    <section
      id="sales"
      className="container scroll-mt-24 py-16"
      aria-labelledby="sales-heading"
    >
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-10">
        <div
          className="absolute -right-24 -top-24 size-72 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              <Radar className="size-4" aria-hidden /> {country.flag} Sale radar
            </p>
            <h2 id="sales-heading" className="mt-2 text-3xl font-semibold tracking-tight">
              Big sales, live & upcoming
            </h2>
            <p className="mt-3 text-muted">
              We check store homepages every 30 minutes and show what they are promoting
              right now.
            </p>

            <ol className="mt-6 flex flex-col gap-3">
              {steps.map((step, i) => (
                <li key={step.text} className="flex items-start gap-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <step.icon className="size-4" aria-hidden />
                  </span>
                  <span className="pt-1.5">
                    <span className="num mr-1 font-semibold text-ink">{i + 1}.</span>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>

            <Link href="/#track" className="btn-primary mt-8 self-start">
              Get sale-ready
            </Link>
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2">
            {stores.map((group) => (
              <StoreSales key={group[0].store} signals={group} />
            ))}
            {sales.slice(0, 4).map((sale) => (
              <CalendarSale key={sale.id} sale={sale} />
            ))}
          </div>

          {quiet.length > 0 && (
            <div className="lg:col-start-2">
              <p className="mb-2 text-xs font-medium text-muted">
                Also checked, no sale promoted right now
              </p>
              <ul className="flex flex-wrap gap-2">
                {quiet.map((store) => (
                  <li key={store.id}>
                    <a
                      href={store.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 text-xs font-medium transition-colors hover:border-accent/40"
                    >
                      <StoreLogo
                        url={store.url}
                        name={store.name}
                        className="size-6 rounded-full"
                      />
                      {store.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
