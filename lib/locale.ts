export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AED: { symbol: 'AED ', name: 'UAE Dirham' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    locale: 'en-IN',
    stores: ['Amazon.in', 'Flipkart', 'Myntra', 'Croma', 'Reliance Digital'],
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    locale: 'en-US',
    stores: ['Amazon', 'Walmart', 'Best Buy', 'Target', 'eBay'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    locale: 'en-GB',
    stores: ['Amazon.co.uk', 'Currys', 'Argos', 'eBay'],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    locale: 'de-DE',
    stores: ['Amazon.de', 'OTTO', 'MediaMarkt'],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    locale: 'en-CA',
    stores: ['Amazon.ca', 'Best Buy', 'Walmart'],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    locale: 'en-AU',
    stores: ['Amazon.com.au', 'JB Hi-Fi', 'eBay'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    locale: 'en-AE',
    stores: ['Amazon.ae', 'Noon'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    locale: 'en-SG',
    stores: ['Amazon.sg', 'Lazada', 'Shopee'],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    locale: 'ja-JP',
    stores: ['Amazon.co.jp', 'Rakuten'],
  },
] as const satisfies readonly {
  code: string;
  name: string;
  flag: string;
  currency: CurrencyCode;
  locale: string;
  stores: readonly string[];
}[];

/** Store search region for a country (stores index by marketplace, not country). */
export function regionForCountry(code: string): 'us' | 'in' | 'uk' | 'de' {
  const c = code.toUpperCase();
  if (c === 'IN') return 'in';
  if (c === 'GB') return 'uk';
  if (c === 'DE') return 'de';
  return 'us';
}

/** Stores with live search support per marketplace (mirrors the scraper adapters). */
export const SEARCHABLE_STORES: Record<ReturnType<typeof regionForCountry>, string[]> = {
  in: ['Amazon.in', 'Flipkart'],
  us: ['Amazon.com'],
  uk: ['Amazon.co.uk'],
  de: ['Amazon.de'],
};

export type CountryCode = (typeof COUNTRIES)[number]['code'];
export type Country = (typeof COUNTRIES)[number];

export type Preferences = {
  country: CountryCode;
  /** 'original' shows each product in its store's currency. */
  currency: CurrencyCode | 'original';
};

export const DEFAULT_PREFERENCES: Preferences = { country: 'IN', currency: 'INR' };
export const PREFERENCES_COOKIE = 'sm_prefs';

export function getCountry(code: string | undefined): Country {
  return COUNTRIES.find((c) => c.code === code?.toUpperCase()) ?? COUNTRIES[0];
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in CURRENCIES;
}

/** Stored products keep a display symbol; map it back to an ISO code. */
export function currencyFromSymbol(symbol: string): CurrencyCode | undefined {
  const trimmed = symbol.trim();
  if (isCurrencyCode(trimmed.toUpperCase())) return trimmed.toUpperCase() as CurrencyCode;
  if (trimmed === '$') return 'USD';
  return (Object.keys(CURRENCIES) as CurrencyCode[]).find(
    (code) => CURRENCIES[code].symbol.trim() === trimmed,
  );
}

export function parsePreferences(raw: string | undefined): Preferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const value = JSON.parse(raw) as Partial<Preferences>;
    const country = getCountry(value.country).code;
    const currency =
      value.currency && (value.currency === 'original' || isCurrencyCode(value.currency))
        ? value.currency
        : DEFAULT_PREFERENCES.currency;
    return { country, currency };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
