import 'server-only';
import axios from 'axios';
import type { Region } from '@/lib/scraper/stores';
import { USER_AGENT } from '@/lib/scraper/agent';
import { mergeSuggestions, parseGoogleSuggestions } from './parse';

const TIMEOUT_MS = 1_500;
const CACHE_TTL_MS = 10 * 60_000;

const GOOGLE_COUNTRY: Record<Region, string> = { in: 'in', us: 'us', uk: 'gb', de: 'de' };

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
 * Search suggestions for a partial query, from the search engine's public
 * suggest endpoint. Store autocomplete APIs are not used: their robots.txt
 * rules ask crawlers to stay away. Never throws.
 */
export async function getQuerySuggestions(
  query: string,
  region: Region,
): Promise<string[]> {
  const key = `${region}:${query.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const web = await google(query, region).catch(() => [] as string[]);
  const value = mergeSuggestions(query, [web]);

  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}
