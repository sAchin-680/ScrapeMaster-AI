import { circuitState, type HealthRegistry, type RunStats } from './health';

export type StoreRunRow = RunStats & {
  store: string;
  storeName: string;
  /** Sources (page kinds) of this store currently paused by the circuit breaker. */
  paused: string[];
  outcome: 'ok' | 'partial' | 'failed' | 'skipped';
};

/** Roll up this run's per-source stats into one row per store. */
export function summarizeRun(registry: HealthRegistry, now = Date.now()): StoreRunRow[] {
  const sources = new Map(registry.all().map((h) => [h.source, h]));
  const rows = new Map<string, StoreRunRow>();

  for (const [source, stats] of registry.runStats()) {
    const health = sources.get(source);
    const store = health?.store ?? source.split(':')[0];
    const row = rows.get(store) ?? {
      store,
      storeName: health?.storeName ?? store,
      attempts: 0,
      successes: 0,
      failures: 0,
      retries: 0,
      skipped: 0,
      paused: [],
      outcome: 'ok' as const,
    };
    row.attempts += stats.attempts;
    row.successes += stats.successes;
    row.failures += stats.failures;
    row.retries += stats.retries;
    row.skipped += stats.skipped;
    if (circuitState(health, now) === 'open') row.paused.push(health!.kind);
    rows.set(store, row);
  }

  for (const row of rows.values()) {
    row.outcome =
      row.attempts === 0 && row.skipped > 0
        ? 'skipped'
        : row.successes === 0
          ? 'failed'
          : row.failures > 0
            ? 'partial'
            : 'ok';
  }
  return [...rows.values()].sort((a, b) => a.storeName.localeCompare(b.storeName));
}

/**
 * The run fails only when most stores failed outright. Stores skipped by
 * an open circuit count as failed so a run can't pass by skipping everything.
 */
export function runFailed(rows: StoreRunRow[]) {
  if (!rows.length) return false;
  const failed = rows.filter(
    (r) => r.outcome === 'failed' || r.outcome === 'skipped',
  ).length;
  return failed > rows.length / 2;
}

export function formatRunTable(rows: StoreRunRow[]) {
  const header = ['Store', 'Requests', 'OK', 'Failed', 'Retries', 'Skipped', 'Result'];
  const body = rows.map((r) => [
    r.storeName,
    String(r.attempts),
    String(r.successes),
    String(r.failures),
    String(r.retries),
    String(r.skipped),
    r.outcome + (r.paused.length ? ` (paused: ${r.paused.join(', ')})` : ''),
  ]);
  const widths = header.map((h, i) =>
    Math.max(h.length, ...body.map((b) => b[i].length)),
  );
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...body.map(line)].join(
    '\n',
  );
}
