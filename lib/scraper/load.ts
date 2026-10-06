import 'server-only';
import { retry, type RetryOptions } from '@/lib/utils/retry';
import { isBrowserConfigured, renderHtml } from './browser';
import { isTransient, ScrapeError } from './errors';
import { getHealthRegistry, pageKind } from './health';
import { assertPublicURL, fetchHtml } from './http';
import { storeFromHost } from './stores/generic';
import type { StoreAdapter } from './stores/types';

type RenderOptions = Parameters<typeof renderHtml>[1];

/** Retry policy for store requests; tests shorten the delays. */
export const loadRetry: RetryOptions = {
  attempts: 3,
  baseDelayMs: 2_000,
  maxDelayMs: 20_000,
};

function sourceFor(adapter: StoreAdapter, url: string) {
  const store =
    adapter.id === 'generic'
      ? storeFromHost(new URL(url).hostname)
      : { id: adapter.id, name: adapter.name };
  const kind = pageKind(url);
  return { source: `${store.id}:${kind}`, store: store.id, storeName: store.name, kind };
}

async function attempt<T>(
  adapter: StoreAdapter,
  url: string,
  parse: (html: string) => T,
  render?: RenderOptions,
) {
  if (adapter.fetchMode === 'browser') {
    await assertPublicURL(url);
    return parse(await renderHtml(url, render));
  }
  try {
    return parse(await fetchHtml(url));
  } catch (error) {
    // HTTP-first stores fall back to a real browser when the response can't
    // be parsed (typically a bot check), if one is configured.
    if (!(error instanceof ScrapeError) || !isTransient(error) || !isBrowserConfigured)
      throw error;
    return parse(await renderHtml(url, render));
  }
}

/**
 * Load a store page and parse it. Skips sources whose circuit is open,
 * retries transient failures with jittered backoff, and records the outcome
 * in the health registry.
 */
export async function loadAndParse<T>(
  adapter: StoreAdapter,
  url: string,
  parse: (html: string) => T,
  render?: RenderOptions,
) {
  const health = getHealthRegistry();
  const ref = sourceFor(adapter, url);
  health.assertCanAttempt(ref.source);

  try {
    const result = await retry(() => attempt(adapter, url, parse, render), {
      ...loadRetry,
      shouldRetry: isTransient,
      onRetry: () => health.retried(ref.source),
    });
    health.record(ref, true);
    return result;
  } catch (error) {
    health.record(ref, false, error);
    throw error;
  }
}
