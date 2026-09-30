import { BellRing, LineChart, Link2 } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: 'Paste a link',
    body: 'Drop in any Amazon product URL. We normalize it, fetch the page and record the first price snapshot.',
  },
  {
    icon: LineChart,
    title: 'Watch it move',
    body: 'Prices are re-checked on a schedule and streamed to your screen live. Every snapshot lands on the chart.',
  },
  {
    icon: BellRing,
    title: 'Get the alert',
    body: 'New all-time low, 40%+ discount or back in stock — you get one clean email, the moment it happens.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="container scroll-mt-24 py-20">
      <p className="eyebrow">How it works</p>
      <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
        Three steps. Zero refreshing.
      </h2>
      <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-4 bg-surface p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-paper">
                <step.icon className="size-5" aria-hidden />
              </span>
              <span className="num text-sm text-muted">0{i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
