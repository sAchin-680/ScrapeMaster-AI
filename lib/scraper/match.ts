const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'new', 'of', 'in', 'on', 'by', 'to', 'a', 'an', 'at', 'or', 'buy', 'online',
  'best', 'price', 'edition', 'version', 'latest', 'pack', 'black', 'white', 'blue', 'silver', 'grey', 'gray',
]);

export function tokenize(title: string) {
  return new Set(
    title
      .toLowerCase()
      .replace(/\(.*?\)|\[.*?\]/g, (m) => ` ${m.slice(1, -1)} `)
      .replace(/(\d+)\s+(gb|tb|mb|mah|inch|in|w|hz|mm|l|kg|g)\b/g, '$1$2')
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t)),
  );
}

/**
 * Similarity between two product titles in [0, 1]. Dice overlap on tokens,
 * penalised when model numbers or capacities from the source are missing.
 */
export function titleSimilarity(source: string, candidate: string) {
  const a = tokenize(source);
  const b = tokenize(candidate);
  if (!a.size || !b.size) return 0;

  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  const dice = (2 * shared) / (a.size + b.size);

  const specs = [...a].filter((t) => /\d/.test(t));
  const missingSpecs = specs.filter((t) => !b.has(t)).length;
  const penalty = specs.length ? missingSpecs / specs.length / 2 : 0;

  return Math.max(0, Math.round((dice - penalty) * 100) / 100);
}

/** Short search query from a long retail title (brand + model words). */
export function searchQuery(title: string, words = 8) {
  return title
    .replace(/\(.*?\)|\[.*?\]|\|.*$/g, ' ')
    .split(/[\s,–—-]+/)
    .filter(Boolean)
    .slice(0, words)
    .join(' ');
}
