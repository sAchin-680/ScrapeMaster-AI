/**
 * Resolve with `fallback` if `promise` takes longer than `ms`. The original
 * promise keeps running (e.g. to fill a cache) but no longer holds up the page.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise.catch(() => fallback), timeout]).finally(() =>
    clearTimeout(timer),
  );
}
