import { CIRCUIT, circuitState, type CircuitState, type SourceHealth } from './health';

export type SourceReliability = {
  kind: string;
  successRate: number | null;
  checks: number;
  lastSuccessAt?: string;
  state: CircuitState;
  openUntil?: string;
};

export type StoreReliability = {
  store: string;
  storeName: string;
  /** Domain used for the store's logo. */
  domain: string;
  /** Share of successful requests over each source's rolling window. */
  successRate: number | null;
  checks: number;
  lastSuccessAt?: string;
  lastCheckedAt?: string;
  status: 'operational' | 'degraded' | 'paused';
  sources: SourceReliability[];
};

/** Below this success rate a store is shown as degraded. */
export const HEALTHY_RATE = 0.8;
/** Sources not checked for this long are left out. */
const STALE_MS = 7 * 24 * 60 * 60_000;

const DOMAINS: Record<string, string> = { amazon: 'amazon.in', flipkart: 'flipkart.com' };

const latest = (...dates: (string | undefined)[]) =>
  dates.filter(Boolean).sort().at(-1) as string | undefined;

/** Roll persisted source health up into one row per store, busiest first. */
export function summarizeReliability(
  entries: SourceHealth[],
  now = Date.now(),
): StoreReliability[] {
  const stores = new Map<string, StoreReliability>();

  for (const h of entries) {
    const lastCheckedAt = latest(h.lastSuccessAt, h.lastFailureAt);
    if (!h.recent.length || !lastCheckedAt || now - Date.parse(lastCheckedAt) > STALE_MS)
      continue;

    const row = stores.get(h.store) ?? {
      store: h.store,
      storeName: h.storeName,
      domain: DOMAINS[h.store] ?? h.store,
      successRate: null,
      checks: 0,
      status: 'operational' as const,
      sources: [],
    };
    const successes = h.recent.filter(Boolean).length;
    row.sources.push({
      kind: h.kind,
      successRate: successes / h.recent.length,
      checks: h.recent.length,
      lastSuccessAt: h.lastSuccessAt,
      state: circuitState(h, now),
      openUntil: h.openUntil,
    });
    // Weighted by checks, so busy page kinds count for more.
    const total = (row.successRate ?? 0) * row.checks + successes;
    row.checks += h.recent.length;
    row.successRate = total / row.checks;
    row.lastSuccessAt = latest(row.lastSuccessAt, h.lastSuccessAt);
    row.lastCheckedAt = latest(row.lastCheckedAt, lastCheckedAt);
    stores.set(h.store, row);
  }

  for (const row of stores.values()) {
    const open = row.sources.filter((s) => s.state === 'open').length;
    row.status =
      open === row.sources.length
        ? 'paused'
        : open > 0 || (row.successRate ?? 0) < HEALTHY_RATE
          ? 'degraded'
          : 'operational';
    row.sources.sort((a, b) => b.checks - a.checks);
  }
  return [...stores.values()].sort((a, b) => b.checks - a.checks);
}

export const RELIABILITY_WINDOW = CIRCUIT.window;
