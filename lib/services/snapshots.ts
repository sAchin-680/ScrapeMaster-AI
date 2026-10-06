import 'server-only';
import { connectDB } from '@/lib/db';
import FeedSnapshot from '@/lib/models/feed-snapshot.model';

export type FeedResult<T> = {
  data: T;
  /** When the data was fetched from the stores (ISO). */
  updatedAt: string;
  /** True when served from the last good snapshot because live fetching failed. */
  stale: boolean;
};

/** Store a snapshot; throws on failure (use saveSnapshot for fire-and-forget). */
export async function writeSnapshot(key: string, data: unknown) {
  await connectDB();
  await FeedSnapshot.updateOne({ key }, { $set: { data } }, { upsert: true });
}

export async function saveSnapshot(key: string, data: unknown) {
  try {
    await writeSnapshot(key, data);
  } catch (error) {
    console.error('[snapshots] save failed', key, error);
  }
}

export async function loadSnapshot<T>(
  key: string,
): Promise<{ data: T; updatedAt: string } | null> {
  try {
    await connectDB();
    const doc = await FeedSnapshot.findOne({ key }).lean();
    return doc
      ? { data: doc.data as T, updatedAt: new Date(doc.updatedAt).toISOString() }
      : null;
  } catch {
    return null;
  }
}
