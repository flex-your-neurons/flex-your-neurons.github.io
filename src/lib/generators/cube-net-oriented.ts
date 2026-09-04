/**
 * Oriented cube net — six squares with marks that have a top; which cube do they fold into?
 *
 * The cube-net format with the constraint it deliberately left out. Its notes explain the choice:
 * symmetric marks, so that the picture of a face does not depend on which way up the face landed
 * and the corner's handedness carries the whole difficulty. The DAT Space Relations item does not
 * make that concession — its faces carry oriented patterns, and a cube showing the right three
 * faces, the right way round, with one pattern a quarter-turn off is wrong. This format is that
 * item. It asks the reader to follow not just which squares meet but which *edges* meet, and it is
 * the harder half of what the DAT measures.
 *
 * ## The geometry
 *
 * Folding by rolling already tracks the cube's whole orientation, so each square's face *and* the
 * direction its top points come out of the same walk (`foldNetOriented`). A drawn cube is the folded
 * cube turned so that three chosen faces show; each mark's top goes through the same turn and lands
 * on one of the four in-plane directions of its face, which `faceTurns` reads off as quarter turns.
 * The picture is then the same drawing as the plain format's, with each mark turned before it is
 * skewed onto its face — and every face's drawing frame is orientation-preserving, so no mark is
 * ever shown reflected. A mark's handedness is not something the reader can be wrong about.
 *
 * ## The three kinds of wrong answer, in pairs
 *
 * Six options, as three pairs that share a face set: the answer and the answer with one mark
 * turned (`wrong-turn`); a mirror-handed corner and the same corner with a mark turned (`mirror`,
 * both — handedness is the error that matters); and a corner showing two opposite faces, twice
 * (`opposite-faces`). Pairs rather than singletons because the turned distractor *must* share the
 * answer's face set, and a face set shared by two options and by no others would point at the pair.
 * With every set shared by exactly two, counting sets says nothing.
 *
 * ## What the level changes
 *
 * Level 1 is the cross net and a half-turn for the turned marks — the easy read — with no mirrors.
 * Level 2 admits any net and a mirror pair. Level 3 makes the turn a quarter. Level 4 replaces the
 * opposite-faces pair with a second mirror pair. At level 5 the mirrors' marks are turned exactly as
 * the answer's are on the faces they share, so checking each face's orientation against the net
 * clears them: only the handedness is wrong, and only imagining the fold finds it.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import {
  faceTurns,
  FIXED_NETS,
  foldNetOriented,
  isCrossNet,
  opposite,
  ORIENTED_MARKS,
  type CubeMark,
  type NetCell,
} from '../cube-geometry';
import { corners, rotations, type CubeFaces } from './cube-net';
import type { Difficulty, ErrorType, Generator, Item, ItemTypeMeta, Option } from '../types';

const meta: ItemTypeMeta = {
  id: 'cube-net-oriented',
  domain: 'Gv',
  icon: '⬕',
  sprintable: false,
};

interface Plan {
  crossOnly: boolean;
  /** Quarter turns a turned mark is off by: 2 is a half-turn, 1 or 3 a quarter either way. */
  turnBy: number[];
  /** How many of the two distractor pairs are mirrors; the rest show opposite faces. */
  mirrorPairs: number;
  /** Whether the mirrors' marks are turned as the answer's are, so only handedness gives them away. */
  consistentMirrors: boolean;
}

export const OPTION_COUNT = 6;

export function planFor(difficulty: Difficulty): Plan {
  switch (difficulty) {
    case 1:
      return { crossOnly: true, turnBy: [2], mirrorPairs: 0, consistentMirrors: false };
    case 2:
      return { crossOnly: false, turnBy: [2], mirrorPairs: 1, consistentMirrors: false };
    case 3:
      return { crossOnly: false, turnBy: [1, 3], mirrorPairs: 1, consistentMirrors: false };
    case 4:
      return { crossOnly: false, turnBy: [1, 3], mirrorPairs: 2, consistentMirrors: false };
    case 5:
      return { crossOnly: false, turnBy: [1, 3], mirrorPairs: 2, consistentMirrors: true };
  }
}

type Turns = [number, number, number];
interface Drawn {
  faces: CubeFaces;
  turns: Turns;
  errorType: ErrorType;
}

