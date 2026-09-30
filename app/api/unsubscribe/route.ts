import { NextResponse, type NextRequest } from 'next/server';
import { unsubscribe } from '@/lib/unsubscribe';

export const dynamic = 'force-dynamic';

/** One-click unsubscribe (RFC 8058) triggered by the mail client. */
export async function POST(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const ok = await unsubscribe(q.get('p') ?? '', q.get('e') ?? '', q.get('t') ?? '');
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}

/** Opening the link in a browser leads to the confirmation page. */
export function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL(`/unsubscribe${request.nextUrl.search}`, request.url),
  );
}
