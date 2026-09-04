/**
 * Cube nets — six marked squares laid flat; which cube do they fold into?
 *
 * The other half of paper folding. Where that format asks what a folded sheet looks like opened
 * out, this one asks what a flat sheet looks like closed up, and it is the item every spatial
 * aptitude battery has carried since the Differential Aptitude Tests: the DAT Space Relations
 * subtest is nothing but nets and cubes. It sits in Gv beside rotation and paper folding, and it
 * measures the same thing they do — holding an image and transforming it — through a transformation
 * neither of them uses, folding out of the plane.
 *
 * ## What a wrong answer is
 *
 * A picture of a cube shows three faces at a corner. It is wrong in one of two ways. Either two of
 * the three are *opposite* faces of the folded cube, which can never be seen together — the mistake
 * of a reader who has not worked out which squares of the net meet; or the three faces are right and
 * their *arrangement* is the mirror image, which no folding can produce — the mistake of a reader
 * who has worked out that they meet but not which way round. The second is the hard one, and the
 * classic: with the faces' identity settled, only imagining the fold separates the cube from its
 * reflection. The ladder moves from the first kind of distractor to the second.
 *
 * ## Why the marks are the way they are
 *
 * Every face carries one of six marks, and all six look the same turned a quarter or reflected.
 * That is a deliberate narrowing of the DAT item, whose faces carry oriented patterns so that the
 * *rotation* of each face also has to come out right. Oriented marks would make a picture of the
 * answer depend on which way up each face landed — a second, independent thing to get wrong, and one
 * that turned the review of a wrong answer into a rotation problem the reader had not been set. The
 * corner's handedness carries the whole difficulty on its own.
 *
 * The marks differ in shape and never in hue: a filled disc against a ring, a square against a
 * frame, a plus against a cross. Nothing on the item is carried by colour.
 *
 * ## The net
 *
 * Levels 1 uses the cross, the net everyone has seen. From level 2 the net is any of the eleven, in
 * any orientation, drawn from the list `cube-geometry` computes by folding every hexomino — so the
 * eleven are found, not asserted. The folding that decides the answer is the same routine, and the
 * test suite checks it against the cross folded by hand.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import {
  CUBE_MARKS,
  FIXED_NETS,
  foldNet,
  isCrossNet,
  isDrawableCorner,
  opposite,
  type CubeMark,
  type NetCell,
} from '../cube-geometry';
import type { Difficulty, ErrorType, Generator, Item, ItemTypeMeta, Option } from '../types';

const meta: ItemTypeMeta = {
  id: 'cube-net',
  domain: 'Gv',
  icon: '⬚',
  sprintable: false,
};

interface Plan {
  /** Only the cross-shaped net, or any of the eleven. */
  crossOnly: boolean;
  options: number;
  /** How many distractors show the right three faces the wrong way round. */
  mirrors: number;
}

export function planFor(difficulty: Difficulty): Plan {
  // Five options at every level, so the answer's position is spread the same way throughout; the
  // ladder replaces opposite-face distractors with mirrors one at a time.
  switch (difficulty) {
    case 1:
      return { crossOnly: true, options: 5, mirrors: 0 };
    case 2:
      return { crossOnly: false, options: 5, mirrors: 1 };
    case 3:
      return { crossOnly: false, options: 5, mirrors: 2 };
    case 4:
      return { crossOnly: false, options: 5, mirrors: 3 };
    case 5:
      return { crossOnly: false, options: 5, mirrors: 4 };
  }
}

/** A cube as drawn: the marks on its top, left and right faces. */
export type CubeFaces = [top: CubeMark, left: CubeMark, right: CubeMark];

const MAX_ATTEMPTS = 100;

/** The eight corners, each as its three directions in a drawable order. */
export function corners(): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const x of [0, 1]) {
    for (const y of [2, 3]) {
      for (const z of [4, 5]) {
        // One drawable ordering per corner; the others are its rotations.
        for (const [a, b, c] of [
          [z, y, x],
          [z, x, y],
        ] as const) {
          if (isDrawableCorner(a, b, c)) out.push([a, b, c]);
        }
      }
    }
  }
  return out;
}

