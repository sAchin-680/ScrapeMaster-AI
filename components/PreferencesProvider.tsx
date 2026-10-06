'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_PREFERENCES,
  getCountry,
  parsePreferences,
  PREFERENCES_COOKIE,
  type Preferences,
} from '@/lib/locale';
import { formatMoney, type RateTable } from '@/lib/utils/money';

type Value = {
  preferences: Preferences;
  rates: RateTable;
  setPreferences: (next: Preferences) => void;
};

const PreferencesContext = createContext<Value>({
  preferences: DEFAULT_PREFERENCES,
  rates: {},
  setPreferences: () => {},
});

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Preferences are read from the cookie in the browser rather than on the
 * server, so pages stay identical for every visitor and can be served
 * statically. Visitors with saved preferences switch over right after load.
 */
export function PreferencesProvider({ children, rates }: { children: ReactNode; rates: RateTable }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const saved = readCookie(PREFERENCES_COOKIE);
    if (saved) setPreferences(parsePreferences(saved));
  }, []);

  const value = useMemo(() => ({ preferences, rates, setPreferences }), [preferences, rates]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
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
