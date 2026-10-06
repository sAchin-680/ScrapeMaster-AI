/**
 * Why a scrape failed. Transient kinds are worth retrying with backoff;
 * the rest will fail the same way again.
 */
export type ScrapeErrorKind =
  | 'blocked' // bot check or captcha
  | 'rate-limited' // HTTP 429
  | 'unavailable' // 5xx or network failure
  | 'timeout'
  | 'not-found' // HTTP 404/410
  | 'disallowed' // robots.txt or our own URL safety rules
  | 'parse' // page loaded but did not contain what we expected
  | 'unsupported'; // needs a capability this environment doesn't have

const TRANSIENT = new Set<ScrapeErrorKind>([
  'blocked',
  'rate-limited',
  'unavailable',
  'timeout',
]);

export class ScrapeError extends Error {
  constructor(
    message: string,
    readonly kind: ScrapeErrorKind = 'unavailable',
  ) {
    super(message);
    this.name = 'ScrapeError';
  }
}

/** Errors that a later attempt could plausibly fix. */
export function isTransient(error: unknown) {
  return error instanceof ScrapeError ? TRANSIENT.has(error.kind) : true;
}

/** Map an HTTP status to an error kind. */
export function kindForStatus(status?: number): ScrapeErrorKind {
  if (status === 429) return 'rate-limited';
  if (status === 403) return 'blocked';
  if (status === 404 || status === 410) return 'not-found';
  return 'unavailable';
}
