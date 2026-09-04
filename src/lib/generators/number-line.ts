/**
 * Number line — a line with its ends labelled; place this number on it.
 *
 * The estimation task from the developmental literature (Siegler & Opfer's number-line estimation),
 * and the one Gq format here that asks for a *magnitude* rather than a computed result. Arithmetic,
 * the pyramid and the running counts all reward exact procedure; this rewards a sense of where a
 * quantity sits relative to others, which is a separate strand of quantitative knowledge and the one
 * that predicts arithmetic learning rather than following from it.
 *
 * ## Scoring
 *
 * An estimate is scored by *percent absolute error*: how far the mark landed from the target, as a
 * fraction of the whole line. The response is correct when that error is within the level's
 * tolerance, which is the standard way the task is reduced to right and wrong. The estimate itself
 * is what is stored — the position tapped, in thousandths of the line — so a review can say by how
 * much and in which direction the mark missed, and the diagnosis is computed from that rather than
 * keyed to a distractor.
 *
 * ## What the level changes
 *
 * The line and the tolerance, in that order of importance. Level 1 is a line everyone has
 * internalised, from zero to 20, 50, 100 or 200. Level 2 stretches it to 1000, where the compression Siegler found in
 * children (small numbers placed too far right) reappears in adults for a moment. Level 3 moves the
 * left end off zero, so the reader has to scale from an offset rather than from the origin. Level 4
 * asks for a fraction or a decimal on a unit line, which is the estimation task that best predicts
 * later mathematics and the one adults get wrong most. Level 5 spans zero asymmetrically, so neither end
 * is the origin and the mark has to be placed by proportion alone. The tolerance narrows a point or
 * two a level, but the line does most of the work.
 *
 * No target sits within the tolerance of an end or of the midpoint, since those are the three
 * places a reader can hit without estimating anything.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

const meta: ItemTypeMeta = {
  id: 'number-line',
  domain: 'Gq',
  icon: '⟷',
  sprintable: false,
};

/** The response and the key are positions along the line in thousandths. */
export const LINE_UNITS = 1000;

/** How close, as a fraction of the whole line, an estimate has to land. */
export function toleranceFor(difficulty: Difficulty): number {
  switch (difficulty) {
    case 1:
      return 0.06;
    case 2:
      return 0.05;
    case 3:
      return 0.05;
    case 4:
      return 0.04;
    case 5:
      return 0.04;
  }
}

export interface NumberLineSpec {
  min: number;
  max: number;
  /** The target as the reader sees it: an integer, or a fraction like `3/8`. */
  label: string;
  /** The target's numeric value. */
  value: number;
}

/** Position of a value along the line, in thousandths, rounded. */
export function positionOf(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * LINE_UNITS);
}

export function encodePosition(position: number): string {
  return String(Math.max(0, Math.min(LINE_UNITS, Math.round(position))));
}

/** Whether a tapped position is within the tolerance of the key, both in thousandths. */
export function withinTolerance(expected: string, tapped: string, tolerance: number): boolean {
  const want = Number(expected);
  const got = Number(tapped);
  if (!Number.isFinite(want) || !Number.isFinite(got)) return false;
  return Math.abs(want - got) <= tolerance * LINE_UNITS + 1e-9;
}

const MAX_ATTEMPTS = 200;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.numberLine;
  const rng = createRng(`number-line:${seed}:${difficulty}`);
  const tolerance = toleranceFor(difficulty);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const spec = drawSpec(difficulty, rng);
    const position = positionOf(spec.value, spec.min, spec.max);
    // Away from the ends and the middle, by more than the tolerance, so that a mark at any of the
    // three landmarks is wrong.
    const margin = tolerance * LINE_UNITS + LINE_UNITS * 0.02;
    if (position < margin || position > LINE_UNITS - margin) continue;
    if (Math.abs(position - LINE_UNITS / 2) < margin) continue;

    return {
      type: 'number-line',
      seed,
      difficulty,
      prompt: t.prompt(spec.label),
      stimulus: {
        kind: 'number-line',
        min: spec.min,
        max: spec.max,
        label: spec.label,
        value: spec.value,
        tolerance,
      },
      responseMode: 'tap',
      options: [],
      answerIndex: -1,
      answerText: encodePosition(position),
      errorTypes: [],
      explanation: {
        summary: t.summary(spec.label, Math.round((position / LINE_UNITS) * 100)),
        rules: [t.ruleTolerance(Math.round(tolerance * 100)), t.ruleLandmarks, t.ruleScore],
      },
      suggestedSeconds: 10 + difficulty * 2,
    };
  }

  throw new Error(`number-line generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

function drawSpec(difficulty: Difficulty, rng: ReturnType<typeof createRng>): NumberLineSpec {
  switch (difficulty) {
    case 1: {
      // The familiar lines: to 20, 50, 100 or 200, from zero.
      const max = [20, 50, 100, 200][rng.int(0, 3)]!;
      const value = rng.int(1, max - 1);
      return { min: 0, max, label: String(value), value };
    }
    case 2: {
      const value = rng.int(30, 970);
      return { min: 0, max: 1000, label: String(value), value };
    }
    case 3: {
      // An offset line: a round start, a length that is not a power of ten.
      const min = rng.int(1, 9) * 100;
      const length = [300, 400, 500, 600, 800][rng.int(0, 4)]!;
      const value = rng.int(min + 10, min + length - 10);
      return { min, max: min + length, label: String(value), value };
    }
    case 4: {
      // The unit line: a proper fraction in lowest terms, or a two-place decimal.
      if (rng.bool()) {
        const value = rng.int(5, 95) / 100;
        return { min: 0, max: 1, label: value.toFixed(2), value };
      }
      const denominator = [3, 5, 6, 7, 8, 9, 10, 12][rng.int(0, 7)]!;
      let numerator = rng.int(1, denominator - 1);
      while (gcd(numerator, denominator) !== 1) numerator = rng.int(1, denominator - 1);
      return { min: 0, max: 1, label: `${numerator}/${denominator}`, value: numerator / denominator };
    }
    case 5: {
      // Spans zero, unequally, so no end is the origin.
      const left = -rng.int(2, 9) * 10;
      const right = rng.int(2, 9) * 10;
      if (Math.abs(left) === right) return drawSpec(5, rng);
      const value = rng.int(left + 5, right - 5);
      return { min: left, max: right, label: String(value), value };
    }
  }
}

export const numberLineGenerator: Generator = { meta, generate };
