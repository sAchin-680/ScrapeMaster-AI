import { BellRing, LineChart, Link2 } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    title: 'Paste a link',
    body: 'Drop in a product URL from any store. We read the page, record the first price and look for the same item elsewhere.',
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
      <p className="text-sm font-medium text-accent">How it works</p>
      <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">Three steps. Zero refreshing.</h2>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="card flex flex-col gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
                <step.icon className="size-5" aria-hidden />
              </span>
              <span className="num text-sm font-medium text-muted">Step {i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
