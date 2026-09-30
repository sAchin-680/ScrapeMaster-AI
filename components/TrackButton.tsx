'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { scrapeAndStoreProduct } from '@/lib/actions';

/** Start tracking a listing, then open its product page. */
export default function TrackButton({
  url,
  label = 'Track price',
}: {
  url: string;
  label?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className="btn-primary w-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await scrapeAndStoreProduct(url);
            if (result.ok) router.push(`/products/${result.data.id}`);
            else setError(result.error);
          })
        }
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        {isPending ? 'Reading live price' : label}
      </button>
      {error && (
        <p role="alert" className="text-xs text-up">
          {error}
        </p>
      )}
    </div>
  );
}
