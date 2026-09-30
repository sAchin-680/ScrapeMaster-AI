import type { CountryCode } from '@/lib/locale';

export type Sale = {
  id: string;
  name: string;
  store: string;
  countries: CountryCode[] | 'all';
  /** ISO dates in the store's local time. */
  start: string;
  end: string;
  url: string;
  /** False until the retailer officially announces the dates. */
  confirmed: boolean;
  tagline: string;
};

/**
 * Major retail sale events. Retailers announce exact dates a few weeks
 * ahead, so unconfirmed entries are expected windows based on past years.
 * Update this list each season.
 */
export const SALES: Sale[] = [
  {
    id: 'amazon-great-indian-festival-2026',
    name: 'Great Indian Festival',
    store: 'Amazon.in',
    countries: ['IN'],
    start: '2026-09-23T00:00:00+05:30',
    end: '2026-10-23T23:59:59+05:30',
    url: 'https://www.amazon.in/deals',
    confirmed: false,
    tagline: 'Month-long festive deals on phones, electronics and home',
  },
  {
    id: 'flipkart-big-billion-days-2026',
    name: 'Big Billion Days',
    store: 'Flipkart',
    countries: ['IN'],
    start: '2026-09-23T00:00:00+05:30',
    end: '2026-10-02T23:59:59+05:30',
    url: 'https://www.flipkart.com/offers-store',
    confirmed: false,
    tagline: 'Flipkart’s biggest sale of the year',
  },
  {
    id: 'myntra-big-fashion-festival-2026',
    name: 'Big Fashion Festival',
    store: 'Myntra',
    countries: ['IN'],
    start: '2026-10-03T00:00:00+05:30',
    end: '2026-10-10T23:59:59+05:30',
    url: 'https://www.myntra.com/',
    confirmed: false,
    tagline: 'Festive fashion and beauty deals',
  },
  {
    id: 'prime-big-deal-days-2026',
    name: 'Prime Big Deal Days',
    store: 'Amazon',
    countries: ['US', 'GB', 'DE', 'CA', 'AU', 'JP', 'SG', 'AE'],
    start: '2026-10-06T00:00:00-07:00',
    end: '2026-10-07T23:59:59-07:00',
    url: 'https://www.amazon.com/primebigdealdays',
    confirmed: false,
    tagline: 'Two days of Prime-exclusive deals',
  },
  {
    id: 'singles-day-2026',
    name: 'Singles’ Day 11.11',
    store: 'Lazada, Shopee, Noon',
    countries: ['SG', 'AE'],
    start: '2026-11-11T00:00:00+08:00',
    end: '2026-11-11T23:59:59+08:00',
    url: 'https://www.lazada.sg/',
    confirmed: false,
    tagline: 'The world’s biggest one-day shopping event',
  },
  {
    id: 'black-friday-2026',
    name: 'Black Friday',
    store: 'Amazon, Walmart, Best Buy',
    countries: ['US', 'GB', 'DE', 'CA', 'AU'],
    start: '2026-11-27T00:00:00-05:00',
    end: '2026-11-30T23:59:59-05:00',
    url: 'https://www.amazon.com/blackfriday',
    confirmed: false,
    tagline: 'Black Friday through Cyber Monday',
  },
  {
    id: 'flipkart-republic-day-2027',
    name: 'Republic Day Sale',
    store: 'Flipkart & Amazon.in',
    countries: ['IN'],
    start: '2027-01-13T00:00:00+05:30',
    end: '2027-01-19T23:59:59+05:30',
    url: 'https://www.flipkart.com/offers-store',
    confirmed: false,
    tagline: 'New-year deals on electronics and appliances',
  },
];

export type SaleStatus = 'live' | 'upcoming' | 'ended';

export function getSaleStatus(sale: Sale, now = Date.now()): SaleStatus {
  if (now < Date.parse(sale.start)) return 'upcoming';
  if (now > Date.parse(sale.end)) return 'ended';
  return 'live';
}

/** Live sales first, then upcoming ones within the horizon, for a country. */
export function getSalesFor(country: CountryCode, now = Date.now(), horizonDays = 120) {
  const horizon = now + horizonDays * 86_400_000;
  return SALES.filter((sale) => sale.countries === 'all' || sale.countries.includes(country))
    .map((sale) => ({ ...sale, status: getSaleStatus(sale, now) }))
    .filter((sale) => sale.status === 'live' || (sale.status === 'upcoming' && Date.parse(sale.start) < horizon))
    .sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live') || Date.parse(a.start) - Date.parse(b.start));
}

/** Announcement bar items: live sales first, then evergreen buying tips. */
export function getAnnouncements(country: CountryCode, now = Date.now()) {
  const sales = getSalesFor(country, now, 21).map((sale) => ({
    id: sale.id,
    text:
      sale.status === 'live'
        ? `🔥 ${sale.name} is live on ${sale.store}. Check the price history before you buy.`
        : `📅 ${sale.name} on ${sale.store} is coming up. Track products now to spot fake discounts.`,
    href: '/#sales',
    cta: sale.status === 'live' ? 'See sales' : 'View calendar',
  }));

  return [
    ...sales,
    { id: 'tip-alert', text: '💡 Set a price alert and we will email you at the real low, not the “sale” price.', href: '/#track', cta: 'Track a product' },
    { id: 'tip-compare', text: '🛒 The same product is often cheaper on another store. Compare before you checkout.' },
  ];
}
