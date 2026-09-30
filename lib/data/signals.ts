import 'server-only';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';

export type PriceDrop = {
  id: string;
  title: string;
  storeName: string;
  currency: string;
  from: number;
  to: number;
  percent: number;
};

export type StoreWave = { storeName: string; dropped: number; tracked: number };

const WINDOW_MS = 48 * 60 * 60_000;
const MIN_DROP = 0.05;

/**
 * Compare each product's latest price with its price before the window to
 * find real drops, and flag stores where many tracked products fell at once
 * (a strong sign of an unannounced sale).
 */
export async function getPriceSignals(currency: string | null) {
  try {
    await connectDB();
    const since = new Date(Date.now() - WINDOW_MS);
    const rows = await ProductModel.aggregate<{
      _id: string;
      title: string;
      storeName: string;
      currency: string;
      current: number;
      before: number | null;
    }>([
      {
        $match: {
          ...(currency ? { currency } : {}),
          'priceHistory.1': { $exists: true },
        },
      },
      {
        $project: {
          title: 1,
          storeName: 1,
          currency: 1,
          current: '$currentPrice',
          before: {
            $let: {
              vars: {
                older: {
                  $filter: {
                    input: '$priceHistory',
                    as: 'p',
                    cond: { $lt: ['$$p.date', since] },
                  },
                },
              },
              in: { $arrayElemAt: ['$$older.price', -1] },
            },
          },
        },
      },
    ]);

    const drops: PriceDrop[] = rows
      .filter((r) => r.before && r.current < r.before * (1 - MIN_DROP))
      .map((r) => ({
        id: String(r._id),
        title: r.title,
        storeName: r.storeName,
        currency: r.currency,
        from: r.before!,
        to: r.current,
        percent: Math.round(((r.before! - r.current) / r.before!) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);

    const byStore = new Map<string, StoreWave>();
    for (const row of rows) {
      const wave = byStore.get(row.storeName) ?? {
        storeName: row.storeName,
        dropped: 0,
        tracked: 0,
      };
      wave.tracked++;
      if (row.before && row.current < row.before * (1 - MIN_DROP)) wave.dropped++;
      byStore.set(row.storeName, wave);
    }
    const waves = [...byStore.values()].filter(
      (w) => w.tracked >= 3 && w.dropped / w.tracked >= 0.3,
    );

    return { drops, waves };
  } catch (error) {
    console.error('[data] getPriceSignals failed', error);
    return { drops: [], waves: [] };
  }
}
