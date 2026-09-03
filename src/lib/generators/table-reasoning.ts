/**
 * Table reasoning — four rows of figures, a few columns, and one question about them.
 *
 * The staple of every graduate and clerical aptitude battery (SHL, Kenexa, the civil-service
 * numerical tests): a small table of numbers and a question whose answer is in it but not *on* it.
 * The arithmetic is never the hard part — a total, a difference, an average, a percentage change —
 * and that is the point. What the item measures is finding the right cells, knowing which operation
 * the question is asking for, and carrying two or three quantities long enough to combine them.
 * Everything on this site until now handed the reader the numbers already selected; this is the
 * first format where the selection is the task.
 *
 * ## Why four rows, always
 *
 * Because the rows are the option set for one of the questions ("which team had the highest
 * total?"), and an option set has to be the same size across the format or the answer's position
 * carries information at the levels where it is smaller. Four is the option count every other
 * numeric format uses. The *columns* are what grow with difficulty — more cells to search, longer
 * sums to hold.
 *
 * ## The questions, and what each one is for
 *
 * - **Row total** and **column total** — the same operation across the two axes, so a reader who
 *   reads down when the question says across is caught by name (`wrong-attribute`: the neighbouring
 *   total is offered).
 * - **Difference between two cells** — two look-ups and a subtraction, with the sum offered as the
 *   distractor for a reader who combined the numbers the wrong way (`wrong-rule`).
 * - **Highest total** — four sums compared. The lure is the row holding the single largest number,
 *   which from level 2 up is never the row with the largest total: the item is built so that the
 *   eye-catching cell misleads.
 * - **Average** — a total and a division; the sum is arranged to divide exactly, because a
 *   remainder would make this a rounding question.
 * - **Percentage change** — the one that separates numerate readers from the rest in every battery
 *   that uses it. The base is always the *earlier* column, and the percentage taken against the later
 *   one is offered by name (`wrong-direction`), as is the absolute difference (`wrong-rule`).
 *
 * All labels are invented — teams and quarters — and the numbers are drawn, so no real-world
 * knowledge helps and no item depends on a fact outside itself. Labels are read from the dictionary
 * after every draw, so a seed gives the same table in both languages.
 */
import { createRng, type Rng } from '../rng';
import { dict, type Locale } from '../i18n';
import { rectangleOptions, windowOptions, type OptionSet } from './distractors';
import type { Difficulty, ErrorType, Generator, Item, ItemTypeMeta, Option } from '../types';

export const ROWS = 4;

export type TableQuestion =
  | { kind: 'row-total'; row: number }
  | { kind: 'column-total'; column: number }
  | { kind: 'difference'; column: number; larger: number; smaller: number }
  | { kind: 'max-row' }
  | { kind: 'average'; row: number }
  | { kind: 'percent-change'; row: number; from: number; to: number };

interface Plan {
  columns: number;
  range: [min: number, max: number];
  kinds: TableQuestion['kind'][];
}

/**
 * Columns and the question menu grow together. The range stays at two digits until the top level:
 * three-digit totals over five columns are where the holding starts to cost, and that cost is the
 * construct — but three-digit *cells* would make this a mental-arithmetic format with a table drawn
 * around it.
 */
