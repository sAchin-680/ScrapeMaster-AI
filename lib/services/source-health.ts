import 'server-only';
import { connectDB } from '@/lib/db';
import SourceHealthModel from '@/lib/models/source-health.model';
import {
  HealthRegistry,
  setHealthRegistry,
  type SourceHealth,
} from '@/lib/scraper/health';

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : undefined);

export async function readSourceHealth(): Promise<SourceHealth[]> {
  await connectDB();
  const docs = await SourceHealthModel.find().lean();
  return docs.map((d) => ({
    source: d.source,
    store: d.store,
    storeName: d.storeName,
    kind: d.kind,
    recent: d.recent ?? [],
    consecutiveFailures: d.consecutiveFailures ?? 0,
    lastSuccessAt: iso(d.lastSuccessAt),
    lastFailureAt: iso(d.lastFailureAt),
    lastError: d.lastError ?? undefined,
    openUntil: iso(d.openUntil),
  }));
}

/** Install a registry seeded with persisted state (open circuits carry over). */
export async function loadHealthRegistry() {
  const registry = new HealthRegistry(await readSourceHealth());
  setHealthRegistry(registry);
  return registry;
}

export async function saveSourceHealth(registry: HealthRegistry) {
  const entries = registry.all();
  if (!entries.length) return;
  await connectDB();
  await SourceHealthModel.bulkWrite(
    entries.map((h) => ({
      updateOne: {
        filter: { source: h.source },
        update: {
          $set: {
            store: h.store,
            storeName: h.storeName,
            kind: h.kind,
            recent: h.recent,
            consecutiveFailures: h.consecutiveFailures,
            lastSuccessAt: h.lastSuccessAt ? new Date(h.lastSuccessAt) : null,
            lastFailureAt: h.lastFailureAt ? new Date(h.lastFailureAt) : null,
            lastError: h.lastError ?? null,
            openUntil: h.openUntil ? new Date(h.openUntil) : null,
          },
        },
        upsert: true,
      },
    })),
  );
}
