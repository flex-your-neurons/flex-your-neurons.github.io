/**
 * Polycubes — the objects of the 3-D block rotation format — and how they are drawn.
 *
 * A polycube is a set of unit cubes on the integer lattice, face-connected. The rotation format
 * needs four things of them: the 24 rotations, so that "the same object turned" is checkable; the
 * mirror image, so that "the same object flipped" is checkable and can be told from a rotation;
 * random generation with a chirality test, since an object that is its own mirror image makes the
 * item unanswerable; and an isometric drawing shared by the page and the share card.
 *
 * ## Rotations
 *
 * The 24 rotations of the cube are generated from two quarter-turns rather than listed, and the set
 * is closed by iteration — so the count is checked (a test asserts 24) rather than trusted. Each
 * rotation is a signed permutation of the axes with determinant +1; a reflection is one with
 * determinant -1, of which mirroring x is the representative.
 *
 * ## Drawing
 *
 * The same isometric projection as `cube-geometry`, one unit cube at a time, painted back to
 * front. The viewer looks along (+1, -1, +1), so a cube's depth is x - y + z and a nearer cube is
 * one with a larger value; drawing in ascending depth lets the near faces cover the far ones, which
 * is all the hidden-surface work an isometric view of a lattice object needs.
 */

export type Cube = readonly [x: number, y: number, z: number];

/** A 3x3 integer matrix, row-major. */
export type Matrix3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