function planFor(difficulty: Difficulty): Plan {
  switch (difficulty) {
    case 1:
      return { columns: 3, range: [10, 60], kinds: ['row-total', 'difference'] };
    case 2:
      return { columns: 3, range: [10, 80], kinds: ['row-total', 'column-total', 'difference', 'max-row'] };
    case 3:
      return {
        columns: 4,
        range: [10, 90],
        kinds: ['row-total', 'column-total', 'difference', 'max-row', 'average'],
      };
    case 4:
      return {
        columns: 4,
        range: [10, 99],
        kinds: ['column-total', 'difference', 'max-row', 'average', 'percent-change'],
      };
    case 5:
      return {
        columns: 5,
        range: [10, 99],
        kinds: ['row-total', 'column-total', 'max-row', 'average', 'percent-change'],
      };
  }
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function rowTotals(cells: number[][]): number[] {
  return cells.map(sum);
}

export function columnTotals(cells: number[][]): number[] {
  return cells[0]!.map((_, c) => sum(cells.map((row) => row[c]!)));
}

/** The independent check: the keyed value, re-derived from the printed cells alone. */
export function answerFor(cells: number[][], question: TableQuestion): number {
  switch (question.kind) {
    case 'row-total':
      return sum(cells[question.row]!);
    case 'column-total':
      return columnTotals(cells)[question.column]!;
    case 'difference':
      return cells[question.larger]![question.column]! - cells[question.smaller]![question.column]!;
    case 'max-row': {
      const totals = rowTotals(cells);
      return totals.indexOf(Math.max(...totals));
    }
    case 'average':
      return sum(cells[question.row]!) / cells[question.row]!.length;
    case 'percent-change': {
      const from = cells[question.row]![question.from]!;
      const to = cells[question.row]![question.to]!;
      // The magnitude. The direction is stated in the question, so the options are all one sign.
      return Math.round((Math.abs(to - from) / from) * 100);
    }
  }
}

/** Whether a percent-change question is about a rise or a fall. */
export function percentDirection(cells: number[][], q: { row: number; from: number; to: number }): 'rise' | 'fall' {
  return cells[q.row]![q.to]! > cells[q.row]![q.from]! ? 'rise' : 'fall';
}

const meta: ItemTypeMeta = {
  id: 'table-reasoning',
  domain: 'Gq',
  icon: '▦',
  // Finding the cells and then combining them is not a two-second item.
  sprintable: false,
};

/** Percentages the change question is allowed to ask: whole multiples of five, never zero. */
const PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50];
/** Bases every percentage in `PERCENTS` divides exactly. */
const PERCENT_BASES = [20, 40, 60, 80];

const MAX_ATTEMPTS = 120;

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const rng = createRng(`table-reasoning:${seed}:${difficulty}`);
  const plan = planFor(difficulty);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const kind = rng.pick(plan.kinds);
    const cells = Array.from({ length: ROWS }, () =>
      Array.from({ length: plan.columns }, () => rng.int(plan.range[0], plan.range[1])),
    );
    const question = poseQuestion(rng, cells, kind, plan);
    if (!question) continue;

    const built = build(rng, cells, question, plan, difficulty, locale);
    if (!built) continue;
    return { ...built, seed };
  }

  throw new Error(
    `table-reasoning generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`,
  );
}

/**
 * Chooses the cells the question is about, adjusting the table where the question needs a property
 * the random draw does not guarantee. Returns `null` when the draw cannot be repaired, which is the
 * signal to draw again.
 */
function poseQuestion(
  rng: Rng,
  cells: number[][],
  kind: TableQuestion['kind'],
  plan: Plan,
): TableQuestion | null {
  const columns = plan.columns;
  switch (kind) {
    case 'row-total':
      return { kind, row: rng.int(0, ROWS - 1) };
    case 'column-total':
      return { kind, column: rng.int(0, columns - 1) };
    case 'difference': {
      const column = rng.int(0, columns - 1);
      const [a, b] = rng.sample([0, 1, 2, 3], 2) as [number, number];
      const va = cells[a]![column]!;
      const vb = cells[b]![column]!;
      // The two cells must differ — "how much more" needs a more — and not by a single unit, or the
      // subtraction is a glance and the ±1 distractor is the answer's twin.
      if (Math.abs(va - vb) < 3) return null;
      return va > vb ? { kind, column, larger: a, smaller: b } : { kind, column, larger: b, smaller: a };
    }
    case 'max-row': {
      const totals = rowTotals(cells);
      const sorted = [...totals].sort((x, y) => y - x);
      // A unique winner, and a margin: two totals a unit apart make the comparison a recount.
      if (sorted[0]! - sorted[1]! < 4) return null;
      const winner = totals.indexOf(sorted[0]!);
      /*
       * The lure. The row holding the single largest cell must be a *different* row from the winner,
       * so a reader who picks the row with the eye-catching number is wrong — and diagnosably so.
       * Level 1 never asks this question, so no leniency is needed for it.
       */
      const biggest = Math.max(...cells.flat());
      const lureRow = cells.findIndex((row) => row.includes(biggest));
      if (lureRow === winner) return null;
      return { kind };
    }
    case 'average': {
      const row = rng.int(0, ROWS - 1);
      // Make the row divide exactly by nudging the last cell — within range, or redraw.
      const values = cells[row]!;
      const remainder = sum(values) % columns;
      if (remainder !== 0) {
        const last = values.length - 1;
        const nudged = values[last]! - remainder;
        if (nudged < plan.range[0]) return null;
        values[last] = nudged;
      }
      return { kind, row };
    }
    case 'percent-change': {
      const row = rng.int(0, ROWS - 1);
      const [from, to] = rng.sample(Array.from({ length: columns }, (_, i) => i), 2).sort(
        (x, y) => x - y,
      ) as [number, number];
      const base = rng.pick(PERCENT_BASES);
      const percent = rng.pick(PERCENTS) * (rng.bool() ? 1 : -1);
      const after = base + (base * percent) / 100;
      if (after < plan.range[0] || after > plan.range[1] || after === base) return null;
      cells[row]![from] = base;
      cells[row]![to] = after;
      return { kind, row, from, to };
    }
  }
}

