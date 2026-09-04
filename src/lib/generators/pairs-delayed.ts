/**
 * Delayed recall — the paired-associates probe, minutes later.
 *
 * This is the fuller Glr measurement the paired-associates format's own notes said it could not
 * make inside one item: the same pairings, asked about again after several other items have come
 * and gone. It is not a format a reader can pick. It is *scheduled*: a practice drill of
 * `paired-associates` learns its sets first, one item each, and then asks one delayed question per
 * set, in the order they were learned, so that the first set is probed after the whole drill and the
 * last after the shortest gap.
 *
 * ## How it regenerates
 *
 * An item here is generated from the *source* item's seed and level: the pairings come back from the
 * paired-associates generator exactly as they were shown, and a probe is drawn that differs from the
 * one asked immediately — so the delayed question is about a box the reader has not already
 * retrieved, and a right answer is evidence of storage rather than of a second retrieval of the same
 * fact. Because the seed is the source's, a response replays from history like any other.
 *
 * ## Why it is not in the registry
 *
 * The registry lists what can be practised, tested and sprinted on its own. A delayed probe on its
 * own is a question about nothing, so it lives beside the registry rather than in it: generatable by
 * id, counted on the progress page, and produced only by the drill that gives it something to ask.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import { encodeBox, pairedAssociatesGenerator } from './paired-associates';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

const meta: ItemTypeMeta = {
  id: 'pairs-delayed',
  domain: 'Glr',
  icon: '⏲',
  sprintable: false,
  scheduledBy: 'paired-associates',
};

/** The box a delayed probe asks about: a different one from the immediate probe, from the same seed. */
export function delayedProbeFor(seed: string, difficulty: Difficulty, boxes: number, immediate: number): number {
  const rng = createRng(`pairs-delayed:${seed}:${difficulty}`);
  const others = Array.from({ length: boxes }, (_, i) => i).filter((i) => i !== immediate);
  return others[rng.int(0, others.length - 1)]!;
}

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.pairsDelayed;
  const source = pairedAssociatesGenerator.generate(seed, difficulty, locale);
  if (source.stimulus.kind !== 'pairs') throw new Error('pairs-delayed: the source is not a paired-associates item');
  const { symbols, probe: immediate } = source.stimulus;
  const probe = delayedProbeFor(seed, difficulty, symbols.length, immediate);

  return {
    type: 'pairs-delayed',
    seed,
    difficulty,
    prompt: t.prompt,
    stimulus: { kind: 'pairs-delayed', symbols, probe },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeBox(probe),
    errorTypes: [],
    explanation: {
      summary: t.summary(probe + 1),
      rules: [t.ruleDelayed, t.ruleDifferentBox],
    },
    suggestedSeconds: 8,
  };
}

export const pairsDelayedGenerator: Generator = { meta, generate };
