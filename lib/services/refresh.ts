import 'server-only';
import ProductModel from '@/lib/models/product.model';
import { getEmailNotifType } from '@/lib/notifications';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';
import { scrapeProduct } from '@/lib/scraper';
import { appendPrice, getPriceStats } from '@/lib/utils';
import { offersAreStale, updateOffers } from './offers';

/** Re-scrape a stored product, append a price snapshot and send any alerts. */
export async function refreshProduct(id: string) {
  const product = await ProductModel.findById(id);
  if (!product) return { id, status: 'missing' as const };

  const scraped = await scrapeProduct(product.url);
  if (!scraped.currentPrice) return { id, status: 'no-price' as const };

  const notification = getEmailNotifType(scraped, {
    priceHistory: product.priceHistory,
    isOutOfStock: product.isOutOfStock,
    discountRate: product.discountRate,
  });

  const priceHistory = appendPrice(product.priceHistory, scraped.currentPrice);
  product.set({ ...scraped, priceHistory, ...getPriceStats(priceHistory) });
  await product.save();

  if (notification && product.users.length) {
    const content = generateEmailBody(
      {
        title: product.title,
        url: product.url,
        image: product.image,
        currency: product.currency,
        currentPrice: product.currentPrice,
      },
      notification,
    );
    await sendEmail(
      content,
      product.users.map((user) => user.email),
    );
  }

  if (offersAreStale(product.offersCheckedAt)) {
    await updateOffers(id).catch((error) =>
      console.error('[refresh] offers failed', id, error),
    );
  }

  return {
    id,
    status: 'updated' as const,
    notification,
    currentPrice: product.currentPrice,
  };
}

const STALE_AFTER_MS = 60 * 60_000;
const inFlight = new Set<string>();

/** Refresh a product when its last check is older than an hour (deduplicated). */
export async function refreshIfStale(id: string) {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  try {
    const product = await ProductModel.findById(id).select('updatedAt').lean();
    if (!product || Date.now() - new Date(product.updatedAt).getTime() < STALE_AFTER_MS)
      return;
    await refreshProduct(id);
  } catch (error) {
    console.error('[refresh] on-view refresh failed', id, error);
  } finally {
    inFlight.delete(id);
  }
}
