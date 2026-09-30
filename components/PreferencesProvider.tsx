'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { DEFAULT_PREFERENCES, getCountry, type Preferences } from '@/lib/locale';
import { formatMoney, type RateTable } from '@/lib/utils/money';

type Value = { preferences: Preferences; rates: RateTable };

const PreferencesContext = createContext<Value>({
  preferences: DEFAULT_PREFERENCES,
  rates: {},
});

export function PreferencesProvider({
  children,
  ...value
}: Value & { children: ReactNode }) {
  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

/** Formatter bound to the viewer's currency preference. */
export function useMoney() {
  const { preferences, rates } = usePreferences();
  const locale = getCountry(preferences.country).locale;
  return useCallback(
    (amount: number | undefined, storeCurrency: string) =>
      formatMoney(amount, storeCurrency, preferences, rates, locale),
    [preferences, rates, locale],
  );
}
