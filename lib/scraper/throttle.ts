const MIN_INTERVAL_MS = 1_200;
const nextSlot = new Map<string, number>();

/**
 * Space out requests to the same host so the app stays a polite, low-volume
 * visitor. Resolves when this request may start.
 */
export async function throttle(url: string, minIntervalMs = MIN_INTERVAL_MS) {
  const host = new URL(url).hostname.replace(/^www\./, '');
  const now = Date.now();
  const slot = Math.max(now, nextSlot.get(host) ?? 0);
  nextSlot.set(host, slot + minIntervalMs);
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
}
