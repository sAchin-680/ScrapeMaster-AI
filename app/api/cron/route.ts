import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { env } from '@/lib/env';
import ProductModel from '@/lib/models/product.model';
import { getEmailNotifType } from '@/lib/notifications';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';
import { scrapeAmazonProduct } from '@/lib/scraper';
import { appendPrice, getPriceStats } from '@/lib/utils';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const CONCURRENCY = 4;

function isAuthorized(request: NextRequest) {
  if (!env.CRON_SECRET) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${env.CRON_SECRET}`;
}

async function refreshProduct(id: string) {
  const product = await ProductModel.findById(id);
  if (!product) return { id, status: 'missing' as const };

  const scraped = await scrapeAmazonProduct(product.url);
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

  return { id, status: 'updated' as const, notification };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await connectDB();
  const ids = (await ProductModel.find({}).select('_id').lean()).map((p) => String(p._id));

  const results: PromiseSettledResult<Awaited<ReturnType<typeof refreshProduct>>>[] = [];
  // Process in small batches so one slow page or a rate limit can't sink the run.
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.allSettled(batch.map(refreshProduct))));
  }

  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) => console.error('[cron] refresh failed', (r as PromiseRejectedResult).reason));

  return NextResponse.json({
    processed: ids.length,
    updated: results.filter((r) => r.status === 'fulfilled' && r.value.status === 'updated').length,
    failed: failed.length,
    durationMs: Date.now() - startedAt,
  });
}
