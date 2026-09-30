'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Retailer image served straight from the store's CDN (already optimized and
 * hosted on arbitrary domains). Shimmers until loaded, then fades in; shows a
 * placeholder when it fails.
 */
export default function ProductImage({ src, alt, className, ...props }: ImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(
    src ? 'loading' : 'failed',
  );

  if (state === 'failed') {
    return (
      <span
        className="absolute inset-0 grid place-items-center text-muted/50"
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-8" aria-hidden />
      </span>
    );
  }

  return (
    <>
      {state === 'loading' && (
        <span className="skeleton absolute inset-0 rounded-none" aria-hidden />
      )}
      <Image
        src={src}
        alt={alt}
        unoptimized
        onLoad={() => setState('loaded')}
        onError={() => setState('failed')}
        className={cn(
          'transition-[opacity,transform] duration-500 ease-out',
          state === 'loaded' ? 'opacity-100' : 'opacity-0',
          className,
        )}
        {...props}
      />
    </>
  );
}
