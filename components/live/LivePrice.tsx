'use client';

import { useEffect, useRef, useState } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import { useLiveProduct } from './LiveProvider';

type Props = {
  productId: string;
  price: number;
  currency: string;
  className?: string;
};

/** Price that updates from the live stream and flashes on change. */
export default function LivePrice({ productId, price, currency, className }: Props) {
  const update = useLiveProduct(productId);
  const value = update?.currentPrice ?? price;
  const previous = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value === previous.current) return;
    setFlash(value < previous.current ? 'down' : 'up');
    previous.current = value;
    const timer = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <span
      className={cn(
        'num rounded-md transition-colors duration-700',
        flash === 'down' && 'bg-down/15 text-down',
        flash === 'up' && 'bg-up/15 text-up',
        className,
      )}
    >
      {formatPrice(update?.currentPrice ?? price, update?.currency ?? currency)}
    </span>
  );
}
