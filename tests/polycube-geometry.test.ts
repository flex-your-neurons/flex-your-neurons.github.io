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
  hasPocket,
  isChiral,
  isConnected,
  isRotationOf,
  mirror,
  moveOneCube,
  normalise,
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

  it('spots a pocket: an empty cell walled in by three cubes', () => {
    expect(hasPocket(L)).toBe(false);
    // The two objects a reader reported as "two cubes joined by a square": in both, the cell
    // (0, 1, 1) is empty with three cubes against it, and the face seen through the gap belongs to a
    // cube standing behind it.
    expect(hasPocket([[0, 0, 0], [0, 1, 0], [0, 1, 2], [1, 1, 0], [1, 1, 1], [1, 1, 2]])).toBe(true);
    expect(hasPocket([[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 0], [0, 1, 2], [1, 0, 2]])).toBe(true);
    // A gap with only two cubes against it is a corner, which reads as a corner.
    expect(hasPocket([[0, 0, 0], [1, 0, 0], [1, 0, 1]])).toBe(false);
    // Rotation and reflection cannot make one or unmake one.
    const pocketed: Cube[] = [[0, 0, 0], [0, 1, 0], [0, 1, 2], [1, 1, 0], [1, 1, 1], [1, 1, 2]];
    for (const r of ROTATIONS) expect(hasPocket(transform(pocketed, r))).toBe(true);
    expect(hasPocket(mirror(pocketed))).toBe(true);
  });

  it('spots a cube hidden behind another along the line of sight, boxed in, or covered by a committee', () => {
    expect(hasHiddenCube(L)).toBe(false);
    expect(hasHiddenCube([[0, 0, 0], [1, -1, 1]])).toBe(true);
    expect(hasHiddenCube([[0, 0, 0], [1, 0, 0], [0, -1, 0], [0, 0, 1]])).toBe(true);
    expect(hasHiddenCube([[0, 0, 0], [1, 0, 0], [0, -1, 0]])).toBe(false);
    // Neither in front of the origin cube nor against a whole face of it, and between them they
    // still cover it: the case the two named ones miss.
    expect(hasHiddenCube([[0, 0, 0], [1, 0, 1], [1, -1, 0], [0, -1, 1]])).toBe(true);
  });

  it('agrees with the drawing about which cubes are hidden', () => {
    // The oracle: paint every cube's whole hexagon, nearer cube last, and see which cubes were left
    // with no pixel of their own. `hasHiddenCube` is the cheap version of exactly that.
    const rng = createRng('hidden-oracle');
    for (let i = 0; i < 300; i++) {
      const grown = randomChiralPolycube(4 + (i % 6), rng);
      if (!grown) continue;
      const cubes = transform(grown, ROTATIONS[rng.int(0, 23)]!);
      const { owner } = paint(cubes);
      const marked = new Set(Array.from(owner).filter((o) => o >= 0));
      expect(hasHiddenCube(cubes)).toBe(marked.size < cubes.length);
    }
  });

  it('draws each face only where it is visible, and each pixel once', () => {
    // What the drawing must look like: every face of every cube painted whole, back to front, so
    // nearer paint covers farther. The drawing cannot be made that way — the faces are translucent
    // and outlined, so paint does not cover, it accumulates — and instead emits only the visible
    // part of each face. The two must come out pixel for pixel the same, and no pixel of the drawing
    // may be painted twice, or the shading would double where two faces overlap.
    const rng = createRng('drawing-oracle');
    for (let i = 0; i < 200; i++) {
      const grown = randomChiralPolycube(4 + (i % 6), rng);
      if (!grown) continue;
      const cubes = transform(grown, ROTATIONS[rng.int(0, 23)]!);
      if (hasHiddenCube(cubes)) continue;
      const { shade: expected, width, height } = paint(cubes, EDGE);
      const drawn = new Int8Array(width * height).fill(-1);
      const times = new Int8Array(width * height);
      for (const face of drawPolycube(cubes, EDGE).faces) {
        for (const [x, y] of pixelsOf(face.points, width, height)) {
          drawn[y * width + x] = face.shade;
          times[y * width + x] = (times[y * width + x] ?? 0) + 1;
        }
      }
      expect(Array.from(times).filter((n) => n > 1)).toHaveLength(0);
      expect(Array.from(drawn)).toEqual(Array.from(expected));
    }
  });

  it('draws at most three faces per cube, nearer cubes last', () => {
    const drawing = drawPolycube(L, 20);
    expect(drawing.faces.length).toBeGreaterThan(0);
    expect(drawing.faces.length).toBeLessThanOrEqual(L.length * 3);
    expect(drawing.width).toBeGreaterThan(0);
    expect(drawing.height).toBeGreaterThan(0);
  });
});

