import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M3 17l5-6 4 3 5-8 4 5"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="21" cy="11" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span className="text-[17px]">
        ScrapeMaster
      </span>
    </span>
  );
}