function build(
  rng: Rng,
  cells: number[][],
  question: TableQuestion,
  plan: Plan,
  difficulty: Difficulty,
  locale: Locale,
): Omit<Item, 'seed'> | null {
  const t = dict(locale).gen.tableReasoning;
  const rowLabel = (i: number) => t.rowLabel(i);
  const colLabel = (i: number) => t.columnLabel(i);
  // Language-neutral: the labels are the view's job, so a seed draws the same table in both locales.
  const stimulus = { kind: 'table' as const, columns: plan.columns, cells };
  const base = {
    type: 'table-reasoning' as const,
    difficulty,
    stimulus,
    responseMode: 'choice' as const,
    suggestedSeconds: 20 + plan.columns * 4,
  };

  if (question.kind === 'max-row') {
    const totals = rowTotals(cells);
    const answer = answerFor(cells, question);
    const biggest = Math.max(...cells.flat());
    const lureRow = cells.findIndex((row) => row.includes(biggest));
    const options: Option[] = cells.map((_, i) => ({ kind: 'text', text: rowLabel(i) }));
    const errorTypes: ErrorType[] = cells.map((_, i) =>
      i === answer ? 'correct' : i === lureRow ? 'wrong-rule' : 'plausible',
    );
    return {
      ...base,
      prompt: t.promptMaxRow,
      options,
      answerIndex: answer,
      errorTypes,
      explanation: {
        summary: t.summaryMaxRow(rowLabel(answer), totals[answer]!),
        rules: [
          t.ruleTotals(cells.map((_, i) => `${rowLabel(i)} ${totals[i]}`).join(' · ')),
          t.ruleLure(rowLabel(lureRow), biggest),
        ],
      },
    };
  }

  const answer = answerFor(cells, question);
  const set = numericOptionsFor(rng, cells, question, answer);
  if (!set) return null;
  const shuffled = rng.shuffle(set.values);
  const options: Option[] = shuffled.map((v) => ({
    kind: 'text',
    text: question.kind === 'percent-change' ? t.percent(v) : String(v),
  }));

  const explanation = explain(t, cells, question, answer, rowLabel, colLabel);
  return {
    ...base,
    prompt: promptFor(t, cells, question, rowLabel, colLabel),
    options,
    answerIndex: shuffled.indexOf(answer),
    errorTypes: shuffled.map((v) => set.errors.get(v) ?? 'plausible'),
    explanation,
  };
}

type Text = ReturnType<typeof dict>['gen']['tableReasoning'];

