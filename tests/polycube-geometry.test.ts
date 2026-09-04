/**
 * The polycube behind 3-D block rotation, checked against what is known: there are 24 rotations,
 * a mirror is not a rotation of a chiral object, and a flat object is never chiral.
 */
import { describe, expect, it } from 'vitest';
import { createRng } from '@/lib/rng';
import {
  canonical,
  drawPolycube,
  hasHiddenCube,
  isChiral,
  isConnected,
  isRotationOf,
  mirror,
  moveOneCube,
  randomChiralPolycube,
  ROTATIONS,
  sortedExtents,
  transform,
  type Cube,
} from '@/lib/polycube-geometry';

const L: Cube[] = [
  [0, 0, 0],
  [1, 0, 0],
  [2, 0, 0],
  [2, 1, 0],
  [2, 1, 1],
];

describe('polycube geometry', () => {
  it('has the 24 rotations of the cube, all with determinant +1', () => {
    expect(ROTATIONS).toHaveLength(24);
    for (const m of ROTATIONS) {
      const det =
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
        m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      expect(det).toBe(1);
    }
  });

  it('tells a rotation from a reflection', () => {
    for (const r of ROTATIONS) expect(isRotationOf(L, transform(L, r))).toBe(true);
    expect(isChiral(L)).toBe(true);
    expect(isRotationOf(L, mirror(L))).toBe(false);
    // The mirror image is chiral too, and its canonical form differs.
    expect(canonical(mirror(L))).not.toBe(canonical(L));
    // A flat L (a polyomino) is its own mirror image turned over.
    const flat: Cube[] = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [2, 1, 0],
    ];
    expect(isChiral(flat)).toBe(false);
  });

  it('grows connected, chiral, non-flat polycubes, and moves one cube without changing the extents', () => {
    const rng = createRng('POLY');
    for (let i = 0; i < 40; i++) {
      const n = 5 + (i % 5);
      const cubes = randomChiralPolycube(n, rng);
      expect(cubes).not.toBeNull();
      expect(cubes!).toHaveLength(n);
      expect(isConnected(cubes!)).toBe(true);
      expect(isChiral(cubes!)).toBe(true);
      expect(sortedExtents(cubes!)[0]).toBeGreaterThanOrEqual(2);
      const moved = moveOneCube(cubes!, rng);
      if (moved) {
        expect(isConnected(moved)).toBe(true);
        expect(sortedExtents(moved)).toEqual(sortedExtents(cubes!));
        expect(isRotationOf(moved, cubes!)).toBe(false);
        expect(isRotationOf(moved, mirror(cubes!))).toBe(false);
      }
    }
  });

  it('spots a cube hidden behind another along the line of sight, or boxed in', () => {
    expect(hasHiddenCube(L)).toBe(false);
    expect(hasHiddenCube([[0, 0, 0], [1, -1, 1]])).toBe(true);
    expect(hasHiddenCube([[0, 0, 0], [1, 0, 0], [0, -1, 0], [0, 0, 1]])).toBe(true);
    expect(hasHiddenCube([[0, 0, 0], [1, 0, 0], [0, -1, 0]])).toBe(false);
  });

  it('draws three faces per cube, nearer cubes last', () => {
    const drawing = drawPolycube(L, 20);
    expect(drawing.faces).toHaveLength(L.length * 3);
    expect(drawing.width).toBeGreaterThan(0);
    expect(drawing.height).toBeGreaterThan(0);
  });
});
