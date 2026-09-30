'use client';

import { cn } from '@/lib/utils';
import { useLive } from './LiveProvider';

const labels = { live: 'Live', connecting: 'Connecting', offline: 'Paused' } as const;

export default function LiveBadge({ className }: { className?: string }) {
  const { status } = useLive();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-2">
        {status === 'live' && <span className="absolute inset-0 animate-ping rounded-full bg-down/60" />}
        <span
          className={cn(
            'relative size-2 rounded-full',
            status === 'live' ? 'bg-down' : status === 'connecting' ? 'bg-muted animate-pulse-dot' : 'bg-muted/50',
          )}
        />
      </span>
      {labels[status]}
    </span>
  );
}
