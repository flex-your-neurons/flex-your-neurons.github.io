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
 * The same isometric projection as `cube-geometry`, one unit cube at a time. The viewer looks along
 * (+1, -1, +1), so a cube's depth is x - y + z and a nearer cube is one with a larger value.
 *
 * Paint order is not enough here, though, and that is worth saying plainly: the faces are shaded by
 * lightness and outlined, which means translucent fill, which means paint that accumulates instead
 * of covering. A face drawn where a nearer cube stands does not get hidden by it — it shows through,
 * and its outline with it, and enough of that turns an object into a thicket of lines. So the
 * drawing works out what is visible and emits only that: the projection puts every cube corner on
 * the lattice (x + y, y + z), the three drawn faces of a cube are three parallelograms of it, and
 * cutting each cell along its diagonal refines them into triangles that any two cubes share whole or
 * not at all. The nearest cube claiming a triangle draws it. A cube that claims none is invisible,
 * which is what `hasHiddenCube` reports and what the generator refuses to draw.
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

/**
 * The smallest key over all rotations: equal for two polycubes exactly when one is the other turned.
 *
 * Memoised on the polycube's own key. The generator asks for the class of every candidate option and
 * the leakage test asks for it again for every option under every blind strategy, so the same few
 * hundred shapes are canonicalised thousands of times; the twenty-four rotations are cheap once and
 * dear at that multiplicity. The memo is bounded so that a long session in the browser cannot grow
 * it without limit — at the bound it is emptied rather than evicted, which is enough.
 */
export function canonical(cubes: readonly Cube[]): string {
  const key = cubesKey(cubes);
  const hit = CANONICAL_MEMO.get(key);
  if (hit !== undefined) return hit;
  let best: string | null = null;
  for (const r of ROTATIONS) {
    const rotated = cubesKey(transform(cubes, r));
    if (best === null || rotated < best) best = rotated;
  }
  if (CANONICAL_MEMO.size >= CANONICAL_MEMO_LIMIT) CANONICAL_MEMO.clear();
  CANONICAL_MEMO.set(key, best!);
  return best!;
}

const CANONICAL_MEMO = new Map<string, string>();
const CANONICAL_MEMO_LIMIT = 4096;

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
 * The triangles of the drawing that each of a cube's three drawn faces covers: the +z face first,
 * then -y, then +x — the order `drawPolycube` paints them and the order of `POLYCUBE_SHADE`.
 *
 * Every corner of every cube lands on the lattice `(a, b) = (x + y, y + z)` of the projection, and
 * each drawn face is one parallelogram of that lattice: the -y face is the unit cell `(a, b)`, and
 * the +z and +x faces are the two sheared cells sharing its corners. The three of them tile the
 * cube's hexagon exactly, and the common refinement of the three shearings is the unit cell cut
 * along its main diagonal — so a face is two triangles, a hexagon is six, and two hexagons meet
 * only in whole triangles. That is what makes covering exact rather than approximate: `L` is the
 * half of cell `(a, b)` on the `(a + 1, b)` side of the diagonal, `U` the half on the other.
 */
function faceTriangles([x, y, z]: Cube): [string, string][] {
  const a = x + y;
  const b = y + z;
  return [
    [`${a},${b + 1},L`, `${a + 1},${b + 1},U`],
    [`${a},${b},L`, `${a},${b},U`],
    [`${a + 1},${b},U`, `${a + 1},${b + 1},L`],
  ];
}

/** How near a cube is to the viewer at (+1, -1, +1): larger is nearer, and painted later. */
function depth([x, y, z]: Cube): number {
  return x - y + z;
}

/**
 * Whether some cube is invisible in the drawing — every one of the six triangles of its hexagon
 * taken by a nearer cube. An object drawn with a hidden cube cannot be judged from the drawing, so
 * the generator turns such orientations away.
 *
 * The older test named two ways for a cube to disappear: one sitting exactly in front of it along
 * the line of sight, or one against each of its three visible faces. Both are real, and both are
 * cases of this one, but they are not all of them — a cube can also be covered by a *committee* of
 * neighbours, none of which hides it alone and no one of which is in front of it or against a whole
 * face of it. Those objects were being drawn, and an item whose object cannot be read is an item
 * whose answer looks wrong. Counting triangles is exact, so there is no third case to miss.
 */
