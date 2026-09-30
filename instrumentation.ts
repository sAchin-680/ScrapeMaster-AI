/**
 * Runs once when a server instance starts. Warms the live store feeds for the
 * default marketplace so the first visitor doesn't wait for stores to load.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production')
    return;

  const { dealsFeed, saleSignalFeed, trendingFeed } =
    await import('@/lib/services/store-feed');
  const { DEFAULT_PREFERENCES, regionForCountry } = await import('@/lib/locale');
  const region = regionForCountry(DEFAULT_PREFERENCES.country);

  // Fire and forget: failures are logged by the feeds and retried on demand.
  void trendingFeed(region)
    .get()
    .catch(() => {});
  void saleSignalFeed(region)
    .get()
    .catch(() => {});
}
