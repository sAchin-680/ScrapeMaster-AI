import { BellRing, Headphones, TrendingDown } from 'lucide-react';

const PATH =
  'M0,60 C30,60 40,34 70,40 C100,46 110,20 140,26 C170,32 180,56 210,52 C240,48 250,74 280,90 C300,100 310,118 340,122';

const stats = [
  ['Lowest', '$248'],
  ['Average', '$321'],
  ['Highest', '$399'],
];

/** Decorative product card illustrating a detected price drop. */
export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-indigo-500/20 via-violet-500/10 to-sky-400/20 blur-3xl"
        aria-hidden
      />

      <div className="card p-6 shadow-xl shadow-indigo-950/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-lg bg-paper ring-1 ring-line">
              <Headphones className="size-5 text-muted" aria-hidden />
            </span>
            <div>
              <p className="text-sm text-muted">Sony WH-1000XM5</p>
              <p className="num text-2xl font-semibold">$248.00</p>
            </div>
          </div>
          <span className="num inline-flex items-center gap-1 rounded-md bg-down/10 px-2 py-1 text-xs font-medium text-down">
            <TrendingDown className="size-3.5" aria-hidden />
            31%
          </span>
        </div>

        <svg viewBox="0 0 340 140" className="mt-6 w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".22" />
              <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[35, 70, 105].map((y) => (
            <line key={y} x1="0" x2="340" y1={y} y2={y} stroke="rgb(var(--line))" strokeDasharray="3 5" />
          ))}
          <path d={`${PATH} L340,140 L0,140 Z`} fill="url(#hero-fill)" className="animate-rise [animation-delay:1.2s]" />
          <path
            d={PATH}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="600"
            strokeDashoffset="600"
            className="animate-draw"
          />
          <circle cx="340" cy="122" r="10" fill="rgb(var(--accent))" opacity=".18" className="animate-pulse-dot" />
          <circle cx="340" cy="122" r="4.5" fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth="2" />
        </svg>

        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-paper px-3 py-2.5 ring-1 ring-line/60">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="num mt-0.5 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card absolute -bottom-6 -left-4 flex animate-rise items-center gap-3 p-3 pr-5 shadow-lg [animation-delay:2.4s] sm:-left-10">
        <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
          <BellRing className="size-4" aria-hidden />
        </span>
        <div className="text-sm">
          <p className="font-medium">Price dropped to $248</p>
          <p className="text-xs text-muted">Alert sent to 128 watchers</p>
        </div>
      </div>
    </div>
  );
}
