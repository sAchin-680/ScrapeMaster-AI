'use client';

import { Eye } from 'lucide-react';
import { useLiveProduct } from './LiveProvider';

export default function LiveWatchers({
  productId,
  initial,
}: {
  productId: string;
  initial: number;
}) {
  const count = useLiveProduct(productId)?.watchers ?? initial;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <Eye className="size-4" aria-hidden />
      <span className="num text-ink">{count}</span> {count === 1 ? 'watcher' : 'watchers'}
    </span>
  );
}
