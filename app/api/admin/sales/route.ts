import { NextResponse, type NextRequest } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { env } from '@/lib/env';
import SaleModel from '@/lib/models/sale.model';

export const dynamic = 'force-dynamic';

const saleSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    store: z.string().trim().min(2).max(80),
    countries: z.array(z.string().length(2).toUpperCase()).max(20).default([]),
    start: z.coerce.date(),
    end: z.coerce.date(),
    url: z.string().url(),
    tagline: z.string().max(160).default(''),
    confirmed: z.boolean().default(false),
  })
  .refine((s) => s.end > s.start, { message: 'end must be after start', path: ['end'] });

function authorized(request: NextRequest) {
  return (
    Boolean(env.ADMIN_TOKEN) &&
    request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`
  );
}

export async function GET(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  return NextResponse.json(await SaleModel.find().sort({ start: 1 }).lean());
}

export async function POST(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = saleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await connectDB();
  const sale = await SaleModel.create(parsed.data);
  return NextResponse.json(sale, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id || !isValidObjectId(id))
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await connectDB();
  const { deletedCount } = await SaleModel.deleteOne({ _id: id });
  return NextResponse.json({ deleted: deletedCount });
}
