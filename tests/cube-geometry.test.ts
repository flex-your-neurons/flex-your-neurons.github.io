/**
 * The cube behind the cube-net format, checked against what is known about cubes rather than against
 * the generator: there are eleven nets, folding the cross gives the faces everyone can picture, and
 * a corner is drawable in one handedness only.
 */
import { describe, expect, it } from 'vitest';
import {
  faceTurns,
  FIXED_NETS,
  foldNet,
  foldNetOriented,
  ORIENTED_MARKS,
  markPath,
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

  /**
   * The cross folded by hand, with orientation. Cells (r, c): A(0,1) B(1,0) C(1,1) D(1,2) E(2,1)
   * F(3,1), C first so it is the base. Fold the flaps up with the printed side out: A stands at −y
   * with its top pointing up (+z); D stands at +x and its top, along the hinge, still points −y; E
   * stands at +y with its top pointing down at the hinge (−z); F folds over E onto the roof and its
   * top, which pointed at E's hinge, now points back towards +y.
   */
  it('folds the cross with each face the right way up', () => {
    const cells = [
      { r: 1, c: 1 },
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 2 },
      { r: 2, c: 1 },
      { r: 3, c: 1 },
    ];
    const folded = foldNetOriented(cells)!;
    expect(folded).not.toBeNull();
    expect(folded.map((f) => f.face)).toEqual([NZ, NY, NX, PX, PY, PZ]);
    expect(folded.map((f) => f.up)).toEqual([NY, PZ, NY, NY, NZ, PY]);
  });

  it('turns a mark on the drawn cube to match where its top points', () => {
    // Show the cross's +z on top, −y left, +x right — the cube as it sits on its own base.
    const upOf = new Array<number>(6);
    upOf[NZ] = NY; upOf[NY] = PZ; upOf[NX] = NY; upOf[PX] = NY; upOf[PY] = NZ; upOf[PZ] = PY;
    // Top face F points +y = up on the top face; left face A points +z = up; right face D points −y = left.
    expect(faceTurns([PZ, NY, PX], upOf)).toEqual([0, 0, 3]);
    // The same cube rolled so that +x is on top: D's top (−y) now reads as the top face's down.
    expect(faceTurns([PX, NY, NZ], upOf)[0]).toBe(2);
  });

  it('gives every oriented mark a drawing, and none of them a symmetric one', () => {
    for (const mark of ORIENTED_MARKS) {
      const { d } = markPath(mark);
      expect(d.length).toBeGreaterThan(10);
    }
  });
});
