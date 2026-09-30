import { useId } from 'react';
import { cn, toAreaPath, toPath, toPoints } from '@/lib/utils';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
};

export default function Sparkline({ values, width = 120, height = 36, className }: Props) {
  const id = useId();
  const points = toPoints(values, width, height);
  const trendingDown = values.length > 1 && values[values.length - 1] < values[0];
  const tone = trendingDown ? 'text-down' : values.length > 1 && values.at(-1)! > values[0] ? 'text-up' : 'text-muted';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', tone, className)}
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={toAreaPath(points, height)} fill={`url(#${id})`} />
      <path
        d={toPath(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
