import type { CountryCode } from '@/lib/locale';

export type Sale = {
  id: string;
  name: string;
  store: string;
  /** Empty means every country. */
  countries: string[];
  start: string;
  end: string;
  url: string;
  confirmed: boolean;
  tagline: string;
};

export type SaleStatus = 'live' | 'upcoming' | 'ended';

export function getSaleStatus(
  sale: Pick<Sale, 'start' | 'end'>,
  now = Date.now(),
): SaleStatus {
  if (now < Date.parse(sale.start)) return 'upcoming';
  if (now > Date.parse(sale.end)) return 'ended';
  return 'live';
}

/** Live sales first, then upcoming ones within the horizon, for a country. */
export function filterSalesFor(
  sales: Sale[],
  country: CountryCode,
  now = Date.now(),
  horizonDays = 120,
) {
  const horizon = now + horizonDays * 86_400_000;
  return sales
    .filter((sale) => !sale.countries.length || sale.countries.includes(country))
    .map((sale) => ({ ...sale, status: getSaleStatus(sale, now) }))
    .filter(
      (sale) =>
        sale.status === 'live' ||
        (sale.status === 'upcoming' && Date.parse(sale.start) < horizon),
    )
    .sort(
      (a, b) =>
        Number(b.status === 'live') - Number(a.status === 'live') ||
        Date.parse(a.start) - Date.parse(b.start),
    );
}
