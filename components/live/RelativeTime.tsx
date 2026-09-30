'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { useLiveProduct } from './LiveProvider';

/** "Checked 3 minutes ago" label that keeps itself current. */
export default function RelativeTime({ date, productId }: { date: string; productId?: string }) {
  const update = useLiveProduct(productId ?? '');
  const value = update?.updatedAt ?? date;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time dateTime={value} title={new Date(value).toLocaleString()} suppressHydrationWarning>
      {formatRelativeTime(value, now)}
    </time>
  );
}
