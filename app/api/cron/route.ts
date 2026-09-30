import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { env } from '@/lib/env';
import ProductModel from '@/lib/models/product.model';
import { refreshProduct } from '@/lib/services/refresh';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const CONCURRENCY = 4;

function isAuthorized(request: NextRequest) {
  if (!env.CRON_SECRET) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await connectDB();
  const ids = (await ProductModel.find({}).select('_id').lean()).map((p) =>
    String(p._id),
  );

  const results: PromiseSettledResult<Awaited<ReturnType<typeof refreshProduct>>>[] = [];
  // Process in small batches so one slow page or a rate limit can't sink the run.
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.allSettled(batch.map(refreshProduct))));
  }

  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) =>
    console.error('[cron] refresh failed', (r as PromiseRejectedResult).reason),
  );

  return NextResponse.json({
    processed: ids.length,
    updated: results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'updated',
    ).length,
    failed: failed.length,
    durationMs: Date.now() - startedAt,
  });
}
