/**
 * Chimp test — numbers scattered on a grid; tap the 1, the rest are masked, tap them in order.
 *
 * The task is Inoue and Matsuzawa's (2007): the chimpanzee Ayumu saw numerals scattered on a
 * screen, touched the 1, and the others were replaced by white squares; he then touched the squares
 * in numerical order, and did it faster and with more numerals than the adult humans tested against
 * him. Human Benchmark's version made it a household name. It is a working-memory task, and a
 * visuospatial one: what has to be held is *where each number was*, not the numbers, which are
 * always one to N.
 *
 * ## How it differs from the site's other spatial spans
 *
 * `block-span` shows places one at a time and asks for the order shown; `pattern-recall` shows a set
 * at once and asks for the set. This shows a set at once *with an order printed on it*, and asks for
 * the order — simultaneous encoding of an ordered set, which is the combination the other two do not
 * cover, and the one whose ceiling is famous for being so much lower in humans than in one chimp.
 *
 * ## What the level changes
 *
 * The number of numerals, four to eight, and nothing else: the grid is five by four at every level,
 * and nothing is timed. There is no exposure limit before the first tap, as in the original — the
 * reader looks as long as they like, and the measurement is what survives the moment the numbers go.
 * (Ayumu's exposure was under a second. The unlimited look is the one concession to a human reader,
 * and it is why the time from first tap to last is recorded as the latency.)
 *
 * ## What is rejected
 *
 * A placement whose numbers run in reading order — left to right, top to bottom, ascending or
 * descending — is a rule to hold rather than a set of places, and is redrawn. So is one where every
 * numeral sits in a single row or column.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

export const CHIMP_COLS = 5;
export const CHIMP_ROWS = 4;

/** How many numerals the level scatters. */
export function countFor(difficulty: Difficulty): number {
  return difficulty + 3;
}

/** Cells are encoded as letters, one per cell, so a tapped sequence is a string like any other tap. */
export function encodeCell(index: number): string {
  return String.fromCharCode(65 + index);
}

export function encodeCells(indices: readonly number[]): string {
  return indices.map(encodeCell).join('');
}

export function decodeCells(text: string): number[] {
  return Array.from(text, (c) => c.charCodeAt(0) - 65);
}

/** True if the numerals, read left to right and top to bottom, come out in ascending or descending order. */
export function isReadingOrder(cells: readonly number[]): boolean {
  const ascending = cells.every((c, i) => i === 0 || c > (cells[i - 1] ?? -1));
  const descending = cells.every((c, i) => i === 0 || c < (cells[i - 1] ?? Infinity));
  return ascending || descending;
}

/** True if every numeral is in one row or one column. */
export function isOneLine(cells: readonly number[]): boolean {
  const rows = new Set(cells.map((c) => Math.floor(c / CHIMP_COLS)));
  const cols = new Set(cells.map((c) => c % CHIMP_COLS));
  return rows.size === 1 || cols.size === 1;
}

/** `cells[i]` is the grid index where numeral `i + 1` sits. */
export function drawCells(rng: ReturnType<typeof createRng>, count: number): number[] {
  const all = Array.from({ length: CHIMP_COLS * CHIMP_ROWS }, (_, i) => i);
  for (;;) {
    const cells = rng.sample(all, count);
    if (!isReadingOrder(cells) && !isOneLine(cells)) return cells;
  }
}

const meta: ItemTypeMeta = {
  id: 'chimp-test',
  domain: 'Gwm',
  icon: '🐵',
  /* Not sprintable: the response is a sequence of taps, and a sprint has no board for it. */
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.chimpTest;
  const rng = createRng(`chimp-test:${seed}:${difficulty}`);
  const count = countFor(difficulty);
  const cells = drawCells(rng, count);

  return {
    type: 'chimp-test',
    seed,
    difficulty,
    prompt: t.prompt(count),
    stimulus: { kind: 'chimp', cols: CHIMP_COLS, rows: CHIMP_ROWS, cells },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeCells(cells),
    errorTypes: [],
    explanation: {
      summary: t.summary(count),
      rules: [t.ruleMask, t.ruleOrder, t.ruleExact, t.ruleAyumu],
    },
    suggestedSeconds: 6 + count * 2,
  };
}

export const chimpTestGenerator: Generator = { meta, generate };
