'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * Retailer image served straight from the store's CDN (already optimized and
 * hosted on arbitrary domains), with a placeholder when it fails to load.
 */
export default function ProductImage({ src, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <span
        className="absolute inset-0 grid place-items-center text-muted/60"
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-8" aria-hidden />
      </span>
    );
  }

  return (
    <Image src={src} alt={alt} unoptimized onError={() => setFailed(true)} {...props} />
  );
}
