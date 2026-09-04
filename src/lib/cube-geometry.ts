/**
 * The cube behind the cube-net format: folding a net, and drawing the result.
 *
 * Kept apart from the generator because two renderers need the drawing half — the Preact option
 * view in the browser and the static SVG on a share card — and both must paint the same picture.
 * Everything here is pure geometry: no locale, no rendering framework.
 *
 * ## Folding
 *
 * A net folds by *rolling*. Put the cube face-down on one square of the net and roll it onto each
 * neighbouring square in turn: whichever face lands on a square is that square's face. Each roll
 * is a quarter turn of the cube about one axis, so the cube's orientation is tracked as a mapping
 * from its six current directions to the six it started with, and the square under it is assigned
 * the original direction now facing down. A hexomino is a net exactly when this walk assigns all
 * six faces once each — which is how the eleven nets are found rather than typed in.
 *
 * ## Corners and handedness
 *
 * A picture of a cube shows three faces meeting at a corner, and a corner has a handedness: seen
 * from outside, the three faces run round it either clockwise or anticlockwise, and no rotation of
 * the cube changes which. The drawing below shows the top, the left and the right face; those three
 * directions form a right-handed triple, so a triple of faces is drawable exactly when its three
 * direction vectors have a positive determinant in that order. Swap left and right and the picture
 * shows a cube that no folding of the net can produce — the mirror image, and the one wrong answer
 * that cannot be dismissed without imagining the fold.
 */

/** The six markings a face can carry. All are unchanged by a quarter turn and by reflection, so
 *  the picture of a face does not depend on which way up the face landed. */
export const CUBE_MARKS = ['disc', 'ring', 'square', 'frame', 'plus', 'cross'] as const;
export type CubeMark = (typeof CUBE_MARKS)[number];

/** Cube directions, indexed so that `i ^ 1` is the opposite face and `i >> 1` the axis. */
export const DIRECTIONS = ['+x', '-x', '+y', '-y', '+z', '-z'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const PX = 0;
export const NX = 1;
export const PY = 2;
export const NY = 3;
export const PZ = 4;
export const NZ = 5;

export function opposite(dir: number): number {
  return dir ^ 1;
}

const VECTORS: readonly [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/**
 * Whether the faces at directions `top`, `left`, `right` can be seen together, in that
 * arrangement, on a real cube: mutually perpendicular and right-handed.
 */
export function isDrawableCorner(top: number, left: number, right: number): boolean {
  if (top >> 1 === left >> 1 || top >> 1 === right >> 1 || left >> 1 === right >> 1) return false;
  const [a, b, c] = [VECTORS[top]!, VECTORS[left]!, VECTORS[right]!];
  const det =
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);
  return det > 0;
}

/** One square of a net. */
export interface NetCell {
  r: number;
  c: number;
}

/**
 * Rolls the orientation one square in a grid direction. `orient[d]` is the original direction now
 * facing `d`. Columns run along x, rows along y; the net lies in the plane z = 0 with the cube on top.
 */
function roll(orient: readonly number[], dr: number, dc: number): number[] {
  const o = [...orient];
  if (dc === 1) {
    // Rolling towards +x: the +x face goes down, the bottom comes up on the -x side.
    o[NZ] = orient[PX]!;
    o[PX] = orient[PZ]!;
    o[PZ] = orient[NX]!;
    o[NX] = orient[NZ]!;
  } else if (dc === -1) {
    o[NZ] = orient[NX]!;
    o[NX] = orient[PZ]!;
    o[PZ] = orient[PX]!;
    o[PX] = orient[NZ]!;
  } else if (dr === 1) {
    o[NZ] = orient[PY]!;
    o[PY] = orient[PZ]!;
    o[PZ] = orient[NY]!;
    o[NY] = orient[NZ]!;
  } else {
    o[NZ] = orient[NY]!;
    o[NY] = orient[PZ]!;
    o[PZ] = orient[PY]!;
    o[PY] = orient[NZ]!;
  }
  return o;
}

/**
 * Folds a net. Returns, for each cell, the cube direction its face ends up facing (with cell 0
 * face-down), or `null` if the cells do not fold into a cube — a face landed twice, or a cell was
 * reached along two paths that disagree.
 */
export function foldNet(cells: readonly NetCell[]): number[] | null {
  if (cells.length !== 6) return null;
  const index = new Map<string, number>();
  cells.forEach((cell, i) => index.set(`${cell.r},${cell.c}`, i));
  if (index.size !== 6) return null;

  const faceOf = new Array<number>(6).fill(-1);
  const orientAt = new Array<number[] | null>(6).fill(null);
  orientAt[0] = [0, 1, 2, 3, 4, 5];
  faceOf[0] = NZ;
  const queue = [0];
  while (queue.length > 0) {
    const i = queue.shift()!;
    const here = cells[i]!;
    const orient = orientAt[i]!;
    for (const [dr, dc] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ] as const) {
      const j = index.get(`${here.r + dr},${here.c + dc}`);
      if (j === undefined) continue;
      const next = roll(orient, dr, dc);
      if (orientAt[j]) {
        // Reached before: the two routes must agree, or the net has a cycle that cannot fold flat.
        if (faceOf[j] !== next[NZ]) return null;
        continue;
      }
      orientAt[j] = next;
      faceOf[j] = next[NZ]!;
      queue.push(j);
    }
  }
  if (faceOf.some((f) => f < 0)) return null;
  if (new Set(faceOf).size !== 6) return null;
  return faceOf;
}

