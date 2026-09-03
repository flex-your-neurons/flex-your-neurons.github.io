/**
 * Pattern recall — a grid lights up all at once, goes dark, and you tap back what was lit.
 *
 * Visual memory as a *simultaneous* pattern, which is the other half of the story block span tells.
 * Corsi's task shows positions one after another and asks for their order; this shows several at
 * once and asks for the set. The two dissociate — the first loads a sequential, rehearsable store
 * and the second a spatial snapshot — and every visual-memory battery that has both reports them
 * separately (the Visual Patterns Test of Della Sala et al., 1997, is this format almost exactly).
 * It is the most-played memory test on the popular benchmark sites, in the same shape.
 *
 * ## Why Gv rather than Gwm
 *
 * CHC files visual memory (MV) under Gv, and the argument for keeping it there is the exposure: the
 * pattern is on screen as a single picture for a fixed moment, and what is held is the picture. Block
 * span was filed under Gwm because its load is a *sequence* that has to be maintained and updated as
 * it arrives; here nothing arrives, so nothing is updated.
 *
 * ## Why the grid is fixed and the exposure is fixed
 *
 * Same reasons as block span, applied to the other two dials. A grid that grew with level would make
 * the item harder by adding places to search; a shorter exposure would trade storage for encoding
 * speed. Both are things a reader can be worse at, and neither is what this format claims to
 * measure. Difficulty is the number of lit cells and nothing else.
 *
 * ## Which patterns are turned away
 *
 * A full row, a full column, or a filled rectangle chunks into a single word ("the top row") and is
 * held as one thing rather than as several cells, so a pattern that is entirely one of those is
 * redrawn. Partial structure is allowed — some chunking is how everyone does this task — but the
 * whole pattern must not be nameable.
 */
import { createRng, type Rng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

/** The grid is four by four, always. */
export const GRID = 4;

/** How long the pattern is on screen, at every level. */
export const EXPOSURE_MS = 1500;

/** How many cells light at each level. */
export function countFor(difficulty: Difficulty): number {
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

/**
 * The tapped-set encoding: one character per cell, row-major, `1` for lit. Fixed width, so the
 * comparison is exact and the order of tapping is irrelevant — a set is what is being remembered.
 */
export function encodeCells(cells: readonly number[], size = GRID): string {
  const out = new Array<string>(size * size).fill('0');
  for (const cell of cells) out[cell] = '1';
  return out.join('');
}

export function decodeCells(encoded: string): number[] {
  return [...encoded].flatMap((c, i) => (c === '1' ? [i] : []));
}

/**
 * Whether the pattern is nameable as one shape: an entire row, an entire column, or a filled
 * rectangle. Exported so the property test can assert the guard bites.
 */
export function isNameable(cells: readonly number[], size = GRID): boolean {
  const rows = cells.map((c) => Math.floor(c / size));
  const cols = cells.map((c) => c % size);
  const rowSpan = Math.max(...rows) - Math.min(...rows) + 1;
  const colSpan = Math.max(...cols) - Math.min(...cols) + 1;
  // Every cell of the bounding rectangle is lit — a full row and a full column are special cases.
  return rowSpan * colSpan === cells.length;
}

const ATTEMPTS = 60;

function drawPattern(count: number, rng: Rng): number[] {
  const all = Array.from({ length: GRID * GRID }, (_, i) => i);
  let last: number[] = [];
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    last = rng.sample(all, count).sort((a, b) => a - b);
    if (!isNameable(last)) return last;
  }
  return last;
}

const meta: ItemTypeMeta = {
  id: 'pattern-recall',
  domain: 'Gv',
  icon: '▚',
  // Plays itself before it can be answered.
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.patternRecall;
  const rng = createRng(`pattern-recall:${seed}:${difficulty}`);
  const count = countFor(difficulty);
  const cells = drawPattern(count, rng);

  return {
    type: 'pattern-recall',
    seed,
    difficulty,
    prompt: t.prompt(count),
    stimulus: { kind: 'pattern', size: GRID, cells },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeCells(cells),
    errorTypes: [],
    explanation: {
      summary: t.summary(count),
      rules: [t.ruleSet, t.ruleExact, t.ruleSnapshot, t.ruleGrid],
    },
    suggestedSeconds: 8 + count * 2,
    presentation: { stepMs: EXPOSURE_MS, gapMs: 0 },
  };
}

export const patternRecallGenerator: Generator = { meta, generate };
