import 'server-only';
import { loadAndParse } from './load';
import { resolveStore } from './stores';

export { ScrapeError } from './errors';
export { parseAmazonProduct } from './stores/amazon';

export function normalizeProductURL(input: string) {
  const url = new URL(input.trim());
  return resolveStore(url).normalize(url);
}

/** Fetch and parse a product page from any supported store. */
export async function scrapeProduct(url: string) {
  const adapter = resolveStore(new URL(url));
  return loadAndParse(adapter, url, (html) => adapter.parse(html, url));
}
