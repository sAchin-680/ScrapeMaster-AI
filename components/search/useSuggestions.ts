'use client';

import { useEffect, useState } from 'react';
import type { ProductSuggestion } from '@/lib/data/products';

export type Suggestions = { queries: string[]; products: ProductSuggestion[] };

const EMPTY: Suggestions = { queries: [], products: [] };
const DEBOUNCE_MS = 150;

/** Debounced suggestions for a partial query; stale requests are cancelled. */
export function useSuggestions(query: string, country: string, enabled: boolean) {
  const [data, setData] = useState<Suggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const term = query.trim();
  const active = enabled && term.length >= 2 && !/^https?:\/\//i.test(term);

  useEffect(() => {
    if (!active) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: term, country });
        const response = await fetch(`/api/suggest?${params}`, {
          signal: controller.signal,
        });
        if (response.ok) setData(await response.json());
      } catch {
        // Aborted or offline: keep the previous suggestions.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, term, country]);

  return { ...(active ? data : EMPTY), loading: active && loading };
}
