/**
 * 3-D block rotation — Shepard and Metzler's objects: which of these is the one above, turned?
 *
 * The 1971 experiment that gave mental rotation its name used exactly this: arm-like objects of ten
 * cubes, shown in pairs, same or mirror-imaged, with response time rising linearly in the angle
 * between them. The Vandenberg & Kuse test made it a paper-and-pencil item with four options. The
 * site's `rotation` format is the flat version of the same construct; this one restores the third
 * dimension, which is where the mirror-image distinction stops being a trick and becomes the task —
 * in the plane, a reflection is what you get by turning the sheet over, and a reader can learn to
 * see it; in space, there is no turning over, and the reflection has to be *found* wrong by rotating
 * the object in mind until it does or does not fit.
 *
 * ## What is offered
 *
 * Four options. One is the object rotated by one to three quarter-turns about the axes. One is its
 * mirror image, rotated — the classic distractor, and the only one that is the same object in every
 * respect but handedness. Two are the object with one cube moved, one of them also mirrored; they
 * are held to the same cube count and the same bounding-box extents as the answer, so nothing a
 * blind count or measurement could see separates any option from any other. Every option is a
 * different object up to rotation, so no two can be paired off as "the same shape twice" either.
 *
 * ## What the level changes
 *
 * The object's size and how far it is turned. Five cubes and a single quarter-turn at level 1; nine
 * cubes and three composed turns at level 5. Shepard and Metzler's finding is that the turning is the
 * cost, so the rotation is the larger part of the ladder.
 *
 * Every object is checked chiral by exhaustive comparison against its mirror image under all 24
 * rotations; an object that was its own reflection would have two right answers. And every drawn
 * object, stimulus or option, shows all of its cubes: an isometric view can hide a cube exactly
 * behind another, and an object that cannot be read off its drawing is not a fair question.
 */
import { createRng, type Rng } from '../rng';
import { dict, type Locale } from '../i18n';
import {
  canonical,
  hasHiddenCube,
  isRotationOf,
  mirror,
  moveOneCube,
  multiply,
  randomChiralPolycube,
  ROTATIONS,
  transform,
  type Cube,
  type Matrix3,
} from '../polycube-geometry';
import type { Difficulty, ErrorType, Generator, Item, ItemTypeMeta, Option } from '../types';

const meta: ItemTypeMeta = {
  id: 'block-rotation',
  domain: 'Gv',
  icon: '⬡',
  sprintable: false,
};

interface Plan {
  cubes: number;
  /** Quarter-turns composed to reach the answer's orientation. */
  turns: number;
}

export function planFor(difficulty: Difficulty): Plan {
  switch (difficulty) {
    case 1:
      return { cubes: 5, turns: 1 };
    case 2:
      return { cubes: 6, turns: 1 };
    case 3:
      return { cubes: 7, turns: 2 };
    case 4:
      return { cubes: 8, turns: 2 };
    case 5:
      return { cubes: 9, turns: 3 };
  }
}

const OPTION_COUNT = 4;
const MAX_ATTEMPTS = 200;

/** The six quarter-turns, as matrices: ±90° about each axis. */
const QUARTER_TURNS: Matrix3[] = ROTATIONS.filter((m) => {
  // A quarter-turn fixes one axis and has trace 1; a half-turn has trace -1; identity has 3.
  const trace = m[0][0] + m[1][1] + m[2][2];
  return trace === 1;
});

/** A rotation made of `turns` quarter-turns, never the identity. */
function composedTurn(turns: number, rng: Rng): Matrix3 {
  for (let attempt = 0; attempt < 50; attempt++) {
    let m: Matrix3 = QUARTER_TURNS[rng.int(0, QUARTER_TURNS.length - 1)]!;
    for (let i = 1; i < turns; i++) m = multiply(QUARTER_TURNS[rng.int(0, QUARTER_TURNS.length - 1)]!, m);
    const trace = m[0][0] + m[1][1] + m[2][2];
    if (trace !== 3) return m;
  }
  return QUARTER_TURNS[0]!;
}

/** The object in a random orientation that shows every cube, or null if none was found. */
function visibleOrientation(cubes: readonly Cube[], rng: Rng): Cube[] | null {
  for (let tries = 0; tries < 24; tries++) {
    const shown = transform(cubes, ROTATIONS[rng.int(0, ROTATIONS.length - 1)]!);
    if (!hasHiddenCube(shown)) return shown;
  }
  return null;
}

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.blockRotation;
  const rng = createRng(`block-rotation:${seed}:${difficulty}`);
  const plan = planFor(difficulty);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const grown = randomChiralPolycube(plan.cubes, rng);
    const object = grown && visibleOrientation(grown, rng);
    if (!object) continue;

    // The answer must look different from the stimulus as drawn, or the item is a matching task —
    // and, like every drawn object here, it must show every one of its cubes.
    let answer: Cube[] | null = null;
    for (let tries = 0; tries < 12 && !answer; tries++) {
      const turned = transform(object, composedTurn(plan.turns, rng));
      if (!cubesEqual(turned, object) && !hasHiddenCube(turned)) answer = turned;
    }
    if (!answer) continue;

    const wrong: { cubes: Cube[]; errorType: ErrorType }[] = [];
    const classes = new Set([canonical(object)]);

    const mirrored = visibleOrientation(mirror(object), rng);
    if (!mirrored) continue;
    classes.add(canonical(mirrored));
    wrong.push({ cubes: mirrored, errorType: 'mirror' });

    // Two near-misses: one cube moved, one of them mirrored as well. Each a new object.
    for (let tries = 0; tries < 30 && wrong.length < OPTION_COUNT - 1; tries++) {
      const moved = moveOneCube(object, rng);
      if (!moved) continue;
      const shown = visibleOrientation(wrong.length === 2 ? mirror(moved) : moved, rng);
      if (!shown) continue;
      const cls = canonical(shown);
      if (classes.has(cls)) continue;
      classes.add(cls);
      wrong.push({ cubes: shown, errorType: 'plausible' });
    }
    if (wrong.length !== OPTION_COUNT - 1) continue;

    // Independent check: exactly one option is a rotation of the object.
    const all = [answer, ...wrong.map((w) => w.cubes)];
    if (all.filter((c) => isRotationOf(c, object)).length !== 1) continue;

    const order = rng.shuffle([-1, ...wrong.map((_, i) => i)]);
    const options: Option[] = order.map((i) => ({ kind: 'polycube', cubes: i < 0 ? answer : wrong[i]!.cubes }));
    const errorTypes: ErrorType[] = order.map((i) => (i < 0 ? 'correct' : wrong[i]!.errorType));
    const answerIndex = order.indexOf(-1);

    return {
      type: 'block-rotation',
      seed,
      difficulty,
      prompt: t.prompt,
      stimulus: { kind: 'polycube', cubes: object },
      responseMode: 'choice',
      options,
      answerIndex,
      errorTypes,
      explanation: {
        summary: t.summary(answerIndex + 1, plan.turns),
        rules: [t.ruleTurn, t.ruleMirror, t.ruleCount(plan.cubes)],
      },
      suggestedSeconds: 20 + difficulty * 8,
    };
  }

  throw new Error(`block-rotation generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

function cubesEqual(a: readonly Cube[], b: readonly Cube[]): boolean {
  return a.length === b.length && a.every((c, i) => c[0] === b[i]![0] && c[1] === b[i]![1] && c[2] === b[i]![2]);
}

export const blockRotationGenerator: Generator = { meta, generate };
