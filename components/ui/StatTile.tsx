import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: 'default' | 'up' | 'down' | 'accent';
};

const tones = {
  default: 'text-muted',
  up: 'text-up',
  down: 'text-down',
  accent: 'text-ink',
};

export default function StatTile({ label, value, icon: Icon, tone = 'default' }: Props) {
  return (
    <div className="flex flex-col gap-3 bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <Icon className={cn('size-4', tones[tone])} aria-hidden />
      </div>
      <p className="num text-xl font-semibold sm:text-2xl">{value}</p>
    </div>
  );
}
