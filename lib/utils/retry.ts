export type RetryOptions = {
  /** Total attempts, including the first. */
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Return false for errors that retrying cannot fix. */
  shouldRetry?: (error: unknown) => boolean;
  /** Injected for tests. */
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

/**
 * "Full jitter" exponential backoff: a random delay between 0 and
 * base * 2^attempt (capped), which spreads retries out instead of having
 * every client hit a struggling server at the same moment.
 */
export function backoffDelay(
  attempt: number,
  baseMs: number,
  maxMs: number,
  random = Math.random,
) {
  return Math.round(random() * Math.min(maxMs, baseMs * 2 ** attempt));
}

export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
) {
  const {
    attempts = 3,
    baseDelayMs = 1_000,
    maxDelayMs = 15_000,
    shouldRetry = () => true,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    random = Math.random,
    onRetry,
  } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt + 1 >= attempts || !shouldRetry(error)) throw error;
      const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs, random);
      onRetry?.(error, attempt + 1, delay);
      await sleep(delay);
    }
  }
}
