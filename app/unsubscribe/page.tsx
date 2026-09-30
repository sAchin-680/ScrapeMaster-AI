import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BellOff, CheckCircle2 } from 'lucide-react';
import { unsubscribe } from '@/lib/unsubscribe';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } };

type Props = {
  searchParams: Promise<{
    p?: string;
    e?: string;
    t?: string;
    done?: string;
    error?: string;
  }>;
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const { p = '', e = '', t = '', done, error } = await searchParams;

  async function confirm() {
    'use server';
    const ok = await unsubscribe(p, e, t);
    redirect(
      ok
        ? '/unsubscribe?done=1'
        : `/unsubscribe?${new URLSearchParams({ p, e, t, error: '1' })}`,
    );
  }

  return (
    <div className="container flex justify-center py-24">
      <div className="card w-full max-w-md p-8 text-center">
        {done ? (
          <>
            <CheckCircle2 className="mx-auto size-10 text-down" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold">You are unsubscribed</h1>
            <p className="mt-2 text-sm text-muted">
              You will not receive more alerts for this product.
            </p>
            <Link href="/" className="btn-ghost mt-6">
              Back to ScrapeMaster
            </Link>
          </>
        ) : (
          <>
            <BellOff className="mx-auto size-10 text-muted" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold">Stop price alerts?</h1>
            <p className="mt-2 break-all text-sm text-muted">
              {e ? (
                <>
                  <span className="text-ink">{e}</span> will stop receiving alerts for
                  this product.
                </>
              ) : (
                'This link is incomplete.'
              )}
            </p>
            {error && (
              <p className="mt-3 text-sm text-up">This link is invalid or has expired.</p>
            )}
            {e && (
              <form action={confirm}>
                <button type="submit" className="btn-primary mt-6 w-full">
                  Unsubscribe
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
