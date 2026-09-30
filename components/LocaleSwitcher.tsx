'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { ChevronDown, Globe, Loader2 } from 'lucide-react';
import { savePreferences } from '@/lib/actions/preferences';
import { COUNTRIES, CURRENCIES, getCountry, type CurrencyCode } from '@/lib/locale';
import { usePreferences } from './PreferencesProvider';

const selectClass =
  'w-full appearance-none rounded-lg border border-line bg-surface px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-accent/60 focus:ring-4 focus:ring-accent/10';

export default function LocaleSwitcher() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const [country, setCountry] = useState<string>(preferences.country);
  const [currency, setCurrency] = useState<string>(preferences.currency);
  const [isPending, startTransition] = useTransition();
  const current = getCountry(preferences.country);

  const save = (close: () => void) =>
    startTransition(async () => {
      await savePreferences({ country, currency });
      router.refresh();
      close();
    });

  return (
    <Popover className="relative">
      <PopoverButton
        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted transition hover:bg-paper hover:text-ink data-[open]:bg-paper data-[open]:text-ink"
        aria-label={`Region ${current.name}, currency ${preferences.currency === 'original' ? 'store currency' : preferences.currency}`}
      >
        <span aria-hidden>{current.flag}</span>
        <span className="hidden font-medium sm:inline">
          {preferences.currency === 'original' ? current.code : preferences.currency}
        </span>
        <ChevronDown className="size-3.5" aria-hidden />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: 'bottom end', gap: 8 }}
        className="card z-50 w-[min(20rem,calc(100vw-2rem))] p-4 shadow-xl transition duration-150 data-[closed]:-translate-y-1 data-[closed]:opacity-0"
      >
        {({ close }) => (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save(close);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-accent" aria-hidden /> Region & currency
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
              Country
              <span className="relative">
                <select
                  className={selectClass}
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    // Follow the country's currency unless the viewer kept store prices.
                    if (currency !== 'original')
                      setCurrency(getCountry(e.target.value).currency);
                  }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden
                />
              </span>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
              Show prices in
              <span className="relative">
                <select
                  className={selectClass}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="original">Store currency (no conversion)</option>
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <option key={code} value={code}>
                      {code} · {CURRENCIES[code].name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden
                />
              </span>
            </label>

            <p className="text-xs text-muted">
              Converted prices are approximate and use daily exchange rates.
            </p>

            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Save
            </button>
          </form>
        )}
      </PopoverPanel>
    </Popover>
  );
}
