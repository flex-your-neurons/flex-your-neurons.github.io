/**
 * The span profile: what each working-memory format's highest level held means in its own units.
 *
 * The progress table reports a peak level per format, and for most formats a level is an abstraction
 * a reader has no reason to care about. For the Gwm formats it is not: every one of their ladders is
 * a *span* — how many digits, how many blocks, how many back — and the span is the number the
 * literature reports and the number a reader wants. "Level 4" says nothing; "six digits backward"
 * is the digit-span figure from the Wechsler manual. This module maps one to the other, from each
 * generator's own ladder rather than a copy of it, so the two cannot drift.
 *
 * "Held" means answered correctly at that level at least once, which is what `peakDifficulty`
 * records. It is a ceiling reached, not a span estimated: a proper span procedure stops at the
 * length failed twice running, and this site's ladder does not run that procedure. The copy says so.
 */
import { planFor as spanPlan } from './generators/span';
import { planFor as blockPlan } from './generators/block-span';
import { countFor as chimpCount } from './generators/chimp-test';
import { planFor as nBackPlan } from './generators/n-back';
import { planFor as mathRecallPlan } from './generators/math-recall';
import { planFor as headCountPlan } from './generators/head-count';
import type { TypeStats } from './scoring';
import type { Difficulty, ItemTypeId } from './types';

export type SpanUnit = 'digits-forward' | 'digits-backward' | 'blocks' | 'squares' | 'back' | 'terms' | 'events';

export interface SpanHeld {
  type: ItemTypeId;
  level: Difficulty;
  span: number;
  unit: SpanUnit;
}

/** The Gwm formats whose ladder is a span, in the order the profile lists them. */
export const SPAN_FORMATS: ItemTypeId[] = ['span', 'block-span', 'chimp-test', 'n-back', 'math-recall', 'head-count'];

/** The span a level of one format stands for, in that format's unit. */
export function spanAt(type: ItemTypeId, level: Difficulty): { span: number; unit: SpanUnit } {
  switch (type) {
    case 'span': {
      const plan = spanPlan(level);
      return { span: plan.length, unit: plan.direction === 'backward' ? 'digits-backward' : 'digits-forward' };
    }
    case 'block-span':
      return { span: blockPlan(level).length, unit: 'blocks' };
    case 'chimp-test':
      return { span: chimpCount(level), unit: 'squares' };
    case 'n-back':
      return { span: nBackPlan(level).n, unit: 'back' };
    case 'math-recall':
      return { span: mathRecallPlan(level).terms, unit: 'terms' };
    case 'head-count':
      return { span: headCountPlan(level).events, unit: 'events' };
    default:
      throw new Error(`spanAt: ${type} is not a span format`);
  }
}

/** One row per span format the reader has held a level on, in `SPAN_FORMATS` order. */
export function spanProfile(byType: readonly TypeStats[]): SpanHeld[] {
  const rows: SpanHeld[] = [];
  for (const type of SPAN_FORMATS) {
    const level = byType.find((s) => s.type === type)?.peakDifficulty ?? null;
    if (level === null) continue;
    rows.push({ type, level, ...spanAt(type, level) });
  }
  return rows;
}
