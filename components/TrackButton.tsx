'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { scrapeAndStoreProduct } from '@/lib/actions';

/** Start tracking a listing, then open its product page. */
export default function TrackButton({
  url,
  label = 'Track price',
  variant = 'primary',
}: {
  url: string;
  label?: string;
  /** 'soft' suits dense grids; 'primary' is the main call to action. */
  variant?: 'primary' | 'soft';
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={
          variant === 'soft'
            ? 'btn w-full bg-accent-soft py-2 text-xs text-accent hover:bg-accent hover:text-accent-ink'
            : 'btn-primary w-full'
        }
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
