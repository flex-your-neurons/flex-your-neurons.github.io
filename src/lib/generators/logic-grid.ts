/**
 * Logic grid — shapes in a row of numbered places, a few clues, and one place asked about.
 *
 * The deductive puzzle in its smallest form: n shapes, n places, and clues of the kind "the star is
 * somewhere to the left of the square", "the circle is not in place 2", "the triangle is next to the
 * cross". The reader is asked what one place holds. The format is the constraint-satisfaction core of
 * every "logic grid" or "zebra" puzzle, with the trappings removed — no houses, no nationalities,
 * just places and shapes — because the trappings are vocabulary and vocabulary is what this site does
 * not generate.
 *
 * ## The guarantees
 *
 * - **Exactly one answer.** Every arrangement of the shapes is tried against the clues (at most 120,
 *   so the search is exhaustive and instant); the arrangements that survive all agree on what the
 *   asked-about place holds. The rest of the row may remain undetermined, deliberately: the question
 *   is about one place, and the clues are only required to settle that.
 * - **Every clue is needed.** After the clue set is drawn it is pruned: any clue whose removal
 *   leaves the answer determined is dropped. So a reader cannot solve the item from a subset, and the
 *   clue count is an honest measure of how much has to be combined.
 * - **No clue states the answer.** A clue placing a shape *in* the asked-about place is never drawn.
 *   Eliminations ("the star is not in place 2") are allowed, because ruling shapes out one by one is
 *   deduction, and the pruning ensures each such clue is doing work.
 *
 * ## What the level changes
 *
 * Which kinds of clue are allowed, then how many shapes. A placement ("the circle is in place 1") is
 * read off; an elimination ("the circle is not in place 2") is one step; a relation ("somewhere to
 * the left of", "side by side") has to be combined with another before it says anything about a
 * place. The ladder withdraws placements, then eliminations, then adds a fifth shape and does it
 * again. That is one dial — how much has to be inferred rather than read — and it stays inside
 * deduction: the places are always in a row, and nothing is timed. Four options are shown at every
 * level, so a fifth shape adds to the puzzle and not to the guessing.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import { SHAPE_TYPES, type Difficulty, type ErrorType, type Figure, type Generator, type Item, type ItemTypeMeta, type Option } from '../types';
import { symbolFigure } from './paired-associates';

export type LogicClue =
  | { type: 'is'; shape: number; place: number }
  | { type: 'not'; shape: number; place: number }
  /** `a` is somewhere to the left of `b`. */
  | { type: 'left-of'; a: number; b: number }
  /** `a` and `b` are side by side, either way round. */
  | { type: 'adjacent'; a: number; b: number }
  /** `a` is immediately to the left of `b`. */
  | { type: 'next-left'; a: number; b: number };

export interface LogicPlan {
  shapes: number;
  /** Whether a plain placement ("the circle is in place 1") may be among the clues. */
  placements: boolean;
  /** Whether an elimination ("the circle is not in place 2") may be among the clues. */
  negations: boolean;
}

/**
 * How many shapes the level lines up, and which kinds of clue it may use. Placements are read off;
 * eliminations are one step; relations ("left of", "side by side") have to be combined — so the
 * ladder withdraws the easy kinds first and then adds a shape.
 */
export function planFor(difficulty: Difficulty): LogicPlan {
  switch (difficulty) {
    case 1:
      return { shapes: 4, placements: true, negations: true };
    case 2:
      return { shapes: 4, placements: false, negations: true };
    case 3:
      return { shapes: 4, placements: false, negations: false };
    case 4:
      return { shapes: 5, placements: false, negations: true };
    case 5:
      return { shapes: 5, placements: false, negations: false };
  }
}

/** Options shown: always four, so the answer's position carries no information about the level. */
export const OPTION_COUNT = 4;

/** The clue set with every left/right relation read the other way round. */
export function mirrored(clues: readonly LogicClue[]): LogicClue[] {
  return clues.map((c) =>
    c.type === 'left-of' || c.type === 'next-left' ? { type: c.type, a: c.b, b: c.a } : c,
  );
}

/** Every arrangement of n shapes: `arrangement[place] = shape`. */
export function arrangements(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (const rest of arrangements(n - 1)) {
    for (let i = 0; i <= rest.length; i++) out.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
  }
  return out;
}

export function clueHolds(clue: LogicClue, arrangement: readonly number[]): boolean {
  const placeOf = (shape: number) => arrangement.indexOf(shape);
  switch (clue.type) {
    case 'is':
      return arrangement[clue.place] === clue.shape;
    case 'not':
      return arrangement[clue.place] !== clue.shape;
    case 'left-of':
      return placeOf(clue.a) < placeOf(clue.b);
    case 'adjacent':
      return Math.abs(placeOf(clue.a) - placeOf(clue.b)) === 1;
    case 'next-left':
      return placeOf(clue.b) - placeOf(clue.a) === 1;
  }
}

