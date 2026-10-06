import 'server-only';
import axios from 'axios';
import type { Region } from '@/lib/scraper/stores';
import { USER_AGENT } from '@/lib/scraper/agent';
import {
  mergeSuggestions,
  parseAmazonSuggestions,
  parseFlipkartSuggestions,
  parseGoogleSuggestions,
} from './parse';

const TIMEOUT_MS = 1_500;
const CACHE_TTL_MS = 10 * 60_000;

const AMAZON_MARKETPLACE: Partial<Record<Region, string>> = {
  us: 'ATVPDKIKX0DER',
  uk: 'A1F83G8C2ARO7P',
  de: 'A1PA6795UKMFR9',
};
const GOOGLE_COUNTRY: Record<Region, string> = { in: 'in', us: 'us', uk: 'gb', de: 'de' };

async function flipkart(query: string) {
  const { data } = await axios.post(
    'https://1.rome.api.flipkart.com/api/4/discover/autosuggest',
    {
      query,
      contextUri: '/',
      marketPlaceId: 'FLIPKART',
      types: ['QUERY', 'QUERY_STORE'],
      rows: 10,
    },
    {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': USER_AGENT,
        'X-User-Agent': 'Mozilla/5.0 FKUA/website/42/website/Desktop',
        Origin: 'https://www.flipkart.com',
        Referer: 'https://www.flipkart.com/',
      },
    },
  );
  return parseFlipkartSuggestions(data);
}

async function amazon(query: string, region: Region) {
  const mid = AMAZON_MARKETPLACE[region];
  if (!mid) return [];
  const { data } = await axios.get('https://completion.amazon.com/api/2017/suggestions', {
    params: { limit: 10, prefix: query, 'suggestion-type': 'KEYWORD', alias: 'aps', mid },
    timeout: TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT },
  });
  return parseAmazonSuggestions(data);
}

async function google(query: string, region: Region) {
  const { data } = await axios.get('https://suggestqueries.google.com/complete/search', {
    params: { client: 'firefox', hl: 'en', gl: GOOGLE_COUNTRY[region], q: query },
    timeout: TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT },
  });
  return parseGoogleSuggestions(data);
}

const cache = new Map<string, { at: number; value: string[] }>();

/**
 * Search suggestions for a partial query: the region's store autocomplete
 * first, search-engine suggestions as a fallback. Never throws.
 */
export async function getQuerySuggestions(
  query: string,
  region: Region,
): Promise<string[]> {
  const key = `${region}:${query.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const primary = region === 'in' ? flipkart(query) : amazon(query, region);
  const [store, web] = await Promise.all([
    primary.catch(() => [] as string[]),
    google(query, region).catch(() => [] as string[]),
  ]);
  const value = mergeSuggestions(query, [store, web]);

  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}
