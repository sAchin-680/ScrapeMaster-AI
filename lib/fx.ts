import 'server-only';
import { CURRENCIES, type CurrencyCode } from '@/lib/locale';

export type Rates = Record<CurrencyCode, number>;

// Used when the rates API is unreachable; approximate USD-based rates.
const FALLBACK: Rates = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 149,
  AED: 3.67,
  SGD: 1.34,
};

/** USD-based exchange rates, cached for 12 hours. */
export async function getRates(): Promise<Rates> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 43_200 },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return FALLBACK;
    const data = (await response.json()) as { rates?: Record<string, number> };
    const rates = { ...FALLBACK };
    for (const code of Object.keys(CURRENCIES) as CurrencyCode[]) {
      const rate = data.rates?.[code];
      if (typeof rate === 'number' && rate > 0) rates[code] = rate;
    }
    return rates;
  } catch {
    return FALLBACK;
  }
}