const MAX_ATTEMPTS = 100;

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.cubeNetOriented;
  const rng = createRng(`cube-net-oriented:${seed}:${difficulty}`);
  const plan = planFor(difficulty);
  const nets = plan.crossOnly ? FIXED_NETS.filter(isCrossNet) : FIXED_NETS;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const cells = nets[rng.int(0, nets.length - 1)]!;
    const folded = foldNetOriented(cells);
    if (!folded) continue;
    const marks = rng.shuffle([...ORIENTED_MARKS]) as CubeMark[];
    const markAt = new Array<CubeMark>(6);
    const upOf = new Array<number>(6);
    folded.forEach((cell, i) => {
      markAt[cell.face] = marks[i]!;
      upOf[cell.face] = cell.up;
    });

    const faces = (dirs: readonly [number, number, number]): CubeFaces => [markAt[dirs[0]]!, markAt[dirs[1]]!, markAt[dirs[2]]!];
    const key = (d: { faces: CubeFaces; turns: Turns }) => `${d.faces.join('/')}#${d.turns.join('')}`;
    const turnOne = (turns: Turns): Turns => {
      const face = rng.int(0, 2);
      const by = plan.turnBy[rng.int(0, plan.turnBy.length - 1)]!;
      const out: Turns = [...turns];
      out[face] = (out[face]! + by) % 4;
      return out;
    };
    const randomTurns = (): Turns => [rng.int(0, 3), rng.int(0, 3), rng.int(0, 3)];

    const allCorners = rng.shuffle(corners());
    const answerDirs = rotations(allCorners[0]!)[rng.int(0, 2)]!;
    const answer: Drawn = { faces: faces(answerDirs), turns: faceTurns(answerDirs, upOf), errorType: 'correct' };
    const drawn: Drawn[] = [answer, { ...answer, turns: turnOne(answer.turns), errorType: 'wrong-turn' }];

    // Mirror pairs: other corners, left and right swapped, each a face set no other pair shows.
    const usedSets = new Set([[...answer.faces].sort().join('/')]);
    let corner = 1;
    for (let m = 0; m < plan.mirrorPairs && corner < allCorners.length; corner++) {
      const [a, b, c] = rotations(allCorners[corner]!)[rng.int(0, 2)]!;
      const mirrored: [number, number, number] = [a, c, b];
      const setKey = [...faces(mirrored)].sort().join('/');
      if (usedSets.has(setKey)) continue;
      usedSets.add(setKey);
      /*
       * A consistent mirror turns each mark as the real cube would if that face were shown there —
       * the lookup in `faceTurns` accepts a mirror-handed triple and yields a drawable picture.
       * Otherwise the turns are drawn at random, and a face-by-face check against the net usually
       * catches them before the handedness has to be judged.
       */
      const turns = plan.consistentMirrors ? faceTurns(mirrored, upOf) : randomTurns();
      const first: Drawn = { faces: faces(mirrored), turns, errorType: 'mirror' };
      drawn.push(first, { ...first, turns: turnOne(turns) });
      m++;
    }
    if (drawn.length !== 2 + plan.mirrorPairs * 2) continue;

    // Opposite-faces pairs: two opposite faces and any third, in any order, any turns.
    for (let tries = 0; tries < 60 && drawn.length < OPTION_COUNT; tries++) {
      const a = rng.int(0, 5);
      const others = [0, 1, 2, 3, 4, 5].filter((d) => d >> 1 !== a >> 1);
      const third = others[rng.int(0, others.length - 1)]!;
      const trio = rng.shuffle([a, opposite(a), third]) as [number, number, number];
      const setKey = [...faces(trio)].sort().join('/');
      if (usedSets.has(setKey)) continue;
      usedSets.add(setKey);
      const turns = randomTurns();
      const first: Drawn = { faces: faces(trio), turns, errorType: 'opposite-faces' };
      drawn.push(first, { ...first, turns: turnOne(turns) });
    }
    if (drawn.length !== OPTION_COUNT) continue;
    if (new Set(drawn.map(key)).size !== OPTION_COUNT) continue;

    const order = rng.shuffle(drawn.map((_, i) => i));
    const options: Option[] = order.map((i) => ({ kind: 'cube', faces: drawn[i]!.faces, turns: drawn[i]!.turns }));
    const errorTypes: ErrorType[] = order.map((i) => drawn[i]!.errorType);
    const answerIndex = order.indexOf(0);

    const rows = Math.max(...cells.map((p) => p.r)) + 1;
    const cols = Math.max(...cells.map((p) => p.c)) + 1;
    const oppositePairs = [0, 2, 4].map((d) => [markAt[d]!, markAt[d + 1]!] as [CubeMark, CubeMark]);

    return {
      type: 'cube-net-oriented',
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
          t.ruleEdges,
          ...(plan.mirrorPairs > 0 ? [t.ruleMirror] : []),
        ],
      },
      suggestedSeconds: 30 + difficulty * 6,
    };
  }

  throw new Error(`cube-net-oriented generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

/** Exposed for the solver test: mark and top-direction per face, from a stimulus. */
export function orientationByDirection(cells: readonly { r: number; c: number; mark: CubeMark }[]): { markAt: CubeMark[]; upOf: number[] } | null {
  const folded = foldNetOriented(cells as readonly NetCell[]);
  if (!folded) return null;
  const markAt = new Array<CubeMark>(6);
  const upOf = new Array<number>(6);
  folded.forEach((cell, i) => {
    markAt[cell.face] = cells[i]!.mark;
    upOf[cell.face] = cell.up;
  });
  return { markAt, upOf };
}


export const cubeNetOrientedGenerator: Generator = { meta, generate };
