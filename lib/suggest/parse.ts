/** Pure parsers for store and search-engine autocomplete responses. */

type Json = Record<string, unknown>;

const clean = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().toLowerCase() : '';

/** Flipkart autosuggest: query and store-query widgets carry the suggestion text. */
export function parseFlipkartSuggestions(body: unknown): string[] {
  const suggestions = ((body as Json)?.RESPONSE as Json)?.suggestions;
  if (!Array.isArray(suggestions)) return [];
  return suggestions.flatMap((s: Json) => {
    const type = String(s?.type ?? '');
    if (!/QUERY/.test(type)) return [];
    const value = ((s?.data as Json)?.component as Json)?.value as Json | undefined;
    const text = clean(value?.query);
    return text ? [text] : [];
  });
}

/** Amazon completion API. */
export function parseAmazonSuggestions(body: unknown): string[] {
  const suggestions = (body as Json)?.suggestions;
  if (!Array.isArray(suggestions)) return [];
  return suggestions.flatMap((s: Json) => {
    const text = s?.type === 'KEYWORD' ? clean(s.value) : '';
    return text ? [text] : [];
  });
}

// Search-engine suggestions include non-shopping intents; drop the obvious ones.
const NON_SHOPPING =
  /\b(recipes?|meaning|how to|what is|near me|login|sign in|download|lyrics|news|wiki|uses|images?|video|movie|song|airline|flight|france)\b/i;

/** Google's suggest endpoint: `[query, [suggestions], ...]`. */
export function parseGoogleSuggestions(body: unknown): string[] {
  const list = Array.isArray(body) ? body[1] : undefined;
  if (!Array.isArray(list)) return [];
  return list.map(clean).filter((text) => text && !NON_SHOPPING.test(text));
}

/** Merge suggestion lists in priority order, removing duplicates and the query itself. */
export function mergeSuggestions(query: string, lists: string[][], limit = 8) {
  const seen = new Set([clean(query)]);
  const merged: string[] = [];
  for (const list of lists) {
    for (const text of list) {
      if (seen.has(text)) continue;
      seen.add(text);
      merged.push(text);
      if (merged.length >= limit) return merged;
    }
  }
  return merged;
}