const IDENTITY: Matrix3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
/** A quarter turn about z: (x, y, z) → (-y, x, z). */
const TURN_Z: Matrix3 = [
  [0, -1, 0],
  [1, 0, 0],
  [0, 0, 1],
];
/** A quarter turn about x: (x, y, z) → (x, -z, y). */
const TURN_X: Matrix3 = [
  [1, 0, 0],
  [0, 0, -1],
  [0, 1, 0],
];
/** Mirror in the plane x = 0. */
export const MIRROR: Matrix3 = [
  [-1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export function multiply(a: Matrix3, b: Matrix3): Matrix3 {
  const row = (i: number): readonly [number, number, number] => [
    a[i]![0] * b[0][0] + a[i]![1] * b[1][0] + a[i]![2] * b[2][0],
    a[i]![0] * b[0][1] + a[i]![1] * b[1][1] + a[i]![2] * b[2][1],
    a[i]![0] * b[0][2] + a[i]![1] * b[1][2] + a[i]![2] * b[2][2],
  ];
  return [row(0), row(1), row(2)];
}

export function apply(m: Matrix3, [x, y, z]: Cube): Cube {
  return [
    m[0][0] * x + m[0][1] * y + m[0][2] * z,
    m[1][0] * x + m[1][1] * y + m[1][2] * z,
    m[2][0] * x + m[2][1] * y + m[2][2] * z,
  ];
}

function matrixKey(m: Matrix3): string {
  return m.map((r) => r.join(',')).join(';');
}

/** The rotation group of the cube: closed under composition from two generators. */
export const ROTATIONS: readonly Matrix3[] = (() => {
  const seen = new Map<string, Matrix3>([[matrixKey(IDENTITY), IDENTITY]]);
  const queue: Matrix3[] = [IDENTITY];
  while (queue.length > 0) {
    const m = queue.shift()!;
    for (const g of [TURN_Z, TURN_X]) {
      const next = multiply(g, m);
      const key = matrixKey(next);
      if (!seen.has(key)) {
        seen.set(key, next);
        queue.push(next);
      }
    }
  }
  return [...seen.values()];
})();

/** Translates a polycube so its bounding box starts at the origin, and sorts it. */
export function normalise(cubes: readonly Cube[]): Cube[] {
  const min = [0, 1, 2].map((i) => Math.min(...cubes.map((c) => c[i]!)));
  return cubes
    .map(([x, y, z]): Cube => [x - min[0]!, y - min[1]!, z - min[2]!])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

export function cubesKey(cubes: readonly Cube[]): string {
  return normalise(cubes)
    .map((c) => c.join(','))
    .join(' ');
}

export function transform(cubes: readonly Cube[], m: Matrix3): Cube[] {
  return normalise(cubes.map((c) => apply(m, c)));
}

/** The smallest key over all rotations: equal for two polycubes exactly when one is the other turned. */
export function canonical(cubes: readonly Cube[]): string {
  let best: string | null = null;
  for (const r of ROTATIONS) {
    const key = cubesKey(transform(cubes, r));
    if (best === null || key < best) best = key;
  }
  return best!;
}

export function isRotationOf(a: readonly Cube[], b: readonly Cube[]): boolean {
  return canonical(a) === canonical(b);
}

export function mirror(cubes: readonly Cube[]): Cube[] {
  return transform(cubes, MIRROR);
}

/** A polycube is chiral when no rotation carries it onto its mirror image. */
export function isChiral(cubes: readonly Cube[]): boolean {
  return !isRotationOf(cubes, mirror(cubes));
}

const NEIGHBOURS: readonly Cube[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function isConnected(cubes: readonly Cube[]): boolean {
  if (cubes.length === 0) return false;
  const have = new Set(cubes.map((c) => c.join(',')));
  const seen = new Set<string>([cubes[0]!.join(',')]);
  const queue: Cube[] = [cubes[0]!];
  while (queue.length > 0) {
    const [x, y, z] = queue.shift()!;
    for (const [dx, dy, dz] of NEIGHBOURS) {
      const key = `${x + dx},${y + dy},${z + dz}`;
      if (have.has(key) && !seen.has(key)) {
        seen.add(key);
        queue.push([x + dx, y + dy, z + dz]);
      }
    }
  }
  return seen.size === cubes.length;
}

/** Bounding-box side lengths, sorted — the same for an object and any rotation or reflection of it. */
export function sortedExtents(cubes: readonly Cube[]): [number, number, number] {
  const n = normalise(cubes);
  const ext = [0, 1, 2].map((i) => Math.max(...n.map((c) => c[i]!)) + 1);
  return ext.sort((a, b) => a - b) as [number, number, number];
}

/**
 * Grows a random face-connected polycube of `count` cubes by adding a random neighbour of a random
 * cube, and keeps only the ones that are chiral and not flat — a flat polycube is a polyomino, and
 * a polyomino's mirror image is a rotation of it out of the plane, so it can never be chiral in 3-D.
 * `rng.int(lo, hi)` is inclusive at both ends.
 */
export function randomChiralPolycube(
  count: number,
  rng: { int: (lo: number, hi: number) => number },
  maxTries = 200,
): Cube[] | null {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const cubes: Cube[] = [[0, 0, 0]];
    const have = new Set(['0,0,0']);
    let stuck = 0;
    while (cubes.length < count && stuck < 50) {
      const base = cubes[rng.int(0, cubes.length - 1)]!;
      const [dx, dy, dz] = NEIGHBOURS[rng.int(0, 5)]!;
      const next: Cube = [base[0] + dx, base[1] + dy, base[2] + dz];
      const key = next.join(',');
      if (have.has(key)) {
        stuck++;
        continue;
      }
      have.add(key);
      cubes.push(next);
    }
    if (cubes.length !== count) continue;
    const ext = sortedExtents(cubes);
    if (ext[0] < 2) continue; // flat
    if (!isChiral(cubes)) continue;
    return normalise(cubes);
  }
  return null;
}

/**
 * Moves one cube to a new face-adjacent position, keeping the object connected and its sorted
 * extents unchanged, so that the result differs from the original in shape and in nothing a count or
 * a bounding box could reveal. Returns null when no such move exists among a bounded number of tries.
 */
export function moveOneCube(
  cubes: readonly Cube[],
  rng: { int: (lo: number, hi: number) => number },
  maxTries = 100,
): Cube[] | null {
  const ext = sortedExtents(cubes).join('x');
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const remove = rng.int(0, cubes.length - 1);
    const rest = cubes.filter((_, i) => i !== remove);
    if (!isConnected(rest)) continue;
    const have = new Set(rest.map((c) => c.join(',')));
    have.add(cubes[remove]!.join(','));
    const base = rest[rng.int(0, rest.length - 1)]!;
    const [dx, dy, dz] = NEIGHBOURS[rng.int(0, 5)]!;
    const spot: Cube = [base[0] + dx, base[1] + dy, base[2] + dz];
    if (have.has(spot.join(','))) continue;
    const moved = normalise([...rest, spot]);
    if (sortedExtents(moved).join('x') !== ext) continue;
    if (isRotationOf(moved, cubes) || isRotationOf(moved, mirror(cubes))) continue;
    return moved;
  }
  return null;
}

/**
 * Whether some cube is invisible in the drawing. Two ways: another cube sits exactly in front of it
 * along the line of sight (+1, -1, +1), whose hexagon covers its own; or all three of its visible
 * faces have a cube against them. An object drawn with a hidden cube cannot be judged from the
 * drawing, so the generator turns such orientations away.
 */
export function hasHiddenCube(cubes: readonly Cube[]): boolean {
  const have = new Set(cubes.map((c) => c.join(',')));
  return cubes.some(
    ([x, y, z]) =>
      have.has(`${x + 1},${y - 1},${z + 1}`) ||
      (have.has(`${x + 1},${y},${z}`) && have.has(`${x},${y - 1},${z}`) && have.has(`${x},${y},${z + 1}`)),
  );
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const COS30 = Math.sqrt(3) / 2;

export interface DrawnFace {
  /** SVG polygon points. */
  points: string;
  /** 0 top, 1 left (-y), 2 right (+x). */
  shade: 0 | 1 | 2;
}

export interface Drawing {
  faces: DrawnFace[];
  width: number;
  height: number;
}

function f(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/**
 * The visible faces of every cube, back to front, in a box that fits the whole object. `edge` is
 * the drawn length of one cube edge.
 */
export function drawPolycube(cubes: readonly Cube[], edge: number): Drawing {
  const X: [number, number] = [COS30 * edge, 0.5 * edge];
  const Y: [number, number] = [COS30 * edge, -0.5 * edge];
  const Z: [number, number] = [0, -edge];
  const project = (x: number, y: number, z: number): [number, number] => [
    x * X[0] + y * Y[0] + z * Z[0],
    x * X[1] + y * Y[1] + z * Z[1],
  ];

  const n = normalise(cubes);
  // Every corner of every cube, for the bounding box.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y, z] of n) {
    for (const [dx, dy, dz] of [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ]) {
      const [px, py] = project(x + dx!, y + dy!, z + dz!);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }
  const pad = 2;
  const shift = (p: [number, number]): [number, number] => [p[0] - minX + pad, p[1] - minY + pad];
  const poly = (pts: [number, number][]) => pts.map((p) => shift(p)).map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

  const faces: DrawnFace[] = [];
  const ordered = [...n].sort((a, b) => a[0] - a[1] + a[2] - (b[0] - b[1] + b[2]));
  for (const [x, y, z] of ordered) {
    const at = (dx: number, dy: number, dz: number) => project(x + dx, y + dy, z + dz);
    faces.push({ points: poly([at(0, 0, 1), at(1, 0, 1), at(1, 1, 1), at(0, 1, 1)]), shade: 0 });
    faces.push({ points: poly([at(0, 0, 0), at(1, 0, 0), at(1, 0, 1), at(0, 0, 1)]), shade: 1 });
    faces.push({ points: poly([at(1, 0, 0), at(1, 1, 0), at(1, 1, 1), at(1, 0, 1)]), shade: 2 });
  }
  return { faces, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}

/** Lightness only, never hue. */
export const POLYCUBE_SHADE = [0.04, 0.16, 0.3] as const;
