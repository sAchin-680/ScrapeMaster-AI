const KEY = 'sm_recent_searches';
const MAX = 6;

/** Recent searches, stored only in this browser. */
export function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(value)
      ? value.filter((v) => typeof v === 'string').slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

export function saveRecent(query: string) {
  try {
    const term = query.trim().toLowerCase();
    if (!term) return;
    const next = [term, ...readRecent().filter((q) => q !== term)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode); recent searches are optional.
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
