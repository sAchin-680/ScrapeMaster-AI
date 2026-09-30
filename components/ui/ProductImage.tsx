'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn, sizedImageUrl } from '@/lib/utils';

/**
 * Retailer image served straight from the store's CDN (already optimized and
 * hosted on arbitrary domains). Shimmers until loaded, then fades in; shows a
 * placeholder when it fails.
 */
type Props = ImageProps & {
  /** Request a rendition about this many pixels wide from the store's CDN. */
  resize?: number;
};

export default function ProductImage({ src, alt, className, resize, ...props }: Props) {
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
        src={resize && typeof src === 'string' ? sizedImageUrl(src, resize) : src}
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
