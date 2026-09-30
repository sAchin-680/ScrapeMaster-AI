import { NextResponse, type NextRequest } from 'next/server';
import { findTrackedProducts } from '@/lib/data/products';
import { regionForCountry } from '@/lib/locale';
import { getQuerySuggestions } from '@/lib/suggest';

export const dynamic = 'force-dynamic';

/** Autocomplete for the search box: popular searches plus matching tracked products. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get('q') ?? '').trim().slice(0, 80);
  if (query.length < 2 || /^https?:\/\//i.test(query)) {
    return NextResponse.json({ queries: [], products: [] });
  }
  const region = regionForCountry(params.get('country') ?? 'IN');

  const [queries, products] = await Promise.all([
    getQuerySuggestions(query, region),
    findTrackedProducts(query),
  ]);

  return NextResponse.json(
    { queries, products },
    // Suggestions change slowly; let the CDN absorb repeated keystrokes.
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
  );
}
