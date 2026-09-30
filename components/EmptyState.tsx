import { Radar } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-accent-soft text-accent">
        <Radar className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">Nothing on the radar yet</h3>
      <p className="max-w-sm text-sm text-muted">
        Paste a product link above to start tracking. It will show up here instantly for
        everyone.
      </p>
      <a href="#track" className="btn-primary mt-2">
        Track the first product
      </a>
    </div>
  );
}
