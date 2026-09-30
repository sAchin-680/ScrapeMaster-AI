export type Point = { x: number; y: number };

/** Map a list of values into SVG coordinates inside a width × height box. */
export function toPoints(values: number[], width: number, height: number, padding = 4): Point[] {
  if (!values.length) return [];
  const series = values.length === 1 ? [values[0], values[0]] : values;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const innerH = height - padding * 2;
  const step = width / (series.length - 1);

  return series.map((value, i) => ({
    x: Math.round(i * step * 100) / 100,
    // Flat series sit in the middle rather than on the floor.
    y: Math.round((max === min ? height / 2 : padding + innerH - ((value - min) / range) * innerH) * 100) / 100,
  }));
}

/** Smooth path through points using monotone-ish cubic segments. */
export function toPath(points: Point[]) {
  if (!points.length) return '';
  return points.reduce((d, point, i, all) => {
    if (i === 0) return `M${point.x},${point.y}`;
    const prev = all[i - 1];
    const cx = (prev.x + point.x) / 2;
    return `${d} C${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
  }, '');
}

export function toAreaPath(points: Point[], height: number) {
  if (!points.length) return '';
  const last = points[points.length - 1];
  return `${toPath(points)} L${last.x},${height} L${points[0].x},${height} Z`;
}
