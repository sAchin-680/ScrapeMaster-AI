import type { Metadata } from 'next';
import Link from 'next/link';
import RelativeTime from '@/components/live/RelativeTime';
import { LastGood, RateBar, StatusLabel } from '@/components/ReliabilityPanel';
import StoreLogo from '@/components/ui/StoreLogo';
import { getStoreReliability } from '@/lib/data/reliability';
import { RELIABILITY_WINDOW } from '@/lib/scraper/reliability';

// Rebuilt in the background at most once a minute, like the homepage.
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Store status',
  description:
    'Success rate and last good refresh for every store we collect prices from.',
  alternates: { canonical: '/status' },
};

const KIND_LABELS: Record<string, string> = {
  product: 'Product pages',
  search: 'Search',
  bestsellers: 'Bestsellers',
  homepage: 'Homepage (sale banners)',
};

export default async function StatusPage() {
  const stores = await getStoreReliability();
  const lastChecked = stores
    .map((s) => s.lastCheckedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="container max-w-4xl py-16">
      <p className="text-sm font-medium text-accent">Status</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Store reliability</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Prices are refreshed every 30 minutes. Each row shows how often requests to a
        store succeeded over the last {RELIABILITY_WINDOW} attempts per page type, and
        when data last came through.{' '}
        {lastChecked && (
          <>
            Last refresh activity <RelativeTime date={lastChecked} />.
          </>
        )}{' '}
        <Link href="/bot" className="text-accent underline">
          How we collect data
        </Link>
        .
      </p>

      {stores.length === 0 ? (
        <p className="card mt-10 p-6 text-muted">
          No refresh runs recorded yet. Status appears after the first scheduled refresh.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {stores.map((store) => (
            <li key={store.store} className="card p-5">
              <header className="flex items-center gap-3">
                <StoreLogo url={`https://${store.domain}`} name={store.storeName} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{store.storeName}</h2>
                  <p className="text-xs text-muted">
                    <LastGood at={store.lastSuccessAt} />
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="num text-lg font-semibold">
                    {store.successRate === null
                      ? '–'
                      : `${Math.round(store.successRate * 100)}%`}
                  </span>
                  <StatusLabel status={store.status} />
                </div>
              </header>

              <table className="mt-4 w-full text-sm">
                <thead className="sr-only">
                  <tr>
                    <th>Page type</th>
                    <th>Success rate</th>
                    <th>Requests</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {store.sources.map((source) => (
                    <tr key={source.kind}>
                      <td className="py-2 pr-3">
                        {KIND_LABELS[source.kind] ?? source.kind}
                      </td>
                      <td className="w-1/3 py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <RateBar rate={source.successRate} />
                          <span className="num w-10 text-right text-xs">
                            {source.successRate === null
                              ? '–'
                              : `${Math.round(source.successRate * 100)}%`}
                          </span>
                        </div>
                      </td>
                      <td className="num hidden py-2 pr-3 text-right text-xs text-muted sm:table-cell">
                        {source.checks} requests
                      </td>
                      <td className="py-2 text-right text-xs text-muted">
                        {source.state === 'open' && source.openUntil ? (
                          <>
                            Paused, retry <RelativeTime date={source.openUntil} />
                          </>
                        ) : source.state === 'half-open' ? (
                          'Retrying next run'
                        ) : (
                          'Active'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