/**
 * Every fixed hexomino that folds into a cube, as cells normalised to the top-left. There are
 * eleven free nets; counted with their rotations and reflections this list has more, and choosing
 * among them uniformly is how the generator gets a net in an arbitrary orientation.
 */
export const FIXED_NETS: readonly (readonly NetCell[])[] = (() => {
  // Grow every fixed hexomino from a single cell, keyed on its normalised cell list.
  let frontier = new Map<string, NetCell[]>([['0,0', [{ r: 0, c: 0 }]]]);
  for (let size = 1; size < 6; size++) {
    const next = new Map<string, NetCell[]>();
    for (const poly of frontier.values()) {
      const have = new Set(poly.map((p) => `${p.r},${p.c}`));
      for (const p of poly) {
        for (const [dr, dc] of [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ] as const) {
          const cell = { r: p.r + dr, c: p.c + dc };
          if (have.has(`${cell.r},${cell.c}`)) continue;
          const grown = normaliseNet([...poly, cell]);
          next.set(netKey(grown), grown);
        }
      }
    }
    frontier = next;
  }
  return [...frontier.values()].filter((poly) => foldNet(poly) !== null).sort((a, b) => netKey(a).localeCompare(netKey(b)));
})();

/** Translates cells so the bounding box starts at (0, 0), in reading order. */
export function normaliseNet(cells: readonly NetCell[]): NetCell[] {
  const minR = Math.min(...cells.map((p) => p.r));
  const minC = Math.min(...cells.map((p) => p.c));
  return cells
    .map((p) => ({ r: p.r - minR, c: p.c - minC }))
    .sort((a, b) => a.r - b.r || a.c - b.c);
}

export function netKey(cells: readonly NetCell[]): string {
  return normaliseNet(cells)
    .map((p) => `${p.r},${p.c}`)
    .join(' ');
}

/** Rotations and reflections of a net, deduplicated — for counting free nets. */
export function netSymmetryClass(cells: readonly NetCell[]): string {
  const images: string[] = [];
  let current = [...cells];
  for (let turn = 0; turn < 4; turn++) {
    images.push(netKey(current), netKey(current.map((p) => ({ r: p.r, c: -p.c }))));
    current = current.map((p) => ({ r: p.c, c: -p.r }));
  }
  return images.sort()[0]!;
}

