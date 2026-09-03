/**
 * Reaction time — wait for the signal, then hit the target that lit.
 *
 * The oldest measurement in experimental psychology (Donders, 1868), and the one every popular
 * benchmark site leads with. It opens a CHC domain nothing else here touches: **Gt**, reaction and
 * decision speed, which is distinct from Gs — processing speed is how many easy items a reader gets
 * through in a fixed time, reaction time is how long a single response takes when nothing has to be
 * worked out. The two correlate modestly and load on different factors, which is why the batteries
 * that measure both report them separately.
 *
 * ## Why the level is the number of targets
 *
 * Donders' own distinction: with one target the task is *simple* reaction time (detect, respond);
 * with several it is *choice* reaction time (detect, identify, select). Hick's law says the choice
 * component grows with the logarithm of the number of alternatives, so the number of targets is a
 * single dial running through one construct, from a-reaction at level 1 to a six-way choice at level
 * 5. It is the one difficulty ladder on the site whose shape is a named law.
 *
 * ## Why the foreperiod is random
 *
 * If the signal always came two seconds after the start, a reader would learn to respond at two
 * seconds and the measurement would be of anticipation rather than reaction. The wait is drawn from
 * the seed between one and three seconds, so it is unpredictable to the reader and reproducible for
 * the item. A response before the signal is a false start and is scored as wrong — the standard
 * treatment, and the only honest one, since the response was not to the stimulus.
 *
 * ## What is measured
 *
 * The latency, as always — but here it *is* the construct rather than a proxy for it, and the board
 * shows it after every trial in milliseconds because that is the number the format exists to
 * produce. Correctness is a binarisation like a trail's: right target after the signal, or not.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

/** The unpredictable wait before the signal, in milliseconds. */
export const FOREPERIOD: readonly [min: number, max: number] = [1000, 3000];

/** How many targets each level shows: one is simple reaction time, more is choice. */
export function targetsFor(difficulty: Difficulty): number {
  switch (difficulty) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 6;
  }
}

/** The tapped-target encoding: the target's 1-based position, or `0` for a response before the signal. */
export const FALSE_START = '0';

export function encodeTarget(index: number): string {
  return String(index + 1);
}

const meta: ItemTypeMeta = {
  id: 'reaction-time',
  domain: 'Gt',
  icon: '⚡',
  /*
   * Not sprintable, although a block of reaction trials is exactly how the lab runs it: the item
   * carries a presentation — the foreperiod — and the contract test forbids the pairing, for the
   * good reason that a sprint's clock would run through the waits. A reaction block would need its
   * own harness, and until it exists the honest flag is false.
   */
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.reactionTime;
  const rng = createRng(`reaction-time:${seed}:${difficulty}`);
  const targets = targetsFor(difficulty);
  const lit = rng.int(0, targets - 1);
  // Drawn in steps of fifty so two seeds rarely share a wait exactly, without being finer than a frame.
  const foreperiodMs = rng.int(FOREPERIOD[0] / 50, FOREPERIOD[1] / 50) * 50;

  return {
    type: 'reaction-time',
    seed,
    difficulty,
    prompt: targets === 1 ? t.promptSimple : t.promptChoice(targets),
    stimulus: { kind: 'reaction', targets, lit, foreperiodMs },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeTarget(lit),
    errorTypes: [],
    explanation: {
      summary: targets === 1 ? t.summarySimple : t.summaryChoice(lit + 1),
      rules: [t.ruleWait, t.ruleFalseStart, targets === 1 ? t.ruleSimple : t.ruleHick(targets)],
    },
    suggestedSeconds: 6,
    /*
     * The foreperiod is the presentation: the item is gated behind a start, waits, and only then
     * can be answered — which is exactly what `presentation` means to the quiz and the test helpers.
     */
    presentation: { stepMs: foreperiodMs, gapMs: 0 },
  };
}

export const reactionTimeGenerator: Generator = { meta, generate };
