'use client';

import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { PriceHistoryItem } from '@/types';
import { formatPrice, toAreaPath, toPath, toPoints } from '@/lib/utils';

const W = 640;
const H = 220;

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
});

export default function PriceChart({
  history,
  currency,
}: {
  history: PriceHistoryItem[];
  currency: string;
}) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const values = useMemo(() => history.map((h) => h.price), [history]);
  const points = useMemo(() => toPoints(values, W, H, 16), [values]);

  if (history.length < 2) {
    return (
      <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-line text-center text-sm text-muted">
        <p>
          Only one price snapshot so far.
          <br />
          The chart fills in as we re-check this product.
        </p>
      </div>
    );
  }

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setActive(
      Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))),
    );
  };

  const index = active ?? points.length - 1;
  const point = points[index];
  const entry = history[index];
  const min = Math.min(...values);
  const lowIndex = values.indexOf(min);

  return (
    <figure className="relative">
      <figcaption className="mb-4 flex items-baseline justify-between gap-4">
        <span className="num text-2xl font-semibold">
          {formatPrice(entry.price, currency)}
        </span>
        <span className="text-sm text-muted">
          {entry.date ? dateFormat.format(new Date(entry.date)) : '—'}
          {active === null && ' · latest'}
        </span>
      </figcaption>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[220px] w-full touch-none select-none overflow-visible"
          preserveAspectRatio="none"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setActive(null)}
          role="img"
          aria-label={`Price history with ${history.length} snapshots, lowest ${formatPrice(min, currency)}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".2" />
              <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((y) => (
            <line
              key={y}
              x1={0}
              x2={W}
              y1={H * y}
              y2={H * y}
              stroke="rgb(var(--line))"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={toAreaPath(points, H)} fill={`url(#${gradientId})`} />
          <path
            d={toPath(points)}
            fill="none"
            stroke="rgb(var(--accent))"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          <line
            x1={point.x}
            x2={point.x}
            y1={0}
            y2={H}
            stroke="rgb(var(--ink) / .25)"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Markers live in HTML so they stay round under the stretched viewBox. */}
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-down shadow"
          style={{
            left: `${(points[lowIndex].x / W) * 100}%`,
            top: `${(points[lowIndex].y / H) * 100}%`,
          }}
          title="Lowest price"
        />
        <span
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent shadow transition-[left,top] duration-75"
          style={{ left: `${(point.x / W) * 100}%`, top: `${(point.y / H) * 100}%` }}
        />
      </div>
    </figure>
  );
}
