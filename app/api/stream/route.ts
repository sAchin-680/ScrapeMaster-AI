import type { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import ProductModel from '@/lib/models/product.model';
import type { LiveProductUpdate } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const POLL_MS = 4_000;
const HEARTBEAT_MS = 15_000;
// Close before the platform limit; EventSource reconnects and resumes via Last-Event-ID.
const STREAM_LIFETIME_MS = 55_000;

function parseCursor(value: string | null) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : new Date();
}

async function fetchChanges(since: Date, ids: Types.ObjectId[] | null) {
  return ProductModel.aggregate<LiveProductUpdate>([
    {
      $match: {
        updatedAt: { $gt: since },
        ...(ids ? { _id: { $in: ids } } : {}),
      },
    },
    { $sort: { updatedAt: 1 } },
    { $limit: 50 },
    {
      $project: {
        _id: 0,
        id: { $toString: '$_id' },
        currentPrice: 1,
        currency: 1,
        isOutOfStock: 1,
        watchers: { $size: { $ifNull: ['$users', []] } },
        updatedAt: 1,
      },
    },
  ]);
}

// Sent when the database is unreachable: tells EventSource to wait a minute
// before reconnecting instead of hammering the server every few seconds.
const UNAVAILABLE = 'retry: 60000\nevent: unavailable\ndata: {}\n\n';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
  } catch {
    return new Response(UNAVAILABLE, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }

  const idsParam = request.nextUrl.searchParams.get('ids');
  const ids = idsParam
    ? idsParam
        .split(',')
        .filter((id) => Types.ObjectId.isValid(id))
        .slice(0, 50)
        .map((id) => new Types.ObjectId(id))
    : null;
  let cursor = parseCursor(
    request.headers.get('last-event-id') ?? request.nextUrl.searchParams.get('since'),
  );

  const encoder = new TextEncoder();
  let closed = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        timers.forEach(clearTimeout);
        controller.close();
      };

      send(
        `retry: 3000\nevent: ready\ndata: ${JSON.stringify({ at: cursor.toISOString() })}\n\n`,
      );

      const poll = async () => {
        if (closed) return;
        try {
          const changes = await fetchChanges(cursor, ids);
          for (const change of changes) {
            cursor = new Date(change.updatedAt);
            send(
              `id: ${cursor.toISOString()}\nevent: product\ndata: ${JSON.stringify(change)}\n\n`,
            );
          }
        } catch (error) {
          console.error('[stream] poll failed', error);
        }
        timers.push(setTimeout(poll, POLL_MS));
      };

      const heartbeat = () => {
        send(`: ping\n\n`);
        timers.push(setTimeout(heartbeat, HEARTBEAT_MS));
      };

      poll();
      timers.push(setTimeout(heartbeat, HEARTBEAT_MS));
      timers.push(setTimeout(close, STREAM_LIFETIME_MS));
      request.signal.addEventListener('abort', close);
    },
    cancel() {
      closed = true;
      timers.forEach(clearTimeout);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
