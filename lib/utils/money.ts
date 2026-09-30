import { currencyFromSymbol, type CurrencyCode, type Preferences } from '@/lib/locale';
import { formatPrice } from './format';

export type RateTable = Partial<Record<CurrencyCode, number>>;

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, rates: RateTable) {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

/**
 * Format a stored price for display. Converts into the viewer's preferred
 * currency when set, otherwise keeps the store's currency.
 */
export function formatMoney(
  amount: number | undefined,
  storeCurrency: string,
  preferences: Pick<Preferences, 'currency'>,
  rates: RateTable,
  locale = 'en-US',
) {
  const value = amount ?? 0;
  const from = currencyFromSymbol(storeCurrency);
  const to = preferences.currency;

  if (to === 'original' || !from || from === to) {
    return { text: formatPrice(value, storeCurrency), converted: false };
  }

  const converted = convert(value, from, to, rates);
  if (converted === null) return { text: formatPrice(value, storeCurrency), converted: false };

  const text = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: to,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(converted);
  return { text, converted: true, original: formatPrice(value, storeCurrency) };
}
