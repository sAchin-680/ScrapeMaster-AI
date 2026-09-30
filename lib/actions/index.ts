'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';
import { scrapeAmazonProduct, ScrapeError } from '@/lib/scraper';
import { refreshProduct } from '@/lib/services/refresh';
import { appendPrice, getPriceStats, isValidAmazonProductURL, normalizeAmazonURL } from '@/lib/utils';
import type { ActionResult } from '@/types';

const urlSchema = z
  .string()
  .trim()
  .min(1, 'Paste an Amazon product link')
  .refine(isValidAmazonProductURL, 'That does not look like an Amazon product link');

export async function scrapeAndStoreProduct(
  input: string,
): Promise<ActionResult<{ id: string }>> {
  const parsed = urlSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const url = normalizeAmazonURL(parsed.data);

  try {
    const scraped = await scrapeAmazonProduct(url);
    if (!scraped.currentPrice) {
      return { ok: false, error: 'We found the product but could not read its price.' };
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

    revalidatePath('/');
    revalidatePath(`/products/${product!._id}`);
    return { ok: true, data: { id: String(product!._id) } };
  } catch (error) {
    console.error('[actions] scrapeAndStoreProduct failed', error);
    const message =
      error instanceof ScrapeError ? error.message : 'Something went wrong. Please try again.';
    return { ok: false, error: message };
  }
}

const trackSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export async function addUserEmailToProduct(
  productId: string,
  email: string,
): Promise<ActionResult<{ alreadyTracking: boolean }>> {
  const parsed = trackSchema.safeParse({ productId, email });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  try {
    await connectDB();
    const { productId: id, email: address } = parsed.data;

    // Atomic conditional push: concurrent submits can't store the same email twice.
    const product = await ProductModel.findOneAndUpdate(
      { _id: id, 'users.email': { $ne: address } },
      { $push: { users: { email: address } } },
      { new: true, projection: 'title url image currency currentPrice' },
    ).lean();

    if (!product) {
      const exists = await ProductModel.exists({ _id: id });
      if (!exists) return { ok: false, error: 'Product not found' };
      return { ok: true, data: { alreadyTracking: true } };
    }

    const content = generateEmailBody(
      {
        title: product.title,
        url: product.url,
        image: product.image,
        currency: product.currency,
        currentPrice: product.currentPrice,
      },
      'WELCOME',
    );
    await sendEmail(content, [address]).catch((error) =>
      console.error('[actions] welcome email failed', error),
    );

    return { ok: true, data: { alreadyTracking: false } };
  } catch (error) {
    console.error('[actions] addUserEmailToProduct failed', error);
    return { ok: false, error: 'Could not save your email. Please try again.' };
  }
}

const REFRESH_COOLDOWN_MS = 60_000;

/** Re-check a product's price right now, rate-limited per product. */
export async function refreshProductNow(
  productId: string,
): Promise<ActionResult<{ changed: boolean }>> {
  if (!/^[a-f\d]{24}$/i.test(productId)) return { ok: false, error: 'Invalid product' };

  try {
    await connectDB();
    const product = await ProductModel.findById(productId).select('updatedAt currentPrice').lean();
    if (!product) return { ok: false, error: 'Product not found' };

    const age = Date.now() - new Date(product.updatedAt).getTime();
    if (age < REFRESH_COOLDOWN_MS) {
      return { ok: false, error: `Checked moments ago. Try again in ${Math.ceil((REFRESH_COOLDOWN_MS - age) / 1000)}s.` };
    }

    const result = await refreshProduct(productId);
    if (result.status !== 'updated') return { ok: false, error: 'Could not read the latest price.' };

    revalidatePath('/');
    revalidatePath(`/products/${productId}`);
    return { ok: true, data: { changed: result.currentPrice !== product.currentPrice } };
  } catch (error) {
    console.error('[actions] refreshProductNow failed', error);
    const message = error instanceof ScrapeError ? error.message : 'Refresh failed. Please try again.';
    return { ok: false, error: message };
  }
}