function promptFor(
  t: Text,
  cells: number[][],
  q: Exclude<TableQuestion, { kind: 'max-row' }>,
  rowLabel: (i: number) => string,
  colLabel: (i: number) => string,
): string {
  switch (q.kind) {
    case 'row-total':
      return t.promptRowTotal(rowLabel(q.row));
    case 'column-total':
      return t.promptColumnTotal(colLabel(q.column));
    case 'difference':
      return t.promptDifference(rowLabel(q.larger), rowLabel(q.smaller), colLabel(q.column));
    case 'average':
      return t.promptAverage(rowLabel(q.row));
    case 'percent-change':
      return t.promptPercent(rowLabel(q.row), colLabel(q.from), colLabel(q.to), percentDirection(cells, q));
  }
}

function explain(
  t: Text,
  cells: number[][],
  q: Exclude<TableQuestion, { kind: 'max-row' }>,
  answer: number,
  rowLabel: (i: number) => string,
  colLabel: (i: number) => string,
): Item['explanation'] {
  switch (q.kind) {
    case 'row-total': {
      const values = cells[q.row]!;
      return {
        summary: t.summaryTotal(rowLabel(q.row), answer),
        rules: [t.ruleAdd(values.join(' + '), answer), t.ruleAxisRow],
      };
    }
    case 'column-total': {
      const values = cells.map((row) => row[q.column]!);
      return {
        summary: t.summaryTotal(colLabel(q.column), answer),
        rules: [t.ruleAdd(values.join(' + '), answer), t.ruleAxisColumn],
      };
    }
    case 'difference': {
      const a = cells[q.larger]![q.column]!;
      const b = cells[q.smaller]![q.column]!;
      return {
        summary: t.summaryDifference(rowLabel(q.larger), rowLabel(q.smaller), colLabel(q.column), answer),
        rules: [t.ruleSubtract(a, b, answer), t.ruleNotSum(a + b)],
      };
    }
    case 'average': {
      const values = cells[q.row]!;
      const total = sum(values);
      return {
        summary: t.summaryAverage(rowLabel(q.row), answer),
        rules: [t.ruleAdd(values.join(' + '), total), t.ruleDivide(total, values.length, answer)],
      };
    }
    case 'percent-change': {
      const from = cells[q.row]![q.from]!;
      const to = cells[q.row]![q.to]!;
      const direction = percentDirection(cells, q);
      return {
        summary: t.summaryPercent(rowLabel(q.row), colLabel(q.from), colLabel(q.to), t.percent(answer), direction),
        rules: [t.rulePercentBase(from, to, Math.abs(to - from), t.percent(answer)), t.rulePercentDirection],
      };
    }
  }
}

/**
 * The option set for the numeric questions.
 *
 * Totals, differences and averages use the rectangle — a carry slip on one axis and a small
 * miscount on the other — because that is the construction the blind solver in
 * `tests/leakage.test.ts` cannot read. The first draft offered the neighbouring row's total as a
 * named distractor and the carry pair as a fixed ±10; the solver found the answer in six items of
 * ten by looking for the unique pair ten apart. The neighbouring total was a good diagnosis and a
 * bad option, so it is named in the explanation instead and not offered.
 *
 * Percentages use a window of multiples of five — every option is a percentage someone might
 * arrive at, and the run has no centre to find.
 */
function numericOptionsFor(
  rng: Rng,
  cells: number[][],
  q: Exclude<TableQuestion, { kind: 'max-row' }>,
  answer: number,
): OptionSet | null {
  if (q.kind === 'percent-change') {
    const from = cells[q.row]![q.from]!;
    const to = cells[q.row]![q.to]!;
    // The change measured against the later value, when that comes out a whole number of percent.
    const reversed = (Math.abs(to - from) / to) * 100;
    const diagnose = (value: number): ErrorType =>
      value === reversed ? 'wrong-direction' : Math.abs(value - answer) === 5 ? 'off-by-one' : 'plausible';
    return windowOptions(rng, answer, 4, diagnose, 5, 5);
  }
  const diagnose = (value: number): ErrorType => {
    if (Math.abs(value - answer) % 10 === 0) return 'carry';
    return Math.abs(value - answer) === 1 ? 'off-by-one' : 'plausible';
  };
  const band = Math.max(14, answer * 0.4);
  return rectangleOptions(rng, answer, [10], [1, 2, 3], diagnose, band, 1);
}

export const tableReasoningGenerator: Generator = { meta, generate };
