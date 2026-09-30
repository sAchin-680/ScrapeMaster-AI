'use client';

import { useEffect, useState } from 'react';

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86_400),
    h: Math.floor((s % 86_400) / 3_600),
    m: Math.floor((s % 3_600) / 60),
    s: s % 60,
  };
}

/** Ticking d/h/m/s countdown to a target date. */
export default function Countdown({ to, className }: { to: string; className?: string }) {
  const target = Date.parse(to);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  // Render a stable placeholder on the server to avoid hydration mismatches.
  const { d, h, m, s } = parts(now === null ? 0 : target - now);
  const units =
    d > 0
      ? [
          [d, 'd'],
          [h, 'h'],
          [m, 'm'],
        ]
      : [
          [h, 'h'],
          [m, 'm'],
          [s, 's'],
        ];

  return (
    <span className={className} role="timer" aria-live="off" suppressHydrationWarning>
      {now === null
        ? '—'
        : units.map(([value, unit]) => (
            <span key={unit} className="num">
              {String(value).padStart(2, '0')}
              <span className="mr-1 text-[0.8em] opacity-60">{unit}</span>
            </span>
          ))}
    </span>
  );
}
