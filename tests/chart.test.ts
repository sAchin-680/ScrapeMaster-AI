import { describe, expect, it } from 'vitest';
import { toAreaPath, toPath, toPoints } from '@/lib/utils/chart';

describe('chart geometry', () => {
  it('maps values into the box with the minimum at the bottom', () => {
    const points = toPoints([10, 20], 100, 50, 0);
    expect(points).toEqual([
      { x: 0, y: 50 },
      { x: 100, y: 0 },
    ]);
  });

  it('centers a flat series vertically', () => {
    expect(toPoints([5, 5, 5], 100, 40).every((p) => p.y === 20)).toBe(true);
  });

  it('handles a single value', () => {
    expect(toPoints([7], 100, 40)).toHaveLength(2);
  });

  it('closes the area path', () => {
    const points = toPoints([1, 2, 3], 90, 30);
    expect(toPath(points).startsWith('M0,')).toBe(true);
    expect(toAreaPath(points, 30).endsWith('Z')).toBe(true);
  });
});
