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

export type SnapshotStorage = {
  save: (key: string, data: unknown) => Promise<void>;
  load: (key: string) => Promise<{ data: unknown; updatedAt: string } | null>;
};

/**
 * Wrap a live loader: successful, non-empty results are saved as the latest
 * snapshot; failures or empty results fall back to that snapshot (marked
 * stale). Empty results never overwrite a good snapshot.
 */
type SnapshotOptions = {
  storage?: SnapshotStorage;
  /** Ignore snapshots older than this (for data that shouldn't linger). */
  maxAgeMs?: number;
  /**
   * Serve a snapshot younger than this without fetching live, e.g. when a
   * scheduled job keeps snapshots current and live requests are often blocked.
   */
  preferWithinMs?: number;
};

export function withSnapshot<T>(
  name: string,
  load: (key: string) => Promise<T>,
  isEmpty: (data: T) => boolean,
  {
    storage = { save: saveSnapshot, load: loadSnapshot },
    maxAgeMs = Infinity,
    preferWithinMs = 0,
  }: SnapshotOptions = {},
) {
  const age = (updatedAt: string) => Date.now() - Date.parse(updatedAt);
  const read = async (id: string) =>
    (await storage.load(id)) as { data: T; updatedAt: string } | null;

  return async (key: string): Promise<FeedResult<T>> => {
    const id = `${name}:${key}`;

    if (preferWithinMs > 0) {
      const recent = await read(id);
      if (recent && age(recent.updatedAt) < preferWithinMs && !isEmpty(recent.data)) {
        return { ...recent, stale: false };
      }
    }

    let failure: unknown;
    try {
      const data = await load(key);
      if (!isEmpty(data)) {
        void storage.save(id, data);
        return { data, updatedAt: new Date().toISOString(), stale: false };
      }
    } catch (error) {
      failure = error;
    }

    const snapshot = await read(id);
    if (snapshot && age(snapshot.updatedAt) < maxAgeMs && !isEmpty(snapshot.data)) {
      return { ...snapshot, stale: true };
    }
    throw failure ?? new Error(`${name} feed returned no data`);
  };
}