export function hasHiddenCube(cubes: readonly Cube[]): boolean {
  const byDepth = [...cubes].sort((a, b) => depth(b) - depth(a));
  const covered = new Set<string>();
  for (let i = 0; i < byDepth.length; ) {
    // A cube at the same depth as another neither hides it nor is hidden by it, so a whole depth is
    // tested against what is nearer than it before any of it is painted.
    let end = i;
    while (end < byDepth.length && depth(byDepth[end]!) === depth(byDepth[i]!)) end++;
    for (let k = i; k < end; k++) {
      if (faceTriangles(byDepth[k]!).flat().every((t) => covered.has(t))) return true;
    }
    for (let k = i; k < end; k++) for (const t of faceTriangles(byDepth[k]!).flat()) covered.add(t);
    i = end;
  }
  return false;
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
 * The visible part of every face of every cube, back to front, in a box that fits the whole object.
 * `edge` is the drawn length of one cube edge.
 *
 * Only the visible part: the faces are shaded translucently and outlined, so a face drawn where a
 * nearer cube covers it does not get painted over — it shows through, and its outline shows through
 * too. Drawing every face of every cube and trusting the paint order gave a thicket of lines with no
 * object in it. So each face is resolved against the triangles of `faceTriangles`: the nearest cube
 * claiming a triangle is the one that draws it, a face whose two triangles are both its own is drawn
 * whole, a face that keeps one is drawn as that triangle, and a face that keeps neither is not drawn
 * at all. Two cubes at the same depth never claim the same triangle, so nearest is unambiguous.
 */
export function drawPolycube(cubes: readonly Cube[], edge: number): Drawing {
  const n = normalise(cubes);
  /** The lattice vertex (a, b) = (x + y, y + z), in drawing coordinates. */
  const vertex = (a: number, b: number): [number, number] => [a * COS30 * edge, a * 0.5 * edge - b * edge];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y, z] of n) {
    // The hexagon's six corners, as lattice vertices: the cube's own (a, b) and its neighbours.
    const a = x + y;
    const b = y + z;
    for (const [da, db] of [[0, 0], [1, 0], [2, 1], [2, 2], [1, 2], [0, 1]]) {
      const [px, py] = vertex(a + da!, b + db!);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }
  const pad = 2;
  const poly = (pts: [number, number][]) =>
    pts.map(([x, y]) => `${f(x - minX + pad)},${f(y - minY + pad)}`).join(' ');

  // The nearest cube claiming each triangle; it is the one that draws it.
  const nearest = new Map<string, number>();
  for (const cube of n) {
    for (const t of faceTriangles(cube).flat()) {
      const d = depth(cube);
      if (!nearest.has(t) || d > nearest.get(t)!) nearest.set(t, d);
    }
  }

  const faces: DrawnFace[] = [];
  const ordered = [...n].sort((p, q) => depth(p) - depth(q));
  for (const cube of ordered) {
    const a = cube[0] + cube[1];
    const b = cube[1] + cube[2];
    // Per face: the whole parallelogram, then the two triangles it is cut into, in triangle order.
    const shapes: [number, number][][][] = [
      [
        [[a, b + 1], [a + 1, b + 1], [a + 2, b + 2], [a + 1, b + 2]],
        [[a, b + 1], [a + 1, b + 1], [a + 1, b + 2]],
        [[a + 1, b + 1], [a + 1, b + 2], [a + 2, b + 2]],
      ],
      [
        [[a, b], [a + 1, b], [a + 1, b + 1], [a, b + 1]],
        [[a, b], [a + 1, b], [a + 1, b + 1]],
        [[a, b], [a, b + 1], [a + 1, b + 1]],
      ],
      [
        [[a + 1, b], [a + 2, b + 1], [a + 2, b + 2], [a + 1, b + 1]],
        [[a + 1, b], [a + 1, b + 1], [a + 2, b + 1]],
        [[a + 1, b + 1], [a + 2, b + 1], [a + 2, b + 2]],
      ],
    ];
    for (const [face, triangles] of faceTriangles(cube).entries()) {
      const mine = triangles.map((t) => nearest.get(t) === depth(cube));
      const [whole, first, second] = shapes[face]!;
      const shape = mine[0] && mine[1] ? whole : mine[0] ? first : mine[1] ? second : null;
      if (!shape) continue;
      faces.push({ points: poly(shape.map(([a2, b2]) => vertex(a2, b2))), shade: face as 0 | 1 | 2 });
    }
  }
  return { faces, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}

/** Lightness only, never hue. */
export const POLYCUBE_SHADE = [0.04, 0.16, 0.3] as const;
