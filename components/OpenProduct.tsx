'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { openProduct } from '@/lib/actions';

const STEPS = [
  'Finding the product',
  'Reading the live price',
  'Preparing price history',
];

/** Opens a store listing inside the app, tracking it first if needed. */
export default function OpenProduct({ url }: { url: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    // Strict mode runs effects twice in development; open the product once.
    if (started.current) return;
    started.current = true;

    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      1800,
    );
    openProduct(url)
      .then((result) => {
        if (result.ok) router.replace(`/products/${result.data.id}`);
        else setError(result.error);
      })
      .catch(() => setError('Something went wrong. Please try again.'))
      .finally(() => clearInterval(timer));
    return () => clearInterval(timer);
  }, [url, router]);

  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {}

  return (
    <div className="container flex justify-center py-24">
      <div className="card w-full max-w-md p-8 text-center">
        {error ? (
          <>
            <h1 className="text-lg font-semibold">We couldn&apos;t open this product</h1>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <div className="mt-6 flex flex-col gap-2">
              {host && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn-primary"
                >
                  View on {host} <ExternalLink className="size-4" aria-hidden />
                </a>
              )}
              <Link href="/" className="btn-ghost">
                <ArrowLeft className="size-4" aria-hidden /> Back to ScrapeMaster
              </Link>
            </div>
          </>
        ) : (
          <div role="status" aria-live="polite">
            <Loader2 className="mx-auto size-8 animate-spin text-accent" aria-hidden />
            <h1 className="mt-4 text-lg font-semibold">Opening product</h1>
            <p className="mt-2 text-sm text-muted">
              {STEPS[step]}
              {host && ` from ${host}`}…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
