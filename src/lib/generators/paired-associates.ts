/**
 * Paired associates — symbols are shown in boxes, one at a time; the boxes close; which box held
 * this one?
 *
 * The first format on the site under **Glr**, long-term storage and retrieval, and the reason it
 * can exist where the verbal formats cannot is that its content is arbitrary by design. Associative
 * memory (MA, the CHC narrow ability) is the ability to learn a pairing you had no reason to expect
 * — a face and a name, a word and its translation — and the classic laboratory version pairs an
 * object with a location precisely so that nothing but the learning can help. Here the objects are
 * abstract figures and the locations are boxes, so the item needs no language, no world knowledge
 * and no lookup table, and the answer is the placement the generator chose.
 *
 * It is the CANTAB Paired Associates Learning task, and Cambridge Brain Sciences' Paired Associates,
 * in the one-trial form: every box is opened once, then one symbol is asked for.
 *
 * ## Why this is not working memory
 *
 * The honest question, since the interval between learning and probe is seconds. What separates
 * it from the span formats is the *structure* of what is held: a span is an ordered list to be
 * reproduced, and this is a set of arbitrary pairings to be queried. The probe is a symbol, not a
 * position, so the reader has to retrieve a location *from* a symbol — the associative direction —
 * rather than replay a sequence. That is the operation Glr names, and it is the operation the
 * Wechsler and Woodcock–Johnson associative subtests score. What this site does not build is a
 * delayed probe minutes later, which would be the fuller measurement; the description says so.
 *
 * ## Why difficulty is the number of boxes
 *
 * Each box is one pairing to learn, so the count is the load. The exposure per box, the layout and
 * the symbol vocabulary stay fixed for the reasons block span gives — each of them is something a
 * reader could be worse at that is not associative learning.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import { SHAPE_TYPES, type Difficulty, type Figure, type Generator, type Item, type ItemTypeMeta } from '../types';

/** How many boxes, and so how many pairings, at each level. */
export function boxesFor(difficulty: Difficulty): number {
  switch (difficulty) {
    case 1:
      return 3;
    case 2:
      return 4;
    case 3:
      return 5;
    case 4:
      return 6;
    case 5:
      return 7;
  }
}

/** How long each box stays open, and the pause between boxes. */
export const STEP_MS = 1300;
export const GAP_MS = 300;

/** The tapped-box encoding: the box's 1-based position. */
export function encodeBox(index: number): string {
  return String(index + 1);
}

if (boxesFor(5) > 9) throw new Error('paired-associates: the tap encoding assumes at most 9 boxes');

/**
 * A symbol: one solid shape. Identity is the outline alone — eight outlines for at most seven
 * boxes, so every symbol on a board is a different shape and none can be confused with another by
 * fill or size.
 */
export function symbolFigure(shape: (typeof SHAPE_TYPES)[number]): Figure {
  return { layout: 'center', shapes: [{ type: shape, size: 3, color: 5, rotation: 0, x: 0.5, y: 0.5 }] };
}

const meta: ItemTypeMeta = {
  id: 'paired-associates',
  domain: 'Glr',
  icon: '⧉',
  // Plays itself before it can be answered.
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.pairedAssociates;
  const rng = createRng(`paired-associates:${seed}:${difficulty}`);
  const boxes = boxesFor(difficulty);

  const shapes = rng.sample(SHAPE_TYPES, boxes);
  const symbols = shapes.map(symbolFigure);
  // The boxes open in a shuffled order, so the order of opening says nothing about position.
  const order = rng.shuffle(symbols.map((_, i) => i));
  const probe = rng.int(0, boxes - 1);

  return {
    type: 'paired-associates',
    seed,
    difficulty,
    prompt: t.prompt(boxes),
    stimulus: { kind: 'pairs', symbols, order, probe },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeBox(probe),
    errorTypes: [],
    explanation: {
      summary: t.summary(probe + 1),
      rules: [t.ruleEachOnce, t.ruleProbe, t.ruleArbitrary, t.ruleInterval],
    },
    suggestedSeconds: 8 + boxes * 2,
    presentation: { stepMs: STEP_MS, gapMs: GAP_MS },
  };
}

export const pairedAssociatesGenerator: Generator = { meta, generate };
