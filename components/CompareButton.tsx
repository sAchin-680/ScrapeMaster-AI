'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2, Search } from 'lucide-react';
import { compareOffersNow } from '@/lib/actions';

export default function CompareButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn-ghost px-3 py-2 text-xs"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await compareOffersNow(productId);
            if (result.ok) router.refresh();
            else setMessage(result.error);
          })
        }
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Search className="size-3.5" aria-hidden />
        )}
        {isPending ? 'Searching stores' : 'Compare stores'}
      </button>
      <span role="status" aria-live="polite" className="text-xs text-muted">
        {message}
      </span>
    </div>
  );
}
