'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshProductNow } from '@/lib/actions';
import { cn } from '@/lib/utils';

export default function RefreshButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      setMessage(null);
      const result = await refreshProductNow(productId);
      if (result.ok) {
        setMessage(result.data.changed ? 'Price updated' : 'No change since last check');
        router.refresh();
      } else {
        setMessage(result.error);
      }
    });

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={refresh} disabled={isPending} className="btn-ghost px-3.5 py-2 text-xs">
        <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} aria-hidden />
        {isPending ? 'Checking' : 'Check now'}
      </button>
      <span role="status" aria-live="polite" className="text-xs text-muted">
        {message}
      </span>
    </div>
  );
}
