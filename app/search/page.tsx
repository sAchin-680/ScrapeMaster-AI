import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import SearchResults from '@/components/SearchResults';
import Searchbar from '@/components/Searchbar';
import { getCountry, regionForCountry, SEARCHABLE_STORES } from '@/lib/locale';
import { getPreferences } from '@/lib/preferences';

// Room for streamed store data; Vercel Hobby defaults to 10 seconds.
export const maxDuration = 60;

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Prices for “${q}”` : 'Search', robots: { index: false } };
}

function ResultsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Searching stores"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton h-72 rounded-xl" />
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 120);
  if (!query) redirect('/');

  const country = getCountry((await getPreferences()).country);

  return (
    <div className="container py-10">
      <div className="max-w-2xl">
        <Searchbar defaultValue={query} />
      </div>
      <div className="mb-6 mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Live prices for “{query}”
        </h1>
        <p className="text-sm text-muted">
          {country.flag} Searching{' '}
          {SEARCHABLE_STORES[regionForCountry(country.code)].join(' & ')} in real time
        </p>
      </div>
      <Suspense key={query} fallback={<ResultsSkeleton />}>
        <SearchResults query={query} region={regionForCountry(country.code)} />
      </Suspense>
    </div>
  );
}
