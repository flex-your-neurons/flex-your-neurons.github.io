/**
 * Go / no-go — a run of signals on one target; press on the plain ones, hold back on the crossed ones.
 *
 * This is Donders' third task. His 1868 paper set out three: the *a*-reaction (one signal, one
 * response — `reaction-time` at level 1), the *b*-reaction (several signals, a response for each —
 * `reaction-time` above level 1), and the *c*-reaction: several signals, but a response to only one
 * of them. The c-reaction isolates the cost of deciding *whether* to respond from the cost of
 * deciding *which*, and a century and a half later it is still the standard measure of response
 * inhibition — the go/no-go task, and its sustained cousin the SART.
 *
 * ## Why it is a run and not a trial
 *
 * A single no-go signal in isolation measures nothing: there is no prepotent response to inhibit
 * until responding has become the habit. So an item is eight signals in a row, six plain and two
 * crossed, never a crossed one first and never two in a row — each withhold has to interrupt a run of
 * presses. The item is right only if every plain signal was pressed and every crossed one was not.
 *
 * ## Why the level is the response window
 *
 * The signal stays up for a fixed time and then is gone; a press after that is a miss. Shortening
 * the window forces faster presses, faster presses are more automatic, and a more automatic press is
 * harder to withhold — which is the whole mechanism of the task, and the one dial that runs through
 * it without changing what is measured. The run length and the number of crossed signals are the
 * same at every level.
 *
 * ## What is scored
 *
 * The response is the record of the run, one character per signal: pressed or not. Grading is an
 * exact match. A press on a crossed signal is a *commission* error, the failure of inhibition the
 * task exists to catch; a plain signal left unpressed is an *omission*, a lapse of attention. They
 * are different failures and are diagnosed apart. The board shows the mean time of the correct
 * presses afterwards, because on a Gt format the milliseconds are the point.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, Generator, Item, ItemTypeMeta } from '../types';

/** Signals in a run, and how many of them are crossed. Fixed: the level changes only the window. */
export const RUN_LENGTH = 8;
export const STOP_COUNT = 2;
/** Blank between one signal leaving and the next arriving. */
export const GAP_MS = 300;

/** How long a signal stays on screen — the window in which a press counts. */
export function windowFor(difficulty: Difficulty): number {
  switch (difficulty) {
    case 1:
      return 1200;
    case 2:
      return 1000;
    case 3:
      return 850;
    case 4:
      return 700;
    case 5:
      return 600;
  }
}

/** The record encoding: one character per signal. */
export const PRESSED = 'g';
export const WITHHELD = '.';

export function encodeRun(pressed: readonly boolean[]): string {
  return pressed.map((p) => (p ? PRESSED : WITHHELD)).join('');
}

export function decodeRun(text: string): boolean[] {
  return Array.from(text, (c) => c === PRESSED);
}

/**
 * Where the crossed signals fall: never first, never adjacent. Drawn by rejection from the seed, so
 * the same seed always gives the same run and no two positions are favoured.
 */
export function drawStops(rng: ReturnType<typeof createRng>): number[] {
  for (;;) {
    const stops = rng.sample(
      Array.from({ length: RUN_LENGTH - 1 }, (_, i) => i + 1),
      STOP_COUNT,
    ).sort((a, b) => a - b);
    if (stops.every((s, i) => i === 0 || s - (stops[i - 1] ?? 0) > 1)) return stops;
  }
}

const meta: ItemTypeMeta = {
  id: 'go-no-go',
  domain: 'Gt',
  icon: '✋',
  /* Carries a presentation — the run plays itself — so it cannot be sprinted; see `reaction-time`. */
  sprintable: false,
};

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.goNoGo;
  const rng = createRng(`go-no-go:${seed}:${difficulty}`);
  const stops = drawStops(rng);
  const signals = Array.from({ length: RUN_LENGTH }, (_, i) => !stops.includes(i));
  const windowMs = windowFor(difficulty);

  return {
    type: 'go-no-go',
    seed,
    difficulty,
    prompt: t.prompt(RUN_LENGTH),
    stimulus: { kind: 'gonogo', signals, windowMs },
    responseMode: 'tap',
    options: [],
    answerIndex: -1,
    answerText: encodeRun(signals),
    errorTypes: [],
    explanation: {
      summary: t.summary(stops.map((s) => s + 1)),
      rules: [t.ruleGo, t.ruleStop, t.ruleWindow(windowMs), t.ruleDonders],
    },
    /*
     * The run plays itself, and a shorter window makes it *shorter* — so the suggested time is the
     * same at every level rather than following the window, which would make the hard levels look
     * quicker than the easy ones. Fourteen seconds covers the longest run and the reading before it.
     */
    suggestedSeconds: 14,
    presentation: { stepMs: windowMs, gapMs: GAP_MS },
  };
}

export const goNoGoGenerator: Generator = { meta, generate };
