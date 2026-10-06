import 'server-only';
import { connectDB, logDataError } from '@/lib/db';
import SaleModel from '@/lib/models/sale.model';
import type { Sale } from '@/lib/sales';

/** Sales that have not ended yet, soonest first. */
export async function getActiveSales(): Promise<Sale[]> {
  try {
    await connectDB();
    const sales = await SaleModel.find({ end: { $gte: new Date() } })
      .sort({ start: 1 })
      .limit(50)
      .lean();
    return sales.map((s) => ({
      id: String(s._id),
      name: s.name,
      store: s.store,
      countries: s.countries,
      start: s.start.toISOString(),
      end: s.end.toISOString(),
      url: s.url,
      confirmed: s.confirmed,
      tagline: s.tagline,
    }));
  } catch (error) {
    logDataError('getActiveSales', error);
    return [];
  }
}