const EDGE = 16;
const COS30 = Math.sqrt(3) / 2;

/** The same projection and frame as `drawPolycube`: a cube corner, in drawing coordinates. */
function project([x, y, z]: readonly number[], edge: number): [number, number] {
  return [COS30 * edge * (x! + y!), 0.5 * edge * (x! - y!) - edge * z!];
}

const CORNERS = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];
/** The hexagon of one cube: its six outer corners, in order. */
const HEXAGON = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [1, 1, 1],
  [0, 1, 1],
  [0, 0, 1],
];

function pointsInside(points: [number, number][], px: number, py: number): boolean {
  let odd = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]!;
    const [xj, yj] = points[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) odd = !odd;
  }
  return odd;
}

/** The pixels whose centre falls inside an SVG polygon's points, as `drawPolycube` writes them. */
function pixelsOf(points: string, width: number, height: number): [number, number][] {
  const pts = points.split(' ').map((p) => p.split(',').map(Number) as [number, number]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const out: [number, number][] = [];
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(height - 1, Math.ceil(Math.max(...ys))); y++) {
    for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(width - 1, Math.ceil(Math.max(...xs))); x++) {
      if (pointsInside(pts, x + 0.5, y + 0.5)) out.push([x, y]);
    }
  }
  return out;
}

/**
 * The picture as painter's algorithm would make it if paint covered: every cube's three faces, and
 * its whole hexagon, painted back to front. Returns the shade and the cube owning each pixel.
 */
function paint(cubes: readonly Cube[], edge = EDGE): { shade: Int8Array; owner: Int32Array; width: number; height: number } {
  const n = normalise(cubes);
  const all = n.flatMap((c) => CORNERS.map((d) => project([c[0] + d[0]!, c[1] + d[1]!, c[2] + d[2]!], edge)));
  const minX = Math.min(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const pad = 2;
  const width = Math.ceil(Math.max(...all.map((p) => p[0])) - minX + pad * 2);
  const height = Math.ceil(Math.max(...all.map((p) => p[1])) - minY + pad * 2);
  const shade = new Int8Array(width * height).fill(-1);
  const owner = new Int32Array(width * height).fill(-1);
  const frame = (p: [number, number]): [number, number] => [p[0] - minX + pad, p[1] - minY + pad];
  const depth = (c: Cube) => c[0] - c[1] + c[2];
  const order = n.map((_, i) => i).sort((a, b) => depth(n[a]!) - depth(n[b]!));
  for (const index of order) {
    const c = n[index]!;
    const at = (d: number[]) => frame(project([c[0] + d[0]!, c[1] + d[1]!, c[2] + d[2]!], edge));
    // Face order and shades as `drawPolycube` has them: +z, then -y, then +x.
    const faces: [number, number[][]][] = [
      [0, [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]],
      [1, [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]],
      [2, [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]],
    ];
    for (const [value, corners] of faces) {
      const pts = corners.map(at);
      for (const [x, y] of pixelsOf(pts.map(([px, py]) => `${px},${py}`).join(' '), width, height)) {
        shade[y * width + x] = value;
      }
    }
    for (const [x, y] of pixelsOf(HEXAGON.map(at).map(([px, py]) => `${px},${py}`).join(' '), width, height)) {
      owner[y * width + x] = index;
    }
  }
  return { shade, owner, width, height };
}
