import 'server-only';
import { cache } from 'react';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';
import type { Product } from '@/types';

// Subscriber emails never leave the server; offers are only needed on detail pages.
const PUBLIC_FIELDS = '-users -offers -__v';

function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

export async function getAllProducts(limit = 24): Promise<Product[]> {
  try {
    await connectDB();
    // Sort by when tracking started so live price updates never reshuffle the grid.
    const products = await ProductModel.find({})
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();
    return serialize(products) as unknown as Product[];
  } catch (error) {
    console.error('[data] getAllProducts failed', error);
    return [];
  }
}

export const getProductById = cache(async (id: string): Promise<Product | null> => {
  if (!isValidObjectId(id)) return null;
  try {
    await connectDB();
    const product = await ProductModel.findById(id).select('-__v').lean();
    if (!product) return null;
    // Expose how many people are watching without leaking who they are.
    const { users, ...rest } = product;
    return serialize({ ...rest, watchers: users?.length ?? 0 }) as unknown as Product;
  } catch (error) {
    console.error('[data] getProductById failed', error);
    return null;
  }
});

export async function getSimilarProducts(id: string, limit = 4): Promise<Product[]> {
  const current = await getProductById(id);
  if (!current) return [];
  try {
    const products = await ProductModel.find({
      _id: { $ne: id },
      ...(current.category ? { category: current.category } : {}),
    })
      .select(PUBLIC_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    if (products.length >= limit || !current.category) {
      return serialize(products) as unknown as Product[];
    }

    // Top up with recent products when the category is sparse.
    const filler = await ProductModel.find({
      _id: { $nin: [id, ...products.map((p) => p._id)] },
    })
      .select(PUBLIC_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(limit - products.length)
      .lean();
    return serialize([...products, ...filler]) as unknown as Product[];
  } catch (error) {
    console.error('[data] getSimilarProducts failed', error);
    return [];
  }
}

export async function getTrackerStats() {
  try {
    await connectDB();
    const [result] = await ProductModel.aggregate<{
      products: number;
      watchers: number;
      datapoints: number;
    }>([
      {
        $group: {
          _id: null,
          products: { $sum: 1 },
          watchers: { $sum: { $size: { $ifNull: ['$users', []] } } },
          datapoints: { $sum: { $size: { $ifNull: ['$priceHistory', []] } } },
        },
      },
    ]);
    return result ?? { products: 0, watchers: 0, datapoints: 0 };
  } catch {
    return { products: 0, watchers: 0, datapoints: 0 };
  }
}

/**
 * Products priced well against their own history: at an all-time low or
 * furthest below their average price.
 */
export async function getTopDeals(
  currency: string | null,
  limit = 4,
): Promise<Product[]> {
  try {
    await connectDB();
    const deals = await ProductModel.aggregate([
      {
        $match: {
          isOutOfStock: { $ne: true },
          'priceHistory.2': { $exists: true },
          averagePrice: { $gt: 0 },
          ...(currency ? { currency } : {}),
        },
      },
      {
        $addFields: {
          belowAverage: {
            $divide: [{ $subtract: ['$averagePrice', '$currentPrice'] }, '$averagePrice'],
          },
          atLow: { $lte: ['$currentPrice', { $multiply: ['$lowestPrice', 1.02] }] },
        },
      },
      { $match: { $or: [{ atLow: true }, { belowAverage: { $gte: 0.03 } }] } },
      { $sort: { atLow: -1, belowAverage: -1 } },
      { $limit: limit },
      { $project: { users: 0, offers: 0, __v: 0, belowAverage: 0, atLow: 0 } },
    ]);
    return serialize(deals) as unknown as Product[];
  } catch (error) {
    console.error('[data] getTopDeals failed', error);
    return [];
  }
}
