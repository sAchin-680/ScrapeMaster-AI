'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';
import { generateEmailBody, sendEmail } from '@/lib/nodemailer';
import { scrapeAmazonProduct, ScrapeError } from '@/lib/scraper';
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
    const product = await ProductModel.findById(parsed.data.productId);
    if (!product) return { ok: false, error: 'Product not found' };

    const alreadyTracking = product.users.some((user) => user.email === parsed.data.email);
    if (alreadyTracking) return { ok: true, data: { alreadyTracking } };

    product.users.push({ email: parsed.data.email });
    await product.save();

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
    await sendEmail(content, [parsed.data.email]).catch((error) =>
      console.error('[actions] welcome email failed', error),
    );

    return { ok: true, data: { alreadyTracking } };
  } catch (error) {
    console.error('[actions] addUserEmailToProduct failed', error);
    return { ok: false, error: 'Could not save your email. Please try again.' };
  }
}
