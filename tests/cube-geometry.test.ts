/**
 * The cube behind the cube-net format, checked against what is known about cubes rather than against
 * the generator: there are eleven nets, folding the cross gives the faces everyone can picture, and
 * a corner is drawable in one handedness only.
 */
import { describe, expect, it } from 'vitest';
import {
  FIXED_NETS,
  foldNet,
  isCrossNet,
  isDrawableCorner,
  netSymmetryClass,
  NX,
  NY,
  NZ,
  PX,
  PY,
  PZ,
} from '@/lib/cube-geometry';

describe('cube geometry', () => {
  it('finds exactly the eleven nets of a cube, in every orientation', () => {
    const classes = new Set(FIXED_NETS.map(netSymmetryClass));
    expect(classes.size).toBe(11);
    // Every fixed net folds, and no two are the same placement.
    for (const net of FIXED_NETS) expect(foldNet(net)).not.toBeNull();
    expect(new Set(FIXED_NETS.map((n) => n.map((p) => `${p.r},${p.c}`).join(' '))).size).toBe(FIXED_NETS.length);
    // A 2x3 rectangle is a hexomino and not a net.
    const block = [0, 1].flatMap((r) => [0, 1, 2].map((c) => ({ r, c })));
    expect(foldNet(block)).toBeNull();
  });

  it('folds the cross the way a hand does', () => {
    // Cell 0 is the centre, face down. Its row neighbours stand up to the sides, the far end of the
    // arm folds over the top, and the squares above and below become the front and back.
    const cells = [
      { r: 1, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 2 },
      { r: 1, c: 3 },
      { r: 0, c: 1 },
      { r: 2, c: 1 },
    ];
    expect(isCrossNet(cells)).toBe(true);
    expect(foldNet(cells)).toEqual([NZ, NX, PX, PZ, NY, PY]);
    expect(FIXED_NETS.filter(isCrossNet)).toHaveLength(4);
  });

  it('draws a corner in one handedness only', () => {
    expect(isDrawableCorner(PZ, NY, PX)).toBe(true);
    expect(isDrawableCorner(PZ, PX, NY)).toBe(false);
    // Rotating the cube keeps the handedness.
    expect(isDrawableCorner(NY, PX, PZ)).toBe(true);
    expect(isDrawableCorner(PX, PZ, NY)).toBe(true);
    // Opposite faces never meet.
    expect(isDrawableCorner(PZ, NZ, PX)).toBe(false);
    // Every one of the eight corners is drawable in exactly three of its six orderings.
    let drawable = 0;
    for (const a of [0, 1, 2, 3, 4, 5]) for (const b of [0, 1, 2, 3, 4, 5]) for (const c of [0, 1, 2, 3, 4, 5]) if (isDrawableCorner(a, b, c)) drawable++;
    expect(drawable).toBe(8 * 3);
  });
});