/** The shapes that could be in `place` given the clues — the answer is unique when this has one member. */
export function candidatesAt(clues: readonly LogicClue[], n: number, place: number): number[] {
  const possible = new Set<number>();
  for (const arrangement of arrangements(n)) {
    if (clues.every((c) => clueHolds(c, arrangement))) possible.add(arrangement[place]!);
  }
  return [...possible].sort((a, b) => a - b);
}

/** Every clue true of the solution that does not place a shape in the asked-about place. */
function trueClues(solution: readonly number[], asked: number, plan: LogicPlan): LogicClue[] {
  const n = solution.length;
  const out: LogicClue[] = [];
  for (let shape = 0; shape < n; shape++) {
    const at = solution.indexOf(shape);
    for (let place = 0; place < n; place++) {
      if (place === at) {
        if (plan.placements && place !== asked) out.push({ type: 'is', shape, place });
      } else if (plan.negations) {
        out.push({ type: 'not', shape, place });
      }
    }
    for (let other = 0; other < n; other++) {
      if (other === shape) continue;
      const otherAt = solution.indexOf(other);
      if (at < otherAt) out.push({ type: 'left-of', a: shape, b: other });
      if (otherAt - at === 1) out.push({ type: 'next-left', a: shape, b: other });
      if (Math.abs(at - otherAt) === 1 && shape < other) out.push({ type: 'adjacent', a: shape, b: other });
    }
  }
  return out;
}

const MIN_CLUES = 2;
const MAX_CLUES = 5;
const MAX_ATTEMPTS = 200;

const meta: ItemTypeMeta = {
  id: 'logic-grid',
  domain: 'Gf',
  icon: '⊞',
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.logicGrid;
  const names = dict(locale).quiz.shapeNames;
  const rng = createRng(`logic-grid:${seed}:${difficulty}`);
  const plan = planFor(difficulty);
  const n = plan.shapes;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shapeTypes = rng.sample(SHAPE_TYPES, n);
    const solution = rng.shuffle(Array.from({ length: n }, (_, i) => i));
    const asked = rng.int(0, n - 1);

    // Draw clues until the asked-about place is settled, then prune to the ones that settle it.
    const pool = rng.shuffle(trueClues(solution, asked, plan));
    const chosen: LogicClue[] = [];
    for (const clue of pool) {
      if (candidatesAt(chosen, n, asked).length === 1) break;
      chosen.push(clue);
    }
    if (candidatesAt(chosen, n, asked).length !== 1) continue;
    let clues = [...chosen];
    for (const clue of rng.shuffle(chosen)) {
      const without = clues.filter((c) => c !== clue);
      if (candidatesAt(without, n, asked).length === 1) clues = without;
    }
    if (clues.length < MIN_CLUES || clues.length > MAX_CLUES) continue;

    const answer = solution[asked]!;

    /*
     * Diagnoses. A reader who read every "left" as "right" solves a mirrored puzzle; if that puzzle
     * settles the asked place on a different shape, that shape is the `wrong-direction` distractor.
     * A reader who solved the row and then miscounted the places picks a neighbour of the answer:
     * `off-by-one`. Anything else is a shape the clues rule out in no single way.
     */
    const flipped = candidatesAt(mirrored(clues), n, asked);
    const mirrorShape = flipped.length === 1 && flipped[0] !== answer ? flipped[0]! : null;
    const diagnose = (shape: number): ErrorType => {
      if (shape === answer) return 'correct';
      if (shape === mirrorShape) return 'wrong-direction';
      if (Math.abs(solution.indexOf(shape) - asked) === 1) return 'off-by-one';
      return 'plausible';
    };
    // Four options: the answer and three wrong shapes, the diagnosable ones first.
    const wrong = Array.from({ length: n }, (_, i) => i).filter((s) => s !== answer);
    const ranked = [...rng.shuffle(wrong)].sort((a, b) => Number(diagnose(b) !== 'plausible') - Number(diagnose(a) !== 'plausible'));
    const order = rng.shuffle([answer, ...ranked.slice(0, OPTION_COUNT - 1)]);
    const options: Option[] = order.map((shape) => ({ kind: 'figure', figure: symbolFigure(shapeTypes[shape]!) }));
    const errorTypes: ErrorType[] = order.map(diagnose);
    const answerIndex = order.indexOf(answer);

    return {
      type: 'logic-grid',
      seed,
      difficulty,
      prompt: t.prompt(asked + 1),
      stimulus: { kind: 'logic', shapes: shapeTypes.map(symbolFigure), places: n, clues, asked },
      responseMode: 'choice',
      options,
      answerIndex,
      errorTypes,
      explanation: {
        summary: t.summary(asked + 1, names[shapeTypes[answer]!]),
        rules: [t.ruleUnique(clues.length), t.ruleMinimal, t.ruleMethod],
      },
      suggestedSeconds: 20 + n * 8,
    };
  }

  throw new Error(`logic-grid generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

export const logicGridGenerator: Generator = { meta, generate };
