import { TrendingDown } from 'lucide-react';

const PATH =
  'M0,70 C30,70 40,40 70,46 C100,52 110,24 140,30 C170,36 180,62 210,58 C240,54 250,80 280,96 C300,106 310,128 340,132';

/** Decorative animated chart showing a price drop being detected. */
export default function HeroVisual() {
  return (
    <div className="grain relative isolate overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-[0_40px_80px_-40px_rgb(var(--ink)/.35)] sm:p-7">
      <div className="dot-grid absolute inset-0 -z-10 opacity-60" />
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Noise-cancelling headphones</p>
          <p className="num mt-1 text-3xl font-semibold">$248.00</p>
        </div>
        <span className="num inline-flex items-center gap-1 rounded-full bg-down/10 px-2.5 py-1 text-xs font-semibold text-down">
          <TrendingDown className="size-3.5" aria-hidden />
          −31%
        </span>
      </div>

      <svg viewBox="0 0 340 150" className="mt-6 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".5" />
            <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${PATH} L340,150 L0,150 Z`} fill="url(#hero-fill)" className="animate-rise [animation-delay:1.2s]" />
        <path
          d={PATH}
          fill="none"
          stroke="rgb(var(--ink))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="600"
          strokeDashoffset="600"
          className="animate-draw"
        />
        <circle cx="340" cy="132" r="5" fill="rgb(var(--down))" className="animate-rise [animation-delay:2.2s]" />
        <circle cx="340" cy="132" r="12" fill="rgb(var(--down))" opacity=".2" className="animate-pulse-dot" />
      </svg>

      <div className="mt-4 flex animate-rise items-center gap-3 rounded-2xl border border-line bg-paper/80 p-3 backdrop-blur [animation-delay:2.4s]">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-sm text-accent-ink">✦</span>
        <div className="min-w-0 text-sm">
          <p className="font-medium">Lowest price in 90 days</p>
          <p className="truncate text-muted">Alert sent to 128 watchers · just now</p>
        </div>
      </div>
    </div>
  );
}
