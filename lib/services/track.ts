import 'server-only';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';
import { normalizeProductURL, scrapeProduct, ScrapeError } from '@/lib/scraper';
import { appendPrice, getPriceStats } from '@/lib/utils';

/**
 * Scrape a product page and store it (or add a price snapshot if it is already
 * tracked). Shared by the track action and scheduled jobs.
 */
export async function trackProduct(input: string) {
  const url = normalizeProductURL(input);
  const scraped = await scrapeProduct(url);
  if (!scraped.currentPrice) {
    throw new ScrapeError('We found the product but could not read its price.');
  }

  await connectDB();
  const existing = await ProductModel.findOne({ url }).select('priceHistory').lean();
  const priceHistory = appendPrice(existing?.priceHistory ?? [], scraped.currentPrice);

  const product = await ProductModel.findOneAndUpdate(
    { url },
    { ...scraped, priceHistory, ...getPriceStats(priceHistory) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .select('_id')
    .lean();

  return { id: String(product!._id), created: !existing };
}

/** Whether a listing URL is already tracked (after normalisation). */
export async function isTracked(input: string) {
  await connectDB();
  return Boolean(await ProductModel.exists({ url: normalizeProductURL(input) }));
}
