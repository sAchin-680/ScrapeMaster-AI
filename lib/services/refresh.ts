import 'server-only';
import ProductModel from '@/lib/models/product.model';
import { getEmailNotifType } from '@/lib/notifications';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';
import { scrapeProduct } from '@/lib/scraper';
import { appendPrice, getPriceStats } from '@/lib/utils';

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
    await sendEmail(content, product.users.map((user) => user.email));
  }

  return { id, status: 'updated' as const, notification, currentPrice: product.currentPrice };
}
