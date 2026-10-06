/**
 * Per-source health tracking with a circuit breaker.
 *
 * A source is a store plus page kind (e.g. "amazon:search"), because stores
 * often block one kind of page while serving others. After THRESHOLD
 * consecutive failures a source is paused ("open") for COOLDOWN; once that
 * passes one trial request is allowed ("half-open"): success closes the
 * circuit, failure opens it again.
 */

export const CIRCUIT = {
  threshold: 3,
  cooldownMs: 2 * 60 * 60_000,
  /** Outcomes kept for the rolling success rate. */
  window: 50,
};

export type SourceHealth = {
  source: string;
  store: string;
  storeName: string;
  kind: string;
  /** Most recent outcomes, newest last (true = success). */
  recent: boolean[];
  consecutiveFailures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  /** Paused until this time after repeated failures. */
  openUntil?: string;
};

export type RunStats = {
  attempts: number;
  successes: number;
  failures: number;
  retries: number;
  skipped: number;
};

export type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitOpenError extends Error {
  constructor(source: string, until: string) {
    super(`Skipped: ${source} is paused after repeated failures until ${until}`);
    this.name = 'CircuitOpenError';
  }
}

export function successRate(health: Pick<SourceHealth, 'recent'>) {
  if (!health.recent.length) return null;
  return health.recent.filter(Boolean).length / health.recent.length;
}

export function circuitState(
  health: SourceHealth | undefined,
  now = Date.now(),
): CircuitState {
  if (!health?.openUntil) return 'closed';
  return Date.parse(health.openUntil) > now ? 'open' : 'half-open';
}

export class HealthRegistry {
  private sources = new Map<string, SourceHealth>();
  private run = new Map<string, RunStats>();

  constructor(
    initial: SourceHealth[] = [],
    private now: () => number = Date.now,
    private random: () => number = Math.random,
  ) {
    for (const h of initial) this.sources.set(h.source, { ...h, recent: [...h.recent] });
  }

  private stats(source: string) {
    let s = this.run.get(source);
    if (!s) {
      s = { attempts: 0, successes: 0, failures: 0, retries: 0, skipped: 0 };
      this.run.set(source, s);
    }
    return s;
  }

  private entry(source: string, store: string, storeName: string, kind: string) {
    let h = this.sources.get(source);
    if (!h) {
      h = { source, store, storeName, kind, recent: [], consecutiveFailures: 0 };
      this.sources.set(source, h);
    }
    return h;
  }

  /** Throws CircuitOpenError while a source is paused. */
  assertCanAttempt(source: string) {
    const h = this.sources.get(source);
    if (circuitState(h, this.now()) === 'open') {
      this.stats(source).skipped++;
      throw new CircuitOpenError(source, h!.openUntil!);
    }
  }

  retried(source: string) {
    this.stats(source).retries++;
  }

  record(
    ref: { source: string; store: string; storeName: string; kind: string },
    ok: boolean,
    error?: unknown,
  ) {
    const h = this.entry(ref.source, ref.store, ref.storeName, ref.kind);
    const at = new Date(this.now()).toISOString();
    const s = this.stats(ref.source);
    s.attempts++;
    h.recent = [...h.recent, ok].slice(-CIRCUIT.window);

    if (ok) {
      s.successes++;
      h.consecutiveFailures = 0;
      h.lastSuccessAt = at;
      h.openUntil = undefined;
      return;
    }

    s.failures++;
    h.consecutiveFailures++;
    h.lastFailureAt = at;
    h.lastError =
      error instanceof Error ? error.message.slice(0, 200) : String(error ?? 'failed');
    // A failed trial (half-open) re-opens immediately; otherwise open at the threshold.
    const wasHalfOpen = Boolean(h.openUntil);
    if (wasHalfOpen || h.consecutiveFailures >= CIRCUIT.threshold) {
      // ±10% jitter so paused sources don't all resume in the same run.
      const cooldown = CIRCUIT.cooldownMs * (0.9 + this.random() * 0.2);
      h.openUntil = new Date(this.now() + cooldown).toISOString();
    }
  }

  all(): SourceHealth[] {
    return [...this.sources.values()];
  }

  runStats(): Map<string, RunStats> {
    return this.run;
  }
}

// One registry per process. Request handlers use it in memory only; the
// scheduled refresh job loads persisted state first and saves it afterwards.
let registry = new HealthRegistry();

export function getHealthRegistry() {
  return registry;
}

export function setHealthRegistry(next: HealthRegistry) {
  registry = next;
}

/** Page kind used to separate sources within a store. */
export function pageKind(url: string) {
  const { pathname, search } = new URL(url);
  if (pathname === '/' && !search) return 'homepage';
  if (/\/(gp\/bestsellers|zgbs)\b/.test(pathname) || /sort=popularity/.test(search))
    return 'bestsellers';
  if (pathname === '/s' || pathname.startsWith('/s/') || pathname.startsWith('/search'))
    return 'search';
  return 'product';
}