/** True of the net shaped like a cross: one square with all four neighbours. */
export function isCrossNet(cells: readonly NetCell[]): boolean {
  const have = new Set(cells.map((p) => `${p.r},${p.c}`));
  return cells.some(
    (p) =>
      have.has(`${p.r + 1},${p.c}`) &&
      have.has(`${p.r - 1},${p.c}`) &&
      have.has(`${p.r},${p.c + 1}`) &&
      have.has(`${p.r},${p.c - 1}`),
  );
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/**
 * A mark as one filled path in the unit square, so it survives the skew of an isometric face
 * without any stroke to distort. Rings and frames are cut with the even-odd rule.
 */
export function markPath(mark: CubeMark): { d: string; evenOdd: boolean } {
  switch (mark) {
    case 'disc':
      return { d: circle(0.5, 0.5, 0.23), evenOdd: false };
    case 'ring':
      return { d: circle(0.5, 0.5, 0.26) + circle(0.5, 0.5, 0.17), evenOdd: true };
    case 'square':
      return { d: rect(0.28, 0.28, 0.44, 0.44), evenOdd: false };
    case 'frame':
      return { d: rect(0.24, 0.24, 0.52, 0.52) + rect(0.33, 0.33, 0.34, 0.34), evenOdd: true };
    case 'plus':
      return { d: rect(0.44, 0.18, 0.12, 0.64) + rect(0.18, 0.44, 0.64, 0.12), evenOdd: false };
    case 'cross': {
      // The plus turned 45° about the centre, as explicit coordinates.
      const arm = (angle: number) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const pts: [number, number][] = [
          [-0.06, -0.32],
          [0.06, -0.32],
          [0.06, 0.32],
          [-0.06, 0.32],
        ];
        return (
          pts
            .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${f(0.5 + x * cos - y * sin)},${f(0.5 + x * sin + y * cos)}`)
            .join(' ') + ' Z '
        );
      };
      return { d: arm(Math.PI / 4) + arm(-Math.PI / 4), evenOdd: false };
    }
  }
}

function f(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

function circle(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)},${f(cy)} A${f(r)},${f(r)} 0 1,0 ${f(cx + r)},${f(cy)} A${f(r)},${f(r)} 0 1,0 ${f(cx - r)},${f(cy)} Z `;
}

function rect(x: number, y: number, w: number, h: number): string {
  return `M${f(x)},${f(y)} h${f(w)} v${f(h)} h${f(-w)} Z `;
}

/** An SVG `matrix(...)` mapping the unit square onto a parallelogram. */
export type Affine = [a: number, b: number, c: number, d: number, e: number, f: number];

export function affineString(m: Affine): string {
  return `matrix(${m.map(f).join(' ')})`;
}

/** The isometric axes, for a cube of edge `s`, drawn in a box `cubeBox(s)` wide and high. */
const COS30 = Math.sqrt(3) / 2;

export function cubeBox(s: number): { w: number; h: number } {
  return { w: 2 * COS30 * s, h: 2 * s };
}

/**
 * The three visible faces of the drawn cube — top, left, right — each as the affine map from the
 * mark's unit square onto that face, plus the face outline as a polygon.
 */
export function cubeFaces(s: number): { transform: Affine; points: string }[] {
  const X: [number, number] = [COS30 * s, 0.5 * s];
  const Y: [number, number] = [COS30 * s, -0.5 * s];
  const Z: [number, number] = [0, -s];
  const O: [number, number] = [0, 1.5 * s];
  const at = (x: number, y: number, z: number): [number, number] => [
    O[0] + x * X[0] + y * Y[0] + z * Z[0],
    O[1] + x * X[1] + y * Y[1] + z * Z[1],
  ];
  const poly = (pts: [number, number][]) => pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
  const map = (u: [number, number], v: [number, number], origin: [number, number]): Affine => [
    u[0],
    u[1],
    v[0],
    v[1],
    origin[0],
    origin[1],
  ];
  return [
    // Top (+z): u along x, v along y.
    { transform: map(X, Y, at(0, 0, 1)), points: poly([at(0, 0, 1), at(1, 0, 1), at(1, 1, 1), at(0, 1, 1)]) },
    // Left (-y): u along x, v down.
    { transform: map(X, [-Z[0], -Z[1]], at(0, 0, 1)), points: poly([at(0, 0, 0), at(1, 0, 0), at(1, 0, 1), at(0, 0, 1)]) },
    // Right (+x): u along y, v down.
    { transform: map(Y, [-Z[0], -Z[1]], at(1, 0, 1)), points: poly([at(1, 0, 0), at(1, 1, 0), at(1, 1, 1), at(1, 0, 1)]) },
  ];
}

/** Lightness only, never hue: the three faces are told apart by how much ink they carry. */
export const FACE_SHADE = [0.04, 0.12, 0.22] as const;
