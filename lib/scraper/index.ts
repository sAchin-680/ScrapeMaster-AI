import 'server-only';
import { fetchHtml } from './http';
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
  const html = await fetchHtml(url);
  return adapter.parse(html, url);
}
