'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = { url: string; name: string; className?: string };

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^(www|m|dl)\./, '');
  } catch {
    return '';
  }
}

/**
 * The store's own site icon, fetched live by domain so any retailer gets its
 * logo without bundling brand assets. Falls back to initials.
 */
export default function StoreLogo({ url, name, className }: Props) {
  const domain = domainOf(url);
  const [failed, setFailed] = useState(!domain);

  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-line',
        className,
      )}
    >
      {failed ? (
        <span className="text-xs font-semibold text-neutral-700" aria-hidden>
          {name.slice(0, 2)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- tiny external favicon, no optimisation needed
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-5"
          onError={() => setFailed(true)}
        />
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
