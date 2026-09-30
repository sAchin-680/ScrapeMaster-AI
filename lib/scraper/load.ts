import 'server-only';
import { isBrowserConfigured, renderHtml } from './browser';
import { ScrapeError } from './errors';
import { assertPublicURL, fetchHtml } from './http';
import type { StoreAdapter } from './stores/types';

/**
 * Load a page and run a parser on it, using the store's preferred fetch mode.
 * HTTP-first stores fall back to browser rendering when the response can't be
 * parsed (typically a bot check), if a browser is configured.
 */
export async function loadAndParse<T>(
  adapter: StoreAdapter,
  url: string,
  parse: (html: string) => T,
) {
  if (adapter.fetchMode === 'browser') {
    await assertPublicURL(url);
    return parse(await renderHtml(url));
  }

  try {
    return parse(await fetchHtml(url));
  } catch (error) {
    if (!(error instanceof ScrapeError) || !isBrowserConfigured) throw error;
    return parse(await renderHtml(url));
  }
}
