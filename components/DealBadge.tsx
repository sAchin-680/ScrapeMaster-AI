import { Clock, Flame, Scale, ThumbsUp, Sparkles } from 'lucide-react';
import type { DealVerdict } from '@/lib/deal';
import { cn } from '@/lib/utils';

const styles = {
  great: { icon: Flame, className: 'bg-down text-white' },
  good: { icon: ThumbsUp, className: 'bg-down/10 text-down' },
  fair: { icon: Scale, className: 'bg-paper text-muted ring-1 ring-line' },
  wait: { icon: Clock, className: 'bg-up/10 text-up' },
  new: { icon: Sparkles, className: 'bg-paper text-muted ring-1 ring-line' },
} as const;

export default function DealBadge({ verdict, className }: { verdict: DealVerdict; className?: string }) {
  const { icon: Icon, className: tone } = styles[verdict.level];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tone, className)}>
      <Icon className="size-3.5" aria-hidden />
      {verdict.label}
    </span>
  );
}
