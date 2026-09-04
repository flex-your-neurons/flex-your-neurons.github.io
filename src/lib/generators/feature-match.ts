/**
 * Feature match — two panels of symbols; are they identical?
 *
 * The clerical-checking task: Cambridge Brain Sciences calls it Feature Match, the old aptitude
 * batteries called it "name comparison" or "number comparison", and the Wechsler Cancellation and
 * Symbol Search items are its cousins. Two panels show the same number of abstract symbols in the
 * same positions; either every symbol matches its opposite number, or exactly one does not. The reader
 * says which. It is filed under Gs because nothing has to be worked out — the answer is visible — and
 * the measurement is how fast a visible answer can be found and reported.
 *
 * ## Why the difference is always small
 *
 * When the panels differ, the odd symbol differs from its counterpart on one dimension only — shape,
 * or shading, or orientation — never two. A gross difference can be seen without comparing; a
 * one-dimension difference has to be found by checking each pair, which is the clerical act the
 * format is named for. That is also why the two panels keep the same layout: a shuffled panel would
 * add a search for each symbol's partner, which is a different cost.
 *
 * ## What the level changes
 *
 * The number of symbols in each panel, and nothing else. More pairs to check is more of the same
 * operation, so the level scales the load without changing the construct. "Same" and "different" are
 * balanced across items, so a reader who always says one of them gains nothing.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import { confusableWith, randomSymbol, symbolKey, toFigure, type Symbol } from './symbols';
import type { Difficulty, ErrorType, Generator, Item, ItemTypeMeta } from '../types';

/** Symbols per panel. */
export function panelSizeFor(difficulty: Difficulty): number {
  return difficulty + 2;
}

const meta: ItemTypeMeta = {
  id: 'feature-match',
  domain: 'Gs',
  icon: '⧓',
  sprintable: true,
};

const MAX_ATTEMPTS = 100;

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.featureMatch;
  const rng = createRng(`feature-match:${seed}:${difficulty}`);
  const size = panelSizeFor(difficulty);
  const same = rng.bool();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // A panel of distinct symbols, so that "the one that differs" is well defined.
    const left: Symbol[] = [];
    const keys = new Set<string>();
    for (let tries = 0; left.length < size && tries < 200; tries++) {
      const s = randomSymbol(rng);
      if (keys.has(symbolKey(s))) continue;
      keys.add(symbolKey(s));
      left.push(s);
    }
    if (left.length !== size) continue;

    const right = [...left];
    let changed = -1;
    if (!same) {
      changed = rng.int(0, size - 1);
      let replacement: Symbol | null = null;
      for (let tries = 0; tries < 60; tries++) {
        const candidate = confusableWith(left[changed]!, rng);
        // Must differ from its partner, and must not duplicate another symbol already in the panel.
        if (keys.has(symbolKey(candidate))) continue;
        replacement = candidate;
        break;
      }
      if (!replacement) continue;
      right[changed] = replacement;
    }

    // Independent check: the panels are identical exactly when the item says so.
    const identical = left.every((s, i) => symbolKey(s) === symbolKey(right[i]!));
    if (identical !== same) continue;

    const answerIndex = same ? 0 : 1;
    const errorTypes: ErrorType[] = same ? ['correct', 'plausible'] : ['plausible', 'correct'];

    return {
      type: 'feature-match',
      seed,
      difficulty,
      prompt: t.prompt,
      stimulus: {
        kind: 'feature-match',
        left: left.map((s) => toFigure(s)),
        right: right.map((s) => toFigure(s)),
        changed,
      },
      responseMode: 'choice',
      options: [
        { kind: 'text', text: t.same },
        { kind: 'text', text: t.different },
      ],
      answerIndex,
      errorTypes,
      explanation: {
        summary: same ? t.summarySame : t.summaryDifferent(changed + 1),
        rules: [t.ruleOne, t.ruleLayout, t.ruleSpeed],
      },
      suggestedSeconds: 6 + size,
    };
  }

  throw new Error(`feature-match generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

export const featureMatchGenerator: Generator = { meta, generate };
