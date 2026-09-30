import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { refreshProduct, staleProductIds } from '@/lib/services/refresh';

// Vercel's Hobby plan caps functions at 60 seconds.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CONCURRENCY = 4;
// Stop starting new batches with enough headroom to respond before the limit.
const TIME_BUDGET_MS = 50_000;

function isAuthorized(request: NextRequest) {
  if (!env.CRON_SECRET) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  // Stalest first, so runs that hit the time budget still rotate through everything.
  const ids = await staleProductIds();

  const results: PromiseSettledResult<Awaited<ReturnType<typeof refreshProduct>>>[] = [];
  // Process in small batches so one slow page or a rate limit can't sink the run.
  let processed = 0;
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    const batch = ids.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.allSettled(batch.map(refreshProduct))));
    processed += batch.length;
  }

  const failed = results.filter((r) => r.status === 'rejected');
  failed.forEach((r) =>
    console.error('[cron] refresh failed', (r as PromiseRejectedResult).reason),
  );

  return NextResponse.json({
    processed,
    remaining: ids.length - processed,
    updated: results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'updated',
    ).length,
    failed: failed.length,
    durationMs: Date.now() - startedAt,
  });
}