/** The three rotations of a drawable ordering, all drawable. */
export function rotations([a, b, c]: [number, number, number]): [number, number, number][] {
  return [
    [a, b, c],
    [b, c, a],
    [c, a, b],
  ];
}

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.cubeNet;
  const rng = createRng(`cube-net:${seed}:${difficulty}`);
  const plan = planFor(difficulty);
  const nets = plan.crossOnly ? FIXED_NETS.filter(isCrossNet) : FIXED_NETS;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const cells = nets[rng.int(0, nets.length - 1)]!;
    const faceOf = foldNet(cells);
    if (!faceOf) continue;
    const marks = rng.shuffle([...CUBE_MARKS]);
    // markAt[direction] is the mark on the face pointing that way.
    const markAt = new Array<CubeMark>(6);
    cells.forEach((_, i) => {
      markAt[faceOf[i]!] = marks[i]!;
    });

    const faces = (dirs: [number, number, number]): CubeFaces => [markAt[dirs[0]]!, markAt[dirs[1]]!, markAt[dirs[2]]!];
    const key = (f: CubeFaces) => f.join('/');

    // The answer: any corner, any of its three rotations.
    const allCorners = rng.shuffle(corners());
    const answerCorner = allCorners[0]!;
    const answer = faces(rotations(answerCorner)[rng.int(0, 2)]!);
    const used = new Set([key(answer)]);
    const wrong: { faces: CubeFaces; errorType: ErrorType }[] = [];

    // Mirrors: other corners, left and right swapped, so no two share a face set with each other
    // or with the answer. A blind reader counting face sets then finds every option's set unique.
    for (const corner of allCorners.slice(1)) {
      if (wrong.length >= plan.mirrors) break;
      const [a, b, c] = rotations(corner)[rng.int(0, 2)]!;
      const mirrored = faces([a, c, b]);
      if (used.has(key(mirrored))) continue;
      used.add(key(mirrored));
      wrong.push({ faces: mirrored, errorType: 'mirror' });
    }
    if (wrong.length < plan.mirrors) continue;

    // Opposite faces shown together, with any third face, in any order.
    for (let tries = 0; tries < 60 && wrong.length < plan.options - 1; tries++) {
      const a = rng.int(0, 5);
      const others = [0, 1, 2, 3, 4, 5].filter((d) => d >> 1 !== a >> 1);
      const third = others[rng.int(0, others.length - 1)]!;
      const trio = rng.shuffle([a, opposite(a), third]) as [number, number, number];
      const shown = faces(trio);
      if (used.has(key(shown))) continue;
      used.add(key(shown));
      wrong.push({ faces: shown, errorType: 'opposite-faces' });
    }
    if (wrong.length !== plan.options - 1) continue;

    const order = rng.shuffle([-1, ...wrong.map((_, i) => i)]);
    const options: Option[] = order.map((i) => ({ kind: 'cube', faces: i < 0 ? answer : wrong[i]!.faces }));
    const errorTypes: ErrorType[] = order.map((i) => (i < 0 ? 'correct' : wrong[i]!.errorType));
    const answerIndex = order.indexOf(-1);

    const rows = Math.max(...cells.map((p) => p.r)) + 1;
    const cols = Math.max(...cells.map((p) => p.c)) + 1;
    const oppositePairs = [0, 2, 4].map((d) => [markAt[d]!, markAt[d + 1]!] as [CubeMark, CubeMark]);

    return {
      type: 'cube-net',
      seed,
      difficulty,
      prompt: t.prompt,
      stimulus: {
        kind: 'cube-net',
        rows,
        cols,
        cells: cells.map((p, i) => ({ r: p.r, c: p.c, mark: marks[i]! })),
      },
      responseMode: 'choice',
      options,
      answerIndex,
      errorTypes,
      explanation: {
        summary: t.summary(answerIndex + 1),
        rules: [
          t.ruleOpposite(oppositePairs.map(([a, b]) => t.pair(t.marks[a], t.marks[b]))),
          t.ruleCorner,
          ...(plan.mirrors > 0 ? [t.ruleMirror] : []),
        ],
      },
      suggestedSeconds: 20 + difficulty * 6,
    };
  }

  throw new Error(`cube-net generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

export const cubeNetGenerator: Generator = { meta, generate };

/** Exposed for the solver test: the marks on the faces pointing each way, from a stimulus. */
export function marksByDirection(cells: readonly { r: number; c: number; mark: CubeMark }[]): CubeMark[] | null {
  const faceOf = foldNet(cells as readonly NetCell[]);
  if (!faceOf) return null;
  const out = new Array<CubeMark>(6);
  cells.forEach((cell, i) => {
    out[faceOf[i]!] = cell.mark;
  });
  return out;
}

