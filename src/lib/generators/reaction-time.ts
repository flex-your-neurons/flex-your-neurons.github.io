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
 * ## Why an item is a block of trials
 *
 * One reaction time is noise: the spread of a single person's trials is a good fraction of the mean,
 * so the lab never reports one — it reports the median of a block, with the false starts and wrong
 * targets counted separately. An item here is therefore five trials run back to back, each with its
 * own seeded wait, and the latency recorded for the item is the *median* of the correct trials rather
 * than the clock the quiz would otherwise run. Five is short enough to sit inside one item and long
 * enough for a median to mean something; the level does not change it.
 *
 * ## What is measured
 *
 * The latency, as always — but here it *is* the construct rather than a proxy for it, and the board
 * shows the median after the block in milliseconds because that is the number the format exists to
 * produce. Correctness is a binarisation like a trail's: every trial hit its target after its signal,
 * or the block did not.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

/** The unpredictable wait before the signal, in milliseconds. */
export const FOREPERIOD: readonly [min: number, max: number] = [1000, 3000];
/** Trials in a block. Fixed: the level changes the targets, not the length. */
export const TRIALS = 5;
/** The pause between one trial's response and the next trial's wait. */
export const INTER_TRIAL_MS = 700;

export interface ReactionTrial {
  /** The target that lights, 0-based. */
  lit: number;
  foreperiodMs: number;
}

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

/**
 * The block's encoding: one character per trial — the pressed target's 1-based position, or `0` for a
 * response before that trial's signal. Six targets at most, so one digit always suffices.
 */
export const FALSE_START = '0';

export function encodeTarget(index: number): string {
  return String(index + 1);
}

export function encodeBlock(pressed: readonly (number | null)[]): string {
  return pressed.map((p) => (p === null ? FALSE_START : encodeTarget(p))).join('');
}

const meta: ItemTypeMeta = {
  id: 'reaction-time',
  domain: 'Gt',
  icon: '⚡',
  /*
   * Not sprintable: the item carries a presentation — the waits — and a sprint's clock would run
   * through them. The block *is* the harness the lab uses; it lives inside the item instead.
   */
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.reactionTime;
  const rng = createRng(`reaction-time:${seed}:${difficulty}`);
  const targets = targetsFor(difficulty);
  const trials: ReactionTrial[] = Array.from({ length: TRIALS }, () => ({
    lit: rng.int(0, targets - 1),
    // Drawn in steps of fifty so two trials rarely share a wait exactly, without being finer than a frame.
    foreperiodMs: rng.int(FOREPERIOD[0] / 50, FOREPERIOD[1] / 50) * 50,
  }));

  return {
    type: 'reaction-time',
    seed,
    difficulty,
    prompt: targets === 1 ? t.promptSimple(TRIALS) : t.promptChoice(targets, TRIALS),
    stimulus: { kind: 'reaction', targets, trials },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeBlock(trials.map((trial) => trial.lit)),
    errorTypes: [],
    explanation: {
      summary: targets === 1 ? t.summarySimple(TRIALS) : t.summaryChoice(trials.map((trial) => trial.lit + 1)),
      rules: [t.ruleWait, t.ruleFalseStart, t.ruleBlock(TRIALS), targets === 1 ? t.ruleSimple : t.ruleHick(targets)],
    },
    suggestedSeconds: 20,
    /*
     * The waits are the presentation: the item is gated behind a start and plays itself between
     * responses — which is what `presentation` means to the quiz and the test helpers. The first
     * trial's wait stands for the block; the gap is the pause between trials.
     */
    presentation: { stepMs: trials[0]?.foreperiodMs ?? FOREPERIOD[0], gapMs: INTER_TRIAL_MS },
  };
}

export const reactionTimeGenerator: Generator = { meta, generate };
